/**
 * Builds the training program from the profile.
 *
 * Reading guide for a beginner:
 *   1. pick a SPLIT from the days per week (how the body is divided over the week)
 *   2. each day is a list of movement PATTERNS (squat, push, pull...)
 *   3. each pattern is filled with the best EXERCISE the user's equipment allows
 *   4. each exercise gets a PRESCRIPTION (sets x reps, rest, reps in reserve)
 * The rules and the papers behind them are listed in docs/EVIDENCE.md.
 */
import { EXERCISE_BY_ID } from '../data/exercises'
import type { Block, Equipment, EquipmentAccess, Exercise, Experience, Goal, Pattern, Profile, Program, RoutineDay } from '../data/types'
import type { Muscle } from '../data/muscles'
import type { DayId } from '../theme/names'
import { ageBracket, preferLowImpact, proteinTarget, weeklyCardioTarget } from './profile'
import { warmupMinutes } from './warmup'

/** Bump when any rule below changes; the app rebuilds stored programs that carry an older number. */
export const PROGRAM_VERSION = 4

/* ---------- 1. equipment ---------- */

const ACCESS: Record<EquipmentAccess, Set<Equipment>> = {
  gym: new Set<Equipment>(['barbell', 'dumbbell', 'kettlebell', 'cable', 'machine', 'band', 'bench', 'pullupBar', 'bodyweight', 'cardioMachine', 'jumpRope']),
  dumbbells: new Set<Equipment>(['dumbbell', 'kettlebell', 'band', 'bench', 'bodyweight', 'jumpRope']),
  bodyweight: new Set<Equipment>(['bodyweight', 'band', 'jumpRope']),
}

export function isAvailable(ex: Exercise, access: EquipmentAccess): boolean {
  const have = ACCESS[access]
  return ex.equipment.some((e) => have.has(e))
}

/* ---------- 2. exercise pools per pattern, in order of preference ---------- */

type Pools = Record<Experience, string[]>
const same = (ids: string[]): Pools => ({ novice: ids, intermediate: ids, advanced: ids })

const POOLS: Record<Pattern, Pools> = {
  squat: { novice: ['gobletSquat', 'legPress', 'backSquat', 'bodyweightSquat'], intermediate: ['backSquat', 'legPress', 'gobletSquat', 'bodyweightSquat'], advanced: ['backSquat', 'legPress', 'gobletSquat', 'bodyweightSquat'] },
  // Hinge = hamstring-led hip extension. Hip thrust / glute bridge live in the 'glute' pattern so a hinge slot always trains the hamstrings.
  hinge: { novice: ['romanianDeadlift', 'singleLegRdl', 'kettlebellSwing', 'backExtension'], intermediate: ['deadlift', 'romanianDeadlift', 'singleLegRdl', 'kettlebellSwing', 'backExtension'], advanced: ['deadlift', 'romanianDeadlift', 'singleLegRdl', 'kettlebellSwing', 'backExtension'] },
  lunge: same(['splitSquat', 'reverseLunge', 'stepUp']),
  pushH: { novice: ['dbBenchPress', 'machineChestPress', 'pushUp', 'kneePushUp', 'benchPress'], intermediate: ['benchPress', 'dbBenchPress', 'inclineDbPress', 'dips', 'pushUp', 'machineChestPress'], advanced: ['benchPress', 'inclineDbPress', 'dips', 'dbBenchPress', 'pushUp'] },
  pushV: { novice: ['dbShoulderPress', 'overheadPress'], intermediate: ['overheadPress', 'dbShoulderPress'], advanced: ['overheadPress', 'dbShoulderPress'] },
  pullH: { novice: ['seatedCableRow', 'chestSupportedRow', 'dbRow', 'invertedRow', 'barbellRow'], intermediate: ['barbellRow', 'seatedCableRow', 'dbRow', 'chestSupportedRow', 'invertedRow'], advanced: ['barbellRow', 'dbRow', 'seatedCableRow', 'chestSupportedRow', 'invertedRow'] },
  pullV: { novice: ['latPulldown', 'bandPulldown', 'chinUp', 'pullUp'], intermediate: ['pullUp', 'latPulldown', 'chinUp', 'bandPulldown'], advanced: ['pullUp', 'chinUp', 'latPulldown', 'bandPulldown'] },
  sideDelt: same(['lateralRaise']),
  rearDelt: same(['facePull', 'reverseFly', 'bandPullApart']),
  biceps: same(['dbCurl', 'barbellCurl', 'hammerCurl']),
  triceps: same(['tricepsPushdown', 'overheadTricepsExt', 'skullCrusher', 'benchDip']),
  quadIso: same(['legExtension', 'splitSquat', 'bodyweightSquat']),
  hamIso: same(['legCurl', 'romanianDeadlift', 'singleLegRdl', 'gluteBridge']),
  calf: same(['standingCalfRaise', 'seatedCalfRaise']),
  glute: same(['hipThrust', 'gluteBridge']),
  coreAnti: same(['plank', 'deadBug', 'palloffPress', 'birdDog', 'hollowHold']),
  coreFlex: same(['hangingKneeRaise', 'cableCrunch', 'lyingLegRaise', 'crunch']),
  coreLateral: same(['sidePlank']),
  cardio: same(['bike', 'rower', 'inclineWalk', 'run', 'elliptical', 'stairClimber', 'jumpRope', 'jumpingJacks']),
  mobility: same(['legSwings', 'hipCircles', 'worldsGreatest', 'armCircles', 'bandPullApart', 'catCow', 'inchworm']),
  balance: same(['singleLegStand', 'sitToStand', 'heelToeWalk']),
}

