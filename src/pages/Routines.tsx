import { ChevronRight, Play } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { GROUP_COLOR, MUSCLES, TARGET_MUSCLES } from '../data/muscles'
import { plannedSetsPerMuscle } from '../engine/program'
import { useRecommendation } from '../store/hooks'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Bar, DAY_COLOR, Page, dayTitle, } from '../components/ui'
import { Figure } from '../components/Figure'
import { haptic } from '../lib/haptics'

export default function Routines() {
  const nav = useNavigate()
  const profile = useStore((s) => s.profile)
  const program = useStore((s) => s.program)
  const active = useStore((s) => s.active)
  const startSession = useStore((s) => s.startSession)
  const rec = useRecommendation()
  if (!profile || !program) return <Navigate to="/onboarding" replace />
  const planned = plannedSetsPerMuscle(program)
  const [lo, hi] = program.setsPerMuscleTarget

  return (
    <Page title={NAMES.pages.routines} kicker="Your plan" sub={`${program.splitLabel} · ${profile.daysPerWeek} days a week`}>
      <section className="aether-rise rise-1" aria-labelledby="why-title">
        <h2 id="why-title" className="text-lg font-semibold">Why it looks like this</h2>
        <div className="metric-panel mt-3 p-4">
          <ul className="space-y-2 text-sm leading-relaxed text-ice/90">
            {program.notes.map((n) => (
              <li key={n} className="flex gap-2"><span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-glow/80" /><span>{n}</span></li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-dim">Every rule and its paper: <Link to="/codex" className="text-glow font-semibold">open The Codex</Link></p>
        </div>
      </section>

      <section className="aether-rise rise-2" aria-labelledby="days-title">
        <h2 id="days-title" className="text-lg font-semibold">Your days</h2>
        <div className="mt-3 space-y-3">
          {program.days.map((d) => (
            <div key={d.key} className="metric-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="kicker" style={{ color: DAY_COLOR[d.id] }}>{d.key.replace('-', ' ')}</p>
                  <h3 className="mt-1 text-xl font-bold leading-tight">{dayTitle(d)}</h3>
                  <p className="mt-1 text-xs text-dim">about {d.minutes} min including warm-up</p>
                </div>
                {!active && rec && (
                  <button
                    onClick={() => { haptic('success'); startSession(d, dayTitle(d), 'Chosen from the plan.', 0, rec.warmup); nav('/forge') }}
                    className="primary-action flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold text-ice"
                  >
                    <Play className="size-4 fill-current text-glow" /> Start
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.muscles.map((m) => <span key={m} className="chip-dim">{MUSCLES[m].label}</span>)}
              </div>
              <ul className="mt-3 space-y-2">
                {d.blocks.map((b) => {
                  const ex = EXERCISE_BY_ID[b.exerciseId]
                  return (
                    <li key={b.exerciseId}>
                      <Link to={`/exercise/${ex.id}`} onClick={() => haptic()} className="workout-row flex items-center gap-3 rounded-2xl p-2.5">
                        <Figure animId={ex.anim} size={44} playing={false} className="rounded-xl shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold truncate">{ex.name}</span>
                          <span className="mt-0.5 block text-xs text-dim">{b.sets} × {b.seconds ? `${b.seconds} s` : `${b.repMin}–${b.repMax}`} · rest {Math.round((b.restSec / 60) * 10) / 10} min</span>
                        </span>
                        <ChevronRight className="size-4 text-dim" />
                      </Link>
                    </li>
                  )
                })}
                {d.cardioPlan && (
                  <li className="py-2 text-sm text-dim">
                    Alternates <span className="text-soft font-semibold">{d.cardioPlan.steady.title}</span> ({d.cardioPlan.steady.minutes} min steady){d.cardioPlan.intervals ? <> and <span className="text-soft font-semibold">{d.cardioPlan.intervals.title}</span> (4 × 4 intervals)</> : ''} week by week.
                  </li>
                )}
                {d.cardioMinutes > 0 && (
                  <li className="flex items-center justify-between rounded-2xl px-3 py-2 text-sm" style={{ background: 'color-mix(in oklab, var(--glow-soft) 10%, transparent)' }}>
                    <span className="font-semibold text-soft">Cardio finisher</span><span className="text-dim">{d.cardioMinutes} min</span>
                  </li>
                )}
                {d.balance && (
                  <li className="rounded-2xl px-3 py-2 text-sm font-semibold text-mobility" style={{ background: 'color-mix(in oklab, #8fd13f 10%, transparent)' }}>Balance block (65+)</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="aether-rise rise-3" aria-labelledby="sets-title">
        <h2 id="sets-title" className="text-lg font-semibold">Planned sets per muscle</h2>
        <p className="mt-1 text-xs text-dim">per week · target {lo}–{hi}</p>
        <div className="metric-panel mt-3 space-y-2.5 p-4">
          {TARGET_MUSCLES.map((m) => {
            const v = planned[m] ?? 0
            return (
              <div key={m}>
                <div className="mb-1 flex justify-between text-xs"><span className="text-ice/90">{MUSCLES[m].label}</span><span className={v < lo ? 'text-dim' : 'text-ice'}>{v}</span></div>
                <Bar value={v} max={hi} color={GROUP_COLOR[MUSCLES[m].group]} />
              </div>
            )
          })}
          <p className="pt-1 text-[11px] text-dim">Secondary muscles count half a set. Arms and calves sit below the big-muscle target on purpose: they already work in the compound lifts.</p>
        </div>
      </section>
    </Page>
  )
}
