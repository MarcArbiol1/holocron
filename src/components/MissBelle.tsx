/**
 * Miss Belle, the Training Variance Authority's kettlebell. A puppet drawn on a canvas every frame
 * (src/avatar/rig.ts) and moved by springs (src/avatar/clips.ts). The canvas is larger than her
 * layout box so she can jump, wave and sparkle outside it without being clipped; it is capped at 2x
 * pixel density (no visible difference at this size, 2.25x less work than 3x). She pauses off-screen
 * and in hidden tabs; under Reduce Motion she stays put but still blinks, looks and talks.
 */
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { subscribe } from '../anim/ticker'
import { draw, type M } from '../avatar/rig'
import { Director, type ClipName } from '../avatar/clips'
import { reducedMotion } from '../lib/motion'

export interface BelleApi {
  play: (clip: ClipName) => void
  /** Start talking; `onText` receives the visible part of the line as it types out. */
  say: (text: string, onText?: (visible: string) => void) => void
  stop: () => void
}

// Her layout box in art pixels, and the extra room the canvas keeps around it (jumps, waves, sparkles).
const VIEW = { x: 110, y: 40, w: 780, h: 1060 }
const PAD = { top: 430, side: 280, bottom: 40 }

export function MissBelle({ height = 120, apiRef, onTap, className = '' }: { height?: number; apiRef?: Ref<BelleApi>; onTap?: () => void; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const director = useRef(new Director())
  const textCb = useRef<((v: string) => void) | undefined>(undefined)

  useImperativeHandle(apiRef, () => ({
    play: (clip) => director.current.play(clip, performance.now() / 1000),
    say: (text, onText) => { textCb.current = onText; director.current.say(text, performance.now() / 1000) },
    stop: () => director.current.stop(performance.now() / 1000),
  }), [])

  const scale = height / VIEW.h
  const cssW = (VIEW.w + PAD.side * 2) * scale
  const cssH = (VIEW.h + PAD.top + PAD.bottom) * scale

  useEffect(() => {
    const canvas = canvasRef.current, box = boxRef.current
    if (!canvas || !box) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const k = scale * dpr
    const baseM: M = [k, 0, 0, k, (PAD.side - VIEW.x) * k, (PAD.top - VIEW.y) * k]
    const d = director.current
    const still = reducedMotion()
    let visible = true
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '120px' }) : null
    io?.observe(box)
    let shown = -1
    const unsub = subscribe((now) => {
      if (!visible) return
      const pose = d.frame(now)
      // development only: a test can set window.__belleLog = [] to record the big one's poses frame by frame
      if (import.meta.env.DEV && height > 200) { const w = window as unknown as { __belleLog?: object[] }; if (w.__belleLog && w.__belleLog.length < 6000) w.__belleLog.push({ t: now, ...pose }) }
      if (still) { pose.hop = 0; pose.spin = 0; pose.lean = 0; pose.sx = 1; pose.sy = 1; pose.bob = 0; pose.tilt = 0; pose.bun = 0; pose.x = 0; pose.y = 0 }
      draw(ctx, pose, baseM, now / 1000)
      if (textCb.current && d.shown !== shown) { shown = d.shown; textCb.current(d.lineText.slice(0, shown)) }
    })
    return () => { unsub(); io?.disconnect() }
  }, [cssW, cssH, scale, height])

  return (
    <div
      ref={boxRef}
      className={`relative shrink-0 ${className}`}
      style={{ width: VIEW.w * scale, height }}
      onClick={onTap}
      role="img"
      aria-label="Miss Belle"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{ width: cssW, height: cssH, left: -PAD.side * scale, top: -PAD.top * scale }}
      />
    </div>
  )
}
