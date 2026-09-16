/**
 * What should I do today?
 *
 *   1. Trained 2 times or fewer in the last 14 days (after the first 2 weeks)?
 *      -> a full-body "health" session plus cardio. With so few visits, every
 *         visit has to touch every muscle (Schoenfeld 2016) and the biggest
 *         health return per visit is ~30-60 min of lifting + some aerobic work
 *         (Momma 2022, Gorzelitz 2022).
 *   2. Otherwise, the next day in the split rotation, skipping any day whose
 *      main muscles were trained less than 48 hours ago (Phillips 1997, Damas 2016).
 *   3. If nothing is recovered, or the week's planned sessions are already done,
 *      a cardio or mobility day so the visit still counts.
 */
import { NAMES } from '../theme/names'
import type { Profile, Program, RoutineDay, Session } from '../data/types'
import { MUSCLES } from '../data/muscles'
import { cardioDay, healthDay, mobilityDay } from './program'
import { addDays, cardioMinutes, finished, hoursSinceTrained, inRange, weekStart } from './recap'
import { buildWarmup, type WarmupPlan } from './warmup'

export type Mode = 'plan' | 'health' | 'recovery' | 'cardio' | 'done'

export interface Recommendation {
  mode: Mode
  day: RoutineDay
  title: string
  reason: string
  /** Extra cardio minutes added because the week is behind on cardio. */
  extraCardio: number
  warmup: WarmupPlan
  /** Other days you could pick instead. */
  alternatives: RoutineDay[]
}

export const RECOVERY_HOURS = 48
const dayName = (d: RoutineDay) => NAMES.days[d.id]

export function recommend(profile: Profile, program: Program, sessions: Session[], now = new Date()): Recommendation {
  const done = finished(sessions)
  const last14 = inRange(done, addDays(now, -14), addDays(now, 1))
  // Days since the FIRST real session (not since the profile was made), so a brand-new user gets the plan.
  const firstDone = [...done].sort((a, b) => new Date(a.endedAt!).getTime() - new Date(b.endedAt!).getTime())[0]
  const sinceStart = firstDone ? (now.getTime() - new Date(firstDone.endedAt!).getTime()) / 864e5 : 0
  const ws = weekStart(now)
  const thisWeek = inRange(done, ws, addDays(ws, 7))
  const cardioThisWeek = cardioMinutes(thisWeek)
  const cardioGap = Math.max(0, program.cardioTargetMin - cardioThisWeek)
  const since = hoursSinceTrained(done, now)

  const finish = (mode: Mode, day: RoutineDay, reason: string, alternatives: RoutineDay[]): Recommendation => {
    // If the week is behind on cardio and this day has little, add a finisher.
    const daysLeft = 7 - ((now.getDay() + 6) % 7)
    const needPerDay = cardioGap / Math.max(1, Math.min(daysLeft, profile.daysPerWeek - thisWeek.length || 1))
    const extraCardio = mode === 'cardio' || done.length === 0 ? 0 : Math.min(10, Math.max(0, Math.round(needPerDay - day.cardioMinutes)))
    return { mode, day, title: dayName(day), reason, extraCardio, warmup: buildWarmup(day, profile, sessions), alternatives }
  }

  // 1. Low attendance -> health session.
  if (sinceStart >= 14 && last14.length <= 2 && profile.daysPerWeek >= 3) {
    const day = healthDay(profile)
    return finish('health', day,
      `You trained ${last14.length} time${last14.length === 1 ? '' : 's'} in the last 14 days. With visits this rare, one full-body session that hits every muscle plus some cardio gives the biggest health return per visit. Your split resumes once you are back to ${profile.daysPerWeek} days a week.`,
      program.days)
  }

  // 2. Rotation.
  const lastKey = done.sort((a, b) => new Date(b.endedAt!).getTime() - new Date(a.endedAt!).getTime())[0]
  const keys = program.days.map((d) => d.key)
  let start = 0
  if (lastKey) {
    const idx = keys.indexOf(lastDayKey(lastKey))
    start = idx >= 0 ? (idx + 1) % keys.length : 0
  }
  const ordered = [...program.days.slice(start), ...program.days.slice(0, start)]

  const recovered = (d: RoutineDay) => {
    if (!d.muscles.length) return true
    const fresh = d.muscles.filter((m) => since[m] < RECOVERY_HOURS)
    // allow a day if fewer than half its muscles are still recovering
    return fresh.length < d.muscles.length / 2
  }

  if (thisWeek.length >= profile.daysPerWeek && profile.daysPerWeek < 6) {
    const day = cardioGap > 0 ? cardioDay(profile) : mobilityDay(profile)
    return finish(cardioGap > 0 ? 'cardio' : 'done', day,
      cardioGap > 0
        ? `All ${profile.daysPerWeek} planned sessions are done this week. You are ${cardioGap} cardio minutes short of the weekly target, so today is cardio and core.`
        : `All ${profile.daysPerWeek} planned sessions are done and cardio is on target. An easy mobility session keeps the habit without eating into recovery.`,
      ordered)
  }

  for (const day of ordered) {
    if (recovered(day)) {
      const stillFresh = day.muscles.filter((m) => since[m] < RECOVERY_HOURS).map((m) => MUSCLES[m].label)
      const reason = lastKey
        ? `Next in your ${program.splitLabel.toLowerCase()} rotation after ${lastKey.title}. Its muscles have had at least 48 hours since they were last trained${stillFresh.length ? ` (${stillFresh.join(', ')} still a bit fresh, go lighter there)` : ''}.`
        : `First session of your ${program.splitLabel.toLowerCase()} plan.`
      return finish('plan', day, reason, ordered.filter((d) => d !== day))
    }
  }

  // 3. Nothing recovered.
  const day = cardioGap > 0 ? cardioDay(profile) : mobilityDay(profile)
  return finish('recovery', day,
    `Every muscle group in your plan was trained within the last 48 hours. Muscle is built while you recover, so today is ${cardioGap > 0 ? 'cardio and core' : 'mobility'} and the next lifting day will be ready tomorrow.`,
    ordered)
}

/** Sessions store the rotation key in dayKey when they came from the plan. */
const lastDayKey = (s: Session): string => s.dayKey ?? s.dayId
