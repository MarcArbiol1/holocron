/**
 * THE FORGE: the warm-up shown before every session.
 * Structure (Fradkin 2010, Behm 2016, Abad 2011): a few minutes of easy cardio,
 * dynamic movements for the joints about to work, then 2 light "ramp-up" sets
 * of the first big lift. No long static stretches: holding a stretch over 60 s
 * measurably weakens the next lift (Simic 2013).
 */
import { EXERCISE_BY_ID } from '../data/exercises'
import type { Profile, RoutineDay, Session } from '../data/types'
import { ageBracket, preferLowImpact } from './profile'
import { lastLog } from './progression'
import { isHardSet } from './recap'
import { roundLoad } from './progression'

export interface RampSet { pct: number; reps: number; weightKg?: number }
export interface WarmupPlan {
  general: { exerciseId: string; minutes: number }
  dynamic: { exerciseId: string; reps?: number; seconds?: number }[]
  ramp?: { exerciseId: string; sets: RampSet[]; basedOnKg?: number }
  totalMinutes: number
  rules: string[]
}

const LOWER = ['legSwings', 'hipCircles', 'bodyweightSquat', 'worldsGreatest', 'ankleRocks']
const UPPER = ['armCircles', 'bandPullApart', 'shoulderDislocates', 'catCow', 'kneePushUp']
const FULL = ['legSwings', 'armCircles', 'worldsGreatest', 'bandPullApart', 'bodyweightSquat']

export function buildWarmup(day: RoutineDay, profile: Profile, sessions: Session[]): WarmupPlan {
  const older = ageBracket(profile.age) === 'older'
  const lowImpact = preferLowImpact(profile)
  const generalId = profile.equipment === 'gym' ? (lowImpact ? 'bike' : 'inclineWalk') : lowImpact ? 'inclineWalk' : 'jumpingJacks'
  const general = { exerciseId: generalId, minutes: older ? 8 : 5 }

  const lowerDay = ['legs', 'lower', 'health'].includes(day.id) || day.key.startsWith('full')
  const upperDay = ['push', 'pull', 'upper'].includes(day.id)
  const list = day.id === 'cardio' || day.id === 'mobility' ? FULL : lowerDay && !upperDay ? (day.key.startsWith('full') || day.id === 'health' ? FULL : LOWER) : UPPER
  const dynamic = list
    .filter((id) => EXERCISE_BY_ID[id])
    .filter((id) => profile.equipment !== 'bodyweight' || !EXERCISE_BY_ID[id].equipment.includes('band') || EXERCISE_BY_ID[id].equipment.includes('bodyweight'))
    .slice(0, 4)
    .map((id) => {
      const ex = EXERCISE_BY_ID[id]
      return ex.timed ? { exerciseId: id, seconds: 30 } : { exerciseId: id, reps: 10 }
    })

  // Ramp-up sets on the first compound lift, from the last working weight.
  let ramp: WarmupPlan['ramp']
  const first = day.blocks.find((b) => EXERCISE_BY_ID[b.exerciseId]?.category === 'compound')
  if (first) {
    const last = lastLog(sessions, first.exerciseId)
    const w = last ? Math.max(...last.log.sets.filter(isHardSet).map((s) => s.weightKg ?? 0)) : 0
    const sets: RampSet[] = [
      { pct: 50, reps: 8, weightKg: w ? roundLoad(w * 0.5) : undefined },
      { pct: 70, reps: 4, weightKg: w ? roundLoad(w * 0.7) : undefined },
    ]
    ramp = { exerciseId: first.exerciseId, sets, basedOnKg: w || undefined }
  }

  const totalMinutes = general.minutes + Math.ceil(dynamic.length * 0.75) + (ramp ? 3 : 0)
  const rules = [
    'Easy cardio until you are slightly warm and breathing a little faster.',
    'Dynamic moves only. Save long stretches (over 60 seconds) for after training.',
    ramp ? 'Ramp-up sets are practice, not work: light, crisp reps with full rest before the first real set.' : 'Start the first exercise with an easy set before the real ones.',
  ]
  return { general, dynamic, ramp, totalMinutes, rules }
}
