/** Shared shell in the Aether skin: page header, liquid dock, bars, chips. */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, ChevronLeft, Dumbbell, Hexagon, Orbit, Settings2, Shield } from 'lucide-react'
import { NAMES, dayTitle } from '../theme/names'
import { useStore } from '../store/store'
import { levelFor, totalXp } from '../engine/levels'
import { HapticSwitch, haptic } from '../lib/haptics'

/**
 * Standard page in the iOS pattern (HIG Toolbars): a navigation bar with the back button and actions,
 * a Large Title under it that scrolls with the content, and a compact centred title that fades into the
 * bar once the large one has scrolled away. `kicker`/`sub` render as a subtitle under the large title.
 */
export function Page({ title, sub, children, back, right, kicker, leading }: { title: string; sub?: string; children: ReactNode; back?: boolean; right?: ReactNode; kicker?: string; leading?: ReactNode }) {
  const nav = useNavigate()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const el = titleRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    // The bar is ~52 px tall under the safe area; the title counts as gone once it slides under it.
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: '-60px 0px 0px 0px', threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const subtitle = [kicker, sub].filter(Boolean).join(' · ')
  const hasBar = back || right || leading
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-night text-ice">
      <div className={`nav-bar ${compact ? 'nav-bar-compact' : ''}`}>
        <div className="mx-auto flex h-[52px] w-full max-w-[430px] items-center gap-2 px-4">
          <div className="flex min-w-[44px] items-center">
            {back ? (
              <button onClick={() => { haptic(); if ((window.history.state?.idx ?? 0) > 0) nav(-1); else nav('/', { replace: true }) }} aria-label="Back" className="press nav-circle">
                <ChevronLeft className="size-[22px]" strokeWidth={2.4} />
              </button>
            ) : leading}
          </div>
          <p className="nav-title min-w-0 flex-1 truncate text-center text-base font-semibold" aria-hidden={!compact}>{title}</p>
          <div className="flex min-w-[44px] items-center justify-end">{right}</div>
        </div>
      </div>
      <div className={`relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-36 ${hasBar ? 'pt-[calc(env(safe-area-inset-top)+56px)]' : 'pt-[calc(env(safe-area-inset-top)+56px)]'}`}>
        <header className="aether-rise px-1">
          <h1 ref={titleRef} className="text-3xl font-bold break-words">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-dim">{subtitle}</p>}
        </header>
        <div className="mt-5 space-y-7">{children}</div>
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
        const max = document.documentElement.scrollHeight - window.innerHeight
        const dy = y - lastY.current
        lastY.current = y
        if (y < 0 || y > max) return // rubber-band
        if (y < 24 || dy < -6) setMin((m) => (m ? false : m))
        else if (dy > 6 && y > 80) setMin((m) => (m ? m : true))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [loc.pathname])

  const Active = tabs[activeIndex].icon
  return (
    <>
      {active && loc.pathname !== '/session' && loc.pathname !== '/' && (
        <div className="fixed bottom-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] left-1/2 z-20 -translate-x-1/2">
          <NavLink to="/session" onClick={() => haptic()} className="pill-in aether-action flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <span className="live-dot" aria-hidden="true" />Session in progress
          </NavLink>
        </div>
      )}
      <div
        className="dock-wrap fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-30 h-[68px] w-[calc(100%-2.5rem)] max-w-[390px] -translate-x-1/2"
        data-min={min ? 'true' : 'false'}
        data-sliding={sliding ? 'true' : 'false'}
      >
        <nav className="liquid-dock absolute inset-0 grid grid-cols-5 p-1.5" aria-label="Primary navigation">
          <div aria-hidden="true" className="liquid-lens absolute bottom-1.5 top-1.5 w-[calc((100%_-_0.75rem)/5)]" style={{ '--nav-index': activeIndex } as React.CSSProperties} />
          {tabs.map(({ to, label, icon: Icon }, i) => (
            <button
              key={to}
              type="button"
              onClick={() => { haptic(); if (i !== activeIndex) nav(to) }}
              aria-current={i === activeIndex ? 'page' : undefined}
              aria-label={label}
              title={label}
              className={`dock-tab relative z-10 flex items-center justify-center ${i === activeIndex ? 'text-ice' : 'text-dim'}`}
            >
              <Icon className="dock-icon size-[22px]" strokeWidth={i === activeIndex ? 2.4 : 1.8} />
              <HapticSwitch />
            </button>
          ))}
        </nav>
        {/* Collapsed state: one circle with the active icon; tapping it reopens the bar (Apple HIG). */}
        <button
          type="button"
          onClick={() => { haptic(); setMin(false) }}
          aria-label="Show navigation"
          className="dock-mini absolute left-1/2 top-1/2 grid size-[58px] -translate-x-1/2 -translate-y-1/2 place-items-center text-ice"
        >
          <Active className="size-[22px]" strokeWidth={2.4} />
          <HapticSwitch />
        </button>
      </div>
    </>
  )
}

/** Kept for App.tsx compatibility. */
export const BottomNav = LiquidDock

/** Progress bar. Fills from the left when it appears and glides on change (a transform, not a width animation). */
export function Bar({ value, max, color = 'var(--glow)', className = '', delay = 150 }: { value: number; max: number; color?: string; className?: string; delay?: number }) {
  const frac = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  return (
    <div className={`h-2 rounded-full overflow-hidden ${className}`} style={{ background: 'color-mix(in oklab, var(--ice) 8%, transparent)' }}>
      <div className="bar-fill h-full w-full rounded-full" style={{ transform: `scaleX(${frac})`, background: color, '--bar-delay': `${delay}ms` } as React.CSSProperties} />
    </div>
  )
}

/** Two or three options with a highlight that slides between them (week / month, sign in / create). */
export function Segment<T extends string>({ value, options, onChange, className = '' }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; className?: string }) {
  const i = Math.max(0, options.findIndex((o) => o.v === value))
  return (
    <div className={`segment glass rounded-full p-1 text-xs font-semibold ${className}`} style={{ '--seg-i': i, '--seg-n': options.length } as React.CSSProperties}>
      <span aria-hidden="true" className="segment-thumb" />
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={o.v === value} onClick={() => { haptic(); if (o.v !== value) onChange(o.v) }} className={`press rounded-full px-3 py-1.5 ${o.v === value ? 'text-night' : 'text-dim'}`}>{o.label}</button>
      ))}
    </div>
  )
}

/** Level + settings button pair for the home header. */
export function ProfileButton() {
  return (
    <NavLink to="/settings" onClick={() => haptic()} aria-label="Profile and settings" className="press nav-circle">
      <Settings2 className="size-5" />
    </NavLink>
  )
}

export function LevelPill() {
  const sessions = useStore((s) => s.sessions)
  const lv = levelFor(totalXp(sessions))
  return <NavLink to="/order" onClick={() => haptic()} className="press chip-glow">{lv.name} · {lv.totalXp} XP</NavLink>
}

export function Section({ title, children, right, className = '' }: { title: string; children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <section className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="px-1 text-xl font-bold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

export const DAY_COLOR: Record<string, string> = {
  legs: '#e0553f', lower: '#e0553f', push: '#f08a3c', pull: '#3fa7e0', upper: '#d9b480', chestback: '#d9b480', arms: '#f5b84a',
  fullA: '#5cdcce', fullB: '#5cdcce', fullC: '#5cdcce', health: '#66b79c', cardio: '#66b79c', core: '#9b6cf0', mobility: '#8fd13f', custom: '#94a3b8',
}

export const dayName = (id: keyof typeof NAMES.days) => NAMES.days[id]
export { dayTitle }

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