const LOW_IMPACT_CARDIO = ['bike', 'inclineWalk', 'rower', 'elliptical', 'stairClimber']

/**
 * First exercise in the pool the user can do (and that fits their level), plus the alternatives.
 * `variant` 2 takes the second option when there is one, so the second upper/lower/push/pull/legs
 * day of the week uses different exercises (same patterns, different angles).
 */
export function pick(pattern: Pattern, profile: Profile, exclude: string[] = [], variant = 1): { id: string; alternatives: string[] } | null {
  const bracket = ageBracket(profile.age)
  let pool = POOLS[pattern][profile.experience]
  if (pattern === 'cardio' && preferLowImpact(profile)) pool = [...LOW_IMPACT_CARDIO, ...pool]
  const ok = pool.filter((id, i, arr) => arr.indexOf(id) === i).filter((id) => {
    const ex = EXERCISE_BY_ID[id]
    if (!ex || !isAvailable(ex, profile.equipment)) return false
    if (exclude.includes(id)) return false
    if (profile.experience === 'novice' && ex.level === 3) return false
    if (bracket === 'older' && (ex.highImpact || ex.level === 3)) return false
    if (bracket === 'youth' && ex.level === 3) return false
    return true
  })
  if (!ok.length) return null
  // The second-visit alternative must be the same kind of exercise (compound stays compound,
  // isolation stays isolation) so the compound-first order of the day is preserved.
  const firstCat = EXERCISE_BY_ID[ok[0]].category
  const altIdx = variant === 2 ? ok.findIndex((id, j) => j > 0 && EXERCISE_BY_ID[id].category === firstCat) : -1
  const i = altIdx > 0 ? altIdx : 0
  return { id: ok[i], alternatives: ok.filter((_, j) => j !== i).slice(0, 3) }
}

/* ---------- 3. prescriptions ---------- */

export interface Prescription { sets: number; repMin: number; repMax: number; restSec: number; rir: number; seconds?: number }

