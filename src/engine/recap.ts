/**
 * Counting what was actually done: sets per muscle, cardio minutes, streaks.
 * A "hard set" is a completed set with reps or seconds logged.
 * Sets count 1 for a primary muscle and 0.5 for a secondary one (fractional
 * counting, the convention used by Pelland 2026).
 */
import { EXERCISE_BY_ID } from '../data/exercises'
import { MUSCLE_IDS, TARGET_MUSCLES, type Muscle } from '../data/muscles'
import type { Profile, Program, Session, SetLog } from '../data/types'

export const isHardSet = (s: SetLog) => s.done && ((s.reps ?? 0) > 0 || (s.seconds ?? 0) > 0)

export const finished = (sessions: Session[]) => sessions.filter((s) => s.endedAt)

export function inRange(sessions: Session[], from: Date, to: Date): Session[] {
  return finished(sessions).filter((s) => {
    const t = new Date(s.endedAt!).getTime()
    return t >= from.getTime() && t < to.getTime()
  })
}

export type MuscleSets = Record<Muscle, number>
export const emptyMuscleSets = (): MuscleSets => Object.fromEntries(MUSCLE_IDS.map((m) => [m, 0])) as MuscleSets

export function setsPerMuscle(sessions: Session[]): MuscleSets {
  const out = emptyMuscleSets()
  for (const s of sessions) {
    for (const log of s.exercises) {
      const ex = EXERCISE_BY_ID[log.exerciseId]
      if (!ex || ex.category === 'cardio' || ex.category === 'mobility' || ex.category === 'balance') continue
      const hard = log.sets.filter(isHardSet).length
      for (const m of ex.primary) out[m] += hard
      for (const m of ex.secondary) out[m] += hard * 0.5
    }
  }
  return out
}

/** Moderate-equivalent cardio minutes (vigorous counts double, WHO 2020). */
export function cardioMinutes(sessions: Session[]): number {
  let total = 0
  for (const s of sessions) {
    for (const c of s.cardio) total += c.minutes * (c.intensity === 'vigorous' ? 2 : 1)
    // cardio exercises logged as timed sets inside the exercise list also count
    for (const log of s.exercises) {
      const ex = EXERCISE_BY_ID[log.exerciseId]
      if (!ex || ex.category !== 'cardio') continue
      const secs = log.sets.filter(isHardSet).reduce((a, b) => a + (b.seconds ?? 0), 0)
      total += (secs / 60) * (ex.intensity === 'vigorous' ? 2 : 1)
    }
  }
  return Math.round(total)
}

/** Total kg moved (weight x reps) for the "volume" stat. */
export function tonnage(sessions: Session[]): number {
  let total = 0
  for (const s of sessions) for (const log of s.exercises) for (const set of log.sets) if (isHardSet(set)) total += (set.weightKg ?? 0) * (set.reps ?? 0)
  return Math.round(total)
}

/** Hours since each muscle last received at least 2 fractional hard sets. Infinity if never. */
export function hoursSinceTrained(sessions: Session[], now: Date): Record<Muscle, number> {
  const out = Object.fromEntries(MUSCLE_IDS.map((m) => [m, Infinity])) as Record<Muscle, number>
  const done = finished(sessions).sort((a, b) => new Date(b.endedAt!).getTime() - new Date(a.endedAt!).getTime())
  for (const s of done) {
    const sets = setsPerMuscle([s])
    const hours = (now.getTime() - new Date(s.endedAt!).getTime()) / 36e5
    for (const m of MUSCLE_IDS) if (sets[m] >= 2 && out[m] === Infinity) out[m] = hours
  }
  return out
}

/* ---------- weeks ---------- */

/** Monday 00:00 of the week containing d (ISO weeks, Europe). */
export function weekStart(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = (x.getDay() + 6) % 7 // Monday = 0
  x.setDate(x.getDate() - day)
  return x
}
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
export const nextMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 1)

export interface PeriodRecap {
  from: Date
  to: Date
  sessions: Session[]
  count: number
  plannedCount: number
  sets: MuscleSets
  setsTarget: [number, number]
  cardio: number
  cardioTarget: number
  tonnage: number
  minutes: number
  xp: number
  /** Muscles under the low end of the target (only the ones the plan tracks). */
  neglected: Muscle[]
  /** Muscles at or above the target. */
  onTarget: Muscle[]
  prs: { exerciseId: string; e1rm: number }[]
}

export function periodRecap(all: Session[], profile: Profile, program: Program, from: Date, to: Date, weeks: number): PeriodRecap {
  const sessions = inRange(all, from, to)
  const sets = setsPerMuscle(sessions)
  const [lo, hi] = program.setsPerMuscleTarget
  const target: [number, number] = [lo * weeks, hi * weeks]
  const neglected = TARGET_MUSCLES.filter((m) => sets[m] < target[0])
  const onTarget = TARGET_MUSCLES.filter((m) => sets[m] >= target[0])
  const minutes = sessions.reduce((a, s) => a + (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime()) / 6e4, 0)
  const before = finished(all).filter((s) => new Date(s.endedAt!).getTime() < from.getTime())
  const prs = findPRs(sessions, before)
  return {
    from, to, sessions, count: sessions.length, plannedCount: profile.daysPerWeek * weeks,
    sets, setsTarget: target, cardio: cardioMinutes(sessions), cardioTarget: program.cardioTargetMin * weeks,
    tonnage: tonnage(sessions), minutes: Math.round(minutes), xp: sessions.reduce((a, s) => a + (s.xp ?? 0), 0),
    neglected, onTarget, prs,
  }
}

/** Epley estimated one-rep max. */
export const e1rm = (w: number, reps: number) => (reps <= 1 ? w : w * (1 + reps / 30))

export function bestE1rm(sessions: Session[], exerciseId: string): number {
  let best = 0
  for (const s of sessions) for (const log of s.exercises) if (log.exerciseId === exerciseId) for (const set of log.sets) if (isHardSet(set) && set.weightKg) best = Math.max(best, e1rm(set.weightKg, set.reps ?? 1))
  return best
}

/** Exercises whose estimated 1RM in `period` beat everything in `before`. */
export function findPRs(period: Session[], before: Session[]): { exerciseId: string; e1rm: number }[] {
  const ids = new Set(period.flatMap((s) => s.exercises.map((e) => e.exerciseId)))
  const out: { exerciseId: string; e1rm: number }[] = []
  for (const id of ids) {
    const now = bestE1rm(period, id)
    const old = bestE1rm(before, id)
    if (now > 0 && now > old) out.push({ exerciseId: id, e1rm: Math.round(now) })
  }
  return out.sort((a, b) => b.e1rm - a.e1rm)
}

/** Consecutive weeks (ending with the current one) that met the planned session count. */
export function weekStreak(all: Session[], profile: Profile, now: Date): number {
  let streak = 0
  let ws = weekStart(now)
  // The current week counts if it is already met; otherwise start from last week.
  const thisWeek = inRange(all, ws, addDays(ws, 7)).length
  if (thisWeek < profile.daysPerWeek) ws = addDays(ws, -7)
  else { streak++; ws = addDays(ws, -7) }
  for (let i = 0; i < 260; i++) {
    const n = inRange(all, ws, addDays(ws, 7)).length
    if (n >= profile.daysPerWeek) { streak++; ws = addDays(ws, -7) } else break
  }
  return streak
}
