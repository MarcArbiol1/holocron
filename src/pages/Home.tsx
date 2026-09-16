import { useState } from 'react'
import { ChevronRight, Dumbbell, Flame, Play, Square } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { levelFor, totalXp } from '../engine/levels'
import { addDays, cardioMinutes, inRange, weekStart, weekStreak } from '../engine/recap'
import { useRecommendation } from '../store/hooks'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { DAY_COLOR, LevelPill, LiquidDock, ProfileButton, dayTitle, fmtDate, fmtDuration, todayLabel } from '../components/ui'
import { Figure } from '../components/Figure'
import { HapticSwitch, haptic } from '../lib/haptics'
import type { RoutineDay } from '../data/types'

const MODE_LABEL: Record<string, string> = { plan: 'Next in your rotation', health: 'Health first', recovery: 'Recovery day', cardio: 'Cardio day', done: 'Week complete' }

/** Three rings: sessions this week (outer), cardio minutes (middle), XP into the level (inner). */
function Rings({ sessions, cardio, xp }: { sessions: number; cardio: number; xp: number }) {
  const ring = (r: number, frac: number) => {
    const c = 2 * Math.PI * r
    return { dasharray: c, dashoffset: c * (1 - Math.max(0, Math.min(1, frac))) }
  }
  const a = ring(90, sessions), b = ring(67, cardio), c = ring(44, xp)
  return (
    <svg viewBox="0 0 224 224" className="absolute inset-0 -rotate-90 overflow-visible" aria-hidden="true">
      <circle cx="112" cy="112" r="90" fill="none" stroke="currentColor" strokeWidth="16" className="text-panel" />
      <circle cx="112" cy="112" r="90" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeDasharray={a.dasharray} strokeDashoffset={a.dashoffset} className="activity-ring text-glow transition-[stroke-dashoffset] duration-700 ease-apple" />
      <circle cx="112" cy="112" r="67" fill="none" stroke="currentColor" strokeWidth="16" className="text-panel" />
      <circle cx="112" cy="112" r="67" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeDasharray={b.dasharray} strokeDashoffset={b.dashoffset} className="activity-ring-soft text-soft transition-[stroke-dashoffset] duration-700 ease-apple" />
      <circle cx="112" cy="112" r="44" fill="none" stroke="currentColor" strokeWidth="16" className="text-panel" />
      <circle cx="112" cy="112" r="44" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeDasharray={c.dasharray} strokeDashoffset={c.dashoffset} className="activity-ring-faint text-ice transition-[stroke-dashoffset] duration-700 ease-apple" />
    </svg>
  )
}