export function prescribe(ex: Exercise, profile: Profile): Prescription {
  const bracket = ageBracket(profile.age)
  const goal: Goal = profile.goal
  const exp = profile.experience
  let p: Prescription

  if (ex.category === 'cardio') return { sets: 1, repMin: 0, repMax: 0, restSec: 0, rir: 0, seconds: 600 }
  if (ex.category === 'mobility') return { sets: 1, repMin: 8, repMax: 10, restSec: 0, rir: 5, seconds: ex.timed ? 30 : undefined }
  if (ex.category === 'balance') return { sets: 2, repMin: 8, repMax: 10, restSec: 30, rir: 5, seconds: ex.timed ? 30 : undefined }
  if (ex.category === 'core') {
    p = { sets: exp === 'novice' ? 2 : 3, repMin: 10, repMax: 15, restSec: exp === 'novice' ? 45 : 60, rir: 2, seconds: ex.timed ? (exp === 'novice' ? 30 : 45) : undefined }
  } else if (ex.category === 'isolation') {
    // Isolation: moderate loads, shorter rest (Grgic 2018: 60-120 s is enough when not chasing max strength).
    p = { sets: exp === 'novice' ? 2 : 3, repMin: 10, repMax: 15, restSec: exp === 'novice' ? 60 : 75, rir: exp === 'novice' ? 2 : 1 }
  } else {
    // Compound lifts. ACSM 2009: novice 8-12RM; strength 1-6RM with 3-5 min rest; hypertrophy 6-12RM with 1-2 min.
    // Rest: untrained 60-120 s is enough; trained lifters gain from >2 min on big lifts (Grgic 2018, Schoenfeld 2016).
    if (goal === 'strength' && exp !== 'novice') {
      p = { sets: exp === 'advanced' ? 5 : 4, repMin: 3, repMax: 6, restSec: 180, rir: 2 }
    } else if (exp === 'novice') {
      p = { sets: 3, repMin: 8, repMax: 12, restSec: 90, rir: 2 }
    } else if (exp === 'intermediate') {
      p = { sets: 3, repMin: 6, repMax: 12, restSec: 120, rir: 1 }
    } else {
      // Advanced: a 4th set only when the session is long enough; otherwise more exercises at 3 sets
      // spreads the volume better than fewer exercises at 4 (Pelland 2026 per-session ceiling).
      p = { sets: profile.sessionMinutes >= 75 ? 4 : 3, repMin: 5, repMax: 10, restSec: 150, rir: 1 }
    }
  }

  // Short sessions (Iversen 2021, time-poor): one set fewer and rests trimmed by a quarter, but keep the lift.
  if (profile.sessionMinutes === 30) { if (p.sets > 2) p.sets -= 1; p.restSec = Math.round(p.restSec * 0.75) }
  // Under 18 (NSCA): 1-3 sets of 6-15, not to failure.
  if (bracket === 'youth') { p.rir = Math.max(p.rir, 3); p.repMin = Math.max(p.repMin, 8); p.repMax = Math.max(p.repMax, 12); p.sets = Math.min(p.sets, 3) }
  // 65+ (Fragala 2019): 1-3 sets, 8-15 reps, avoid failure to spare the joints.
  if (bracket === 'older') { p.rir = Math.max(p.rir, 2); p.repMin = Math.max(p.repMin, 8); p.repMax = Math.max(p.repMax, 12); p.sets = Math.min(p.sets, 3); p.restSec = Math.max(p.restSec, 90) }
  return p
}

/* ---------- 4. day templates ---------- */

type Template = { id: DayId; patterns: Pattern[]; muscles: Muscle[] }

