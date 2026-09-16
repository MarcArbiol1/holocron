import { levelFor, THRESHOLDS, totalXp } from '../engine/levels'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Bar, Page } from '../components/ui'

export default function Order() {
  const sessions = useStore((s) => s.sessions)
  const xp = totalXp(sessions)
  const lv = levelFor(xp)
  return (
    <Page title={NAMES.pages.order} kicker={`${lv.name} · ${xp} XP`}>
      <div className="aether-rise rise-1 metric-panel space-y-2.5 p-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-lg font-semibold">{lv.name}</span>
          <span className="text-dim">{lv.next ? `${lv.span - lv.into} XP to ${lv.next}` : 'Top of the ladder'}</span>
        </div>
        <Bar value={lv.into} max={lv.span} />
      </div>

      <section className="aether-rise rise-2" aria-labelledby="ladder-title">
        <h2 id="ladder-title" className="text-lg font-semibold">The ladder</h2>
        <ol className="metric-panel mt-3 divide-y divide-ice/5 overflow-hidden">
          {NAMES.levels.map((name, i) => {
            const reached = i <= lv.index
            const current = i === lv.index
            return (
              <li key={name} className="flex items-center justify-between px-4 py-2.5" style={current ? { background: 'color-mix(in oklab, var(--glow) 10%, transparent)' } : undefined}>
                <div className="flex items-center gap-3">
                  <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${reached ? 'bg-glow text-night' : 'text-dim'}`} style={reached ? undefined : { background: 'color-mix(in oklab, var(--ice) 8%, transparent)' }}>{i + 1}</span>
                  <span className={reached ? 'font-semibold' : 'text-dim'}>{name}</span>
                </div>
                <span className="font-mono text-xs text-dim tabular-nums">{THRESHOLDS[i]} XP</span>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="aether-rise rise-3" aria-labelledby="xp-title">
        <h2 id="xp-title" className="text-lg font-semibold">How XP is earned</h2>
        <ul className="metric-panel mt-3 space-y-2 p-4 text-sm text-ice/90">
          <li className="flex gap-3"><span className="chip-glow shrink-0 font-mono">+100</span><span>for every session you finish</span></li>
          <li className="flex gap-3"><span className="chip-glow shrink-0 font-mono">+5</span><span>per hard set (up to 40 sets)</span></li>
          <li className="flex gap-3"><span className="chip-glow shrink-0 font-mono">+2</span><span>per moderate cardio minute, vigorous counts double (up to 60)</span></li>
          <li className="flex gap-3"><span className="chip-glow shrink-0 font-mono">+150</span><span>the moment a week hits your planned session count</span></li>
          <li className="flex gap-3"><span className="chip-glow shrink-0 font-mono">+50</span><span>for each new estimated-1RM record (up to 3 per session)</span></li>
          <li className="pt-1 text-xs text-dim">Consistency out-earns heroics on purpose: at three sessions a week you reach Knight in about ten weeks and Ascended in about a year and a half.</li>
        </ul>
      </section>
    </Page>
  )
}
