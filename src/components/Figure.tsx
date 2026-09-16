/** Draws one exercise animation (or a still frame) from the stick-figure rig. */
import { useEffect, useRef, useState } from 'react'
import { getAnim } from '../anim/anims'
import { poseAt, renderShapes, VIEW, type Shape } from '../anim/rig'

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

interface Props {
  animId: string
  size?: number | string
  playing?: boolean
  className?: string
  /** Frames per second cap, to keep many figures cheap. */
  fps?: number
}

export function Figure({ animId, size = 200, playing = true, className, fps = 30 }: Props) {
  const anim = getAnim(animId)
  const [t, setT] = useState(0)
  const start = useRef<number>(0)
  const last = useRef<number>(0)

  useEffect(() => {
    if (!playing || !anim) return
    let raf = 0
    start.current = performance.now()
    const loop = (now: number) => {
      if (now - last.current >= 1000 / fps) {
        last.current = now
        setT(now - start.current)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, anim, fps])

  if (!anim) {
    return (
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} width={size} height={size} className={className}>
        <rect width={VIEW} height={VIEW} rx={16} fill="#191c25" />
        <text x={VIEW / 2} y={VIEW / 2} fill="#64748b" fontSize={11} textAnchor="middle" fontFamily="sans-serif">animation coming</text>
      </svg>
    )
  }
  const shapes = renderShapes(anim, poseAt(anim, playing ? t : 0))
  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} width={size} height={size} className={className} aria-label={`${animId} demonstration`}>
      <rect width={VIEW} height={VIEW} rx={16} fill="#191c25" />
      {shapes.map((s, i) => <ShapeEl key={i} s={s} />)}
    </svg>
  )
}
