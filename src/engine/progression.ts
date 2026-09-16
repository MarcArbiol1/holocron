/**
 * Next-weight suggestions: "double progression".
 * Hit the top of the rep range on every set with reps to spare -> add weight
 * (ACSM 2009: raise the load 2-10% once you can do 1-2 reps over target).
 * Miss the bottom of the range on two sets -> take a little off.
 */
import { EXERCISE_BY_ID } from '../data/exercises'
import type { Block, ExerciseLog, Session } from '../data/types'
import { isHardSet } from './recap'

export interface Suggestion {
  weightKg?: number
  reps: number
  note: string
  /** 'up' | 'same' | 'down' | 'new' */
  trend: 'up' | 'same' | 'down' | 'new'
}

/** The last time this exercise was logged with at least one hard set. */
export function lastLog(sessions: Session[], exerciseId: string): { log: ExerciseLog; session: Session } | undefined {
  const done = sessions.filter((s) => s.endedAt).sort((a, b) => new Date(b.endedAt!).getTime() - new Date(a.endedAt!).getTime())
  for (const s of done) {
    const log = s.exercises.find((e) => e.exerciseId === exerciseId && e.sets.some(isHardSet))
    if (log) return { log, session: s }
  }
  return undefined
}

const isLowerCompound = (id: string) => {
  const ex = EXERCISE_BY_ID[id]
  return ex?.category === 'compound' && ['squat', 'hinge', 'lunge', 'glute'].includes(ex.pattern)
}

/** Round to the plates most gyms have. */
export const roundLoad = (kg: number, stepKg = 2.5) => Math.round(kg / stepKg) * stepKg

export function suggest(block: Block, sessions: Session[]): Suggestion {
  const ex = EXERCISE_BY_ID[block.exerciseId]
  const last = lastLog(sessions, block.exerciseId)
  const target = block.repMax
  if (!last) {
    return {
      reps: block.repMin,
      trend: 'new',
      note: ex?.category === 'compound'
        ? `First time. Pick a weight you could do about ${block.repMax + 3} reps with, log it, and the app takes it from here.`
        : `First time. Start light and stop ${block.rir} reps short of failure.`,
    }
  }
  const sets = last.log.sets.filter(isHardSet)
  const weight = Math.max(...sets.map((s) => s.weightKg ?? 0))
  const reps = sets.map((s) => s.reps ?? 0)
  const step = isLowerCompound(block.exerciseId) ? 5 : 2.5
  const allTop = sets.length >= block.sets && reps.every((r) => r >= target)
  const spare = sets.every((s) => (s.rir ?? 0) >= block.rir)
  const missed = reps.filter((r) => r < block.repMin).length >= 2

  if (!weight) {
    // bodyweight or timed: progress by reps / seconds
    if (allTop) return { reps: target, trend: 'up', note: `You hit ${target} on every set. Add a rep, slow the lowering, or move to a harder version.` }
    return { reps: Math.max(block.repMin, Math.min(...reps) + 1), trend: 'same', note: `Last time ${reps.join('/')}. Beat one of those numbers.` }
  }
  if (allTop && spare) {
    const next = roundLoad(weight + step)
    return { weightKg: next, reps: block.repMin, trend: 'up', note: `Every set reached ${target} with reps to spare. Go to ${next} kg and rebuild the reps from ${block.repMin}.` }
  }
  if (missed) {
    const next = roundLoad(weight * 0.925)
    return { weightKg: next, reps: block.repMin, trend: 'down', note: `Two sets fell under ${block.repMin} reps last time. Drop to ${next} kg and own the range first.` }
  }
  return { weightKg: weight, reps: Math.min(target, Math.max(...reps) + 1), trend: 'same', note: `Same ${weight} kg. Last time ${reps.join('/')}: add a rep on one set.` }
}
