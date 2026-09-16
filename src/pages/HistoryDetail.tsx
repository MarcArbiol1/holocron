import { Trash2 } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { useStore } from '../store/store'
import { Page, fmtDate, fmtDuration } from '../components/ui'
import { Figure } from '../components/Figure'
import { haptic } from '../lib/haptics'

export default function HistoryDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const s = useStore((st) => st.sessions.find((x) => x.id === id))
  const del = useStore((st) => st.deleteSession)
  if (!s) return <Navigate to="/palantir" replace />
  const setsDone = s.exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0)
  return (
    <Page title={s.title} kicker={fmtDate(s.endedAt ?? s.startedAt)} sub={`${fmtDuration(s.startedAt, s.endedAt)} · ${setsDone} sets · +${s.xp ?? 0} XP`} back>
      {s.reason && <p className="aether-rise text-xs leading-relaxed text-dim">{s.reason}</p>}
      <div className="aether-rise rise-1 space-y-3">
        {s.exercises.map((e, i) => {
          const ex = EXERCISE_BY_ID[e.exerciseId]
          return (
            <div key={i} className="metric-panel p-3">
              <div className="flex items-center gap-3">
                {ex && <Figure animId={ex.anim} size={44} playing={false} className="rounded-xl shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{ex?.name ?? e.exerciseId}</div>
                  <div className="mt-0.5 text-xs text-dim">{e.sets.filter((x) => x.done).length} sets done</div>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {e.sets.filter((x) => x.done).map((x, j) => (
                  <span key={j} className="chip-ice font-mono tabular-nums">
                    {x.seconds ? `${x.seconds}s` : x.weightKg ? `${x.weightKg}×${x.reps ?? 0}` : `${x.reps ?? 0} reps`}
                    {x.rir !== undefined ? <span className="ml-1 text-dim">@{x.rir}</span> : null}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {s.cardio.length > 0 && (
        <div className="aether-rise rise-2 metric-panel p-4">
          <div className="text-xs font-semibold text-soft">Cardio</div>
          {s.cardio.map((c, i) => (
            <div key={i} className="mt-1 text-sm text-ice/90">{EXERCISE_BY_ID[c.exerciseId]?.name ?? c.exerciseId}: {c.minutes} min {c.intensity}</div>
          ))}
        </div>
      )}
      <button
        className="aether-rise rise-3 btn-danger w-full"
        onClick={() => { haptic('warning'); if (confirm('Delete this session from the archive?')) { del(s.id); nav('/palantir', { replace: true }) } }}
      >
        <Trash2 className="size-4" /> Delete session
      </button>
    </Page>
  )
}
