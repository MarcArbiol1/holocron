import { useState } from 'react'
import { ChevronLeft, ChevronRight, Dumbbell, Flame } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { MUSCLES, TARGET_MUSCLES, type Muscle } from '../data/muscles'
import { addDays, monthStart, nextMonth, periodRecap, weekStart, weekStreak } from '../engine/recap'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { MuscleMap } from '../components/MuscleMap'
import { Page, fmtDate, fmtDuration } from '../components/ui'
import { haptic } from '../lib/haptics'

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
  // Month targets are scaled by fractional weeks; round them for display so no float noise leaks into the UI.
  const planned = Math.round(r.plannedCount)
  const targetLo = Math.round(r.setsTarget[0])
  const targetHi = Math.round(r.setsTarget[1])
  const levels = Object.fromEntries(TARGET_MUSCLES.map((m) => [m, r.setsTarget[0] > 0 ? r.sets[m] / r.setsTarget[0] : 0])) as Partial<Record<Muscle, number>>
  const streak = weekStreak(sessions, profile, now)
  const history = [...r.sessions].reverse()

  const toggle = (
    <div className="glass flex rounded-full p-1 text-xs font-semibold">
      {(['week', 'month'] as const).map((k) => (
        <button key={k} onClick={() => { haptic(); setRange(k); setOffset(0) }} className={`rounded-full px-3 py-1.5 transition-colors duration-300 ${range === k ? 'bg-glow text-night' : 'text-dim'}`}>{k}</button>
      ))}
    </div>
  )

  return (
    <Page title={NAMES.pages.palantir} kicker="What the archive shows" right={toggle}>
      <div className="aether-rise rise-1 flex items-center justify-between">
        <button onClick={() => { haptic(); setOffset(offset - 1) }} aria-label="Previous period" className="primary-action grid size-9 place-items-center rounded-full text-ice"><ChevronLeft className="size-4" /></button>
        <div className="font-semibold">{label}</div>
        <button onClick={() => { haptic(); setOffset(offset + 1) }} disabled={offset >= 0} aria-label="Next period" className="primary-action grid size-9 place-items-center rounded-full text-ice disabled:opacity-30"><ChevronRight className="size-4" /></button>
      </div>

      <div className="aether-rise rise-2 grid grid-cols-3 gap-2">
        <Tile label="Sessions" value={`${r.count}`} sub={`of ${planned} planned`} good={r.count >= planned} />
        <Tile label="Cardio" value={`${r.cardio}`} sub={`of ${r.cardioTarget} min`} good={r.cardio >= r.cardioTarget} />
        <Tile label="XP" value={`${r.xp}`} sub={streak ? `${streak}-week streak` : 'no streak'} />
        <Tile label="Hard sets" value={`${Math.round(Object.values(r.sets).reduce((a, b) => a + b, 0))}`} sub="fractional" />
        <Tile label="Tonnage" value={r.tonnage >= 1000 ? `${(r.tonnage / 1000).toFixed(1)} t` : `${r.tonnage} kg`} sub="weight × reps" />
        <Tile label="Time" value={r.minutes >= 60 ? `${Math.floor(r.minutes / 60)} h ${r.minutes % 60}` : `${r.minutes} min`} sub="in the gym" />
      </div>

      <section className="aether-rise rise-3" aria-labelledby="muscles-title">
        <h2 id="muscles-title" className="text-lg font-semibold">Sets per muscle</h2>
        <p className="mt-1 text-xs text-dim">versus the {targetLo}–{targetHi} target · tap a muscle</p>
        <div className="metric-panel mt-3 space-y-3 p-4">
          <MuscleMap levels={levels} onPick={(m) => { haptic(); setPicked(m) }} />
          {picked && (
            <div className="text-center text-sm text-ice/90">{MUSCLES[picked].label}: {Math.round(r.sets[picked] * 10) / 10} sets ({Math.round((r.sets[picked] / r.setsTarget[0]) * 100)}% of the low target)</div>
          )}
          {r.count > 0 && offset < 0 && r.neglected.length > 0 && (
            <p className="text-sm text-ice/90"><span className="font-semibold text-legs">Under-trained:</span> {r.neglected.map((m) => MUSCLES[m].label).join(', ')}.</p>
          )}
          {r.count > 0 && offset === 0 && r.neglected.length > 0 && r.neglected.length < TARGET_MUSCLES.length && (
            <p className="text-sm text-ice/90"><span className="font-semibold text-sand">Still to reach target:</span> {r.neglected.map((m) => MUSCLES[m].label).join(', ')}. The next sessions in your rotation cover these.</p>
          )}
          {r.count > 0 && r.onTarget.length > 0 && (
            <p className="text-sm text-ice/90"><span className="font-semibold text-soft">On target:</span> {r.onTarget.map((m) => MUSCLES[m].label).join(', ')}.</p>
          )}
          {r.count === 0 && <p className="text-center text-sm text-dim">No sessions in this period.</p>}
        </div>
      </section>

      {r.prs.length > 0 && (
        <section className="aether-rise rise-4" aria-labelledby="prs-title">
          <h2 id="prs-title" className="text-lg font-semibold">New records</h2>
          <p className="mt-1 text-xs text-dim">estimated one-rep max</p>
          <ul className="metric-panel mt-3 divide-y divide-ice/5 px-4">
            {r.prs.map((p) => (
              <li key={p.exerciseId} className="flex items-center justify-between py-2.5 text-sm">
                <span>{EXERCISE_BY_ID[p.exerciseId]?.name ?? p.exerciseId}</span>
                <span className="chip-glow">{p.e1rm} kg</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="aether-rise rise-5" aria-labelledby="sessions-title">
        <h2 id="sessions-title" className="text-lg font-semibold">Sessions</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-dim">Nothing here yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {history.map((s) => {
              const sets = s.exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0)
              const isCardio = s.dayId === 'cardio'
              return (
                <Link key={s.id} to={`/history/${s.id}`} onClick={() => haptic()} className="workout-row flex w-full items-center gap-4 rounded-2xl p-4 text-left">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: isCardio ? 'color-mix(in oklab, var(--ice) 9%, transparent)' : 'color-mix(in oklab, var(--glow) 14%, transparent)', color: isCardio ? 'var(--ice)' : 'var(--glow)' }}>
                    {isCardio ? <Flame className="size-5" /> : <Dumbbell className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate">{s.title}</span>
                    <span className="mt-1 block text-xs text-dim">{fmtDate(s.endedAt!)} · {fmtDuration(s.startedAt, s.endedAt)} · {sets} sets</span>
                  </span>
                  <span className="text-sm font-semibold text-glow">+{s.xp ?? 0}</span>
                  <ChevronRight className="size-5 text-dim" />
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </Page>
  )
}

function Tile({ label, value, sub, good }: { label: string; value: string; sub?: string; good?: boolean }) {
  return (
    <div className="metric-panel p-3.5">
      <p className="text-xs font-semibold text-glow">{label}</p>
      <p className={`mt-1 text-xl font-bold leading-tight ${good ? 'text-soft' : ''}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] font-medium text-dim">{sub}</p>}
    </div>
  )
}
