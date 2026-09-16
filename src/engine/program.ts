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
  hinge: { novice: ['romanianDeadlift', 'hipThrust', 'kettlebellSwing', 'gluteBridge', 'backExtension'], intermediate: ['deadlift', 'romanianDeadlift', 'hipThrust', 'kettlebellSwing', 'gluteBridge'], advanced: ['deadlift', 'romanianDeadlift', 'hipThrust', 'kettlebellSwing', 'gluteBridge'] },
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
  hamIso: same(['legCurl', 'romanianDeadlift', 'gluteBridge']),
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

/** First exercise in the pool the user can do (and that fits their level), plus the alternatives. */
export function pick(pattern: Pattern, profile: Profile, exclude: string[] = []): { id: string; alternatives: string[] } | null {
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
  return { id: ok[0], alternatives: ok.slice(1, 4) }
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
    p = { sets: exp === 'novice' ? 2 : 3, repMin: 10, repMax: 15, restSec: 60, rir: 2, seconds: ex.timed ? (exp === 'novice' ? 30 : 45) : undefined }
  } else if (ex.category === 'isolation') {
    // Isolation: moderate loads, shorter rest (Grgic 2018: 60-120 s is enough when not chasing max strength).
    p = { sets: exp === 'novice' ? 2 : 3, repMin: 10, repMax: 15, restSec: 75, rir: exp === 'novice' ? 2 : 1 }
  } else {
    // Compound lifts. ACSM 2009: novice 8-12RM; strength 1-6RM with 3-5 min rest; hypertrophy 6-12RM with 1-2 min.
    if (goal === 'strength' && exp !== 'novice') {
      p = { sets: exp === 'advanced' ? 5 : 4, repMin: 3, repMax: 6, restSec: 180, rir: 2 }
    } else if (exp === 'novice') {
      p = { sets: 3, repMin: 8, repMax: 12, restSec: 90, rir: 2 }
    } else if (exp === 'intermediate') {
      p = { sets: 3, repMin: 6, repMax: 12, restSec: 150, rir: 1 }
    } else {
      p = { sets: 4, repMin: 5, repMax: 10, restSec: 180, rir: 1 }
    }
  }

  // Short sessions: one set fewer on everything but keep the lift.
  if (profile.sessionMinutes === 30 && p.sets > 2) p.sets -= 1
  // Under 18 (NSCA): 1-3 sets of 6-15, not to failure.
  if (bracket === 'youth') { p.rir = Math.max(p.rir, 3); p.repMin = Math.max(p.repMin, 8); p.repMax = Math.max(p.repMax, 12); p.sets = Math.min(p.sets, 3) }
  // 65+ (Fragala 2019): 1-3 sets, 8-15 reps, avoid failure to spare the joints.
  if (bracket === 'older') { p.rir = Math.max(p.rir, 2); p.repMin = Math.max(p.repMin, 8); p.repMax = Math.max(p.repMax, 12); p.sets = Math.min(p.sets, 3); p.restSec = Math.max(p.restSec, 90) }
  return p
}

/* ---------- 4. day templates ---------- */

type Template = { id: DayId; patterns: Pattern[]; muscles: Muscle[] }

