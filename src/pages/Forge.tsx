import { Navigate, useNavigate } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Figure } from '../components/Figure'
import { Page } from '../components/ui'

export default function Forge() {
  const nav = useNavigate()
  const active = useStore((s) => s.active)
  const warmup = useStore((s) => s.activeWarmup)
  const setForged = useStore((s) => s.setForged)
  if (!active) return <Navigate to="/" replace />

  const go = () => { setForged(true); nav('/session', { replace: true }) }

  return (
    <Page title={NAMES.pages.forge} sub={`Before ${active.title}${warmup ? ` · about ${warmup.totalMinutes} min` : ''}`}>
      <div className="card p-4 bg-gradient-to-br from-ink-800 to-ink-700 border-gold-400/30">
        <p className="text-sm text-slate-200 leading-relaxed">
          Warm muscles lift more and get hurt less. A warm-up improved performance in four out of five studies tested. Three steps, then the real work.
        </p>
      </div>

      {warmup && (
        <>
          <Step n={1} title="Get warm" sub={`${warmup.general.minutes} min easy`}>
            <Row id={warmup.general.exerciseId} detail={`${warmup.general.minutes} minutes, easy pace, until you are slightly out of breath`} />
          </Step>
          <Step n={2} title="Move the joints" sub="dynamic, not static">
            {warmup.dynamic.map((d) => <Row key={d.exerciseId} id={d.exerciseId} detail={d.seconds ? `${d.seconds} seconds` : `${d.reps} reps${EXERCISE_BY_ID[d.exerciseId]?.unilateral ? ' each side' : ''}`} />)}
          </Step>
          {warmup.ramp && (
            <Step n={3} title="Ramp up" sub={`light sets of ${EXERCISE_BY_ID[warmup.ramp.exerciseId]?.name}`}>
              <Row id={warmup.ramp.exerciseId} detail={warmup.ramp.sets.map((s) => `${s.reps} reps at ${s.weightKg ? `${s.weightKg} kg` : `${s.pct}%`}`).join(', then ')} />
              <p className="text-xs text-slate-400 px-1">{warmup.ramp.basedOnKg ? `Based on your last working weight of ${warmup.ramp.basedOnKg} kg.` : 'No weight logged yet: use half, then 70%, of the weight you plan to use.'}</p>
            </Step>
          )}
          <ul className="text-xs text-slate-400 space-y-1 px-1">
            {warmup.rules.map((r) => <li key={r}>• {r}</li>)}
          </ul>
        </>
      )}

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button className="btn-ghost" onClick={go}>Skip today</button>
        <button className="btn-primary" onClick={go}>Forged. Begin.</button>
      </div>
    </Page>
  )
}

function Step({ n, title, sub, children }: { n: number; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="card p-3 space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="h-6 w-6 rounded-full bg-gold-400 text-ink-950 text-xs font-bold flex items-center justify-center">{n}</span>
        <h2 className="font-bold">{title}</h2>
        <span className="text-xs text-slate-400">{sub}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function Row({ id, detail }: { id: string; detail: string }) {
  const ex = EXERCISE_BY_ID[id]
  if (!ex) return null
  return (
    <div className="flex items-center gap-3">
      <Figure animId={ex.anim} size={64} className="rounded-xl shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-semibold">{ex.name}</div>
        <div className="text-xs text-slate-400">{detail}</div>
      </div>
    </div>
  )
}
