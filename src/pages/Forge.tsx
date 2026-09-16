import { Flame } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Figure } from '../components/Figure'
import { Page } from '../components/ui'
import { HapticSwitch, haptic } from '../lib/haptics'

export default function Forge() {
  const nav = useNavigate()
  const active = useStore((s) => s.active)
  const warmup = useStore((s) => s.activeWarmup)
  const setForged = useStore((s) => s.setForged)
  if (!active) return <Navigate to="/" replace />

  const go = () => { haptic('success'); setForged(true); nav('/session', { replace: true }) }

  return (
    <Page title={NAMES.pages.forge} kicker={`Before ${active.title}${warmup ? ` · about ${warmup.totalMinutes} min` : ''}`}>
      <div className="metric-panel aether-rise rise-1 flex items-start gap-3 p-4" style={{ borderColor: 'color-mix(in oklab, var(--glow) 22%, transparent)' }}>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl text-glow" style={{ background: 'color-mix(in oklab, var(--glow) 14%, transparent)' }}><Flame className="size-5" /></span>
        <p className="text-sm leading-relaxed text-ice">
          Warm muscles lift more and get hurt less. A warm-up improved performance in four out of five studies tested. Three steps, then the real work.
        </p>
      </div>

      {warmup && (
        <>
          <Step n={1} title="Get warm" sub={`${warmup.general.minutes} min easy`} rise="rise-2">
            <Row id={warmup.general.exerciseId} detail={`${warmup.general.minutes} minutes, easy pace, until you are slightly out of breath`} />
          </Step>
          <Step n={2} title="Move the joints" sub="dynamic, not static" rise="rise-3">
            {warmup.dynamic.map((d) => <Row key={d.exerciseId} id={d.exerciseId} detail={d.seconds ? `${d.seconds} seconds` : `${d.reps} reps${EXERCISE_BY_ID[d.exerciseId]?.unilateral ? ' each side' : ''}`} />)}
          </Step>
          {warmup.ramp && (
            <Step n={3} title="Ramp up" sub={`light sets of ${EXERCISE_BY_ID[warmup.ramp.exerciseId]?.name}`} rise="rise-4">
              <Row id={warmup.ramp.exerciseId} detail={warmup.ramp.sets.map((s) => `${s.reps} reps at ${s.weightKg ? `${s.weightKg} kg` : `${s.pct}%`}`).join(', then ')} />
              <p className="px-1 text-xs text-dim">{warmup.ramp.basedOnKg ? `Based on your last working weight of ${warmup.ramp.basedOnKg} kg.` : 'No weight logged yet: use half, then 70%, of the weight you plan to use.'}</p>
            </Step>
          )}
          <ul className="aether-rise rise-5 space-y-1 px-1 text-xs text-dim">
            {warmup.rules.map((r) => <li key={r}>• {r}</li>)}
          </ul>
        </>
      )}

      <div className="aether-rise rise-5 grid grid-cols-2 gap-3 pt-2">
        <button className="btn-ghost relative" onClick={go}>Skip today<HapticSwitch /></button>
        <button className="btn-primary aether-sheen relative" onClick={go}>Forged. Begin.<HapticSwitch /></button>
      </div>
    </Page>
  )
}

function Step({ n, title, sub, rise, children }: { n: number; title: string; sub: string; rise: string; children: React.ReactNode }) {
  return (
    <section className={`metric-panel aether-rise ${rise} space-y-3 p-3`}>
      <div className="flex items-baseline gap-2 px-1">
        <span className="grid size-6 place-items-center rounded-full bg-glow text-[11px] font-bold text-night">{n}</span>
        <h2 className="font-semibold">{title}</h2>
        <span className="text-xs text-dim">{sub}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function Row({ id, detail }: { id: string; detail: string }) {
  const ex = EXERCISE_BY_ID[id]
  if (!ex) return null
  return (
    <div className="workout-row flex items-center gap-3 rounded-2xl p-2.5">
      <Figure animId={ex.anim} size={56} className="shrink-0 rounded-xl" />
      <div className="min-w-0">
        <div className="text-sm font-semibold">{ex.name}</div>
        <div className="text-xs text-dim">{detail}</div>
      </div>
    </div>
  )
}
