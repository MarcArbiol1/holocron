import { Link, Navigate } from 'react-router-dom'
import { levelFor, totalXp } from '../engine/levels'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Bar, Page } from '../components/ui'
import { haptic } from '../lib/haptics'

export default function Done() {
  const xp = useStore((s) => s.lastXp)
  const sessions = useStore((s) => s.sessions)
  if (!xp) return <Navigate to="/" replace />
  const total = totalXp(sessions)
  const lv = levelFor(total)
  const before = levelFor(total - xp.total)
  const levelled = lv.index > before.index
  return (
    <Page title="Session archived" kicker="Nice work.">
      <div className="metric-panel aether-rise rise-1 space-y-2 p-6 text-center" style={{ borderColor: 'color-mix(in oklab, var(--glow) 30%, transparent)', boxShadow: '0 0 40px color-mix(in oklab, var(--glow) 10%, transparent), inset 0 1px 0 color-mix(in oklab, var(--ice) 8%, transparent)' }}>
        <div className="kicker">Experience</div>
        <div className="font-display text-5xl font-bold text-glow">+{xp.total}</div>
        <ul className="space-y-0.5 text-sm text-dim">{xp.lines.map((l) => <li key={l}>{l}</li>)}</ul>
      </div>
      <div className="metric-panel aether-rise rise-2 space-y-2 p-4">
        {levelled && <div className="text-center font-semibold text-soft">Level up! You are now {lv.name}.</div>}
        <div className="flex justify-between text-sm"><span className="font-semibold">{lv.name}</span><span className="text-dim">{lv.next ? `${lv.span - lv.into} XP to ${lv.next}` : 'Top of the ladder'}</span></div>
        <Bar value={lv.into} max={lv.span} />
      </div>
      <div className="aether-rise rise-3 grid grid-cols-2 gap-3">
        <Link to="/palantir" onClick={() => haptic()} className="btn-ghost whitespace-nowrap px-3 text-sm">Open {NAMES.pages.palantir}</Link>
        <Link to="/" onClick={() => haptic()} className="btn-primary whitespace-nowrap px-3 text-sm">Back home</Link>
      </div>
    </Page>
  )
}
