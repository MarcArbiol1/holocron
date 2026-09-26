/**
 * All app state, saved automatically to the phone's browser storage.
 * One store, one JSON blob under the key 'holocron-v1'. Export/import is that blob.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CardioLog, ExerciseLog, Profile, Program, RoutineDay, Session } from '../data/types'
import { buildProgram } from '../engine/program'
import { sessionXp, type XpBreakdown } from '../engine/levels'
import { uid } from '../engine/ids'
import { EXERCISE_BY_ID } from '../data/exercises'
import type { WarmupPlan } from '../engine/warmup'
import { cardioSessionFor } from '../engine/cardio'
import type { Account, CloudState } from '../lib/cloud'

export interface Settings {
  restTimer: boolean
  sound: boolean
  /** Show the rest countdown on the lock screen / Dynamic Island via a Now Playing card (opt-in, iOS is fragile). */
  liveTimer: boolean
}

export interface State {
  profile?: Profile
  program?: Program
  sessions: Session[]
  /** Ids of sessions deleted on this phone, so a cloud merge does not bring them back. */
  deleted: string[]
  active?: Session
  activeWarmup?: WarmupPlan
  forged: boolean
  settings: Settings
  lastXp?: XpBreakdown
  /** The running rest countdown, kept here so it survives leaving the session page. */
  rest?: { endsAt: number; startedAt: number; label: string }
  /** Signed-in account (Supabase user), when accounts are on and the user chose one. */
  account?: Account
  /** The account this phone's data was last synced with; a different account must not absorb it. */
  lastUserId?: string
  cloud: { status: 'idle' | 'syncing' | 'error'; lastSyncAt?: string; error?: string }
  /** The user chose to keep everything on this phone; do not show the login page first. */
  loginSkipped: boolean

  setProfile: (p: Profile) => void
  startSession: (day: RoutineDay, title: string, reason: string, extraCardio: number, warmup?: WarmupPlan) => void
  setForged: (v: boolean) => void
  updateActive: (fn: (s: Session) => Session) => void
  setSet: (exIdx: number, setIdx: number, patch: Partial<ExerciseLog['sets'][number]>) => void
  addSet: (exIdx: number) => void
  removeSet: (exIdx: number, setIdx: number) => void
  swapExercise: (exIdx: number, newId: string) => void
  addExercise: (id: string, sets?: number) => void
  removeExercise: (exIdx: number) => void
  setCardio: (cardio: CardioLog[]) => void
  finishSession: () => XpBreakdown | undefined
  discardSession: () => void
  deleteSession: (id: string) => void
  setSettings: (s: Partial<Settings>) => void
  setRest: (r: State['rest']) => void
  setAccount: (a: Account | undefined) => void
  setLastUserId: (id: string | undefined) => void
  setCloud: (c: Partial<State['cloud']>) => void
  setLoginSkipped: (v: boolean) => void
  /** Replace profile, sessions and settings with a merged cloud copy (keeps the running session). */
  adoptCloud: (data: CloudState, replace?: boolean) => void
  importData: (json: string) => void
  exportData: () => string
  reset: () => void
}

