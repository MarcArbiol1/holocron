/**
 * XP and the twelve-step ladder. XP rewards showing up and doing hard sets,
 * with a bonus for finishing the week you planned, so consistency beats heroics.
 */
import { NAMES, type LevelName } from '../theme/names'
import type { Profile, Session } from '../data/types'
import { cardioMinutes, findPRs, finished, inRange, isHardSet, weekStart, addDays } from './recap'

/** Cumulative XP needed to REACH each level (index 0 = Recruit). */
export const THRESHOLDS = [0, 500, 1500, 3000, 5000, 8000, 12000, 17000, 24000, 33000, 45000, 60000] as const

export interface LevelInfo {
  index: number
  name: LevelName
  next?: LevelName
  /** XP into the current level and XP needed to leave it. */
  into: number
  span: number
  progress: number // 0..1
  totalXp: number
}

export function levelFor(totalXp: number): LevelInfo {
  let index = 0
  for (let i = 0; i < THRESHOLDS.length; i++) if (totalXp >= THRESHOLDS[i]) index = i
  const base = THRESHOLDS[index]
  const nextT = THRESHOLDS[index + 1]
  const span = nextT !== undefined ? nextT - base : 1
  const into = totalXp - base
  return {
    index, name: NAMES.levels[index], next: NAMES.levels[index + 1],
    into, span, progress: nextT === undefined ? 1 : Math.min(1, into / span), totalXp,
  }
}

export interface XpBreakdown { base: number; sets: number; cardio: number; week: number; prs: number; total: number; lines: string[] }

/**
 * XP for a session that just finished. `history` = all OTHER finished sessions.
 * base 100, +5 per hard set (max 40), +2 per moderate-equivalent cardio minute (max 60),
 * +150 the moment the week reaches the planned session count, +50 per new estimated-1RM record (max 3).
 */
export function sessionXp(session: Session, history: Session[], profile: Profile): XpBreakdown {
  const hardSets = session.exercises.reduce((a, e) => a + e.sets.filter(isHardSet).length, 0)
  const sets = Math.min(hardSets, 40) * 5
  const cardio = Math.min(cardioMinutes([session]), 60) * 2
  const end = new Date(session.endedAt ?? Date.now())
  const ws = weekStart(end)
  const weekCount = inRange(finished(history), ws, addDays(ws, 7)).length + 1
  const week = weekCount === profile.daysPerWeek ? 150 : 0
  const prs = Math.min(findPRs([session], finished(history)).length, 3) * 50
  const base = 100
  const total = base + sets + cardio + week + prs
  const lines = [`+${base} showed up`]
  if (sets) lines.push(`+${sets} for ${Math.min(hardSets, 40)} hard sets`)
  if (cardio) lines.push(`+${cardio} for cardio`)
  if (week) lines.push(`+${week} week complete (${profile.daysPerWeek}/${profile.daysPerWeek})`)
  if (prs) lines.push(`+${prs} new records`)
  return { base, sets, cardio, week, prs, total, lines }
}

export const totalXp = (sessions: Session[]) => finished(sessions).reduce((a, s) => a + (s.xp ?? 0), 0)
