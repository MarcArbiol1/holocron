/**
 * Miss Belle, the Training Variance Authority's kettlebell. A puppet (see src/avatar/rig.ts):
 * the art's layers as images, the face and the rubber-hose limbs drawn live, all patched in place
 * every frame by the shared ticker (no React renders while she moves). She pauses off-screen, in a
 * hidden tab, and holds still (but still blinks and talks) under Reduce Motion.
 */
import { useEffect, useId, useImperativeHandle, useRef, type Ref } from 'react'
import { subscribe } from '../anim/ticker'
import { BOX, COLORS, FACE, render, type Parts } from '../avatar/rig'
import { Director, type ClipName } from '../avatar/clips'
import { reducedMotion } from '../lib/motion'

export interface BelleApi {
  play: (clip: ClipName) => void
  /** Start talking; `onText` receives the visible part of the line as it types out. */
  say: (text: string, onText?: (visible: string) => void) => void
  stop: () => void
}

const base = `${import.meta.env.BASE_URL}belle/`
// The art box she is laid out in (art pixels). She can jump and wave outside it: overflow is visible.
const VIEW = { x: 110, y: 40, w: 780, h: 1060 }

export function MissBelle({ height = 120, apiRef, onTap, className = '' }: { height?: number; apiRef?: Ref<BelleApi>; onTap?: () => void; className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '') // ids must be unique if two Belles are on screen
  const director = useRef(new Director())
  const textCb = useRef<((v: string) => void) | undefined>(undefined)

  useImperativeHandle(apiRef, () => ({
    play: (clip) => director.current.play(clip, performance.now() / 1000),
    say: (text, onText) => { textCb.current = onText; director.current.say(text, performance.now() / 1000) },
    stop: () => director.current.stop(performance.now() / 1000),
  }), [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const q = <T extends Element>(id: string) => svg.querySelector(`[data-p="${id}"]`) as T
    const parts: Parts = {
      root: q('root'), body: q('body'), bun: q('bun'),
      armL: q('armL'), armR: q('armR'), legL: q('legL'), legR: q('legR'),
      gloveL: q('gloveL'), gloveR: q('gloveR'), shoeL: q('shoeL'), shoeR: q('shoeR'),
      eyeOpen: q('eyeOpen'), eyeHappy: q('eyeHappy'), eyeShut: q('eyeShut'), bicep: q('bicep'), pupilL: q('pupilL'), pupilR: q('pupilR'),
      lidL: q('lidL'), lidR: q('lidR'), browL: q('browL'), browR: q('browR'),
      mouthLine: q('mouthLine'), mouthOpen: q('mouthOpen'), mouthShape: q('mouthShape'), mouthClip: q('mouthClip'),
      tongue: q('tongue'), teeth: q('teeth'), blush: q('blush'), zzz: q('zzz'), sparkle: q('sparkle'),
    }
    const d = director.current
    let shown = -1
    let visible = true
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '80px' }) : null
    io?.observe(svg)
    const still = reducedMotion()
    const unsub = subscribe((now) => {
      if (!visible) return
      const pose = d.frame(now)
      if (still) { pose.y = 0; pose.spin = 0; pose.lean = 0; pose.sx = 1; pose.sy = 1; pose.bob = 0; pose.tilt = 0; pose.bun = 0 }
      render(parts, pose, now / 1000)
      if (textCb.current && d.shown !== shown) {
        shown = d.shown
        textCb.current(d.lineText.slice(0, shown))
      }
    })
    return () => { unsub(); io?.disconnect() }
  }, [])

  const { CREAM, INK, BLUSH, SKIN } = COLORS
  const { EYE, PUPIL, MOUTH } = FACE
  const scale = height / VIEW.h
  const outline = 2.4 / scale // a 2.4 px cream sticker edge at any size
  // `placed`: the rig positions it every frame with a transform (gloves, sneakers), so it starts at 0,0
  const img = (p: string, b: readonly number[], key: string, placed = false) => (
    <image data-p={key} href={`${base}${p}.png`} x={placed ? 0 : b[0]} y={placed ? 0 : b[1]} width={b[2]} height={b[3]} preserveAspectRatio="none" />
  )
  const eye = (e: [number, number], side: 'L' | 'R') => (
    <g>
      <clipPath id={`${uid}-eye-${side}`}><ellipse cx={e[0]} cy={e[1]} rx={EYE.rx} ry={EYE.ry} /></clipPath>
      <ellipse cx={e[0]} cy={e[1]} rx={EYE.rx} ry={EYE.ry} fill={CREAM} />
      <g clipPath={`url(#${uid}-eye-${side})`}>
        <g data-p={`pupil${side}`}>
          {/* centred: by default she looks straight at you */}
          <ellipse cx={e[0]} cy={e[1] + 4} rx={PUPIL.rx} ry={PUPIL.ry} fill={INK} />
          {/* the pie-cut highlight of 1930s cartoon eyes */}
          <path d={`M${e[0] + 4} ${e[1] - 8}L${e[0] + 36} ${e[1] - 32}L${e[0] + 36} ${e[1] + 2}Z`} fill={CREAM} />
        </g>
        <rect data-p={`lid${side}`} x={e[0] - EYE.rx - 4} y={e[1] - EYE.ry - 4} width={EYE.rx * 2 + 8} height={0} fill={SKIN} />
      </g>
      <ellipse cx={e[0]} cy={e[1]} rx={EYE.rx} ry={EYE.ry} fill="none" stroke={INK} strokeWidth={7} />
    </g>
  )

  return (
    <svg
      ref={svgRef}
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      width={(VIEW.w / VIEW.h) * height}
      height={height}
      className={`overflow-visible ${className}`}
      onClick={onTap}
      role="img"
      aria-label="Miss Belle"
    >
      <defs>
        {/* Cream sticker outline so the dark kettlebell reads on the black UI. */}
        <filter id={`${uid}-outline`} x="-40%" y="-60%" width="180%" height="200%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={outline} result="grow" />
          <feFlood floodColor={CREAM} result="cream" />
          <feComposite in="cream" in2="grow" operator="in" result="edge" />
          <feMerge><feMergeNode in="edge" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <clipPath id={`${uid}-mouth`}><path data-p="mouthClip" /></clipPath>
        <path id={`${uid}-star`} d="M0 -26 Q4 -4 26 0 Q4 4 0 26 Q-4 4 -26 0 Q-4 -4 0 -26Z" />
      </defs>
      <g data-p="root" filter={`url(#${uid}-outline)`}>
        {/* legs and sneakers */}
        <path data-p="legL" fill="none" stroke={INK} strokeWidth={46} strokeLinecap="round" />
        <path data-p="legR" fill="none" stroke={INK} strokeWidth={46} strokeLinecap="round" />
        {img('shoe-l', BOX.shoeL, 'shoeL', true)}
        {img('shoe-r', BOX.shoeR, 'shoeR', true)}
        {/* arms come from behind the body */}
        <path data-p="armL" fill="none" stroke={INK} strokeWidth={38} strokeLinecap="round" />
        <path data-p="armR" fill="none" stroke={INK} strokeWidth={38} strokeLinecap="round" />
        <g data-p="bicep" transform="scale(0)"><ellipse rx={50} ry={40} fill={INK} /></g>
        <g data-p="body">
          {img('bun', BOX.bun, 'bun')}
          {img('ball', BOX.ball, 'ball')}
          {/* face */}
          <g data-p="blush" fill={BLUSH}>
            <circle cx={322} cy={556} r={33} />
            <circle cx={666} cy={560} r={33} />
          </g>
          <g data-p="eyeOpen">{eye(EYE.L, 'L')}{eye(EYE.R, 'R')}</g>
          <g data-p="eyeHappy" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" opacity={0}>
            <path d={`M${EYE.L[0] - 40} ${EYE.L[1] + 14}Q${EYE.L[0]} ${EYE.L[1] - 40} ${EYE.L[0] + 40} ${EYE.L[1] + 14}`} />
            <path d={`M${EYE.R[0] - 40} ${EYE.R[1] + 14}Q${EYE.R[0]} ${EYE.R[1] - 40} ${EYE.R[0] + 40} ${EYE.R[1] + 14}`} />
          </g>
          <g data-p="eyeShut" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" opacity={0}>
            <path d={`M${EYE.L[0] - 42} ${EYE.L[1] + 4}Q${EYE.L[0]} ${EYE.L[1] + 40} ${EYE.L[0] + 42} ${EYE.L[1] + 4}`} />
            <path d={`M${EYE.R[0] - 42} ${EYE.R[1] + 4}Q${EYE.R[0]} ${EYE.R[1] + 40} ${EYE.R[0] + 42} ${EYE.R[1] + 4}`} />
          </g>
          <path data-p="browL" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <path data-p="browR" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <path d="M478 548Q492 532 506 548" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path data-p="mouthLine" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <g data-p="mouthOpen" opacity={0}>
            <path data-p="mouthShape" fill={INK} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <g clipPath={`url(#${uid}-mouth)`}>
              <rect data-p="teeth" x={MOUTH[0] - 90} y={MOUTH[1] - 40} width={180} height={10} fill={CREAM} />
              <ellipse data-p="tongue" cx={MOUTH[0] + 12} cy={MOUTH[1] + 50} rx={38} ry={20} fill={BLUSH} />
            </g>
          </g>
        </g>
        {img('glove-l', BOX.gloveL, 'gloveL', true)}
        {img('glove-r', BOX.gloveR, 'gloveR', true)}
      </g>
      {/* effects (no outline) */}
      <g data-p="zzz" opacity={0} fill={CREAM} fontWeight={800} fontSize={90} fontFamily="-apple-system, system-ui, sans-serif">
        <text>z</text><text>z</text><text>Z</text>
      </g>
      <g data-p="sparkle" opacity={0} fill="#5cdcce">
        {Array.from({ length: 7 }, (_, i) => <use key={i} href={`#${uid}-star`} />)}
      </g>
    </svg>
  )
}