export default function Home() {
  const nav = useNavigate()
  const profile = useStore((s) => s.profile)
  const program = useStore((s) => s.program)
  const sessions = useStore((s) => s.sessions)
  const active = useStore((s) => s.active)
  const startSession = useStore((s) => s.startSession)
  const discardSession = useStore((s) => s.discardSession)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const rec = useRecommendation()
  if (!profile || !program) return <Navigate to="/onboarding" replace />
  if (!rec) return null

  const now = new Date()
  const ws = weekStart(now)
  const week = inRange(sessions, ws, addDays(ws, 7))
  const cardio = cardioMinutes(week)
  const lv = levelFor(totalXp(sessions))
  const streak = weekStreak(sessions, profile, now)
  const weekPct = Math.round(Math.min(1, week.length / profile.daysPerWeek) * 100)
  const recent = [...sessions].filter((s) => s.endedAt).sort((a, b) => new Date(b.endedAt!).getTime() - new Date(a.endedAt!).getTime()).slice(0, 3)
  const minutes = rec.day.minutes + rec.extraCardio
  const cardioTotal = rec.day.cardioMinutes + rec.extraCardio

  const start = (day: RoutineDay, title: string, reason: string, extra: number) => {
    haptic('success')
    startSession(day, title, reason, extra, rec.warmup)
    nav('/forge')
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-night text-ice">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pb-36 pt-[max(2rem,env(safe-area-inset-top))]">
        <header className="aether-rise flex items-end justify-between">
          <div>
            <p className="kicker">{todayLabel()}</p>
            <h1 className="mt-1 text-[32px] font-bold leading-none">{NAMES.app}</h1>
          </div>
          <ProfileButton />
        </header>
        <div className="aether-rise rise-1 mt-3 flex items-center gap-2">
          <LevelPill />
          {streak > 0 && <span className="chip-dim">{streak}-week streak</span>}
        </div>

        <section className="aether-rise rise-1 mt-8 flex justify-center" aria-label="Weekly progress">
          <div className="relative size-[238px]">
            <Rings sessions={week.length / profile.daysPerWeek} cardio={cardio / program.cardioTargetMin} xp={lv.progress} />
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <span className="text-[38px] font-bold leading-none">{weekPct}</span><span className="text-sm text-dim">%</span>
                <p className="mt-1 text-xs font-medium text-dim">Week goal</p>
              </div>
            </div>
          </div>
        </section>

        <section className="aether-rise rise-2 mt-7 grid grid-cols-2 gap-3" aria-label="This week">
          <div className="metric-panel p-4">
            <p className="text-xs font-semibold text-glow">Sessions</p>
            <p className="mt-1 text-xl font-bold">{week.length} <span className="text-xs font-medium text-dim">/ {profile.daysPerWeek} planned</span></p>
          </div>
          <div className="metric-panel p-4">
            <p className="text-xs font-semibold text-soft">Cardio</p>
            <p className="mt-1 text-xl font-bold">{cardio} <span className="text-xs font-medium text-dim">/ {program.cardioTargetMin} min</span></p>
          </div>
        </section>

        <section className="aether-rise rise-3 mt-7" aria-labelledby="today-title">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-dim">{active ? 'In progress' : 'Today'}</p>
              <h2 id="today-title" className="mt-1 text-lg font-semibold truncate">{active ? active.title : rec.title}</h2>
            </div>
            <span className="chip-glow shrink-0">{active ? fmtDuration(active.startedAt) : MODE_LABEL[rec.mode]}</span>
          </div>
          {active ? (
            <>
              <Link to="/session" onClick={() => haptic()} className="primary-action mt-4 flex w-full items-center justify-between rounded-2xl p-4 text-left">
                <span className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl text-glow" style={{ background: 'color-mix(in oklab, var(--glow) 14%, transparent)' }}><Play className="size-5 fill-current" /></span>
                  <span><span className="block text-sm font-semibold">Resume session</span><span className="mt-0.5 block text-xs text-dim">{active.exercises.length} exercises</span></span>
                </span>
                <ChevronRight className="size-5 text-dim" />
              </Link>
              <button onClick={() => { haptic('warning'); setConfirmEnd(true) }} className="btn-danger relative mt-2 w-full py-2.5 text-sm">
                <Square className="size-4" /> Terminate workout<HapticSwitch />
              </button>
            </>
          ) : (
            <button onClick={() => start(rec.day, rec.title, rec.reason, rec.extraCardio)} className="primary-action aether-sheen relative mt-4 flex w-full items-center justify-between rounded-2xl p-4 text-left">
              <HapticSwitch />
              <span className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl text-glow" style={{ background: 'color-mix(in oklab, var(--glow) 14%, transparent)' }}><Play className="size-5 fill-current" /></span>
                <span><span className="block text-sm font-semibold">Enter {NAMES.pages.forge}</span><span className="mt-0.5 block text-xs text-dim">~{minutes} min · {rec.day.blocks.length} exercises{cardioTotal > 0 ? ` + ${cardioTotal} min cardio` : ''}</span></span>
              </span>
              <ChevronRight className="size-5 text-dim" />
            </button>
          )}
          <p className="mt-3 text-xs leading-relaxed text-dim">{rec.reason}</p>
          <ul className="mt-3 space-y-2">
            {rec.day.blocks.map((b) => {
              const ex = EXERCISE_BY_ID[b.exerciseId]
              return (
                <li key={b.exerciseId}>
                  <Link to={`/exercise/${ex.id}`} onClick={() => haptic()} className="workout-row flex items-center gap-3 rounded-2xl p-2.5">
                    <Figure animId={ex.anim} size={44} playing={false} className="rounded-xl shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{ex.name}</span>
                      <span className="mt-0.5 block text-xs text-dim">{b.sets} × {b.seconds ? `${b.seconds} s` : `${b.repMin}–${b.repMax}`} · rest {Math.round((b.restSec / 60) * 10) / 10} min</span>
                    </span>
                    <ChevronRight className="size-4 text-dim" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        {!active && rec.alternatives.length > 0 && (
          <section className="aether-rise rise-4 mt-7" aria-labelledby="alt-title">
            <h2 id="alt-title" className="text-lg font-semibold">Or choose another day</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {rec.alternatives.map((d) => (
                <button key={d.key} onClick={() => start(d, dayTitle(d), 'Chosen manually.', 0)} className="workout-row relative rounded-2xl p-4 text-left">
                  <HapticSwitch />
                  <span className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: DAY_COLOR[d.id] }}>{d.key.replace('-', ' ')}</span>
                  <span className="mt-1 block text-sm font-semibold">{dayTitle(d)}</span>
                  <span className="mt-0.5 block text-xs text-dim">{d.blocks.length} exercises · ~{d.minutes} min</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="aether-rise rise-5 mt-7" aria-labelledby="recent-title">
          <div className="flex items-center justify-between">
            <h2 id="recent-title" className="text-lg font-semibold">Recent sessions</h2>
            <Link to="/palantir" onClick={() => haptic()} className="text-sm font-semibold text-glow">Show more</Link>
          </div>
          <div className="mt-3 space-y-3">
            {recent.length === 0 && <p className="text-sm text-dim">Your first session will appear here.</p>}
            {recent.map((s) => {
              const sets = s.exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0)
              const isCardio = s.dayId === 'cardio'
              return (
                <Link key={s.id} to={`/history/${s.id}`} onClick={() => haptic()} className="workout-row flex w-full items-center gap-4 rounded-2xl p-4 text-left">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: isCardio ? 'color-mix(in oklab, var(--ice) 9%, transparent)' : 'color-mix(in oklab, var(--glow) 14%, transparent)', color: isCardio ? 'var(--ice)' : 'var(--glow)' }}>
                    {isCardio ? <Flame className="size-5" /> : <Dumbbell className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate">{s.title}</span>
                    <span className="mt-1 block text-xs text-dim">{fmtDate(s.endedAt!)} · {fmtDuration(s.startedAt, s.endedAt)} · {sets} sets · +{s.xp ?? 0} XP</span>
                  </span>
                  <ChevronRight className="size-5 text-dim" />
                </Link>
              )
            })}
          </div>
        </section>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-dim" aria-label="A subtle constellation points toward the road ahead">
          {['bg-glow/80', 'bg-dim/50', 'bg-soft/80', 'bg-dim/50', 'bg-glow/80'].map((color, index) => <span key={index} className={`size-1 rounded-full ${color}`} />)}
        </div>
      </div>
      {confirmEnd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: 'color-mix(in oklab, var(--night) 80%, transparent)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} onClick={() => setConfirmEnd(false)}>
          <div className="metric-panel w-full max-w-sm space-y-3 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Terminate the workout?</h3>
            <p className="text-sm text-dim">Everything logged in this session is lost. To keep it, open the session and press Finish.</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost" onClick={() => setConfirmEnd(false)}>Back</button>
              <button className="btn-danger" onClick={() => { haptic('warning'); discardSession(); setConfirmEnd(false) }}>Terminate</button>
            </div>
          </div>
        </div>
      )}
      <LiquidDock />
    </main>
  )
}
