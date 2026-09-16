import { useCallback, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { EXERCISE_BY_ID, EXERCISES } from '../data/exercises'
import { MUSCLES } from '../data/muscles'
import { suggest } from '../engine/progression'
import { isAvailable } from '../engine/program'
import { useStore } from '../store/store'
import { Figure } from '../components/Figure'
import { ExercisePicker } from '../components/ExercisePicker'
import { RestTimer } from '../components/RestTimer'
import { Page, fmtDuration } from '../components/ui'
import type { Block, CardioLog } from '../data/types'

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
  const finishSession = useStore((s) => s.finishSession)
  const discardSession = useStore((s) => s.discardSession)
  const lastXp = useStore((s) => s.lastXp)

  const [picker, setPicker] = useState<{ mode: 'add' } | { mode: 'swap'; idx: number; only?: string[] } | null>(null)
  const [rest, setRest] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<'finish' | 'discard' | null>(null)
  const [, tick] = useState(0)

  const day = useMemo(() => program?.days.find((d) => d.key === active?.dayKey), [program, active?.dayKey])
  const blockFor = useCallback((exerciseId: string): Block => {
    const b = day?.blocks.find((x) => x.exerciseId === exerciseId)
    if (b) return b
    const ex = EXERCISE_BY_ID[exerciseId]
    const p = ex?.category === 'core' ? { repMin: 10, repMax: 15, restSec: 60, rir: 2 } : ex?.category === 'isolation' ? { repMin: 10, repMax: 15, restSec: 75, rir: 1 } : { repMin: 8, repMax: 12, restSec: 90, rir: 2 }
    return { exerciseId, sets: 3, ...p, seconds: ex?.timed ? 30 : undefined, alternatives: [] }
  }, [day])

  const onRestDone = useCallback(() => setRest(null), [])
  if (!active || !profile) return <Navigate to={!active && lastXp ? '/done' : '/'} replace />

  const cardioOptions = EXERCISES.filter((e) => e.category === 'cardio' && isAvailable(e, profile.equipment))
  const plannedCardio = (day?.cardioMinutes ?? 0)
  const hardSets = active.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0)

  const finish = () => {
    finishSession()
    nav('/done', { replace: true })
  }

  return (
    <Page title={active.title} sub={`${fmtDuration(active.startedAt)} · ${hardSets} sets done`} right={
      <button className="btn-primary py-2 px-3 text-sm" onClick={() => setConfirm('finish')}>Finish</button>
    }>
      {active.reason && <p className="text-xs text-slate-400 leading-relaxed px-1">{active.reason}</p>}

      {active.exercises.map((log, idx) => {
        const ex = EXERCISE_BY_ID[log.exerciseId]
        if (!ex) return null
        const block = blockFor(log.exerciseId)
        const sug = suggest(block, sessions)
        const alts = block.alternatives.length ? block.alternatives : EXERCISES.filter((e) => e.pattern === ex.pattern && e.id !== ex.id && isAvailable(e, profile.equipment)).map((e) => e.id)
        return (
          <section key={`${log.exerciseId}-${idx}`} className="card p-3 space-y-3">
            <div className="flex items-start gap-3">
              <Link to={`/exercise/${ex.id}`}><Figure animId={ex.anim} size={72} className="rounded-xl shrink-0" /></Link>
              <div className="flex-1 min-w-0">
                <Link to={`/exercise/${ex.id}`} className="font-bold leading-tight block">{ex.name}</Link>
                <div className="text-[11px] text-slate-400">{ex.primary.map((m) => MUSCLES[m].label).join(', ')} · target {block.sets} × {block.seconds ? `${block.seconds} s` : `${block.repMin}–${block.repMax}`}{ex.unilateral ? ' each side' : ''} · {block.rir} in reserve</div>
                <p className={`text-xs mt-1 leading-snug ${sug.trend === 'up' ? 'text-cardio' : sug.trend === 'down' ? 'text-legs' : 'text-slate-300'}`}>{sug.note}</p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                <tr><th className="w-8 text-left font-semibold">Set</th>{!ex.timed && <th className="text-left font-semibold">kg</th>}<th className="text-left font-semibold">{ex.timed ? 'seconds' : 'reps'}</th><th className="text-left font-semibold w-16">RIR</th><th className="w-12" /></tr>
              </thead>
              <tbody>
                {log.sets.map((s, j) => (
                  <tr key={j} className={s.done ? 'opacity-70' : ''}>
                    <td className="py-1 text-slate-400 font-semibold">{j + 1}</td>
                    {!ex.timed && (
                      <td className="py-1 pr-1">
                        <input className="input py-2 px-2" type="number" inputMode="decimal" step="0.5" placeholder={sug.weightKg ? String(sug.weightKg) : '-'} value={s.weightKg ?? ''}
                          onChange={(e) => setSet(idx, j, { weightKg: e.target.value === '' ? undefined : Number(e.target.value) })} />
                      </td>
                    )}
                    <td className="py-1 pr-1">
                      <input className="input py-2 px-2" type="number" inputMode="numeric" placeholder={ex.timed ? String(block.seconds ?? 30) : String(sug.reps)} value={ex.timed ? (s.seconds ?? '') : (s.reps ?? '')}
                        onChange={(e) => setSet(idx, j, ex.timed ? { seconds: e.target.value === '' ? undefined : Number(e.target.value) } : { reps: e.target.value === '' ? undefined : Number(e.target.value) })} />
                    </td>
                    <td className="py-1 pr-1">
                      <select className="input py-2 px-1" value={s.rir ?? ''} onChange={(e) => setSet(idx, j, { rir: e.target.value === '' ? undefined : Number(e.target.value) })}>
                        <option value="">–</option>{[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td className="py-1">
                      <button aria-label="Set done" onClick={() => {
                        const done = !s.done
                        // Fill blanks with the suggestion so a tap is enough.
                        const patch: Partial<typeof s> = { done }
                        if (done) {
                          if (!ex.timed && s.reps === undefined) patch.reps = sug.reps
                          if (!ex.timed && s.weightKg === undefined && sug.weightKg) patch.weightKg = sug.weightKg
                          if (ex.timed && s.seconds === undefined) patch.seconds = block.seconds ?? 30
                        }
                        setSet(idx, j, patch)
                        if (done && settings.restTimer && block.restSec > 0) setRest(Date.now() + block.restSec * 1000)
                        tick((n) => n + 1)
                      }} className={`h-10 w-10 rounded-xl flex items-center justify-center border ${s.done ? 'bg-gold-400 border-gold-400 text-ink-950' : 'border-white/10 text-slate-500'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 text-xs">
              <button className="btn-ghost py-1.5 px-3 text-xs" onClick={() => addSet(idx)}>+ set</button>
              {log.sets.length > 1 && <button className="btn-ghost py-1.5 px-3 text-xs" onClick={() => removeSet(idx, log.sets.length - 1)}>– set</button>}
              <button className="btn-ghost py-1.5 px-3 text-xs" onClick={() => setPicker({ mode: 'swap', idx, only: alts })}>Swap</button>
              <button className="btn-ghost py-1.5 px-3 text-xs ml-auto text-slate-400" onClick={() => removeExercise(idx)}>Remove</button>
            </div>
          </section>
        )
      })}

      <button className="btn-ghost w-full" onClick={() => setPicker({ mode: 'add' })}>+ Add an exercise</button>

      <section className="card p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Cardio</h2>
          <span className="text-xs text-slate-400">{plannedCardio > 0 ? `planned ${plannedCardio} min` : 'optional'}</span>
        </div>
        {(active.cardio.length ? active.cardio : [{ exerciseId: '', minutes: 0, intensity: 'moderate' as const }]).map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_72px_100px] gap-2">
            <select className="input py-2" value={c.exerciseId} onChange={(e) => updateCardio(i, { exerciseId: e.target.value, intensity: EXERCISE_BY_ID[e.target.value]?.intensity ?? c.intensity })}>
              <option value="">Choose…</option>
              {cardioOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <input className="input py-2 px-2" type="number" inputMode="numeric" placeholder="min" value={c.minutes || ''} onChange={(e) => updateCardio(i, { minutes: Number(e.target.value) })} />
            <select className="input py-2 px-1" value={c.intensity} onChange={(e) => updateCardio(i, { intensity: e.target.value as CardioLog['intensity'] })}>
              <option value="moderate">moderate</option><option value="vigorous">vigorous</option>
            </select>
          </div>
        ))}
        <p className="text-[11px] text-slate-500">Moderate: you can talk but not sing. Vigorous: a few words at a time. Vigorous minutes count double.</p>
      </section>

      <button className="w-full text-center text-xs text-slate-500 py-2" onClick={() => setConfirm('discard')}>Discard this session</button>

      {picker && (
        <ExercisePicker
          title={picker.mode === 'swap' ? 'Swap for…' : 'Add an exercise'}
          only={picker.mode === 'swap' ? picker.only : undefined}
          onClose={() => setPicker(null)}
          onPick={(id) => { if (picker.mode === 'swap') swapExercise(picker.idx, id); else addExercise(id); setPicker(null) }}
        />
      )}
      {rest !== null && <RestTimer endsAt={rest} onDone={onRestDone} onSkip={() => setRest(null)} sound={settings.sound} />}
      {confirm && (
        <div className="fixed inset-0 z-50 bg-ink-950/80 flex items-end sm:items-center justify-center p-4" onClick={() => setConfirm(null)}>
          <div className="card p-4 w-full max-w-sm space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{confirm === 'finish' ? 'Finish the session?' : 'Discard the session?'}</h3>
            <p className="text-sm text-slate-300">{confirm === 'finish' ? `${hardSets} sets ticked. Unticked sets are dropped and XP is awarded now.` : 'Everything logged in this session is lost.'}</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost" onClick={() => setConfirm(null)}>Back</button>
              {confirm === 'finish'
                ? <button className="btn-primary" onClick={finish}>Finish</button>
                : <button className="btn-danger" onClick={() => { discardSession(); nav('/', { replace: true }) }}>Discard</button>}
            </div>
          </div>
        </div>
      )}
    </Page>
  )

  function updateCardio(i: number, patch: Partial<CardioLog>) {
    const list = active!.cardio.length ? [...active!.cardio] : [{ exerciseId: '', minutes: 0, intensity: 'moderate' as const }]
    list[i] = { ...list[i], ...patch }
    setCardio(list)
  }
}
