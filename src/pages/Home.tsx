import { Link, Navigate, useNavigate } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { levelFor, totalXp } from '../engine/levels'
import { addDays, cardioMinutes, inRange, weekStart, weekStreak } from '../engine/recap'
import { useRecommendation } from '../store/hooks'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Bar, DAY_COLOR, LevelPill, Page, Section, dayName } from '../components/ui'
import { Figure } from '../components/Figure'
import type { RoutineDay } from '../data/types'

const MODE_LABEL: Record<string, string> = { plan: 'Next in your rotation', health: 'Health first', recovery: 'Recovery day', cardio: 'Cardio day', done: 'Week complete' }

export default function Home() {
  const nav = useNavigate()
  const profile = useStore((s) => s.profile)
  const program = useStore((s) => s.program)
  const sessions = useStore((s) => s.sessions)
  const active = useStore((s) => s.active)
  const startSession = useStore((s) => s.startSession)
  const rec = useRecommendation()
  if (!profile || !program) return <Navigate to="/onboarding" replace />
  if (!rec) return null

  const now = new Date()
  const ws = weekStart(now)
  const week = inRange(sessions, ws, addDays(ws, 7))
  const cardio = cardioMinutes(week)
  const lv = levelFor(totalXp(sessions))
  const streak = weekStreak(sessions, profile, now)
  const hour = now.getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const start = (day: RoutineDay, title: string, reason: string, extra: number) => {
    startSession(day, title, reason, extra, rec.warmup)
    nav('/forge')
  }

  return (
    <Page title={NAMES.pages.home} sub={`${greet}${profile.name ? ', ' + profile.name : ''}.`} right={<LevelPill />}>
      {active && (
        <Link to="/session" className="card p-4 flex items-center justify-between border-gold-400/40">
          <div>
            <div className="text-xs text-gold-300 font-semibold uppercase tracking-wider">In progress</div>
            <div className="font-bold">{active.title}</div>
          </div>
          <span className="btn-primary py-2 px-3 text-sm">Resume</span>
        </Link>
      )}

      <div className="card p-4 space-y-3" style={{ borderColor: `${DAY_COLOR[rec.day.id]}55` }}>
        <div className="flex items-center justify-between">
          <span className="chip" style={{ background: `${DAY_COLOR[rec.day.id]}22`, color: DAY_COLOR[rec.day.id] }}>{MODE_LABEL[rec.mode]}</span>
          <span className="text-xs text-slate-400">~{rec.day.minutes + rec.extraCardio} min · {rec.day.blocks.length} exercises{rec.day.cardioMinutes + rec.extraCardio > 0 ? ` + ${rec.day.cardioMinutes + rec.extraCardio} min cardio` : ''}</span>
        </div>
        <div>
          <h2 className="font-display text-2xl font-extrabold">{rec.title}</h2>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">{rec.reason}</p>
        </div>
        <ul className="divide-y divide-white/5">
          {rec.day.blocks.map((b) => {
            const ex = EXERCISE_BY_ID[b.exerciseId]
            return (
              <li key={b.exerciseId} className="py-2 flex items-center gap-3">
                <Figure animId={ex.anim} size={44} playing={false} className="rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{ex.name}</div>
                  <div className="text-xs text-slate-400">{b.sets} × {b.seconds ? `${b.seconds} s` : `${b.repMin}–${b.repMax}`} · rest {Math.round(b.restSec / 60 * 10) / 10} min</div>
                </div>
              </li>
            )
          })}
        </ul>
        {!active && (
          <button className="btn-primary w-full" onClick={() => start(rec.day, rec.title, rec.reason, rec.extraCardio)}>
            Enter {NAMES.pages.forge}
          </button>
        )}
      </div>

      <Section title="This week">
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{week.length} of {profile.daysPerWeek} sessions</span>
            <span className="text-slate-400">{streak > 0 ? `${streak} week streak` : 'no streak yet'}</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(ws, i)
              const did = week.some((s) => new Date(s.endedAt!).toDateString() === d.toDateString())
              const today = d.toDateString() === now.toDateString()
              return (
                <div key={i} className={`h-9 rounded-lg flex items-center justify-center text-[11px] font-semibold border ${did ? 'bg-gold-400 text-ink-950 border-gold-400' : today ? 'border-gold-400/60 text-gold-300' : 'border-white/5 text-slate-500'}`}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </div>
              )
            })}
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Cardio (moderate-equivalent)</span><span>{cardio} / {program.cardioTargetMin} min</span></div>
            <Bar value={cardio} max={program.cardioTargetMin} color="#3fd0a4" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1"><span>{lv.name}{lv.next ? ` → ${lv.next}` : ''}</span><span>{lv.into} / {lv.span} XP</span></div>
            <Bar value={lv.into} max={lv.span} />
          </div>
        </div>
      </Section>

      {!active && rec.alternatives.length > 0 && (
        <Section title="Or choose another day">
          <div className="grid grid-cols-2 gap-2">
            {rec.alternatives.map((d) => (
              <button key={d.key} className="card p-3 text-left" onClick={() => start(d, dayName(d.id), 'Chosen manually.', 0)}>
                <div className="text-xs" style={{ color: DAY_COLOR[d.id] }}>{d.key.replace('-', ' ')}</div>
                <div className="font-bold">{dayName(d.id)}</div>
                <div className="text-[11px] text-slate-400">{d.blocks.length} exercises · ~{d.minutes} min</div>
              </button>
            ))}
          </div>
        </Section>
      )}
    </Page>
  )
}
