/** Shared shell in the Aether skin: page header, liquid dock, bars, chips. */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, ChevronLeft, Dumbbell, Hexagon, Orbit, Settings2, Shield } from 'lucide-react'
import { NAMES, dayTitle } from '../theme/names'
import { useStore } from '../store/store'
import { levelFor, totalXp } from '../engine/levels'
import { HapticSwitch, haptic } from '../lib/haptics'
import { reducedMotion } from '../lib/motion'
import { BelleCorner } from './BelleCorner'
import type { BelleSpot, Line } from '../avatar/lines'

/**
 * Standard page in the iOS pattern (HIG Toolbars): a navigation bar with the back button and actions,
 * a Large Title under it that scrolls with the content, and a compact centred title that fades into the
 * bar once the large one has scrolled away. `kicker`/`sub` render as a subtitle under the large title.
 */
export function Page({ title, sub, children, back, right, kicker, leading, belle, belleLines, belleSmall }: {
  title: string; sub?: string; children: ReactNode; back?: boolean; right?: ReactNode; kicker?: string; leading?: ReactNode
  /** Miss Belle stands at the right of the title row and talks with lines for this page. */
  belle?: BelleSpot; belleLines?: Line[]; belleSmall?: boolean
}) {
  const belleOn = useStore((s) => s.settings.belle !== false)
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
        <header className="aether-rise flex flex-wrap items-end gap-x-3 px-1">
          <div className="min-w-0 flex-1">
            <h1 ref={titleRef} className="text-3xl font-bold break-words">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-dim">{subtitle}</p>}
          </div>
          {belle && belleOn && <BelleCorner spot={belle} lines={belleLines} small={belleSmall} />}
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

/*
 * The iOS 26 Liquid Glass tab bar.
 *
 * Geometry, glass values and motion follow two MIT-licensed recreations that measured UIKit:
 *  - rdlabo-team/ionic-theme-ios26 (MIT, © 2021): 62 pt bar = 54 pt tabs + 4 pt padding, blur 6 px /
 *    saturate 180 % / brightness 1.05, the bar grows 3.8 % while pressed, the lens is the tab + 16 pt,
 *    velocity stretch min(16, 32·v²), and the release / tap curves below, sampled from UITabBarController.
 *  - konstaui/konsta (© 2021 Vladimir Kharlampidi): dark-glass rim shadows and the pill→lens crossfade.
 * iOS Safari cannot refract (no SVG backdrop filters, WebKit 245510), so the lens cuts a hole in the
 * bar's frost instead: the page shows through it clear, like the real clear-glass lens.
 */
// [time s, remaining fraction] — lens release after a drag (≈450 ms, small undershoot)
const RELEASE: [number, number][] = [[0, 1], [0.033, 0.85], [0.067, 0.58], [0.1, 0.31], [0.133, 0.15], [0.167, 0.055], [0.2, 0.01], [0.267, -0.01], [0.367, -0.004], [0.45, 0]]
// [time s, progress, extra width pt, extra height pt] — a tap: the blob travels, squashes, settles (800 ms)
const TAP: [number, number, number, number][] = [[0, 0, 0, 0], [0.033, 0.099, 4.15, 2.91], [0.067, 0.333, 13.81, 5.59], [0.1, 0.589, 23.77, 5.52], [0.133, 0.794, 29.84, 4.24], [0.167, 0.925, 29.01, 5.83], [0.2, 0.992, 26.85, 7.25], [0.233, 1.015, 25.83, 7.87], [0.267, 1.018, 20.43, 5.56], [0.3, 1.018, 12.87, 3.16], [0.367, 1.024, 1.3, 2.69], [0.433, 1.031, -3.98, 4.1], [0.5, 1.027, -5.05, 3.89], [0.6, 1.013, -2.95, 2.31], [0.7, 1.003, -0.74, 0.59], [0.8, 1, 0, 0]]
const PAD = 4
const FADE = 0.2 // the lens melts into the pill over the last 200 ms

/** Linear interpolation inside a sampled table at time t (seconds). */
function sample<T extends number[]>(table: T[], t: number): number[] {
  if (t <= table[0][0]) return table[0].slice(1)
  for (let i = 1; i < table.length; i++) {
    const [t1] = table[i]
    if (t <= t1) {
      const a = table[i - 1], b = table[i], f = (t - a[0]) / (t1 - a[0])
      return a.slice(1).map((v, k) => v + (b[k + 1] - v) * f)
    }
  }
  return table[table.length - 1].slice(1)
}

export function LiquidDock() {
  const loc = useLocation()
  const nav = useNavigate()
  const active = useStore((s) => s.active)
  // Detail pages light up the tab they belong to.
  const section = loc.pathname.startsWith('/exercise') ? '/library' : loc.pathname.startsWith('/history') ? '/palantir' : loc.pathname.startsWith('/codex') ? '/routines' : loc.pathname
  const activeIndex = Math.max(0, tabs.findIndex((t) => (t.to === '/' ? section === '/' : section.startsWith(t.to))))
  const [min, setMin] = useState(false)
  const [pressed, setPressed] = useState(false) // bar grown, pill hidden, lens in charge
  const [target, setTarget] = useState<number | null>(null)
  const shown = target ?? activeIndex
  const lastY = useRef(0)
  const innerRef = useRef<HTMLDivElement>(null)
  const glassRef = useRef<HTMLDivElement>(null)
  const lensRef = useRef<HTMLDivElement>(null)
  const iconRefs = useRef<(HTMLSpanElement | null)[]>([])
  const g = useRef({ id: -1, downX: 0, down: false, lifted: false, x: 0, sx: 1, sy: 1, stretch: 0, lastX: 0, lastT: 0, over: 0, from: 0, raf: 0, timer: 0 })

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
  useEffect(() => () => { cancelAnimationFrame(g.current.raf); clearTimeout(g.current.timer) }, [])

  /** Untransformed geometry of the bar (the pressed bar is scaled, so pointer x is mapped back). */
  const geom = () => {
    const el = innerRef.current!
    const W = el.offsetWidth, H = el.offsetHeight
    const r = el.getBoundingClientRect()
    const w = (W - PAD * 2) / tabs.length, h = H - PAD * 2
    const k = 1 + 14.14 / W
    return { W, w, h, toLocal: (cx: number) => ((cx - r.left) * W) / r.width - PAD, liftX: ((w + 16) / w) * k, liftY: ((h + 16) / h) * k }
  }
  /** One frame of the lens: position, stretch, the clear hole in the frost, icon magnification. */
  const draw = (x: number, sx: number, sy: number, opacity = 1) => {
    const { w, h } = geom()
    const lens = lensRef.current, glass = glassRef.current
    if (lens) { lens.style.transform = `translate3d(${x}px,0,0) scale(${sx},${sy})`; lens.style.opacity = String(opacity) }
    if (glass) {
      glass.style.setProperty('--hx', `${PAD + x + w / 2}px`)
      glass.style.setProperty('--hw', `${(w * sx) / 2 * opacity}px`)
      glass.style.setProperty('--hh', `${(h * sy) / 2 * opacity}px`)
    }
    iconRefs.current.forEach((el, i) => {
      if (!el) return
      const d = Math.abs(i * w - x) / w
      el.style.transform = opacity > 0.5 ? `scale(${1 + 0.16 * Math.max(0, 1 - d)})` : ''
    })
    const s = g.current
    s.x = x; s.sx = sx; s.sy = sy
  }
  const clampX = (x: number) => { const { w } = geom(); return Math.max(0, Math.min(x, w * (tabs.length - 1))) }

  /** Drive an animation frame by frame (rAF), so the frost hole and icons follow the lens exactly. */
  const run = (ms: number, frame: (t: number) => void, done: () => void) => {
    cancelAnimationFrame(g.current.raf)
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(ms, now - t0)
      frame(t / 1000)
      if (t < ms) g.current.raf = requestAnimationFrame(step)
      else done()
    }
    g.current.raf = requestAnimationFrame(step)
  }
  const finish = () => {
    const lens = lensRef.current
    if (lens) lens.style.opacity = '0'
    glassRef.current?.classList.remove('holed')
    iconRefs.current.forEach((el) => { if (el) el.style.transform = '' })
    setPressed(false)
  }

  const lift = () => {
    const s = g.current
    if (!s.down || s.lifted) return
    s.lifted = true
    const { w, liftX, liftY } = geom()
    glassRef.current?.classList.add('holed')
    // From the pill (scale 1 at the selected tab) up to the lens over the finger, 200 ms ease-out.
    const x0 = s.from * w, x1 = s.over * w
    run(200, (t) => { const f = 1 - Math.pow(1 - t / 0.2, 3); draw(x0 + (x1 - x0) * f, 1 + (liftX - 1) * f, 1 + (liftY - 1) * f) }, () => {})
  }

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || min) return
    const s = g.current
    try { innerRef.current!.setPointerCapture(e.pointerId) } catch { /* synthetic pointer */ }
    const { w, toLocal } = geom()
    cancelAnimationFrame(s.raf)
    s.id = e.pointerId; s.down = true; s.lifted = false; s.stretch = 0
    s.from = shown
    s.over = Math.max(0, Math.min(tabs.length - 1, Math.floor(toLocal(e.clientX) / w)))
    s.lastX = e.clientX; s.lastT = performance.now(); s.downX = e.clientX
    draw(s.from * w, 1, 1, 0)
    setPressed(true)
    // A hold becomes a drag lens; a quick tap plays UIKit's tap instead.
    clearTimeout(s.timer)
    if (!reducedMotion()) s.timer = window.setTimeout(lift, 130)
  }
  const onMove = (e: React.PointerEvent) => {
    const s = g.current
    if (!s.down || e.pointerId !== s.id) return
    const { w, toLocal, liftX, liftY } = geom()
    const now = performance.now()
    const v = (e.clientX - s.lastX) / Math.max(1, now - s.lastT) // px per ms
    s.lastX = e.clientX; s.lastT = now
    // A finger that slides more than a few px lifts the lens at once (no need to wait for the hold).
    if (!s.lifted) { if (Math.abs(e.clientX - s.downX) > 6 && !reducedMotion()) { clearTimeout(s.timer); lift() } return }
    cancelAnimationFrame(s.raf)
    const x = clampX(toLocal(e.clientX) - w / 2)
    // Fast moves stretch the lens sideways and flatten it; it relaxes when the finger slows.
    s.stretch = s.stretch * 0.7 + Math.min(16, 32 * v * v) * 0.3
    draw(x, liftX + s.stretch / w, liftY - s.stretch / 54)
    const over = Math.round(x / w)
    if (over !== s.over) { s.over = over; haptic('tap') }
  }
  const onUp = (e: React.PointerEvent) => {
    const s = g.current
    if (!s.down || e.pointerId !== s.id) return
    s.down = false
    clearTimeout(s.timer)
    const { w, h, toLocal } = geom()
    const idx = s.lifted ? Math.round(s.x / w) : Math.max(0, Math.min(tabs.length - 1, Math.floor(toLocal(e.clientX) / w)))
    const xT = idx * w
    setTarget(idx)
    haptic()
    if (idx !== activeIndex) nav(tabs[idx].to)
    if (reducedMotion()) { finish(); return }
    if (s.lifted) {
      // UIKit release: spring onto the tab with a small undershoot, then melt into the pill.
      const x0 = s.x, sx0 = s.sx, sy0 = s.sy
      run(450, (t) => {
        const [r] = sample(RELEASE, t)
        const op = t < 0.45 - FADE ? 1 : Math.max(0, (0.45 - t) / FADE)
        draw(xT + (x0 - xT) * r, 1 + (sx0 - 1) * r, 1 + (sy0 - 1) * r, op)
      }, () => finish())
    } else {
      // UIKit tap: the glass blob travels from the old tab, stretches wide, squashes and settles.
      const x0 = s.from * w
      const extra = Math.max(0, Math.abs(idx - s.from) - 1)
      glassRef.current?.classList.add('holed')
      run(800, (t) => {
        const [pos, we, he] = sample(TAP, t)
        const late = t >= 0.367
        const sx = 1 + (we * (late ? 1 + 0.75 * extra : 1)) / w
        const sy = 1 + (he * (late ? 1 + 0.5 * extra : 1)) / h
        const op = idx === s.from ? Math.max(0, 1 - t / 0.3) : t < 0.8 - FADE ? 1 : Math.max(0, (0.8 - t) / FADE)
        draw(x0 + (xT - x0) * pos, sx, sy, op)
      }, () => finish())
    }
  }
  const onCancel = () => {
    const s = g.current
    if (!s.down) return
    s.down = false
    clearTimeout(s.timer)
    cancelAnimationFrame(s.raf)
    const { w } = geom()
    draw(shown * w, 1, 1, 0)
    finish()
  }

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
        className="dock-wrap fixed bottom-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.8rem))] left-1/2 z-30 h-[62px] w-[calc(100%-2.625rem)] max-w-[420px] -translate-x-1/2"
        data-min={min ? 'true' : 'false'}
      >
        {/* One piece of glass for both states: collapsing clips the bar's frost into the centre circle. */}
        <div
          ref={innerRef}
          className="liquid-dock absolute inset-0"
          data-pressed={pressed}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}
        >
          <div ref={glassRef} className="dock-glass" aria-hidden="true" />
          <div className="dock-pill" aria-hidden="true" style={{ '--i': shown } as React.CSSProperties} />
          <nav className="absolute inset-1 grid grid-cols-5" aria-label="Primary navigation">
            {tabs.map(({ to, label, icon: Icon }, i) => (
              <button
                key={to}
                type="button"
                // Pointer taps are handled by the bar (so the glass can travel); this is the keyboard path.
                onClick={(e) => { if (e.detail === 0 && i !== activeIndex) { haptic(); nav(to) } }}
                aria-current={i === shown ? 'page' : undefined}
                aria-label={label}
                className="dock-tab relative flex flex-col items-center justify-center text-ice"
                // distance from the centre tab: the collapse folds tabs in from the edges, the expansion deals them out
                style={{ '--d': Math.abs(i - (tabs.length - 1) / 2) } as React.CSSProperties}
              >
                <span ref={(el) => { iconRefs.current[i] = el }} className="dock-icon flex flex-col items-center gap-[2px]">
                  <Icon className="size-[25px]" strokeWidth={i === shown ? 2.1 : 1.8} fill={i === shown ? 'currentColor' : 'none'} fillOpacity={i === shown ? 0.28 : 0} />
                  <span className={`text-[10px] leading-[12px] tracking-[0.1px] ${i === shown ? 'font-semibold' : 'font-medium'}`}>{label}</span>
                </span>
                <HapticSwitch />
              </button>
            ))}
          </nav>
          <div ref={lensRef} className="dock-lens" aria-hidden="true"><span className="lens-rim" /></div>
        </div>
        {/* Collapsed: one glass circle with the logo; tapping it reopens the bar. */}
        <button
          type="button"
          onClick={() => { haptic(); setMin(false) }}
          aria-label="Show navigation"
          className="dock-mini absolute left-1/2 top-1/2 grid size-[62px] place-items-center"
        >
          <img className="dock-logo relative" src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={38} height={38} draggable={false} />
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
