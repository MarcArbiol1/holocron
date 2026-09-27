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
 * The iOS 26 Liquid Glass tab bar, modelled frame by frame on Marc's screen recording (Reddit's bar):
 *  - a floating glass capsule with a thick specular rim; the selected tab sits in a darker glass pill.
 *  - touching the bar lifts the pill into a clear glass lens, taller than the bar, with bright
 *    rainbow-edged rims. It follows the finger (no React renders: the transform is written per
 *    frame), magnifies the icon under it, ticks as it crosses tabs, and on release springs onto the
 *    nearest tab and drops back into the pill. A plain tap lifts it, carries it over, drops it.
 *  - scrolling down shrinks the bar into one glass circle with the Holocron logo; tap to reopen.
 * Real refraction needs SVG backdrop filters, which iOS Safari does not run (WebKit 245510), so
 * the glass is blur + saturation + light rims, which is what reads as glass at this size.
 */
export function LiquidDock() {
  const loc = useLocation()
  const nav = useNavigate()
  const active = useStore((s) => s.active)
  // Detail pages light up the tab they belong to.
  const section = loc.pathname.startsWith('/exercise') ? '/library' : loc.pathname.startsWith('/history') ? '/palantir' : loc.pathname.startsWith('/codex') ? '/routines' : loc.pathname
  const activeIndex = Math.max(0, tabs.findIndex((t) => (t.to === '/' ? section === '/' : section.startsWith(t.to))))
  const [min, setMin] = useState(false)
  const [lifted, setLifted] = useState(false)
  const [target, setTarget] = useState<number | null>(null) // tab the pill is heading to after a release
  const lastY = useRef(0)
  const barRef = useRef<HTMLElement>(null)
  const lensRef = useRef<HTMLDivElement>(null)
  const iconRefs = useRef<(HTMLSpanElement | null)[]>([])
  const drag = useRef<{ id: number; x0: number; moved: boolean; over: number; from: number } | null>(null)
  const shown = target ?? activeIndex

  // Once the route has caught up with a release, the pill follows the route again.
  useEffect(() => { setTarget(null) }, [activeIndex])

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

  // --- the lens, driven directly (per-frame writes, no re-render) ---
  const geom = () => {
    const bar = barRef.current!.getBoundingClientRect()
    const pad = 4
    const w = (bar.width - pad * 2) / tabs.length
    return { left: bar.left + pad, w }
  }
  /** Put the lens centre at `cx` (px from the tabs' left edge) and magnify icons near it. */
  const placeLens = (cx: number, w: number) => {
    const x = Math.max(0, Math.min(cx - w / 2, w * (tabs.length - 1)))
    const lens = lensRef.current
    if (lens) lens.style.setProperty('--lens-x', `${x}px`)
    iconRefs.current.forEach((el, i) => {
      if (!el) return
      const d = Math.abs(i * w + w / 2 - (x + w / 2)) / w
      el.style.transform = `scale(${1 + 0.22 * Math.max(0, 1 - d)})`
    })
    return Math.round(x / w)
  }
  const resetIcons = () => iconRefs.current.forEach((el) => { if (el) el.style.transform = '' })

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || min) return
    const { left, w } = geom()
    try { barRef.current!.setPointerCapture(e.pointerId) } catch { /* synthetic or already-released pointer */ }
    drag.current = { id: e.pointerId, x0: e.clientX, moved: false, over: shown, from: shown }
    lensRef.current?.style.setProperty('--lens-x', `${shown * w}px`)
    setLifted(true)
    // The lens glides to the finger (CSS transition), then tracks it frame by frame.
    requestAnimationFrame(() => { if (drag.current) drag.current.over = placeLens(e.clientX - left, w) })
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (Math.abs(e.clientX - d.x0) > 4) { d.moved = true; lensRef.current?.setAttribute('data-tracking', 'true') }
    const { left, w } = geom()
    const over = placeLens(e.clientX - left, w)
    if (over !== d.over) { d.over = over; haptic('tap') }
  }
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    const { left, w } = geom()
    const idx = Math.max(0, Math.min(tabs.length - 1, Math.floor((e.clientX - left) / w)))
    const lens = lensRef.current
    lens?.removeAttribute('data-tracking')
    lens?.style.setProperty('--lens-x', `${idx * w}px`)
    resetIcons()
    setTarget(idx)
    // Let the lens land on the tab before it sinks back into the pill: a tap that jumps tabs carries
    // it across while lifted (like the recording), a drag has already brought it there.
    window.setTimeout(() => setLifted(false), !d.moved && idx !== d.from ? 280 + 40 * Math.abs(idx - d.from) : 140)
    haptic()
    if (idx !== activeIndex) nav(tabs[idx].to)
  }
  const onCancel = () => { drag.current = null; lensRef.current?.removeAttribute('data-tracking'); resetIcons(); setLifted(false) }

  return (
    <>
      {active && loc.pathname !== '/session' && loc.pathname !== '/' && (
        <div className="fixed bottom-[max(6.25rem,calc(env(safe-area-inset-bottom)+5.25rem))] left-1/2 z-20 -translate-x-1/2">
          <NavLink to="/session" onClick={() => haptic()} className="pill-in aether-action flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <span className="live-dot" aria-hidden="true" />Session in progress
          </NavLink>
        </div>
      )}
      <div
        className="dock-wrap fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-30 h-[64px] w-[calc(100%-2rem)] max-w-[400px] -translate-x-1/2"
        data-min={min ? 'true' : 'false'}
      >
        <nav
          ref={barRef}
          className="liquid-dock glass-rim absolute inset-0 grid grid-cols-5 p-1"
          aria-label="Primary navigation"
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}
        >
          <div ref={lensRef} aria-hidden="true" data-lifted={lifted} className="liquid-lens" style={{ '--lens-x': `calc(${shown} * 100%)` } as React.CSSProperties}>
            <span className="lens-rim" />
          </div>
          {tabs.map(({ to, label, icon: Icon }, i) => (
            <button
              key={to}
              type="button"
              // Pointer taps are handled by the bar (so the lens can travel); this is the keyboard path.
              onClick={(e) => { if (e.detail === 0 && i !== activeIndex) { haptic(); nav(to) } }}
              aria-current={i === shown ? 'page' : undefined}
              aria-label={label}
              className={`dock-tab relative z-10 flex flex-col items-center justify-center gap-[3px] ${i === shown ? 'text-glow' : 'text-ice'}`}
            >
              <span ref={(el) => { iconRefs.current[i] = el }} className="dock-icon flex flex-col items-center gap-[3px]">
                <Icon className="size-[23px]" strokeWidth={i === shown ? 2.3 : 1.9} />
                <span className="text-[10px] font-semibold leading-none tracking-[0.1px]">{label}</span>
              </span>
              <HapticSwitch />
            </button>
          ))}
        </nav>
        {/* Collapsed: one glass circle with the logo; tapping it reopens the bar. */}
        <button
          type="button"
          onClick={() => { haptic(); setMin(false) }}
          aria-label="Show navigation"
          className="dock-mini glass-rim absolute left-1/2 top-1/2 grid size-[60px] place-items-center"
        >
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={36} height={36} draggable={false} />
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
