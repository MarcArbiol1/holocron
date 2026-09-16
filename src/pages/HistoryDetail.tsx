import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { useStore } from '../store/store'
import { Page, fmtDate, fmtDuration } from '../components/ui'

export default function HistoryDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const s = useStore((st) => st.sessions.find((x) => x.id === id))
  const del = useStore((st) => st.deleteSession)
  if (!s) return <Navigate to="/palantir" replace />
  return (
    <Page title={s.title} sub={`${fmtDate(s.endedAt ?? s.startedAt)} · ${fmtDuration(s.startedAt, s.endedAt)} · +${s.xp ?? 0} XP`} back>
      {s.reason && <p className="text-xs text-slate-400 px-1">{s.reason}</p>}
      {s.exercises.map((e, i) => (
        <div key={i} className="card p-3">
          <div className="font-semibold">{EXERCISE_BY_ID[e.exerciseId]?.name ?? e.exerciseId}</div>
          <div className="text-sm text-slate-300 mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {e.sets.filter((x) => x.done).map((x, j) => <span key={j} className="tabular-nums">{x.seconds ? `${x.seconds}s` : `${x.weightKg ?? 0}×${x.reps ?? 0}`}{x.rir !== undefined ? <span className="text-slate-500"> @{x.rir}</span> : null}</span>)}
          </div>
        </div>
      ))}
      {s.cardio.length > 0 && (
        <div className="card p-3">
          <div className="font-semibold text-cardio">Cardio</div>
          {s.cardio.map((c, i) => <div key={i} className="text-sm text-slate-300">{EXERCISE_BY_ID[c.exerciseId]?.name ?? c.exerciseId}: {c.minutes} min {c.intensity}</div>)}
        </div>
      )}
      <button className="btn-danger w-full" onClick={() => { if (confirm('Delete this session from the archive?')) { del(s.id); nav('/palantir', { replace: true }) } }}>Delete session</button>
    </Page>
  )
}
