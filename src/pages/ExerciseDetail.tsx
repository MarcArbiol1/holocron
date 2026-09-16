import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { MUSCLES } from '../data/muscles'
import { lastLog } from '../engine/progression'
import { bestE1rm, isHardSet } from '../engine/recap'
import { useStore } from '../store/store'
import { Figure } from '../components/Figure'
import { Page, Section, fmtDate } from '../components/ui'

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
    <Page title={ex.name} sub={`${LEVEL[ex.level]} · ${ex.category}`} back>
      <Figure animId={ex.anim} size="100%" className="w-full h-auto rounded-2xl" />
      <div className="flex flex-wrap gap-1.5">
        {ex.primary.map((m) => <span key={m} className="chip bg-gold-400/15 text-gold-300">{MUSCLES[m].label}</span>)}
        {ex.secondary.map((m) => <span key={m} className="chip bg-ink-700 text-slate-300">{MUSCLES[m].label}</span>)}
        {ex.equipment.map((e) => <span key={e} className="chip bg-ink-700 text-slate-400">{e}</span>)}
      </div>
      <Section title="How to do it">
        <ol className="card p-4 space-y-2 text-sm text-slate-200">
          {ex.steps.map((s, i) => <li key={i} className="flex gap-3"><span className="text-gold-400 font-bold">{i + 1}</span><span className="leading-relaxed">{s}</span></li>)}
        </ol>
      </Section>
      {ex.cues.length > 0 && (
        <Section title="Keep in mind">
          <ul className="card p-4 space-y-1 text-sm text-slate-200">{ex.cues.map((c) => <li key={c}>✓ {c}</li>)}</ul>
        </Section>
      )}
      {ex.mistakes.length > 0 && (
        <Section title="Common mistakes">
          <ul className="card p-4 space-y-1 text-sm text-slate-300">{ex.mistakes.map((c) => <li key={c}>✗ {c}</li>)}</ul>
        </Section>
      )}
      <Section title="Your history">
        <div className="card p-4 text-sm space-y-1">
          {best > 0 && <div>Best estimated 1RM: <span className="text-gold-300 font-semibold">{Math.round(best)} kg</span></div>}
          {last ? <div className="text-slate-300">Last time ({fmtDate(last.session.endedAt!)}): {last.log.sets.filter(isHardSet).map((s) => (s.seconds ? `${s.seconds}s` : `${s.weightKg ?? 0}×${s.reps ?? 0}`)).join(', ')}</div> : <div className="text-slate-500">Not logged yet.</div>}
        </div>
      </Section>
      {active && <button className="btn-primary w-full" onClick={() => { addExercise(ex.id); nav('/session') }}>Add to current session</button>}
    </Page>
  )
}
