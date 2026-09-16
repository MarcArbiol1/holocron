/** Shared shell in the Aether skin: page header, liquid dock, bars, chips. */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, ChevronLeft, Dumbbell, Hexagon, Orbit, Settings2, Shield } from 'lucide-react'
import { NAMES } from '../theme/names'
import { useStore } from '../store/store'
import { levelFor, totalXp } from '../engine/levels'
import { HapticSwitch, haptic } from '../lib/haptics'

/** Standard page: kicker line, big title, optional back button and right slot. Content is centred at phone width. */
export function Page({ title, sub, children, back, right, kicker }: { title: string; sub?: string; children: ReactNode; back?: boolean; right?: ReactNode; kicker?: string }) {
  const nav = useNavigate()
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-night text-ice">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pb-36 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="aether-rise flex items-end justify-between gap-3">
          <div className="min-w-0 flex items-end gap-3">
            {back && (
              <button onClick={() => { haptic(); nav(-1) }} aria-label="Back" className="profile-orbit grid size-11 shrink-0 place-items-center rounded-full bg-panel text-glow transition-transform active:scale-95">
                <ChevronLeft className="size-5" />
              </button>
            )}
            <div className="min-w-0">
              <p className="kicker truncate">{kicker ?? sub ?? ''}</p>
              <h1 className="mt-1 text-[28px] font-bold leading-[1.05] break-words">{title}</h1>
              {kicker && sub && <p className="mt-1.5 text-xs text-dim">{sub}</p>}
            </div>
          </div>
          {right}
        </header>
        <div className="mt-6 space-y-6">{children}</div>
      </div>
    </main>
  )
}

const tabs = [
  { to: '/', label: 'Home', icon: Hexagon },
  { to: '/routines', label: 'Plan', icon: Dumbbell },
  { to: '/palantir', label: 'Recap', icon: Orbit },
  { to: '/library', label: 'Archive', icon: BookOpen },
  { to: '/order', label: 'Order', icon: Shield },
]

/**
 * The floating glass tab bar. The lens slides with a spring, stretches while
 * moving, and the whole capsule slims down while you scroll down the page.
 */
export function LiquidDock() {
  const loc = useLocation()
  const nav = useNavigate()
  const active = useStore((s) => s.active)
  // Detail pages light up the tab they belong to.
  const section = loc.pathname.startsWith('/exercise') ? '/library' : loc.pathname.startsWith('/history') ? '/palantir' : loc.pathname
  const activeIndex = Math.max(0, tabs.findIndex((t) => (t.to === '/' ? section === '/' : section.startsWith(t.to))))
  const [sliding, setSliding] = useState(false)
  const [min, setMin] = useState(false)
  const lastY = useRef(0)
  const prevIndex = useRef(activeIndex)

  useEffect(() => {
    if (prevIndex.current !== activeIndex) {
      prevIndex.current = activeIndex
      setSliding(true)
      const t = setTimeout(() => setSliding(false), 540)
      return () => clearTimeout(t)
    }
  }, [activeIndex])

  useEffect(() => {
    lastY.current = window.scrollY
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        const dy = y - lastY.current
        if (y < 24 || dy < -6) setMin(false)
        else if (dy > 6 && y > 80) setMin(true)
        lastY.current = y
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [loc.pathname])

  return (
    <>
      {active && loc.pathname !== '/session' && (
        <NavLink to="/session" onClick={() => haptic()} className="fixed bottom-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] left-1/2 z-20 -translate-x-1/2 aether-action rounded-full px-4 py-2 text-sm">
          Session in progress
        </NavLink>
      )}
      <nav
        className="liquid-dock fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-30 grid h-[76px] w-[calc(100%-2.5rem)] max-w-[390px] -translate-x-1/2 grid-cols-5 p-1.5"
        data-min={min ? 'true' : 'false'}
        data-sliding={sliding ? 'true' : 'false'}
        aria-label="Primary navigation"
      >
        <div aria-hidden="true" className="liquid-lens absolute bottom-1.5 top-1.5 w-[calc((100%_-_0.75rem)/5)]" style={{ '--nav-index': activeIndex } as React.CSSProperties} />
        {tabs.map(({ to, label, icon: Icon }, i) => (
          <button
            key={to}
            type="button"
            onClick={() => { haptic(); if (min) { setMin(false); return } if (i !== activeIndex) nav(to) }}
            aria-current={i === activeIndex ? 'page' : undefined}
            aria-label={label}
            className={`dock-tab relative z-10 flex flex-col items-center justify-center rounded-full ${i === activeIndex ? 'text-ice' : 'text-dim'}`}
          >
            <Icon className="dock-icon size-5" strokeWidth={i === activeIndex ? 2.4 : 1.8} />
            <span className="dock-label mt-1 text-[10px] font-medium">{label}</span>
            <HapticSwitch />
          </button>
        ))}
      </nav>
    </>
  )
}

/** Kept for App.tsx compatibility. */
export const BottomNav = LiquidDock

export function Bar({ value, max, color = 'var(--glow)', className = '' }: { value: number; max: number; color?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={`h-2 rounded-full overflow-hidden ${className}`} style={{ background: 'color-mix(in oklab, var(--ice) 8%, transparent)' }}>
      <div className="h-full rounded-full transition-all duration-700 ease-apple" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

/** Level + settings button pair for the home header. */
export function ProfileButton() {
  return (
    <NavLink to="/settings" onClick={() => haptic()} aria-label="Profile and settings" className="profile-orbit grid size-11 shrink-0 place-items-center rounded-full bg-panel text-glow transition-transform active:scale-95">
      <Settings2 className="size-5" />
    </NavLink>
  )
}

export function LevelPill() {
  const sessions = useStore((s) => s.sessions)
  const lv = levelFor(totalXp(sessions))
  return <NavLink to="/order" onClick={() => haptic()} className="chip-glow">{lv.name} · {lv.totalXp} XP</NavLink>
}

export function Section({ title, children, right, className = '' }: { title: string; children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <section className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

export const DAY_COLOR: Record<string, string> = {
  legs: '#e0553f', lower: '#e0553f', push: '#f08a3c', pull: '#3fa7e0', upper: '#d9b480',
  fullA: '#5cdcce', fullB: '#5cdcce', fullC: '#5cdcce', health: '#66b79c', cardio: '#66b79c', core: '#9b6cf0', mobility: '#8fd13f', custom: '#94a3b8',
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
export function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
}