const blankSets = (exerciseId: string, n: number) => {
  const ex = EXERCISE_BY_ID[exerciseId]
  return Array.from({ length: n }, () => (ex?.timed ? { seconds: undefined, done: false } : { reps: undefined, weightKg: undefined, done: false }))
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      sessions: [],
      deleted: [],
      forged: false,
      settings: { restTimer: true, sound: false, liveTimer: false },
      cloud: { status: 'idle' },
      loginSkipped: false,

      setProfile: (profile) => set({ profile, program: buildProgram(profile) }),

      startSession: (day, title, reason, extraCardio, warmup) => {
        const exercises: ExerciseLog[] = day.blocks.map((b) => ({ exerciseId: b.exerciseId, sets: blankSets(b.exerciseId, b.sets) }))
        const session: Session = {
          id: uid(), dayId: day.id, dayKey: day.key, title, reason,
          startedAt: new Date().toISOString(), exercises, cardio: [],
        }
        const plannedCardio = day.cardioMinutes + extraCardio
        const planned = cardioSessionFor(day, get().sessions)
        if (planned) session.cardio = [{ exerciseId: planned.exerciseId, minutes: planned.minutes, intensity: planned.intensity }]
        else if (plannedCardio > 0) session.cardio = [{ exerciseId: '', minutes: 0, intensity: 'moderate' }]
        set({ active: session, activeWarmup: warmup, forged: false, lastXp: undefined, rest: undefined })
      },
      setForged: (v) => set({ forged: v }),
      updateActive: (fn) => { const a = get().active; if (a) set({ active: fn(a) }) },
      setSet: (exIdx, setIdx, patch) => get().updateActive((s) => {
        const exercises = s.exercises.map((e, i) => i !== exIdx ? e : { ...e, sets: e.sets.map((st, j) => (j !== setIdx ? st : { ...st, ...patch })) })
        return { ...s, exercises }
      }),
      addSet: (exIdx) => get().updateActive((s) => {
        const exercises = s.exercises.map((e, i) => {
          if (i !== exIdx) return e
          const last = e.sets[e.sets.length - 1]
          return { ...e, sets: [...e.sets, { ...last, done: false }] }
        })
        return { ...s, exercises }
      }),
      removeSet: (exIdx, setIdx) => get().updateActive((s) => ({ ...s, exercises: s.exercises.map((e, i) => (i !== exIdx ? e : { ...e, sets: e.sets.filter((_, j) => j !== setIdx) })) })),
      swapExercise: (exIdx, newId) => get().updateActive((s) => ({ ...s, exercises: s.exercises.map((e, i) => (i !== exIdx ? e : { exerciseId: newId, sets: blankSets(newId, e.sets.length) })) })),
      addExercise: (id, sets = 3) => get().updateActive((s) => ({ ...s, exercises: [...s.exercises, { exerciseId: id, sets: blankSets(id, sets) }] })),
      removeExercise: (exIdx) => get().updateActive((s) => ({ ...s, exercises: s.exercises.filter((_, i) => i !== exIdx) })),
      setCardio: (cardio) => get().updateActive((s) => ({ ...s, cardio })),

      finishSession: () => {
        const { active, sessions, profile } = get()
        if (!active || !profile) return undefined
        // Nothing ticked and no cardio: there is nothing to save, and an empty session would still
        // earn XP, count toward the week and move the rotation past a day that was never done.
        const anySet = active.exercises.some((e) => e.sets.some((x) => x.done))
        const anyCardio = active.cardio.some((c) => c.minutes > 0 && c.exerciseId)
        if (!anySet && !anyCardio) { get().discardSession(); return undefined }
        const done: Session = {
          ...active,
          endedAt: new Date().toISOString(),
          cardio: active.cardio.filter((c) => c.minutes > 0 && c.exerciseId),
          exercises: active.exercises.filter((e) => e.sets.some((s) => s.done)),
        }
        const xp = sessionXp(done, sessions, profile)
        done.xp = xp.total
        set({ sessions: [...sessions, done], active: undefined, activeWarmup: undefined, forged: false, lastXp: xp, rest: undefined })
        return xp
      },
      discardSession: () => set({ active: undefined, activeWarmup: undefined, forged: false, rest: undefined }),
      deleteSession: (id) => set({ sessions: get().sessions.filter((s) => s.id !== id), deleted: [...get().deleted, id] }),
      setSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      setRest: (rest) => set({ rest }),
      setAccount: (account) => set({ account }),
      setLastUserId: (lastUserId) => set({ lastUserId }),
      setCloud: (c) => set({ cloud: { ...get().cloud, ...c } }),
      setLoginSkipped: (loginSkipped) => set({ loginSkipped }),
      adoptCloud: (data, replace) => {
        const cur = get()
        const profile = replace ? data.profile : data.profile ?? cur.profile
        const program = !profile ? undefined : profile !== cur.profile || !cur.program ? buildProgram(profile) : cur.program
        set({ profile, program, sessions: data.sessions ?? cur.sessions, settings: data.settings ?? cur.settings, deleted: data.deletedIds ?? cur.deleted })
      },

      importData: (json) => {
        const data = JSON.parse(json)
        if (!data || !Array.isArray(data.sessions)) throw new Error('Not a Holocron backup')
        set({ profile: data.profile, program: data.profile ? buildProgram(data.profile) : undefined, sessions: data.sessions, settings: data.settings ?? get().settings, active: undefined, rest: undefined })
      },
      exportData: () => JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), profile: get().profile, sessions: get().sessions, settings: get().settings }, null, 2),
      reset: () => set({ profile: undefined, program: undefined, sessions: [], deleted: [], active: undefined, activeWarmup: undefined, forged: false, lastXp: undefined, rest: undefined }),
    }),
    {
      name: 'holocron-v1',
      partialize: (s) => ({ profile: s.profile, program: s.program, sessions: s.sessions, deleted: s.deleted, active: s.active, activeWarmup: s.activeWarmup, forged: s.forged, settings: s.settings, lastXp: s.lastXp, rest: s.rest, account: s.account, lastUserId: s.lastUserId, loginSkipped: s.loginSkipped }),
    },
  ),
)
