import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { MUSCLES, TARGET_MUSCLES, type Muscle } from '../data/muscles'
import { addDays, monthStart, nextMonth, periodRecap, weekStart, weekStreak } from '../engine/recap'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { MuscleMap } from '../components/MuscleMap'
import { DAY_COLOR, Page, Section, fmtDate, fmtDuration } from '../components/ui'

export default function Palantir() {
  const profile = useStore((s) => s.profile)
  const program = useStore((s) => s.program)
  const sessions = useStore((s) => s.sessions)
  const [range, setRange] = useState<'week' | 'month'>('week')
  const [offset, setOffset] = useState(0)
  const [picked, setPicked] = useState<Muscle | null>(null)
  if (!profile || !program) return <Navigate to="/onboarding" replace />

  const now = new Date()
  let from: Date, to: Date, weeks: number, label: string
  if (range === 'week') {
    from = addDays(weekStart(now), offset * 7); to = addDays(from, 7); weeks = 1
    label = offset === 0 ? 'This week' : offset === -1 ? 'Last week' : `Week of ${from.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
  } else {
    const m = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    from = monthStart(m); to = nextMonth(m); weeks = Math.round((to.getTime() - from.getTime()) / 6048e5 * 10) / 10
    label = m.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }
  const r = periodRecap(sessions, profile, program, from, to, weeks)
  const levels = Object.fromEntries(TARGET_MUSCLES.map((m) => [m, r.setsTarget[0] > 0 ? r.sets[m] / r.setsTarget[0] : 0])) as Partial<Record<Muscle, number>>
  const streak = weekStreak(sessions, profile, now)
  const history = [...r.sessions].reverse()

  return (
    <Page title={NAMES.pages.palantir} sub="What the archive shows." right={
      <div className="flex rounded-lg bg-ink-700 p-0.5 text-xs font-semibold">
        {(['week', 'month'] as const).map((k) => <button key={k} onClick={() => { setRange(k); setOffset(0) }} className={`px-3 py-1.5 rounded-md ${range === k ? 'bg-gold-400 text-ink-950' : 'text-slate-300'}`}>{k}</button>)}
      </div>
    }>
      <div className="flex items-center justify-between">
        <button className="btn-ghost py-1.5 px-3 text-sm" onClick={() => setOffset(offset - 1)}>‹</button>
        <div className="font-bold">{label}</div>
        <button className="btn-ghost py-1.5 px-3 text-sm" disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>›</button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Tile label="Sessions" value={`${r.count}`} sub={`of ${r.plannedCount} planned`} good={r.count >= r.plannedCount} />
        <Tile label="Cardio min" value={`${r.cardio}`} sub={`of ${r.cardioTarget}`} good={r.cardio >= r.cardioTarget} />
        <Tile label="XP" value={`${r.xp}`} sub={streak ? `${streak}-week streak` : 'no streak'} />
        <Tile label="Hard sets" value={`${Math.round(Object.values(r.sets).reduce((a, b) => a + b, 0))}`} sub="fractional" />
        <Tile label="Tonnage" value={r.tonnage >= 1000 ? `${(r.tonnage / 1000).toFixed(1)} t` : `${r.tonnage} kg`} sub="weight × reps" />
        <Tile label="Time" value={r.minutes >= 60 ? `${Math.floor(r.minutes / 60)} h ${r.minutes % 60}` : `${r.minutes} min`} sub="in the gym" />
      </div>

      <Section title={`Sets per muscle vs target (${r.setsTarget[0]}–${r.setsTarget[1]})`}>
        <div className="card p-4 space-y-3">
          <MuscleMap levels={levels} onPick={setPicked} />
          {picked && (
            <div className="text-sm text-center text-slate-300">{MUSCLES[picked].label}: {r.sets[picked]} sets ({Math.round((r.sets[picked] / r.setsTarget[0]) * 100)}% of the low target)</div>
          )}
          {r.count > 0 && offset < 0 && r.neglected.length > 0 && (
            <p className="text-sm text-slate-300"><span className="text-legs font-semibold">Under-trained:</span> {r.neglected.map((m) => MUSCLES[m].label).join(', ')}.</p>
          )}
          {r.count > 0 && offset === 0 && r.neglected.length > 0 && r.neglected.length < TARGET_MUSCLES.length && (
            <p className="text-sm text-slate-300"><span className="text-gold-300 font-semibold">Still to reach target:</span> {r.neglected.map((m) => MUSCLES[m].label).join(', ')}. The next sessions in your rotation cover these.</p>
          )}
          {r.count > 0 && r.onTarget.length > 0 && (
            <p className="text-sm text-slate-300"><span className="text-cardio font-semibold">On target:</span> {r.onTarget.map((m) => MUSCLES[m].label).join(', ')}.</p>
          )}
          {r.count === 0 && <p className="text-sm text-slate-500 text-center">No sessions in this period.</p>}
        </div>
      </Section>

      {r.prs.length > 0 && (
        <Section title="New records (estimated 1RM)">
          <ul className="card p-4 divide-y divide-white/5">
            {r.prs.map((p) => <li key={p.exerciseId} className="py-1.5 flex justify-between text-sm"><span>{EXERCISE_BY_ID[p.exerciseId]?.name ?? p.exerciseId}</span><span className="text-gold-300 font-semibold">{p.e1rm} kg</span></li>)}
          </ul>
        </Section>
      )}

      <Section title="Sessions">
        {history.length === 0 ? <p className="text-sm text-slate-500 px-1">Nothing here yet.</p> : (
          <ul className="space-y-2">
            {history.map((s) => (
              <li key={s.id}>
                <Link to={`/history/${s.id}`} className="card p-3 flex items-center gap-3">
                  <span className="h-10 w-1.5 rounded-full" style={{ background: DAY_COLOR[s.dayId] }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{s.title}</div>
                    <div className="text-xs text-slate-400">{fmtDate(s.endedAt!)} · {fmtDuration(s.startedAt, s.endedAt)} · {s.exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0)} sets</div>
                  </div>
                  <div className="text-gold-300 font-semibold text-sm">+{s.xp ?? 0}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Page>
  )
}

function Tile({ label, value, sub, good }: { label: string; value: string; sub?: string; good?: boolean }) {
  return (
    <div className="card p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`font-display text-xl font-extrabold ${good ? 'text-cardio' : ''}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </div>
  )
}
