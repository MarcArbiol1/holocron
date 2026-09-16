import { Check, Plus, X } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { MUSCLES } from '../data/muscles'
import { lastLog } from '../engine/progression'
import { bestE1rm, isHardSet } from '../engine/recap'
import { useStore } from '../store/store'
import { Figure } from '../components/Figure'
import { Page, fmtDate } from '../components/ui'
import { haptic } from '../lib/haptics'

const LEVEL = ['', 'Beginner-friendly', 'Needs practice', 'Advanced']

export default function ExerciseDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const ex = id ? EXERCISE_BY_ID[id] : undefined
  const sessions = useStore((s) => s.sessions)
  const active = useStore((s) => s.active)
  const addExercise = useStore((s) => s.addExercise)
  if (!ex) return <Navigate to="/library" replace />
  const best = bestE1rm(sessions, ex.id)
  const last = lastLog(sessions, ex.id)
  return (
    <Page title={ex.name} kicker={`${LEVEL[ex.level]} · ${ex.category}`} back>
      <div className="aether-rise rise-1 metric-panel overflow-hidden p-1.5">
        <Figure animId={ex.anim} size="100%" className="h-auto w-full rounded-2xl" />
      </div>
      <div className="aether-rise rise-1 flex flex-wrap gap-1.5">
        {ex.primary.map((m) => <span key={m} className="chip-glow">{MUSCLES[m].label}</span>)}
        {ex.secondary.map((m) => <span key={m} className="chip-ice">{MUSCLES[m].label}</span>)}
        {ex.equipment.map((e) => <span key={e} className="chip-dim">{e}</span>)}
      </div>

      <section className="aether-rise rise-2" aria-labelledby="how-title">
        <h2 id="how-title" className="text-lg font-semibold">How to do it</h2>
        <ol className="metric-panel mt-3 space-y-3 p-4 text-sm text-ice/90">
          {ex.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold text-glow" style={{ background: 'color-mix(in oklab, var(--glow) 14%, transparent)' }}>{i + 1}</span>
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {ex.cues.length > 0 && (
        <section className="aether-rise rise-3" aria-labelledby="cues-title">
          <h2 id="cues-title" className="text-lg font-semibold">Keep in mind</h2>
          <ul className="metric-panel mt-3 space-y-2 p-4 text-sm text-ice/90">
            {ex.cues.map((c) => <li key={c} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-soft" /><span>{c}</span></li>)}
          </ul>
        </section>
      )}

      {ex.mistakes.length > 0 && (
        <section className="aether-rise rise-4" aria-labelledby="mistakes-title">
          <h2 id="mistakes-title" className="text-lg font-semibold">Common mistakes</h2>
          <ul className="metric-panel mt-3 space-y-2 p-4 text-sm text-ice/90">
            {ex.mistakes.map((c) => <li key={c} className="flex gap-2.5"><X className="mt-0.5 size-4 shrink-0 text-legs" /><span>{c}</span></li>)}
          </ul>
        </section>
      )}

      <section className="aether-rise rise-5" aria-labelledby="history-title">
        <h2 id="history-title" className="text-lg font-semibold">Your history</h2>
        <div className="metric-panel mt-3 space-y-1.5 p-4 text-sm">
          {best > 0 && <div className="flex items-center justify-between"><span className="text-ice/90">Best estimated 1RM</span><span className="chip-glow font-mono">{Math.round(best)} kg</span></div>}
          {last
            ? <div className="text-ice/90">Last time <span className="text-dim">({fmtDate(last.session.endedAt!)})</span>: <span className="font-mono">{last.log.sets.filter(isHardSet).map((s) => (s.seconds ? `${s.seconds}s` : `${s.weightKg ?? 0}×${s.reps ?? 0}`)).join(', ')}</span></div>
            : <div className="text-dim">Not logged yet.</div>}
        </div>
      </section>

      {active && (
        <button className="aether-rise rise-5 btn-primary w-full" onClick={() => { haptic('success'); addExercise(ex.id); nav('/session') }}>
          <Plus className="size-4" /> Add to current session
        </button>
      )}
    </Page>
  )
}
