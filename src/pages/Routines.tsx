import { Navigate, useNavigate } from 'react-router-dom'
import { EXERCISE_BY_ID } from '../data/exercises'
import { MUSCLES, TARGET_MUSCLES } from '../data/muscles'
import { plannedSetsPerMuscle } from '../engine/program'
import { useRecommendation } from '../store/hooks'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Bar, DAY_COLOR, Page, Section, dayName } from '../components/ui'
import { GROUP_COLOR } from '../data/muscles'

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
    <Page title={NAMES.pages.routines} sub={`${program.splitLabel} · ${profile.daysPerWeek} days`}>
      <Section title="Why it looks like this">
        <ul className="card p-4 text-sm text-slate-300 space-y-2">
          {program.notes.map((n) => <li key={n} className="leading-relaxed">• {n}</li>)}
          <li className="text-xs text-slate-500 pt-1">Every rule is traced to a paper in docs/EVIDENCE.md in the repo.</li>
        </ul>
      </Section>

      <Section title="Your days">
        <div className="space-y-3">
          {program.days.map((d) => (
            <div key={d.key} className="card p-4 space-y-2" style={{ borderColor: `${DAY_COLOR[d.id]}44` }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider" style={{ color: DAY_COLOR[d.id] }}>{d.key.replace('-', ' ')}</div>
                  <h3 className="font-display text-xl font-extrabold">{dayName(d.id)}</h3>
                  <div className="text-[11px] text-slate-400">about {d.minutes} min including warm-up</div>
                </div>
                {!active && rec && (
                  <button className="btn-ghost py-2 px-3 text-sm" onClick={() => { startSession(d, dayName(d.id), 'Chosen from the plan.', 0, rec.warmup); nav('/forge') }}>Start</button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {d.muscles.map((m) => <span key={m} className="chip bg-ink-700 text-slate-300">{MUSCLES[m].label}</span>)}
              </div>
              <ul className="divide-y divide-white/5">
                {d.blocks.map((b) => {
                  const ex = EXERCISE_BY_ID[b.exerciseId]
                  return (
                    <li key={b.exerciseId} className="py-1.5 flex justify-between text-sm">
                      <button className="text-left" onClick={() => nav(`/exercise/${ex.id}`)}>{ex.name}</button>
                      <span className="text-slate-400 tabular-nums">{b.sets} × {b.seconds ? `${b.seconds}s` : `${b.repMin}–${b.repMax}`}</span>
                    </li>
                  )
                })}
                {d.cardioMinutes > 0 && <li className="py-1.5 flex justify-between text-sm"><span className="text-cardio">Cardio finisher</span><span className="text-slate-400">{d.cardioMinutes} min</span></li>}
                {d.balance && <li className="py-1.5 text-sm text-mobility">Balance block (65+)</li>}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Planned sets per muscle per week (target ${lo}–${hi})`}>
        <div className="card p-4 space-y-2">
          {TARGET_MUSCLES.map((m) => {
            const v = planned[m] ?? 0
            return (
              <div key={m}>
                <div className="flex justify-between text-xs mb-0.5"><span className="text-slate-300">{MUSCLES[m].label}</span><span className={v < lo ? 'text-slate-500' : 'text-slate-300'}>{v}</span></div>
                <Bar value={v} max={hi} color={GROUP_COLOR[MUSCLES[m].group]} />
              </div>
            )
          })}
          <p className="text-[11px] text-slate-500 pt-1">Secondary muscles count half a set. Arms and calves sit below the big-muscle target on purpose: they already work in the compound lifts.</p>
        </div>
      </Section>
    </Page>
  )
}
