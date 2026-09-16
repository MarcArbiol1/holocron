/** Small shared pieces: page shell, bottom nav, badges, progress bars. */
import type { ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { NAMES } from '../theme/names'
import { useStore } from '../store/store'
import { levelFor, totalXp } from '../engine/levels'

export function Page({ title, sub, children, back, right }: { title: string; sub?: string; children: ReactNode; back?: boolean; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="min-h-full pb-24">
      <header className="safe-top sticky top-0 z-20 bg-ink-900/90 backdrop-blur border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          {back && (
            <button onClick={() => nav(-1)} className="h-9 w-9 rounded-full bg-ink-700 flex items-center justify-center text-slate-300" aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg leading-tight truncate">{title}</h1>
            {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
          </div>
          {right}
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 pt-4 space-y-4">{children}</main>
    </div>
  )
}

const tabs: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/', label: 'Home', icon: <path d="M12 3l8 4.6v8.8L12 21l-8-4.6V7.6z" /> },
  { to: '/routines', label: 'Plan', icon: <path d="M4 5h16M4 12h10M4 19h7" /> },
  { to: '/palantir', label: 'Recap', icon: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></> },
  { to: '/library', label: 'Archive', icon: <path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 00-3 3V4zM5 17h14" /> },
  { to: '/order', label: 'Order', icon: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /> },
]

export function BottomNav() {
  const active = useStore((s) => s.active)
  const loc = useLocation()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-ink-900/95 backdrop-blur border-t border-white/5 safe-bottom">
      <div className="max-w-xl mx-auto grid grid-cols-5">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${isActive ? 'text-gold-400' : 'text-slate-500'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{t.icon}</svg>
            {t.label}
          </NavLink>
        ))}
      </div>
      {active && loc.pathname !== '/session' && (
        <NavLink to="/session" className="absolute -top-11 inset-x-0 mx-auto w-max btn-primary py-2 px-4 text-sm shadow-lg">
          Session in progress
        </NavLink>
      )}
    </nav>
  )
}

export function Bar({ value, max, color = '#f5b84a', className = '' }: { value: number; max: number; color?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={`h-2 rounded-full bg-ink-600 overflow-hidden ${className}`}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function LevelPill() {
  const sessions = useStore((s) => s.sessions)
  const lv = levelFor(totalXp(sessions))
  return (
    <div className="flex items-center gap-2">
      <NavLink to="/order" className="chip bg-gold-400/15 text-gold-300 border border-gold-400/20">
        {lv.name} · {lv.totalXp} XP
      </NavLink>
      <NavLink to="/settings" aria-label="Settings" className="h-8 w-8 rounded-full bg-ink-700 flex items-center justify-center text-slate-300">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>
      </NavLink>
    </div>
  )
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

export const DAY_COLOR: Record<string, string> = {
  legs: '#e0553f', lower: '#e0553f', push: '#f08a3c', pull: '#3fa7e0', upper: '#f5b84a',
  fullA: '#9b6cf0', fullB: '#9b6cf0', fullC: '#9b6cf0', health: '#3fd0a4', cardio: '#3fd0a4', core: '#9b6cf0', mobility: '#8fd13f', custom: '#94a3b8',
}

export const dayName = (id: keyof typeof NAMES.days) => NAMES.days[id]

export function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}
export function fmtDuration(startIso: string, endIso?: string) {
  const ms = (endIso ? new Date(endIso).getTime() : Date.now()) - new Date(startIso).getTime()
  const m = Math.max(0, Math.round(ms / 6e4))
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`
}
