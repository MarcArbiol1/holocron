import { useEffect, useState } from 'react'
import { ChevronRight, Dumbbell, Flame, Play, Square } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { levelFor, totalXp } from '../engine/levels'
import { addDays, cardioMinutes, inRange, weekStart, weekStreak } from '../engine/recap'
import { useRecommendation } from '../store/hooks'
import { useStore } from '../store/store'
import { DAY_COLOR, Page, ProfileButton, dayTitle, fmtDate, fmtDuration, todayLabel } from '../components/ui'
import { Figure } from '../components/Figure'
import { Confirm } from '../components/Confirm'
import { LogoMark } from '../components/LogoLoader'
import { HapticSwitch, haptic } from '../lib/haptics'
import { useCountUp } from '../lib/motion'
import type { RoutineDay } from '../data/types'
import { homeLines } from '../avatar/lines'

const MODE_LABEL: Record<string, string> = { plan: 'Next in your rotation', health: 'Health first', recovery: 'Recovery day', cardio: 'Cardio day', done: 'Week complete' }

/**
 * What the rings showed last time Home was on screen (module scope: survives tab switches, resets on
 * relaunch). The rings grow from there, so the first launch draws them from empty and a finished
 * workout visibly adds its part, while a plain tab switch changes nothing.
 */
