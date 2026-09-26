import { Link, Navigate } from 'react-router-dom'
import { levelFor, totalXp } from '../engine/levels'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Page } from '../components/ui'
import { haptic } from '../lib/haptics'
import { useCountUp } from '../lib/motion'

/** Particles for the XP burst: evenly spread angles with a little jitter, two colours. Built once. */
const BURST = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + (i % 3) * 0.17
  const d = 70 + ((i * 37) % 40)
  return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.7, delay: (i % 4) * 25, c: i % 3 === 0 ? 'var(--gold)' : 'var(--glow)' }
})

function Burst() {
  return (
    <span className="burst" aria-hidden="true">
      {BURST.map((p, i) => <i key={i} style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--d': `${p.delay}ms`, '--c': p.c } as React.CSSProperties} />)}
    </span>
  )
}

export default function Done() {
  const xp = useStore((s) => s.lastXp)
  const sessions = useStore((s) => s.sessions)
  const total = totalXp(sessions)
  const lv = levelFor(total)
  const before = levelFor(total - (xp?.total ?? 0))
  const levelled = lv.index > before.index
  // The XP rolls up once the number has popped in; the level bar grows from where it stood before this session.
  const shown = useCountUp(xp?.total ?? 0, { ms: 1100, delay: 250 })
  const intoShown = useCountUp(lv.into, { from: levelled ? 0 : before.into, ms: 1200, delay: 500 })
  if (!xp) return <Navigate to="/" replace />
  return (
    <Page title="Session archived" kicker="Nice work.">
      <div className="metric-panel aether-rise rise-1 relative space-y-2 p-6 text-center" style={{ borderColor: 'color-mix(in oklab, var(--glow) 30%, transparent)', boxShadow: '0 0 40px color-mix(in oklab, var(--glow) 10%, transparent), inset 0 1px 0 color-mix(in oklab, var(--ice) 8%, transparent)' }}>
        <div className="kicker">Experience</div>
        <div className="relative inline-block">
          <Burst />
          <div className="xp-pop font-display text-5xl font-bold tabular-nums text-glow">+{shown}</div>
        </div>
        <ul className="space-y-0.5 text-sm text-dim">{xp.lines.map((l, i) => <li key={l} className="stagger" style={{ '--i': i + 4 } as React.CSSProperties}>{l}</li>)}</ul>
      </div>
      <div className="metric-panel aether-rise rise-2 space-y-2 p-4">
        {levelled && <div className="level-up text-center font-semibold text-soft"><span className="level-glow">Level up! You are now {lv.name}.</span></div>}
        <div className="flex justify-between text-sm"><span className="font-semibold">{lv.name}</span><span className="text-dim tabular-nums">{lv.next ? `${Math.max(0, lv.span - intoShown)} XP to ${lv.next}` : 'Top of the ladder'}</span></div>
        <div className="h-2 overflow-hidden rounded-full" style={{ background: 'color-mix(in oklab, var(--ice) 8%, transparent)' }}>
          <div className="h-full w-full origin-left rounded-full bg-glow" style={{ transform: `scaleX(${lv.span > 0 ? Math.min(1, intoShown / lv.span) : 1})` }} />
        </div>
      </div>
      <div className="aether-rise rise-3 grid grid-cols-2 gap-3">
        <Link to="/palantir" onClick={() => haptic()} className="btn-ghost whitespace-nowrap px-3 text-sm">Open {NAMES.pages.palantir}</Link>
        <Link to="/" onClick={() => haptic()} className="btn-primary whitespace-nowrap px-3 text-sm">Back home</Link>
      </div>
    </Page>
  )
}
