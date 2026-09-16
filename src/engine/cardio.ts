/** Which Mount Doom session is next: steady and intervals alternate, counted over finished cardio days. */
import type { CardioSession, RoutineDay, Session } from '../data/types'

export function cardioSessionFor(day: RoutineDay, sessions: Session[]): CardioSession | undefined {
  if (!day.cardioPlan) return undefined
  const done = sessions.filter((s) => s.endedAt && s.dayId === 'cardio').length
  if (day.cardioPlan.intervals && done % 2 === 1) return day.cardioPlan.intervals
  return day.cardioPlan.steady
}
