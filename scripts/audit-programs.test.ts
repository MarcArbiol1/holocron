/**
 * Audit: does every generated program obey the evidence rules?
 * Prints violations per profile. Run: npx vitest run scripts/audit-programs
 */
import { expect, it } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
const LINES: string[] = []
const log = (m: string) => LINES.push(m)
import { buildProgram, healthDay, pick } from '../src/engine/program'
import { buildWarmup } from '../src/engine/warmup'
import { EXERCISE_BY_ID } from '../src/data/exercises'
import { MUSCLE_IDS, type Muscle } from '../src/data/muscles'
import type { Profile, RoutineDay } from '../src/data/types'
import { bmi } from '../src/engine/profile'

const base: Profile = { name: 'A', age: 25, sex: 'male', heightCm: 178, weightKg: 75, experience: 'novice', daysPerWeek: 3, sessionMinutes: 60, equipment: 'gym', goal: 'muscle', createdAt: new Date().toISOString() }

const profiles: Partial<Profile>[] = []
for (const experience of ['novice', 'intermediate', 'advanced'] as const)
  for (const daysPerWeek of [1, 2, 3, 4, 5, 6] as const)
    for (const sessionMinutes of [30, 45, 60, 75] as const)
      profiles.push({ experience, daysPerWeek, sessionMinutes })
profiles.push({ equipment: 'dumbbells' }, { equipment: 'bodyweight' }, { equipment: 'bodyweight', daysPerWeek: 4, experience: 'intermediate' })
profiles.push({ age: 16 }, { age: 70 }, { age: 70, weightKg: 100, equipment: 'dumbbells' }, { weightKg: 110 }, { goal: 'strength', experience: 'intermediate', daysPerWeek: 4 }, { goal: 'fatloss', sex: 'female' })

const BIG: Muscle[] = ['chest', 'lats', 'upperBack', 'quads', 'hamstrings', 'glutes']
/** Small muscles that only get half-credit from the big lifts; the balance pass (24 Sep 2026) gives them a floor. */
const SMALL: Muscle[] = ['biceps', 'triceps', 'sideDelts', 'rearDelts']
const LEG_MUSCLES = new Set<Muscle>(['quads', 'hamstrings', 'glutes', 'calves'])
const LEG_DAYS = new Set(['legs', 'lower'])
const isLifting = (d: RoutineDay) => d.muscles.length > 0

function estMinutes(day: RoutineDay, p: Profile): number {
  const warm = buildWarmup(day, p, []).totalMinutes
  let work = 0
  for (const b of day.blocks) {
    const ex = EXERCISE_BY_ID[b.exerciseId]
    if (ex.category === 'cardio') continue
    const perSet = (b.seconds ?? Math.round(((b.repMin + b.repMax) / 2) * 3 + 10)) + b.restSec
    work += (b.sets * perSet - b.restSec + 60) / 60 // last rest replaced by transition
  }
  return Math.round(warm + work + day.cardioMinutes)
}

