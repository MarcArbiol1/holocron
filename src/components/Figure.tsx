/**
 * Draws one exercise animation (or a still frame) from the stick-figure rig.
 *
 * Frames are not React renders: the SVG is rendered once, then every tick of the shared
 * ticker patches the attributes of the existing elements in place. A figure that is
 * scrolled out of view, in a hidden tab, or on a phone that asks for reduced motion
 * stays on its first frame.
 */
import { memo, useEffect, useRef, useState } from 'react'
import { getAnim } from '../anim/anims'
import { poseAt, renderShapes, VIEW, type Anim, type Shape } from '../anim/rig'
import { subscribe } from '../anim/ticker'

function ShapeEl({ s }: { s: Shape }) {
  const op = s.opacity
  switch (s.kind) {
    case 'line':
      return <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.stroke} strokeWidth={s.width} strokeLinecap="round" strokeDasharray={s.dash} opacity={op} />
    case 'circle':
      return <circle cx={s.cx} cy={s.cy} r={s.r} fill={s.fill ?? 'none'} stroke={s.stroke} strokeWidth={s.width} opacity={op} />
    case 'rect':
      return <rect x={s.x} y={s.y} width={s.w} height={s.h} fill={s.fill ?? 'none'} stroke={s.stroke} rx={s.rx} opacity={op} transform={s.angle ? `rotate(${s.angle} ${s.x + s.w / 2} ${s.y + s.h / 2})` : undefined} />
    case 'path':
      return <path d={s.d} stroke={s.stroke} strokeWidth={s.width} fill={s.fill ?? 'none'} strokeLinecap="round" strokeLinejoin="round" opacity={op} />
    case 'text':
      return <text x={s.x} y={s.y} fill={s.fill} fontSize={s.size} textAnchor="middle" fontFamily="sans-serif" opacity={op}>{s.text}</text>
  }
}

const num = (el: Element, k: string, v: number) => el.setAttribute(k, v.toFixed(2))

/** Write a frame's numbers onto the SVG children (child 0 is the background rect). */
function patch(svg: SVGSVGElement, shapes: Shape[]) {
  const kids = svg.children
  if (kids.length !== shapes.length + 1) return
  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i]
    const el = kids[i + 1]
    switch (s.kind) {
      case 'line': num(el, 'x1', s.x1); num(el, 'y1', s.y1); num(el, 'x2', s.x2); num(el, 'y2', s.y2); break
      case 'circle': num(el, 'cx', s.cx); num(el, 'cy', s.cy); num(el, 'r', s.r); break
      case 'rect':
        num(el, 'x', s.x); num(el, 'y', s.y); num(el, 'width', s.w); num(el, 'height', s.h)
        if (s.angle) el.setAttribute('transform', `rotate(${s.angle} ${(s.x + s.w / 2).toFixed(2)} ${(s.y + s.h / 2).toFixed(2)})`)
        break
      case 'path': el.setAttribute('d', s.d); break
      case 'text': num(el, 'x', s.x); num(el, 'y', s.y); break
    }
    if (s.opacity !== undefined) el.setAttribute('opacity', String(s.opacity))
  }
}

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  animId: string
  size?: number | string
  playing?: boolean
  className?: string
}

/** Runs the shared ticker for one SVG while `run` is true. */
function useFrames(svgRef: React.RefObject<SVGSVGElement | null>, anim: Anim | undefined, run: boolean) {
  useEffect(() => {
    const el = svgRef.current
    if (!run || !anim || !el) return
    const start = performance.now()
    let last = 0
    return subscribe((now) => {
      if (now - last < 12) return // at most ~60 frames a second, even on 120 Hz screens
      last = now
      patch(el, renderShapes(anim, poseAt(anim, now - start)))
    })
  }, [svgRef, anim, run])
}

export const Figure = memo(function Figure({ animId, size = 200, playing = true, className }: Props) {
  const anim = getAnim(animId)
  const svgRef = useRef<SVGSVGElement>(null)
  const [onScreen, setOnScreen] = useState(true)

  // Off-screen figures (below the fold on the session page) do not animate.
  useEffect(() => {
    const el = svgRef.current
    if (!playing || !el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: '120px' })
    io.observe(el)
    return () => io.disconnect()
  }, [playing])

  useFrames(svgRef, anim, playing && onScreen && !reducedMotion())

  if (!anim) {
    return (
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} width={size} height={size} className={className}>
        <rect width={VIEW} height={VIEW} rx={16} fill="#14181b" />
        <text x={VIEW / 2} y={VIEW / 2} fill="#64748b" fontSize={11} textAnchor="middle" fontFamily="sans-serif">animation coming</text>
      </svg>
    )
  }
  const shapes = renderShapes(anim, poseAt(anim, 0))
  return (
    <svg ref={svgRef} viewBox={`0 0 ${VIEW} ${VIEW}`} width={size} height={size} className={className} aria-label={`${animId} demonstration`}>
      <rect width={VIEW} height={VIEW} rx={16} fill="#14181b" />
      {shapes.map((s, i) => <ShapeEl key={i} s={s} />)}
    </svg>
  )
})
