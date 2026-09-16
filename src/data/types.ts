import type { Muscle } from './muscles'
import type { DayId } from '../theme/names'

/** Movement patterns. A routine is built from patterns first, exercises second. */
export type Pattern =
  | 'squat' | 'hinge' | 'lunge'
  | 'pushH' | 'pushV' | 'pullH' | 'pullV'
  | 'sideDelt' | 'rearDelt'
  | 'biceps' | 'triceps'
  | 'quadIso' | 'hamIso' | 'calf' | 'glute'
  | 'coreAnti' | 'coreFlex' | 'coreLateral'
  | 'cardio' | 'mobility' | 'balance'

export type Equipment =
  | 'barbell' | 'dumbbell' | 'kettlebell' | 'cable' | 'machine' | 'band'
  | 'bench' | 'pullupBar' | 'bodyweight' | 'cardioMachine' | 'jumpRope'

export type Category = 'compound' | 'isolation' | 'core' | 'cardio' | 'mobility' | 'balance'

export interface Exercise {
  id: string
  name: string
  pattern: Pattern
  category: Category
  primary: Muscle[]
  secondary: Muscle[]
  equipment: Equipment[]
  /** 1 = beginner-safe, 2 = needs some practice, 3 = advanced */
  level: 1 | 2 | 3
  /** Logged in seconds instead of reps (planks, cardio). */
  timed?: boolean
  /** One side at a time (log reps per side). */
  unilateral?: boolean
  /** Cardio intensity for WHO minute counting (vigorous minutes count double). */
  intensity?: 'moderate' | 'vigorous'
  /** True if it involves jumping / running impact (avoided at high BMI or 65+). */
  highImpact?: boolean
  /** Short plain-language steps. Written for this project, not copied. */
  steps: string[]
  /** Form cues shown next to the animation. */
  cues: string[]
  /** Common mistakes. */
  mistakes: string[]
  /** Animation id in src/anim/poses.ts */
  anim: string
}

export type Sex = 'male' | 'female' | 'other'
export type Experience = 'novice' | 'intermediate' | 'advanced'
export type Goal = 'health' | 'muscle' | 'strength' | 'fatloss'
export type EquipmentAccess = 'gym' | 'dumbbells' | 'bodyweight'

export interface Profile {
  name: string
  age: number
  sex: Sex
  heightCm: number
  weightKg: number
  experience: Experience
  /** Days per week the user can REALISTICALLY train. */
  daysPerWeek: 1 | 2 | 3 | 4 | 5 | 6
  sessionMinutes: 30 | 45 | 60 | 75
  equipment: EquipmentAccess
  goal: Goal
  createdAt: string
}

export interface SetLog {
  reps?: number
  weightKg?: number
  seconds?: number
  /** Reps in reserve: how many more reps you could have done. */
  rir?: number
  done: boolean
}

export interface ExerciseLog {
  exerciseId: string
  sets: SetLog[]
  note?: string
}

export interface CardioLog {
  exerciseId: string
  minutes: number
  intensity: 'moderate' | 'vigorous'
}

export interface Session {
  id: string
  dayId: DayId
  /** Rotation key of the planned day (e.g. 'upper-2'), if it came from the plan. */
  dayKey?: string
  title: string
  startedAt: string
  endedAt?: string
  exercises: ExerciseLog[]
  cardio: CardioLog[]
  /** XP awarded when the session was finished. */
  xp?: number
  /** Why the app recommended this session (shown in the recap). */
  reason?: string
}

/** One prescribed exercise inside a routine day. */
export interface Block {
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
  /** For timed exercises: target seconds per set. */
  seconds?: number
  restSec: number
  /** Target reps in reserve on the last set. */
  rir: number
  /** Swap options for the same pattern. */
  alternatives: string[]
}

export interface RoutineDay {
  /** Unique within the rotation (e.g. 'upper-1', 'upper-2'). */
  key: string
  id: DayId
  /** The muscles this day counts as "training" for recovery and rotation. */
  muscles: Muscle[]
  blocks: Block[]
  /** Cardio finisher in minutes, if any. */
  cardioMinutes: number
  /** Estimated length including warm-up and cardio. */
  minutes: number
  /** Add a balance block (65+). */
  balance?: boolean
}

export interface Program {
  /** Bumped whenever the builder's rules change, so stored plans rebuild. */
  version: number
  split: 'fullbody' | 'upperlower' | 'ppl' | 'ulppl' | 'pplx2'
  splitLabel: string
  /** The day rotation, in order. */
  days: RoutineDay[]
  /** Weekly hard sets per muscle the plan aims for. */
  setsPerMuscleTarget: [number, number]
  /** Weekly moderate-equivalent cardio minutes target. */
  cardioTargetMin: number
  /** Protein target in grams / day. */
  proteinGrams: number
  /** Plain-language reasons the plan looks the way it does. */
  notes: string[]
}
