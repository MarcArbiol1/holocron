import { Link, Navigate } from 'react-router-dom'
import { levelFor, totalXp } from '../engine/levels'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Bar, Page } from '../components/ui'

export default function Done() {
  const xp = useStore((s) => s.lastXp)
  const sessions = useStore((s) => s.sessions)
  if (!xp) return <Navigate to="/" replace />
  const total = totalXp(sessions)
  const lv = levelFor(total)
  const before = levelFor(total - xp.total)
  const levelled = lv.index > before.index
  return (
    <Page title="Session archived" sub="Nice work.">
      <div className="card p-5 text-center space-y-2 border-gold-400/40">
        <div className="text-xs uppercase tracking-widest text-slate-400">Experience</div>
        <div className="font-display text-5xl font-extrabold text-gold-300">+{xp.total}</div>
        <ul className="text-sm text-slate-300 space-y-0.5">{xp.lines.map((l) => <li key={l}>{l}</li>)}</ul>
      </div>
      <div className="card p-4 space-y-2">
        {levelled && <div className="text-center text-cardio font-bold">Level up! You are now {lv.name}.</div>}
        <div className="flex justify-between text-sm"><span className="font-semibold">{lv.name}</span><span className="text-slate-400">{lv.next ? `${lv.span - lv.into} XP to ${lv.next}` : 'Top of the ladder'}</span></div>
        <Bar value={lv.into} max={lv.span} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link to="/palantir" className="btn-ghost">Open {NAMES.pages.palantir}</Link>
        <Link to="/" className="btn-primary">Back home</Link>
      </div>
    </Page>
  )
}
