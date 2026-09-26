/**
 * Small motion helpers shared by the pages. Everything here moves transform/opacity only, or runs a
 * short rAF loop that writes text, and every helper steps aside when the phone asks for reduced motion.
 */
import { useEffect, useRef, useState } from 'react'

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** How long sheets take to leave (matches the `*-out` keyframes in index.css). */
export const EXIT_MS = 200

/**
 * Lets a component play its exit animation before the parent unmounts it:
 * `leave(fn)` flags `leaving` (CSS switches to the out animation) and calls `fn` once it has played.
 */
export function useLeave() {
  const [leaving, setLeaving] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const leave = (fn: () => void) => {
    if (leaving) return
    if (reducedMotion()) { fn(); return }
    setLeaving(true)
    timer.current = setTimeout(fn, EXIT_MS)
  }
  return { leaving, leave }
}

/** Ease-out quint: fast start, long soft landing. The curve used for counters. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 5)

/**
 * A number that rolls from `from` to `to` when it first shows up and whenever `to` changes.
 * Integers only; the text is the only thing that changes, so it costs one text node per frame.
 */
export function useCountUp(to: number, { from = 0, ms = 900, delay = 0 }: { from?: number; ms?: number; delay?: number } = {}) {
  const [v, setV] = useState(() => (reducedMotion() ? to : from))
  const shown = useRef(v)
  useEffect(() => {
    if (reducedMotion()) { shown.current = to; setV(to); return }
    const start0 = shown.current
    if (start0 === to) return
    let raf = 0
    let t0 = 0
    const step = (now: number) => {
      if (!t0) t0 = now + delay
      const t = Math.min(1, Math.max(0, (now - t0) / ms))
      const next = Math.round(start0 + (to - start0) * easeOut(t))
      shown.current = next
      setV(next)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to, ms, delay])
  return v
}
