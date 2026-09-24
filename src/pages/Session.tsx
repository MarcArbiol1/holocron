import { useCallback, useMemo, useState } from 'react'
import { Check, ChevronRight, Plus } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { EXERCISE_BY_ID, EXERCISES } from '../data/exercises'
import { MUSCLES } from '../data/muscles'
import { suggest } from '../engine/progression'
import { isAvailable } from '../engine/program'
import { useStore } from '../store/store'
import { Figure } from '../components/Figure'
import { ExercisePicker } from '../components/ExercisePicker'
import { NumField } from '../components/NumField'
import { Confirm } from '../components/Confirm'
import { Page, fmtDuration } from '../components/ui'
import { HapticSwitch, haptic } from '../lib/haptics'
import { liveActive, startLive } from '../lib/live'
import { cardioSessionFor } from '../engine/cardio'
import type { Block, CardioLog } from '../data/types'

const GLOW_TINT: React.CSSProperties = { background: 'color-mix(in oklab, var(--glow) 14%, transparent)' }

export default function Session() {
  const nav = useNavigate()
  const active = useStore((s) => s.active)
  const program = useStore((s) => s.program)
  const profile = useStore((s) => s.profile)
  const sessions = useStore((s) => s.sessions)
  const settings = useStore((s) => s.settings)
  const setSet = useStore((s) => s.setSet)
  const addSet = useStore((s) => s.addSet)
  const removeSet = useStore((s) => s.removeSet)
  const swapExercise = useStore((s) => s.swapExercise)
  const addExercise = useStore((s) => s.addExercise)
  const removeExercise = useStore((s) => s.removeExercise)
  const setCardio = useStore((s) => s.setCardio)
  const setRest = useStore((s) => s.setRest)
  const finishSession = useStore((s) => s.finishSession)
  const discardSession = useStore((s) => s.discardSession)
  const lastXp = useStore((s) => s.lastXp)

  const [picker, setPicker] = useState<{ mode: 'add' } | { mode: 'swap'; idx: number; only?: string[] } | null>(null)
  const [confirm, setConfirm] = useState<'finish' | 'discard' | { remove: number } | null>(null)

  const day = useMemo(() => program?.days.find((d) => d.key === active?.dayKey), [program, active?.dayKey])
  const blockFor = useCallback((exerciseId: string): Block => {
    const b = day?.blocks.find((x) => x.exerciseId === exerciseId)
    if (b) return b
    const ex = EXERCISE_BY_ID[exerciseId]
    const p = ex?.category === 'core' ? { repMin: 10, repMax: 15, restSec: 60, rir: 2 } : ex?.category === 'isolation' ? { repMin: 10, repMax: 15, restSec: 75, rir: 1 } : { repMin: 8, repMax: 12, restSec: 90, rir: 2 }
    return { exerciseId, sets: 3, ...p, seconds: ex?.timed ? 30 : undefined, alternatives: [] }
  }, [day])

  if (!active || !profile) return <Navigate to={!active && lastXp ? '/done' : '/'} replace />

  const cardioOptions = EXERCISES.filter((e) => e.category === 'cardio' && isAvailable(e, profile.equipment))
  const plannedCardio = (day?.cardioMinutes ?? 0)
  const cardioSession = day ? cardioSessionFor(day, sessions) : undefined
  const hardSets = active.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0)

  const finish = () => {
    haptic('success')
    finishSession()
    nav('/done', { replace: true })
  }

  return (
    <Page title={active.title} kicker="Session" sub={`${fmtDuration(active.startedAt)} · ${hardSets} sets done`} right={
      <button className="btn-primary relative py-2 px-4 text-sm" onClick={() => { haptic(); setConfirm('finish') }}>Finish<HapticSwitch /></button>
    }>
      {active.reason && <p className="aether-rise px-1 text-xs leading-relaxed text-dim">{active.reason}</p>}

      {active.exercises.map((log, idx) => {
        const ex = EXERCISE_BY_ID[log.exerciseId]
        if (!ex) return null
        const block = blockFor(log.exerciseId)
        const sug = suggest(block, sessions)
        const alts = block.alternatives.length ? block.alternatives : EXERCISES.filter((e) => e.pattern === ex.pattern && e.id !== ex.id && isAvailable(e, profile.equipment)).map((e) => e.id)
        return (
          <section key={`${log.exerciseId}-${idx}`} className={`metric-panel aether-rise rise-${Math.min(5, idx + 1)} space-y-3 p-3`}>
            <div className="flex items-start gap-3">
              <Link to={`/exercise/${ex.id}`} onClick={() => haptic()}><Figure animId={ex.anim} size={64} className="shrink-0 rounded-xl" /></Link>
              <div className="min-w-0 flex-1">
                <Link to={`/exercise/${ex.id}`} onClick={() => haptic()} className="flex items-center gap-1 font-semibold leading-tight">
                  <span className="truncate">{ex.name}</span><ChevronRight className="size-4 shrink-0 text-dim" />
                </Link>
                <div className="mt-0.5 text-[11px] text-dim">{ex.primary.map((m) => MUSCLES[m].label).join(', ')} · target {block.sets} × {block.seconds ? `${block.seconds} s` : `${block.repMin}–${block.repMax}`}{ex.unilateral ? ' each side' : ''} · {block.rir} in reserve</div>
                <p className={`mt-1 text-xs leading-snug ${sug.trend === 'up' ? 'text-soft' : sug.trend === 'down' ? 'text-legs' : 'text-dim'}`}>{sug.note}</p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                  <th className="w-7 text-left font-semibold">Set</th>
                  {!ex.timed && <th className="text-left font-semibold">kg</th>}
                  <th className="text-left font-semibold">{ex.timed ? 'seconds' : 'reps'}</th>
                  <th className="w-16 text-left font-semibold">RIR</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {log.sets.map((s, j) => (
                  <tr key={j} className={s.done ? 'opacity-70' : ''}>
                    <td className="py-1 font-mono text-xs font-bold text-dim">{j + 1}</td>
                    {!ex.timed && (
                      <td className="py-1 pr-1">
                        <NumField className="input py-2 px-2 text-center font-mono" mode="decimal" ariaLabel="Weight in kg" placeholder={sug.weightKg ? String(sug.weightKg) : '-'} value={s.weightKg}
                          onChange={(v) => setSet(idx, j, { weightKg: v })} />
                      </td>
                    )}
                    <td className="py-1 pr-1">
                      <NumField className="input py-2 px-2 text-center font-mono" mode="numeric" ariaLabel={ex.timed ? 'Seconds' : 'Reps'} placeholder={ex.timed ? String(block.seconds ?? 30) : String(sug.reps)} value={ex.timed ? s.seconds : s.reps}
                        onChange={(v) => setSet(idx, j, ex.timed ? { seconds: v } : { reps: v })} />
                    </td>
                    <td className="py-1 pr-1">
                      <select className="input py-2 px-1 text-center font-mono" value={s.rir ?? ''} onChange={(e) => setSet(idx, j, { rir: e.target.value === '' ? undefined : Number(e.target.value) })}>
                        <option value="">–</option>{[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td className="py-1">
                      <button aria-label="Set done" onClick={() => {
                        const done = !s.done
                        haptic('tap')
                        // Fill blanks with the suggestion so a tap is enough.
                        const patch: Partial<typeof s> = { done }
                        if (done) {
                          if (!ex.timed && s.reps === undefined) patch.reps = sug.reps
                          if (!ex.timed && s.weightKg === undefined && sug.weightKg) patch.weightKg = sug.weightKg
                          if (ex.timed && s.seconds === undefined) patch.seconds = block.seconds ?? 30
                        }
                        setSet(idx, j, patch)
                        if (done && settings.restTimer && block.restSec > 0) {
                          // Must start inside the tap (autoplay rules); the timer then updates the card.
                          if (settings.liveTimer && !liveActive()) startLive(`Rest ${Math.floor(block.restSec / 60)}:${String(block.restSec % 60).padStart(2, '0')}`, ex.name)
                          const now = Date.now()
                          setRest({ startedAt: now, endsAt: now + block.restSec * 1000, label: ex.name })
                        }
                      }} className={`relative grid size-10 place-items-center rounded-xl border transition-transform active:scale-90 ${s.done ? 'bg-glow text-night' : 'text-dim'}`}
                        style={s.done ? { borderColor: 'var(--glow)', boxShadow: '0 6px 18px color-mix(in oklab, var(--glow) 28%, transparent)' } : { borderColor: 'color-mix(in oklab, var(--ice) 12%, transparent)', background: 'color-mix(in oklab, var(--panel) 85%, transparent)' }}>
                        <HapticSwitch />
                        <Check className="size-[18px]" strokeWidth={3} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 text-xs">
              <button className="btn-ghost py-1.5 px-3 text-xs" onClick={() => { haptic(); addSet(idx) }}>+ set</button>
              {log.sets.length > 1 && <button className="btn-ghost py-1.5 px-3 text-xs" onClick={() => { haptic(); removeSet(idx, log.sets.length - 1) }}>– set</button>}
              <button className="btn-ghost py-1.5 px-3 text-xs" onClick={() => { haptic(); setPicker({ mode: 'swap', idx, only: alts }) }}>Swap</button>
              <button className="btn-ghost ml-auto py-1.5 px-3 text-xs text-dim" onClick={() => { haptic('warning'); setConfirm({ remove: idx }) }}>Remove</button>
            </div>
          </section>
        )
      })}

      <button className="primary-action aether-rise flex w-full items-center justify-between rounded-2xl p-4 text-left" onClick={() => { haptic(); setPicker({ mode: 'add' }) }}>
        <span className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl text-glow" style={GLOW_TINT}><Plus className="size-5" /></span>
          <span><span className="block text-sm font-semibold">Add an exercise</span><span className="mt-0.5 block text-xs text-dim">Search the Archive</span></span>
        </span>
        <ChevronRight className="size-5 text-dim" />
      </button>

      <section className="metric-panel aether-rise space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Cardio</h2>
          <span className={plannedCardio > 0 ? 'chip-glow' : 'chip-dim'}>{plannedCardio > 0 ? `planned ${plannedCardio} min` : 'optional'}</span>
        </div>
        {cardioSession && (
          <div className="rounded-2xl p-3" style={{ background: 'color-mix(in oklab, var(--glow) 8%, transparent)', border: '1px solid color-mix(in oklab, var(--glow) 18%, transparent)' }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-glow">{cardioSession.title}</span>
              <span className="chip-glow">{cardioSession.style === 'intervals' ? '4 × 4 intervals' : 'steady'} · {cardioSession.minutes} min</span>
            </div>
            <ol className="mt-2 space-y-1 text-sm text-ice">
              {cardioSession.steps.map((st, i) => <li key={i} className="flex gap-2"><span className="text-glow font-bold">{i + 1}</span><span>{st}</span></li>)}
            </ol>
          </div>
        )}
        {(active.cardio.length ? active.cardio : [{ exerciseId: '', minutes: 0, intensity: 'moderate' as const }]).map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_72px_100px] gap-2">
            <select className="input py-2" value={c.exerciseId} onChange={(e) => updateCardio(i, { exerciseId: e.target.value, intensity: EXERCISE_BY_ID[e.target.value]?.intensity ?? c.intensity })}>
              <option value="">Choose…</option>
              {cardioOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <input className="input py-2 px-2 text-center font-mono" type="number" inputMode="numeric" placeholder="min" value={c.minutes || ''} onChange={(e) => updateCardio(i, { minutes: Number(e.target.value) })} />
            <select className="input py-2 px-1" value={c.intensity} onChange={(e) => updateCardio(i, { intensity: e.target.value as CardioLog['intensity'] })}>
              <option value="moderate">moderate</option><option value="vigorous">vigorous</option>
            </select>
          </div>
        ))}
        <p className="text-[11px] leading-snug text-dim">Moderate: you can talk but not sing. Vigorous: a few words at a time. Vigorous minutes count double.</p>
      </section>

      <button className="btn-danger relative w-full" onClick={() => { haptic('warning'); setConfirm('discard') }}>Terminate workout<HapticSwitch /></button>
      <p className="text-center text-[11px] text-dim">Ends the session without saving it. Use Finish to keep what you logged.</p>

      {picker && (
        <ExercisePicker
          title={picker.mode === 'swap' ? 'Swap for…' : 'Add an exercise'}
          only={picker.mode === 'swap' ? picker.only : undefined}
          onClose={() => setPicker(null)}
          onPick={(id) => { if (picker.mode === 'swap') swapExercise(picker.idx, id); else addExercise(id); setPicker(null) }}
        />
      )}
      {confirm === 'finish' && (
        <Confirm title="Finish the session?" body={`${hardSets} sets ticked. Unticked sets are dropped and XP is awarded now.`} confirmLabel="Finish" onConfirm={finish} onCancel={() => setConfirm(null)} />
      )}
      {confirm === 'discard' && (
        <Confirm title="Terminate the workout?" body="Everything logged in this session is lost." confirmLabel="Terminate" danger onConfirm={() => { discardSession(); nav('/', { replace: true }) }} onCancel={() => setConfirm(null)} />
      )}
      {confirm && typeof confirm === 'object' && (
        <Confirm title="Remove this exercise?" body={(() => { const n = active.exercises[confirm.remove]?.sets.filter((s) => s.done).length ?? 0; return `${EXERCISE_BY_ID[active.exercises[confirm.remove]?.exerciseId]?.name ?? 'It'} leaves this session${n ? ` with its ${n} ticked set${n === 1 ? '' : 's'}` : ''}.` })()} confirmLabel="Remove" danger onConfirm={() => { removeExercise(confirm.remove); setConfirm(null) }} onCancel={() => setConfirm(null)} />
      )}
    </Page>
  )

  function updateCardio(i: number, patch: Partial<CardioLog>) {
    const list = active!.cardio.length ? [...active!.cardio] : [{ exerciseId: '', minutes: 0, intensity: 'moderate' as const }]
    list[i] = { ...list[i], ...patch }
    setCardio(list)
  }
}