const T: Record<string, Template> = {
  fullA: { id: 'fullA', patterns: ['squat', 'pushH', 'pullH', 'hinge', 'coreAnti', 'calf', 'biceps'], muscles: ['quads', 'glutes', 'chest', 'lats', 'upperBack', 'hamstrings', 'abs'] },
  fullB: { id: 'fullB', patterns: ['hinge', 'pushV', 'pullV', 'lunge', 'coreFlex', 'triceps', 'sideDelt'], muscles: ['hamstrings', 'glutes', 'frontDelts', 'sideDelts', 'lats', 'quads', 'abs'] },
  fullC: { id: 'fullC', patterns: ['squat', 'pushH', 'pullH', 'glute', 'coreLateral', 'rearDelt', 'calf'], muscles: ['quads', 'glutes', 'chest', 'lats', 'upperBack', 'abs'] },
  upper: { id: 'upper', patterns: ['pushH', 'pullH', 'pushV', 'pullV', 'sideDelt', 'biceps', 'triceps'], muscles: ['chest', 'lats', 'upperBack', 'frontDelts', 'sideDelts', 'biceps', 'triceps'] },
  lower: { id: 'lower', patterns: ['squat', 'hinge', 'lunge', 'hamIso', 'calf', 'coreAnti', 'glute'], muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'] },
  push: { id: 'push', patterns: ['pushH', 'pushV', 'pushH', 'sideDelt', 'triceps', 'triceps', 'coreAnti'], muscles: ['chest', 'frontDelts', 'sideDelts', 'triceps'] },
  pull: { id: 'pull', patterns: ['pullV', 'pullH', 'pullH', 'rearDelt', 'biceps', 'biceps', 'coreFlex'], muscles: ['lats', 'upperBack', 'rearDelts', 'biceps'] },
  legs: { id: 'legs', patterns: ['squat', 'hinge', 'lunge', 'hamIso', 'calf', 'coreLateral', 'quadIso'], muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  // The minimum effective dose day (Iversen 2021): one leg push, one hinge, one upper push, one upper pull, core, then cardio.
  health: { id: 'health', patterns: ['squat', 'hinge', 'pushH', 'pullH', 'coreAnti'], muscles: ['quads', 'glutes', 'hamstrings', 'chest', 'lats', 'upperBack', 'abs'] },
  cardio: { id: 'cardio', patterns: ['cardio', 'coreAnti', 'coreFlex'], muscles: [] },
  mobility: { id: 'mobility', patterns: ['mobility', 'mobility', 'mobility', 'mobility', 'balance'], muscles: [] },
}

/** Exercises per session by session length. */
const SLOTS: Record<Profile['sessionMinutes'], number> = { 30: 4, 45: 5, 60: 6, 75: 7 }

function buildDay(key: string, tpl: Template, profile: Profile, cardioMinutes: number): RoutineDay {
  const slots = tpl.id === 'health' ? 5 : tpl.id === 'cardio' ? 3 : tpl.id === 'mobility' ? 5 : SLOTS[profile.sessionMinutes]
  const used: string[] = []
  const blocks: Block[] = []
  for (const pattern of tpl.patterns.slice(0, slots)) {
    const choice = pick(pattern, profile, used)
    if (!choice) continue
    used.push(choice.id)
    const ex = EXERCISE_BY_ID[choice.id]
    const p = prescribe(ex, profile)
    blocks.push({ exerciseId: choice.id, sets: p.sets, repMin: p.repMin, repMax: p.repMax, seconds: p.seconds, restSec: p.restSec, rir: p.rir, alternatives: choice.alternatives })
  }
  return { key, id: tpl.id, muscles: tpl.muscles, blocks, cardioMinutes, balance: ageBracket(profile.age) === 'older' }
}

/* ---------- 5. split ---------- */

function rotation(profile: Profile): { split: Program['split']; label: string; keys: [string, string][] } {
  const d = profile.daysPerWeek
  const exp = profile.experience
  if (d <= 1) return { split: 'fullbody', label: 'Full body', keys: [['fullA', 'fullA']] }
  if (d === 2) return { split: 'fullbody', label: 'Full body, two versions', keys: [['fullA', 'fullA'], ['fullB', 'fullB']] }
  if (d === 3) {
    if (exp === 'novice') return { split: 'fullbody', label: 'Full body, three versions', keys: [['fullA', 'fullA'], ['fullB', 'fullB'], ['fullC', 'fullC']] }
    return { split: 'upperlower', label: 'Upper / lower / full body', keys: [['upper', 'upper-1'], ['lower', 'lower-1'], ['fullA', 'full-1']] }
  }
  if (d === 4) return { split: 'upperlower', label: 'Upper / lower, twice', keys: [['upper', 'upper-1'], ['lower', 'lower-1'], ['upper', 'upper-2'], ['lower', 'lower-2']] }
  if (d === 5) return { split: 'ulppl', label: 'Push / pull / legs + upper / lower', keys: [['push', 'push-1'], ['pull', 'pull-1'], ['legs', 'legs-1'], ['upper', 'upper-1'], ['lower', 'lower-1']] }
  return { split: 'pplx2', label: 'Push / pull / legs, twice', keys: [['push', 'push-1'], ['pull', 'pull-1'], ['legs', 'legs-1'], ['push', 'push-2'], ['pull', 'pull-2'], ['legs', 'legs-2']] }
}

/** Weekly hard sets per muscle the plan aims for (Schoenfeld 2017, Baz-Valle 2022, Pelland 2026). */
export function setsTarget(exp: Experience): [number, number] {
  return exp === 'novice' ? [6, 10] : exp === 'intermediate' ? [10, 16] : [12, 20]
}

export function buildProgram(profile: Profile): Program {
  const rot = rotation(profile)
  const cardioPerSession = profile.sessionMinutes >= 60 ? 15 : 10
  const days = rot.keys.map(([tpl, key]) => buildDay(key, T[tpl], profile, profile.goal === 'fatloss' ? cardioPerSession + 10 : cardioPerSession))
  const bracket = ageBracket(profile.age)
  const notes: string[] = []
  notes.push(`${rot.label}: with ${profile.daysPerWeek} day${profile.daysPerWeek > 1 ? 's' : ''} a week this is the layout that trains every muscle at least twice a week when volume allows (Schoenfeld 2016).`)
  notes.push(`Aim for ${setsTarget(profile.experience)[0]} to ${setsTarget(profile.experience)[1]} hard sets per muscle per week. Growth starts near 4 and each extra set buys less (Pelland 2026).`)
  notes.push(`Rest ${profile.experience === 'novice' ? '1 to 2' : '2 to 3'} minutes on the big lifts (Schoenfeld 2016, Grgic 2018).`)
  notes.push(`Finish sets ${profile.goal === 'strength' ? '2 to 3' : '1 to 3'} reps short of failure; going all the way adds little and costs recovery (Refalo 2023, Robinson 2024).`)
  notes.push(`Cardio ${weeklyCardioTarget(profile)} moderate minutes a week (WHO 2020${profile.goal === 'fatloss' ? '; 250+ for fat loss, Donnelly 2009' : ''}). Total minutes matter, not how many days they are spread over.`)
  if (bracket === 'youth') notes.push('Under 18: every set stops 3 reps short of failure and reps stay at 8 or more (NSCA youth statement).')
  if (bracket === 'older') notes.push('65+: a balance block is added and sets stop 2 reps short of failure (Fragala 2019, WHO 2020).')
  if (preferLowImpact(profile)) notes.push('Low-impact cardio is chosen first (bike, rowing, incline walking) to keep joint load down.')
  if (profile.sex !== 'other') notes.push('Sex does not change the plan (Roberts 2020).')
  return {
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
  return buildDay('health', T.health, profile, 15)
}
export function cardioDay(profile: Profile): RoutineDay {
  const d = buildDay('cardio', T.cardio, profile, profile.goal === 'fatloss' ? 30 : 25)
  return d
}
export function mobilityDay(profile: Profile): RoutineDay {
  return buildDay('mobility', T.mobility, profile, 0)
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