let shown = { sessions: 0, cardio: 0, xp: 0, pct: 0 }
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** Three rings: sessions this week (outer), cardio minutes (middle), XP into the level (inner). */
function Rings({ sessions, cardio, xp }: { sessions: number; cardio: number; xp: number }) {
  const [from] = useState(shown)
  const ring = (r: number, frac: number, was: number) => {
    const c = 2 * Math.PI * r
    return { dasharray: c, dashoffset: c * (1 - clamp01(frac)), style: { '--ring-c': `${c * (1 - clamp01(was))}px` } as React.CSSProperties }
  }
  const a = ring(90, sessions, from.sessions), b = ring(67, cardio, from.cardio), c = ring(44, xp, from.xp)
  return (
    <svg viewBox="0 0 224 224" className="absolute inset-0 -rotate-90 overflow-visible" aria-hidden="true">
      <circle cx="112" cy="112" r="90" fill="none" stroke="currentColor" strokeWidth="16" className="text-glow" opacity="0.2" />
      <circle cx="112" cy="112" r="90" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeDasharray={a.dasharray} strokeDashoffset={a.dashoffset} style={a.style} className="ring-draw activity-ring text-glow transition-[stroke-dashoffset] duration-700 ease-apple" />
      <circle cx="112" cy="112" r="67" fill="none" stroke="currentColor" strokeWidth="16" className="text-soft" opacity="0.2" />
      <circle cx="112" cy="112" r="67" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeDasharray={b.dasharray} strokeDashoffset={b.dashoffset} style={b.style} className="ring-draw ring-draw-2 activity-ring-soft text-soft transition-[stroke-dashoffset] duration-700 ease-apple" />
      <circle cx="112" cy="112" r="44" fill="none" stroke="currentColor" strokeWidth="16" className="text-ice" opacity="0.2" />
      <circle cx="112" cy="112" r="44" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeDasharray={c.dasharray} strokeDashoffset={c.dashoffset} style={c.style} className="ring-draw ring-draw-3 activity-ring-faint text-ice transition-[stroke-dashoffset] duration-700 ease-apple" />
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

  const now = new Date()
  const ws = weekStart(now)
  const week = inRange(sessions, ws, addDays(ws, 7))
  const cardio = cardioMinutes(week)
  const lv = levelFor(totalXp(sessions))
  const days = profile?.daysPerWeek ?? 1
  const weekPct = Math.round(Math.min(1, week.length / days) * 100)
  const pctShown = useCountUp(weekPct, { from: shown.pct, ms: 1000, delay: 120 })
  const ringVals = { sessions: week.length / days, cardio: program ? cardio / program.cardioTargetMin : 0, xp: lv.progress }
  // Remember what is on screen now, for the next visit's starting point.
  useEffect(() => { shown = { ...ringVals, pct: weekPct } })

  if (!profile || !program) return <Navigate to="/onboarding" replace />
  if (!rec) return null
  const streak = weekStreak(sessions, profile, now)
  const recent = [...sessions].filter((s) => s.endedAt).sort((a, b) => new Date(b.endedAt!).getTime() - new Date(a.endedAt!).getTime()).slice(0, 3)
  const daysAway = recent[0] ? Math.floor((now.getTime() - new Date(recent[0].endedAt!).getTime()) / 86_400_000) : undefined
  const belleLines = homeLines({ active: active?.title, today: dayTitle(rec.day), mode: rec.mode, daysAway, streak })
  const minutes = rec.day.minutes + rec.extraCardio
  const cardioTotal = rec.day.cardioMinutes + rec.extraCardio

  const start = (day: RoutineDay, title: string, reason: string, extra: number) => {
    haptic('success')
    startSession(day, title, reason, extra, rec.warmup)
    nav('/forge')
  }

  const EX_ICON = { background: 'color-mix(in srgb, var(--glow) 16%, transparent)', color: 'var(--glow)' }
  return (
    <Page belle="home" belleLines={belleLines} title="Today" sub={`${todayLabel()} · ${lv.name}${streak > 0 ? ` · ${streak}-week streak` : ''}`}
      leading={<LogoMark size={34} className="shrink-0" />}
      right={<ProfileButton />}>

      <section className="aether-rise rise-1 flex items-center gap-5 px-1" aria-label="Weekly progress">
        <div className="relative size-[170px] shrink-0">
          <Rings {...ringVals} />
          <div className="absolute inset-0 grid place-items-center text-center">
            <div><span className="text-2xl font-bold tabular-nums">{pctShown}</span><span className="text-xs text-dim">%</span></div>
          </div>
        </div>
        <dl className="min-w-0 space-y-2.5">
          <div><dt className="text-footnote font-semibold">Sessions</dt><dd className="text-xl font-semibold text-glow tabular-nums">{week.length}/{profile.daysPerWeek}<span className="text-footnote font-semibold"> this week</span></dd></div>
          <div><dt className="text-footnote font-semibold">Cardio</dt><dd className="text-xl font-semibold text-soft tabular-nums">{cardio}/{program.cardioTargetMin}<span className="text-footnote font-semibold"> min</span></dd></div>
          <div><dt className="text-footnote font-semibold">Level</dt><dd className="text-xl font-semibold tabular-nums">{Math.round(lv.progress * 100)}%<span className="text-footnote font-semibold text-dim"> to {lv.next ?? 'max'}</span></dd></div>
        </dl>
      </section>

      <section className="aether-rise rise-2 space-y-3" aria-labelledby="today-title">
        <div className="flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="text-footnote font-semibold text-dim">{active ? 'In progress' : MODE_LABEL[rec.mode]}</p>
            <h2 id="today-title" className="truncate text-xl font-bold">{active ? active.title : rec.title}</h2>
          </div>
          {active && <span className="chip-glow shrink-0">{fmtDuration(active.startedAt)}</span>}
        </div>
        {active ? (
          <div className="space-y-2">
            <Link to="/session" onClick={() => haptic()} className="btn-primary w-full"><Play className="size-4 fill-current" /> Resume Workout</Link>
            <button onClick={() => { haptic('warning'); setConfirmEnd(true) }} className="btn-danger relative w-full"><Square className="size-4" /> End Workout<HapticSwitch /></button>
          </div>
        ) : (
          <button onClick={() => start(rec.day, rec.title, rec.reason, rec.extraCardio)} className="btn-primary relative w-full">
            <HapticSwitch />
            <Play className="size-4 fill-current" /> Start Workout
          </button>
        )}
        <p className="px-1 text-footnote text-dim">~{minutes} min · {rec.day.blocks.length} exercises{cardioTotal > 0 ? ` + ${cardioTotal} min cardio` : ''}. {rec.reason}</p>
        <ul className="ios-list" style={{ '--sep-inset': '72px' } as React.CSSProperties}>
          {rec.day.blocks.map((b) => {
            const ex = EXERCISE_BY_ID[b.exerciseId]
            if (!ex) return null
            return (
              <li key={b.exerciseId}>
                <Link to={`/exercise/${ex.id}`} onClick={() => haptic()} className="workout-row ios-row">
                  <Figure animId={ex.anim} size={44} playing={false} className="shrink-0 rounded-[10px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base">{ex.name}</span>
                    <span className="block text-sm text-dim">{b.sets} × {b.seconds ? `${b.seconds} s` : `${b.repMin}–${b.repMax}`} · rest {Math.round((b.restSec / 60) * 10) / 10} min</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-[color:var(--faint)]" strokeWidth={2.6} />
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {!active && rec.alternatives.length > 0 && (
        <section className="aether-rise rise-3 space-y-3" aria-labelledby="alt-title">
          <h2 id="alt-title" className="px-1 text-xl font-bold">Or choose another day</h2>
          <div className="grid grid-cols-2 gap-3">
            {rec.alternatives.map((d) => (
              <button key={d.key} onClick={() => start(d, dayTitle(d), 'Chosen manually.', 0)} className="workout-row relative rounded-[22px] p-4 text-left">
                <HapticSwitch />
                <span className="block text-footnote font-semibold capitalize" style={{ color: DAY_COLOR[d.id] }}>{d.key.replace('-', ' ')}</span>
                <span className="mt-0.5 block text-base font-semibold">{dayTitle(d)}</span>
                <span className="mt-0.5 block text-xs text-dim">{d.blocks.length} exercises · ~{d.minutes} min</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="aether-rise rise-4 space-y-3" aria-labelledby="recent-title">
        <div className="flex items-end justify-between px-1">
          <h2 id="recent-title" className="text-xl font-bold">Recent sessions</h2>
          <Link to="/palantir" onClick={() => haptic()} className="text-base text-glow">Show more</Link>
        </div>
        {recent.length === 0 ? <p className="px-1 text-sm text-dim">Your first session will appear here.</p> : (
          <ul className="ios-list" style={{ '--sep-inset': '64px' } as React.CSSProperties}>
            {recent.map((s) => {
              const sets = s.exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0)
              const isCardio = s.dayId === 'cardio'
              return (
                <li key={s.id}>
                  <Link to={`/history/${s.id}`} onClick={() => haptic()} className="workout-row ios-row">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full" style={isCardio ? { background: 'color-mix(in srgb, var(--glow-soft) 18%, transparent)', color: 'var(--glow-soft)' } : EX_ICON}>
                      {isCardio ? <Flame className="size-[18px]" /> : <Dumbbell className="size-[18px]" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base">{s.title}</span>
                      <span className="block text-sm text-dim">{fmtDate(s.endedAt!)} · {fmtDuration(s.startedAt, s.endedAt)} · {sets} sets</span>
                    </span>
                    <span className="text-sm text-dim tabular-nums">+{s.xp ?? 0}</span>
                    <ChevronRight className="size-4 shrink-0 text-[color:var(--faint)]" strokeWidth={2.6} />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {confirmEnd && (
        <Confirm title="End the workout without saving?" body="Everything logged in this session is lost. To keep it, open the session and press Finish." confirmLabel="End Workout" danger onConfirm={() => { discardSession(); setConfirmEnd(false) }} onCancel={() => setConfirmEnd(false)} />
      )}
    </Page>
  )
}