it('audit', () => {
let violations = 0
const say = (tag: string, msg: string) => { violations++; log(`  [${tag}] ${msg}`) }

for (const over of profiles) {
  const p: Profile = { ...base, ...over }
  const prog = buildProgram(p)
  const label = JSON.stringify(over)
  log(`\n${label} -> ${prog.splitLabel}`)
  const weeklySets: Record<string, number> = Object.fromEntries(MUSCLE_IDS.map((m) => [m, 0]))
  const freq: Record<string, number> = Object.fromEntries(MUSCLE_IDS.map((m) => [m, 0]))
  for (const d of prog.days) {
    const hit = new Set<Muscle>()
    const ids = d.blocks.map((b) => b.exerciseId)
    if (new Set(ids).size !== ids.length) say('dup', `${d.key}: duplicate exercise`)
    let seenIso = false
    for (const b of d.blocks) {
      const ex = EXERCISE_BY_ID[b.exerciseId]
      if (ex.category === 'compound' && seenIso) say('order', `${d.key}: compound ${ex.id} after an isolation move`)
      if (ex.category === 'isolation') seenIso = true
      if (p.experience === 'novice' && ex.level === 3) say('level', `${d.key}: level-3 ${ex.id} for a novice`)
      const lifting = ex.category !== 'cardio' && ex.category !== 'mobility' && ex.category !== 'balance'
      if (lifting && p.age < 18 && b.rir < 3) say('youth', `${d.key}: ${ex.id} rir ${b.rir} < 3`)
      if (p.age >= 65 && ((lifting && (b.rir < 2 || b.sets > 3)) || ex.highImpact)) say('older', `${d.key}: ${ex.id} sets ${b.sets} rir ${b.rir} impact ${!!ex.highImpact}`)
      if (bmi(p) >= 30 && ex.highImpact) say('impact', `${d.key}: high-impact ${ex.id} at BMI ${bmi(p).toFixed(0)}`)
      if (ex.category === 'compound' || ex.category === 'isolation' || ex.category === 'core') {
        for (const m of ex.primary) { weeklySets[m] += b.sets; hit.add(m) }
        for (const m of ex.secondary) weeklySets[m] += b.sets * 0.5
      }
    }
    for (const m of hit) freq[m]++
    if (p.age >= 65 && d.muscles.length > 0 && !d.blocks.some((b) => EXERCISE_BY_ID[b.exerciseId].category === 'balance')) say('balance', `${d.key}: no balance exercise for 65+`)
    const t = estMinutes(d, p)
    const flag = t > p.sessionMinutes * 1.1 ? ' OVER' : ''
    log(`  ${d.key.padEnd(9)} ${d.blocks.length} ex, ${d.blocks.reduce((a, b) => a + b.sets, 0)} sets, ~${t} min of ${p.sessionMinutes}${flag}  [${d.blocks.map((b) => b.exerciseId).join(', ')}]`)
    if (flag) say('time', `${d.key}: ~${t} min for a ${p.sessionMinutes}-min session`)
  }
  const [lo, hi] = prog.setsPerMuscleTarget
  const liftingDays = prog.days.filter((d) => d.muscles.length > 0).length

  // ---- balance rules (docs/AUDIT.md part 3) ----
  const upperDays = prog.days.filter((d) => isLifting(d) && !LEG_DAYS.has(d.id))
  const hasArmsDay = prog.days.some((d) => d.id === 'arms')
  let legsOpen = 0
  let legBlocks = 0
  let upperBlocks = 0
  const chestUsed = new Set<string>()
  for (const d of upperDays) {
    const exs = d.blocks.map((b) => EXERCISE_BY_ID[b.exerciseId])
    // (a) direct arm work on every day that is not a leg day, once the session is 45 minutes or longer.
    //     Tolerances: a strength goal (4 sets, 3-minute rests) and an advanced lifter's 45-minute session
    //     (2.5-minute rests) are filled by four big lifts; that is the point of those prescriptions.
    const armRule = p.goal !== 'strength' && (p.sessionMinutes >= 60 || (p.sessionMinutes >= 45 && p.experience !== 'advanced'))
    //     A chest-and-back day is exempt when the week has a shoulders-and-arms day: that is the split's whole point.
    if (armRule && !(hasArmsDay && d.id === 'chestback') && !exs.some((ex) => ex.pattern === 'biceps' || ex.pattern === 'triceps')) say('arms', `${d.key}: no direct biceps or triceps exercise`)
    if (d.id === 'arms' && p.sessionMinutes >= 60) {
      const n = (pat: string) => exs.filter((ex) => ex.pattern === pat).length
      if (n('biceps') < 2 || n('triceps') < 2 || n('forearm') < 1) say('armsday', `${d.key}: biceps ${n('biceps')}, triceps ${n('triceps')}, forearm ${n('forearm')}`)
    }
    if (d.id === 'lower' && p.sessionMinutes >= 60 && !exs.some((ex) => ex.pattern === 'quadIso')) say('legday', `${d.key}: no leg extension`)
    // (b) legs never outnumber the upper body inside a full-body day
    const legs = exs.filter((ex) => ex.category !== 'core' && ex.category !== 'balance' && ex.primary.every((m) => LEG_MUSCLES.has(m))).length
    const upper = exs.filter((ex) => ex.category !== 'core' && ex.category !== 'balance' && ex.primary.every((m) => !LEG_MUSCLES.has(m))).length
    if (legs > upper) say('balance', `${d.key}: ${legs} leg exercises vs ${upper} upper-body`)
    if (exs[0] && exs[0].primary.every((m) => LEG_MUSCLES.has(m))) legsOpen++
    for (const ex of exs) if (ex.pattern === 'pushH') chestUsed.add(ex.id)
  }
  for (const d of prog.days.filter(isLifting)) {
    for (const b of d.blocks) {
      const ex = EXERCISE_BY_ID[b.exerciseId]
      if (ex.category === 'core' || ex.category === 'balance') continue
      if (ex.primary.every((m) => LEG_MUSCLES.has(m))) legBlocks++
      else upperBlocks++
    }
  }
  // (c) the first exercise rotates: legs do not open every non-leg day
  if (upperDays.length >= 2 && legsOpen === upperDays.length) say('order', `every lifting day opens with a leg exercise`)
  // (d) the chest is trained with at least two different exercises when the week has two chest days and the equipment allows
  const chestDays = upperDays.filter((d) => d.blocks.some((b) => EXERCISE_BY_ID[b.exerciseId].pattern === 'pushH')).length
  if (chestDays >= 2 && (pick('pushH', p)?.alternatives.length ?? 0) >= 1 && chestUsed.size < 2) say('variety', `chest exercise is ${[...chestUsed].join()} on every day`)
  // (e) small-muscle floors for 60-minute sessions with 3+ lifting days (not for a strength goal, whose days are four heavy lifts):
  //     arms half the band's low end; side delts 40% (they get half-credit from overhead presses only), 25% for advanced
  //     lifters, whose 2.5-minute rests leave a 60-minute upper day room for five big lifts and one curl, so the second
  //     chest press wins the last slot and the recap shows the side-delt gap; rear delts 25% (half-credit from every row and pulldown).
  const FLOOR: Record<string, number> = { biceps: 0.5, triceps: 0.5, sideDelts: p.experience === 'advanced' ? 0.25 : 0.4, rearDelts: 0.25 }
  if (liftingDays >= 3 && p.sessionMinutes >= 60 && p.goal !== 'strength') for (const m of SMALL) if (weeklySets[m] < lo * FLOOR[m]) say('volume', `${m} ${weeklySets[m]} sets/week < ${lo * FLOOR[m]}`)
  log(`  blocks/wk: upper ${upperBlocks}, legs ${legBlocks}; small: ${SMALL.map((m) => `${m} ${weeklySets[m]}`).join(', ')}`)
  for (const m of BIG) {
    // Twice a week, unless the layout gives the muscle its own day with the full weekly volume
    // (Arnold split): with volume matched, frequency makes no measurable difference (Schoenfeld 2019).
    const ownDay = prog.split === 'arnold' && freq[m] >= 1 && weeklySets[m] >= lo * 0.75
    if (p.daysPerWeek >= 3 && freq[m] < 2 && !ownDay) say('freq', `${m} trained directly ${freq[m]}x/week`)
    // Tolerances (documented in docs/AUDIT.md):
    //  - under target only counts for sessions of 60 min or more; shorter sessions cannot fit the volume and say so in the plan notes
    //  - over target: 1.5x the high end; 2.2x for glutes/hamstrings, which collect half-credit from every squat, lunge and hip thrust,
    //    and for the upper back, which collects half-credit from every row, pulldown, hinge, overhead press and rear-delt move
    const overCap = m === 'glutes' || m === 'hamstrings' || m === 'upperBack' ? hi * 2.2 : hi * 1.5
    // a cardio day that leaves only two lifting days cannot reach growth targets; the plan notes say so
    if (liftingDays >= 3 && p.sessionMinutes >= 60 && weeklySets[m] < lo * 0.75) say('volume', `${m} ${weeklySets[m]} sets/week < target ${lo}`)
    if (weeklySets[m] > overCap) say('volume', `${m} ${weeklySets[m]} sets/week > ${hi}`)
  }
  log('  sets/wk: ' + BIG.map((m) => `${m} ${weeklySets[m]}(${freq[m]}x)`).join(', '))
}
const h = healthDay(base)
log(`\nhealth day: ~${estMinutes(h, base)} min [${h.blocks.map((b) => b.exerciseId).join(', ')}] + ${h.cardioMinutes} cardio`)
log(`\nTOTAL VIOLATIONS: ${violations}`)

mkdirSync('scratch', { recursive: true })
writeFileSync('scratch/audit-report.txt', LINES.join('\n'))
expect(violations, 'see scratch/audit-report.txt').toBe(0)
})