const T: Record<string, Template> = {
  fullA: { id: 'fullA', patterns: ['squat', 'pushH', 'pullH', 'hinge', 'pullV', 'coreAnti', 'calf'], muscles: ['quads', 'glutes', 'chest', 'lats', 'upperBack', 'hamstrings', 'abs'] },
  fullB: { id: 'fullB', patterns: ['hinge', 'pushH', 'pullH', 'lunge', 'pushV', 'coreFlex', 'sideDelt'], muscles: ['hamstrings', 'glutes', 'chest', 'frontDelts', 'sideDelts', 'lats', 'upperBack', 'quads', 'abs'] },
  fullC: { id: 'fullC', patterns: ['squat', 'pushH', 'pullV', 'glute', 'coreLateral', 'sideDelt', 'rearDelt'], muscles: ['quads', 'glutes', 'chest', 'lats', 'abs'] },
  upper: { id: 'upper', patterns: ['pushH', 'pullH', 'pushV', 'pullV', 'pushH', 'sideDelt', 'biceps', 'triceps'], muscles: ['chest', 'lats', 'upperBack', 'frontDelts', 'sideDelts', 'biceps', 'triceps'] },
  lower: { id: 'lower', patterns: ['squat', 'hinge', 'lunge', 'glute', 'calf', 'coreAnti', 'hamIso'], muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'] },
  push: { id: 'push', patterns: ['pushH', 'pushV', 'pushH', 'sideDelt', 'triceps', 'triceps', 'coreAnti'], muscles: ['chest', 'frontDelts', 'sideDelts', 'triceps'] },
  pull: { id: 'pull', patterns: ['pullV', 'pullH', 'pullV', 'rearDelt', 'biceps', 'biceps', 'coreFlex'], muscles: ['lats', 'upperBack', 'rearDelts', 'biceps'] },
  legs: { id: 'legs', patterns: ['squat', 'hinge', 'lunge', 'calf', 'coreLateral', 'hamIso', 'quadIso'], muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  // The minimum effective dose day (Iversen 2021): one leg push, one hinge, one upper push, one upper pull, core, then cardio.
  health: { id: 'health', patterns: ['squat', 'hinge', 'pushH', 'pullH', 'coreAnti'], muscles: ['quads', 'glutes', 'hamstrings', 'chest', 'lats', 'upperBack', 'abs'] },
  cardio: { id: 'cardio', patterns: ['cardio', 'coreAnti', 'coreFlex'], muscles: [] },
  mobility: { id: 'mobility', patterns: ['mobility', 'mobility', 'mobility', 'mobility', 'balance'], muscles: [] },
}

/* ---------- time model ---------- */

/** Minutes a block takes: sets x (work + rest), last rest swapped for a 1-min transition. */
export function blockMinutes(p: Prescription, ex: Exercise): number {
  if (ex.category === 'cardio') return p.seconds ? p.seconds / 60 : 10
  const work = p.seconds ?? Math.round(((p.repMin + p.repMax) / 2) * 3 + 10)
  return (p.sets * (work + p.restSec) - p.restSec + 60) / 60
}

/** Cardio finisher the plan would like to fit after the lifting. */
function plannedCardio(profile: Profile): number {
  const base = profile.sessionMinutes >= 75 ? 15 : profile.sessionMinutes >= 45 ? 10 : 0
  return profile.goal === 'fatloss' ? base + 10 : base
}

/**
 * Fill the day's patterns in priority order until the session length is used up.
 * Compound lifts come first in every template, so a short session keeps the lifts that
 * matter most (Iversen 2021: one leg push, one hinge, one upper push, one upper pull).
 * Cardio takes whatever time is left, up to the planned finisher; the weekly cardio
 * target is mostly met outside the gym (walking), which the recap tracks.
 */
function buildDay(key: string, tpl: Template, profile: Profile, opts: { cardio?: number; minBlocks?: number; minCardio?: number } = {}): RoutineDay {
  const older = ageBracket(profile.age) === 'older'
  const variant = key.endsWith('-2') ? 2 : 1
  const warm = warmupMinutes(profile)
  const cardioWanted = opts.cardio ?? plannedCardio(profile)
  const minCardio = opts.minCardio ?? 0
  const budget = profile.sessionMinutes - warm - minCardio
  const minBlocks = opts.minBlocks ?? 3
  const used: string[] = []
  const blocks: Block[] = []
  let time = 0
  let isoSeen = false
  for (const pattern of tpl.patterns) {
    const choice = pick(pattern, profile, used, variant)
    if (!choice) continue
    const ex = EXERCISE_BY_ID[choice.id]
    // Compound lifts come first (ACSM 2009, Simão 2012): once an isolation move is in, a late
    // compound fallback (e.g. a hinge chosen for the hamstring slot) is skipped rather than misplaced.
    if (ex.category === 'compound' && isoSeen) continue
    if (ex.category === 'isolation') isoSeen = true
    const p = prescribe(ex, profile)
    const cost = blockMinutes(p, ex)
    if (blocks.length >= minBlocks && time + cost > budget) continue
    used.push(choice.id)
    blocks.push({ exerciseId: choice.id, sets: p.sets, repMin: p.repMin, repMax: p.repMax, seconds: p.seconds, restSec: p.restSec, rir: p.rir, alternatives: choice.alternatives })
    time += cost
  }
  // 65+: WHO 2020 asks for balance work on 3+ days; it is cheap, so it always goes in.
  if (older && tpl.id !== 'cardio') {
    const b = pick('balance', profile, used)
    if (b) {
      const ex = EXERCISE_BY_ID[b.id]
      const p = prescribe(ex, profile)
      blocks.push({ exerciseId: b.id, sets: p.sets, repMin: p.repMin, repMax: p.repMax, seconds: p.seconds, restSec: p.restSec, rir: p.rir, alternatives: b.alternatives })
      time += blockMinutes(p, ex)
    }
  }
  let cardioMinutes = Math.max(minCardio, Math.min(cardioWanted, Math.round(profile.sessionMinutes - warm - time)))
  if (cardioMinutes < 5) cardioMinutes = minCardio
  return { key, id: tpl.id, muscles: tpl.muscles, blocks, cardioMinutes, minutes: Math.round(warm + time + cardioMinutes), balance: older }
}

/* ---------- 5. split ---------- */

function rotation(profile: Profile): { split: Program['split']; label: string; keys: [string, string][] } {
  const d = profile.daysPerWeek
  const exp = profile.experience
  const withCardio = profile.cardioDay ?? true
  if (d <= 1) return { split: 'fullbody', label: 'Full body', keys: [['fullA', 'fullA']] }
  if (d === 2) return { split: 'fullbody', label: 'Full body, two versions', keys: [['fullA', 'fullA'], ['fullB', 'fullB']] }
  // A dedicated cardio day (Gorzelitz 2022: aerobic activity plus 1-2 lifting sessions a week carries the lowest
  // mortality; a 30-40 min session covers a third to a half of the weekly aerobic target in one visit).
  // The lifting days that remain are laid out so every muscle is still trained twice a week.
  if (withCardio && d >= 3) {
    if (d === 3) return { split: 'fullbody', label: 'Full body twice, plus a cardio day', keys: [['fullA', 'fullA'], ['fullB', 'fullB'], ['cardio', 'cardio-1']] }
    if (d === 4) {
      if (exp === 'novice') return { split: 'fullbody', label: 'Full body three times, plus a cardio day', keys: [['fullA', 'fullA'], ['fullB', 'fullB'], ['fullC', 'fullC'], ['cardio', 'cardio-1']] }
      return { split: 'upperlower', label: 'Upper / lower / full body, plus a cardio day', keys: [['upper', 'upper-1'], ['lower', 'lower-1'], ['fullA', 'full-1'], ['cardio', 'cardio-1']] }
    }
    if (d === 5) return { split: 'upperlower', label: 'Upper / lower, twice, plus a cardio day', keys: [['upper', 'upper-1'], ['lower', 'lower-1'], ['upper', 'upper-2'], ['lower', 'lower-2'], ['cardio', 'cardio-1']] }
    if (exp === 'novice') return { split: 'upperlower', label: 'Upper / lower, twice, plus cardio and mobility days', keys: [['upper', 'upper-1'], ['lower', 'lower-1'], ['cardio', 'cardio-1'], ['upper', 'upper-2'], ['lower', 'lower-2'], ['mobility', 'mobility-1']] }
    return { split: 'ulppl', label: 'Push / pull / legs + upper / lower, plus a cardio day', keys: [['push', 'push-1'], ['pull', 'pull-1'], ['legs', 'legs-1'], ['upper', 'upper-1'], ['lower', 'lower-1'], ['cardio', 'cardio-1']] }
  }
  if (d === 3) {
    if (exp === 'novice') return { split: 'fullbody', label: 'Full body, three versions', keys: [['fullA', 'fullA'], ['fullB', 'fullB'], ['fullC', 'fullC']] }
    return { split: 'upperlower', label: 'Upper / lower / full body', keys: [['upper', 'upper-1'], ['lower', 'lower-1'], ['fullA', 'full-1']] }
  }
  if (d === 4) return { split: 'upperlower', label: 'Upper / lower, twice', keys: [['upper', 'upper-1'], ['lower', 'lower-1'], ['upper', 'upper-2'], ['lower', 'lower-2']] }
  // ACSM 2009: novices lift 2-3 days, intermediates 3-4, advanced 4-6. A novice who can come 5-6 times
  // still lifts four of them; the extra visits become cardio and mobility so they count without over-training.
  if (exp === 'novice') {
    if (d === 5) return { split: 'upperlower', label: 'Upper / lower, twice, plus a cardio day', keys: [['upper', 'upper-1'], ['lower', 'lower-1'], ['cardio', 'cardio-1'], ['upper', 'upper-2'], ['lower', 'lower-2']] }
    return { split: 'upperlower', label: 'Upper / lower, twice, plus cardio and mobility days', keys: [['upper', 'upper-1'], ['lower', 'lower-1'], ['cardio', 'cardio-1'], ['upper', 'upper-2'], ['lower', 'lower-2'], ['mobility', 'mobility-1']] }
  }
  if (d === 5) return { split: 'ulppl', label: 'Push / pull / legs + upper / lower', keys: [['push', 'push-1'], ['pull', 'pull-1'], ['legs', 'legs-1'], ['upper', 'upper-1'], ['lower', 'lower-1']] }
  return { split: 'pplx2', label: 'Push / pull / legs, twice', keys: [['push', 'push-1'], ['pull', 'pull-1'], ['legs', 'legs-1'], ['push', 'push-2'], ['pull', 'pull-2'], ['legs', 'legs-2']] }
}

/** Weekly hard sets per muscle the plan aims for (Schoenfeld 2017, Baz-Valle 2022, Pelland 2026). */
export function setsTarget(exp: Experience): [number, number] {
  return exp === 'novice' ? [6, 10] : exp === 'intermediate' ? [10, 16] : [12, 20]
}

export function buildProgram(profile: Profile): Program {
  const rot = rotation(profile)
  const OPTS: Record<string, Parameters<typeof buildDay>[3]> = {
    cardio: { cardio: profile.goal === 'fatloss' ? 40 : 35, minCardio: 25, minBlocks: 0 },
    mobility: { cardio: 0, minBlocks: 4 },
  }
  const days = rot.keys.map(([tpl, key]) => buildDay(key, T[tpl], profile, OPTS[tpl]))
  const bracket = ageBracket(profile.age)
  const notes: string[] = []
  notes.push(`${rot.label}: with ${profile.daysPerWeek} day${profile.daysPerWeek > 1 ? 's' : ''} a week this is the layout that trains every muscle at least twice a week when volume allows (Schoenfeld 2016).`)
  notes.push(`Each day is time-boxed to your ${profile.sessionMinutes} minutes including the warm-up. Big lifts are filled first, small ones only if time remains (Iversen 2021).`)
  if ((profile.cardioDay ?? true) && profile.daysPerWeek >= 3) notes.push(`One visit a week is a cardio day. Aerobic fitness is one of the strongest predictors of a long life, and lifting plus aerobic work beats either alone (Gorzelitz 2022). ${profile.daysPerWeek === 3 ? 'With three visits that leaves two lifting days, so muscle-growth volume runs below the usual target; add a day or switch the cardio day off if physique is the priority.' : ''}`)
  notes.push(`Aim for ${setsTarget(profile.experience)[0]} to ${setsTarget(profile.experience)[1]} hard sets per muscle per week. Growth starts near 4 and each extra set buys less (Pelland 2026).`)
  notes.push(`Rest ${profile.experience === 'novice' ? '1.5' : profile.goal === 'strength' ? '3' : profile.experience === 'advanced' ? '2.5' : '2'} minutes on the big lifts, about a minute on the small ones (Schoenfeld 2016, Grgic 2018).`)
  notes.push(`Finish sets ${profile.goal === 'strength' ? '2 to 3' : '1 to 3'} reps short of failure; going all the way adds little and costs recovery (Refalo 2023, Robinson 2024).`)
  notes.push(`Cardio ${weeklyCardioTarget(profile)} moderate minutes a week (WHO 2020${profile.goal === 'fatloss' ? '; 250+ for fat loss, Donnelly 2009' : ''}). Sessions end with a short finisher only when it fits; the rest comes from brisk walks or a cardio day. Total minutes matter, not how many days they are spread over.`)
  if (bracket === 'youth') notes.push('Under 18: every set stops 3 reps short of failure and reps stay at 8 or more (NSCA youth statement).')
  if (bracket === 'older') notes.push('65+: a balance block is added and sets stop 2 reps short of failure (Fragala 2019, WHO 2020).')
  if (preferLowImpact(profile)) notes.push('Low-impact cardio is chosen first (bike, rowing, incline walking) to keep joint load down.')
  if (profile.sex !== 'other') notes.push('Sex does not change the plan (Roberts 2020).')
  return {
    version: PROGRAM_VERSION,
    split: rot.split,
    splitLabel: rot.label,
    days,
    setsPerMuscleTarget: setsTarget(profile.experience),
    cardioTargetMin: weeklyCardioTarget(profile),
    proteinGrams: proteinTarget(profile),
    notes,
  }
}

/** Special days that are not part of the rotation but the recommender can hand out. */
export function healthDay(profile: Profile): RoutineDay {
  // The point of this day is lifting + aerobic work in one visit, so cardio is guaranteed 10 minutes.
  return buildDay('health', T.health, profile, { cardio: 15, minCardio: 10, minBlocks: 4 })
}
export function cardioDay(profile: Profile): RoutineDay {
  return buildDay('cardio', T.cardio, profile, { cardio: profile.goal === 'fatloss' ? 30 : 25, minCardio: 20, minBlocks: 0 })
}
export function mobilityDay(profile: Profile): RoutineDay {
  return buildDay('mobility', T.mobility, profile, { cardio: 0, minBlocks: 4 })
}

/** Fractional sets per muscle for one full pass of the rotation (primary 1, secondary 0.5). */
export function plannedSetsPerMuscle(program: Program): Partial<Record<Muscle, number>> {
  const out: Partial<Record<Muscle, number>> = {}
  for (const day of program.days) {
    for (const b of day.blocks) {
      const ex = EXERCISE_BY_ID[b.exerciseId]
      if (!ex || ex.category === 'cardio' || ex.category === 'mobility' || ex.category === 'balance') continue
      for (const m of ex.primary) out[m] = (out[m] ?? 0) + b.sets
      for (const m of ex.secondary) out[m] = (out[m] ?? 0) + b.sets * 0.5
    }
  }
  return out
}
