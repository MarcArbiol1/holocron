/**
 * Miss Belle's puppet rig.
 *
 * The art is a Gemini drawing on a green screen, cut into layers (public/belle/*.png): bun, ball,
 * two gloves, two sneakers. Everything else is drawn here every frame: the face (eyes, pupils,
 * lids, brows, nose, blush, a mouth that can talk) and the rubber-hose arms and legs, which are
 * curves between a shoulder/hip and a glove/sneaker. All coordinates are in the original art's
 * pixels (928 × 1140); the images are stored at half size and stretched back.
 *
 * A Pose is a flat bag of numbers. Clips (clips.ts) write into it; `render` turns it into SVG
 * attributes. Nothing here touches React.
 */

export type V = [number, number]

/** The ball (the kettlebell's round body) as a circle in art pixels. */
export const BALL = { cx: 503, cy: 568, r: 255 }
const FEET_Y = 1080 // the floor line, for whole-body squash and lean

/** Where each image sits in art pixels: [x, y, w, h]. */
export const BOX = {
  bun: [240, 60, 530, 388],
  ball: [242, 307, 523, 523],
  gloveL: [140, 736, 158, 200],
  gloveR: [693, 739, 159, 200],
  shoeL: [222, 912, 244, 172],
  shoeR: [543, 916, 233, 170],
} as const

/** Rest positions of the joints, measured on the drawing. */
export const REST = {
  shoulderL: [262, 615] as V, shoulderR: [748, 618] as V,
  handL: [206, 740] as V, handR: [792, 740] as V,
  hipL: [410, 808] as V, hipR: [580, 808] as V,
  footL: [388, 914] as V, footR: [609, 916] as V,
  bunPivot: [503, 330] as V,
}
const ARM_LEN = Math.hypot(REST.handL[0] - REST.shoulderL[0], REST.handL[1] - REST.shoulderL[1]) * 1.08
const LEG_LEN = Math.hypot(REST.footL[0] - REST.hipL[0], REST.footL[1] - REST.hipL[1]) * 1.05

export interface Pose {
  // whole character, around the feet
  x: number; y: number; lean: number; spin: number; sx: number; sy: number; alpha: number
  // upper body (ball + bun + face + arms), relative to the feet
  bob: number; tilt: number; bsx: number; bsy: number
  bun: number
  // hands: offset from rest in body space, plus extra glove rotation (deg)
  hl: V; hr: V; hlr: number; hrr: number
  /** 0..1: how much hlr/hrr are absolute glove angles instead of extra turn on top of the arm's direction */
  hlLock: number; hrLock: number
  /** a little bicep bump on the right arm (flex), 0..1 */
  bicep: number
  /** which way each arm bows (1 = natural; −1 = elbow pushed the other way, for a flex) */
  bendL: number; bendR: number
  // feet: offset from rest, plus rotation (deg)
  fl: V; fr: V; flr: number; frr: number
  // face
  lookX: number; lookY: number; blink: number; squint: number
  browL: number; browR: number; browTilt: number
  mouthOpen: number; smile: number; mouthW: number; smirk: number; tongue: number
  blush: number
  // effects
  zzz: number; sparkle: number
}

export const neutral = (): Pose => ({
  x: 0, y: 0, lean: 0, spin: 0, sx: 1, sy: 1, alpha: 1,
  bob: 0, tilt: 0, bsx: 1, bsy: 1, bun: 0,
  hl: [0, 0], hr: [0, 0], hlr: 0, hrr: 0, hlLock: 0, hrLock: 0, bicep: 0, bendL: 1, bendR: 1,
  fl: [0, 0], fr: [0, 0], flr: 0, frr: 0,
  lookX: 0, lookY: 0, blink: 0, squint: 0,
  browL: 0, browR: 0, browTilt: 0,
  mouthOpen: 0, smile: 0.7, mouthW: 1, smirk: 0, tongue: 1,
  blush: 1, zzz: 0, sparkle: 0,
})

/** Blend two poses: a + (b − a)·w for every number. */
export function lerpPose(a: Pose, b: Pose, w: number): Pose {
  const out = { ...a } as Record<string, unknown>
  for (const k of Object.keys(a) as (keyof Pose)[]) {
    const va = a[k], vb = b[k]
    if (Array.isArray(va)) out[k] = [va[0] + ((vb as V)[0] - va[0]) * w, va[1] + ((vb as V)[1] - va[1]) * w]
    else out[k] = (va as number) + ((vb as number) - (va as number)) * w
  }
  return out as unknown as Pose
}

// ---------- tiny 2D affine maths (a b c d e f, like SVG matrix) ----------
type M = [number, number, number, number, number, number]
const mul = (m: M, n: M): M => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]]
const T = (x: number, y: number): M => [1, 0, 0, 1, x, y]
const S = (sx: number, sy: number, ox: number, oy: number): M => mul(mul(T(ox, oy), [sx, 0, 0, sy, 0, 0]), T(-ox, -oy))
const Rd = (deg: number, ox: number, oy: number): M => { const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return mul(mul(T(ox, oy), [c, s, -s, c, 0, 0]), T(-ox, -oy)) }
const ap = (m: M, p: V): V => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]]
const mstr = (m: M) => `matrix(${m.map((v) => v.toFixed(4)).join(' ')})`
const f = (n: number) => n.toFixed(1)

/** A rubber-hose limb from `a` to `b`: a quadratic curve that bows outward when the limb is "shorter" than its length. */
function hose(a: V, b: V, len: number, side: number): { d: string; ctrl: V } {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const dist = Math.hypot(dx, dy) || 1
  const sag = Math.sqrt(Math.max(0, len * len - dist * dist)) * 0.55 + 6
  const nx = (-dy / dist) * side, ny = (dx / dist) * side
  const ctrl: V = [(a[0] + b[0]) / 2 + nx * sag, (a[1] + b[1]) / 2 + ny * sag]
  return { d: `M${f(a[0])} ${f(a[1])}Q${f(ctrl[0])} ${f(ctrl[1])} ${f(b[0])} ${f(b[1])}`, ctrl }
}
const angle = (from: V, to: V) => (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI

// Glove/sneaker anchor points inside their images (art pixels from the image's top-left).
const GLOVE_AT = { L: [REST.handL[0] - BOX.gloveL[0], REST.handL[1] - BOX.gloveL[1]] as V, R: [REST.handR[0] - BOX.gloveR[0], REST.handR[1] - BOX.gloveR[1]] as V }
const SHOE_AT = { L: [REST.footL[0] - BOX.shoeL[0], REST.footL[1] - BOX.shoeL[1]] as V, R: [REST.footR[0] - BOX.shoeR[0], REST.footR[1] - BOX.shoeR[1]] as V }
// The direction each limb ends in at rest, so a glove only turns by how much the arm turned.
const REST_ARM_L = angle(hose(REST.shoulderL, REST.handL, ARM_LEN, 1).ctrl, REST.handL)
const REST_ARM_R = angle(hose(REST.shoulderR, REST.handR, ARM_LEN, -1).ctrl, REST.handR)

// ---------- the face, in ball space ----------
const EYE = { L: [398, 470] as V, R: [592, 472] as V, rx: 52, ry: 74 }
const PUPIL = { rx: 30, ry: 46 }
const MOUTH: V = [494, 622]
const CREAM = '#f2ead8', INK = '#141312', BLUSH = '#d9644e', SKIN = '#2b2926'

function brow(e: V, raise: number, tilt: number, side: -1 | 1): string {
  const y = e[1] - 100 - raise * 24
  const inner = side === -1 ? e[0] + 36 : e[0] - 36
  const outer = side === -1 ? e[0] - 40 : e[0] + 40
  const yi = y + tilt * 16, yo = y - tilt * 8
  return `M${f(outer)} ${f(yo)}Q${f(e[0])} ${f(y - 18)} ${f(inner)} ${f(yi)}`
}

function mouthPath(p: Pose): { open: string; line: string; corners: [V, V]; bottom: number } {
  const w = 72 * p.mouthW
  const [cx, cy] = MOUTH
  const lift = p.smile * 20
  const L: V = [cx - w, cy - lift - p.smirk * 14]
  const R: V = [cx + w, cy - lift + p.smirk * 10]
  const top = cy - lift * 0.15 + (p.smile < 0 ? -p.smile * 10 : 0)
  const bottom = cy + 12 + p.mouthOpen * 92 + Math.max(0, p.smile) * 20
  const open = `M${f(L[0])} ${f(L[1])}Q${f(cx)} ${f(top)} ${f(R[0])} ${f(R[1])}Q${f(cx)} ${f(bottom)} ${f(L[0])} ${f(L[1])}Z`
  const line = `M${f(L[0])} ${f(L[1])}Q${f(cx)} ${f(cy + p.smile * 34)} ${f(R[0])} ${f(R[1])}`
  return { open, line, corners: [L, R], bottom }
}

/** The SVG elements the renderer writes into (created once by the component). */
export interface Parts {
  root: SVGGElement
  body: SVGGElement
  bun: SVGImageElement
  armL: SVGPathElement; armR: SVGPathElement
  legL: SVGPathElement; legR: SVGPathElement
  gloveL: SVGImageElement; gloveR: SVGImageElement
  shoeL: SVGImageElement; shoeR: SVGImageElement
  eyeOpen: SVGGElement; eyeHappy: SVGGElement; eyeShut: SVGGElement
  bicep: SVGGElement
  pupilL: SVGGElement; pupilR: SVGGElement
  lidL: SVGRectElement; lidR: SVGRectElement
  browL: SVGPathElement; browR: SVGPathElement
  mouthLine: SVGPathElement; mouthOpen: SVGGElement; mouthShape: SVGPathElement; mouthClip: SVGPathElement
  tongue: SVGEllipseElement; teeth: SVGRectElement
  blush: SVGGElement
  zzz: SVGGElement; sparkle: SVGGElement
}

/** Write one frame. `t` (seconds) only drives the decorative effects (z's drifting, sparkles twinkling). */
export function render(parts: Parts, p: Pose, t: number) {
  const set = (el: Element, k: string, v: string) => el.setAttribute(k, v)
  // whole body: position, lean and squash around the feet
  // spin turns her around her middle (a somersault), lean tips her over her feet
  const root = mul(mul(mul(T(p.x, p.y), Rd(p.spin, BALL.cx, 700)), Rd(p.lean, 500, FEET_Y)), S(p.sx, p.sy, 500, FEET_Y))
  set(parts.root, 'transform', mstr(root))
  set(parts.root, 'opacity', p.alpha.toFixed(3))
  // upper body
  const body = mul(mul(T(0, p.bob), Rd(p.tilt, BALL.cx, BALL.cy)), S(p.bsx, p.bsy, BALL.cx, BALL.cy + BALL.r))
  set(parts.body, 'transform', mstr(body))
  set(parts.bun, 'transform', `rotate(${f(p.bun)} ${REST.bunPivot[0]} ${REST.bunPivot[1]})`)

  // arms: shoulders ride with the body, hands are placed in body space
  const sL = ap(body, REST.shoulderL), sR = ap(body, REST.shoulderR)
  const hL = ap(body, [REST.handL[0] + p.hl[0], REST.handL[1] + p.hl[1]])
  const hR = ap(body, [REST.handR[0] + p.hr[0], REST.handR[1] + p.hr[1]])
  const aL = hose(sL, hL, ARM_LEN, p.bendL >= 0 ? 1 : -1), aR = hose(sR, hR, ARM_LEN, p.bendR >= 0 ? -1 : 1)
  set(parts.armL, 'd', aL.d); set(parts.armR, 'd', aR.d)
  // the bicep sits on the outside of the arm's bend
  const mx = (sR[0] + 2 * aR.ctrl[0] + hR[0]) / 4, my = (sR[1] + 2 * aR.ctrl[1] + hR[1]) / 4 // the curve's middle
  const ox = aR.ctrl[0] - mx, oy = aR.ctrl[1] - my, ol = Math.hypot(ox, oy) || 1
  set(parts.bicep, 'transform', `translate(${f(mx + (ox / ol) * 16)} ${f(my + (oy / ol) * 16)}) scale(${(p.bicep).toFixed(3)})`)
  const autoL = angle(aL.ctrl, hL) - REST_ARM_L, autoR = angle(aR.ctrl, hR) - REST_ARM_R
  const gl = (autoL + p.hlr) * (1 - p.hlLock) + p.hlr * p.hlLock
  const gr = (autoR + p.hrr) * (1 - p.hrLock) + p.hrr * p.hrLock
  set(parts.gloveL, 'transform', `translate(${f(hL[0] - GLOVE_AT.L[0])} ${f(hL[1] - GLOVE_AT.L[1])}) rotate(${f(gl)} ${f(GLOVE_AT.L[0])} ${f(GLOVE_AT.L[1])})`)
  set(parts.gloveR, 'transform', `translate(${f(hR[0] - GLOVE_AT.R[0])} ${f(hR[1] - GLOVE_AT.R[1])}) rotate(${f(gr)} ${f(GLOVE_AT.R[0])} ${f(GLOVE_AT.R[1])})`)

  // legs: hips ride with the body (but not its squash), feet stay on the floor unless a clip lifts them
  const hipM = mul(T(0, p.bob * 0.6), Rd(p.tilt * 0.4, BALL.cx, BALL.cy))
  const pL = ap(hipM, REST.hipL), pR = ap(hipM, REST.hipR)
  const fL: V = [REST.footL[0] + p.fl[0], REST.footL[1] + p.fl[1]]
  const fR: V = [REST.footR[0] + p.fr[0], REST.footR[1] + p.fr[1]]
  set(parts.legL, 'd', hose(pL, fL, LEG_LEN, 1).d); set(parts.legR, 'd', hose(pR, fR, LEG_LEN, -1).d)
  set(parts.shoeL, 'transform', `translate(${f(fL[0] - SHOE_AT.L[0])} ${f(fL[1] - SHOE_AT.L[1])}) rotate(${f(p.flr)} ${f(SHOE_AT.L[0] - 60)} ${f(SHOE_AT.L[1] + 150)})`)
  set(parts.shoeR, 'transform', `translate(${f(fR[0] - SHOE_AT.R[0])} ${f(fR[1] - SHOE_AT.R[1])}) rotate(${f(p.frr)} ${f(SHOE_AT.R[0] - 40)} ${f(SHOE_AT.R[1] + 150)})`)

  // face
  // fully closed lids become a curved line (sleeping) instead of a dark eye socket
  const shut = Math.max(0, Math.min(1, (p.blink - 0.82) / 0.18)) * (1 - p.squint)
  set(parts.eyeOpen, 'opacity', ((1 - p.squint) * (1 - shut)).toFixed(3))
  set(parts.eyeShut, 'opacity', shut.toFixed(3))
  set(parts.eyeHappy, 'opacity', p.squint.toFixed(3))
  const lx = p.lookX * 16, ly = p.lookY * 20
  set(parts.pupilL, 'transform', `translate(${f(lx)} ${f(ly)})`)
  set(parts.pupilR, 'transform', `translate(${f(lx)} ${f(ly)})`)
  const lid = Math.max(0, Math.min(1, p.blink)) * (EYE.ry * 2 + 8)
  set(parts.lidL, 'height', f(lid)); set(parts.lidR, 'height', f(lid))
  set(parts.browL, 'd', brow(EYE.L, p.browL, p.browTilt, -1))
  set(parts.browR, 'd', brow(EYE.R, p.browR, p.browTilt, 1))
  const m = mouthPath(p)
  const isOpen = p.mouthOpen > 0.06
  set(parts.mouthLine, 'd', m.line)
  set(parts.mouthLine, 'opacity', isOpen ? '0' : '1')
  set(parts.mouthOpen, 'opacity', isOpen ? '1' : '0')
  set(parts.mouthShape, 'd', m.open); set(parts.mouthClip, 'd', m.open)
  set(parts.tongue, 'cy', f(m.bottom - 6))
  set(parts.tongue, 'ry', f(10 + 26 * Math.min(1, p.mouthOpen) * p.tongue))
  set(parts.teeth, 'height', f(6 + 16 * Math.min(1, p.mouthOpen)))
  set(parts.blush, 'opacity', (p.blush * 0.9).toFixed(3))

  // effects
  set(parts.zzz, 'opacity', p.zzz.toFixed(3))
  if (p.zzz > 0.01) {
    Array.from(parts.zzz.children).forEach((z, i) => {
      const ph = (t * 0.45 + i / 3) % 1
      set(z, 'transform', `translate(${f(640 + ph * 150 + i * 10)} ${f(300 - ph * 260)}) scale(${(0.6 + ph * 0.8).toFixed(2)})`)
      set(z, 'opacity', (Math.sin(ph * Math.PI)).toFixed(2))
    })
  }
  set(parts.sparkle, 'opacity', p.sparkle.toFixed(3))
  if (p.sparkle > 0.01) {
    Array.from(parts.sparkle.children).forEach((s, i) => {
      const a = (i / parts.sparkle.children.length) * Math.PI * 2 + t * 0.6
      const r = 380 + Math.sin(t * 3 + i) * 30
      const sc = 0.6 + 0.5 * Math.abs(Math.sin(t * 5 + i * 1.7))
      set(s, 'transform', `translate(${f(BALL.cx + Math.cos(a) * r)} ${f(BALL.cy - 60 + Math.sin(a) * r * 0.75)}) scale(${sc.toFixed(2)}) rotate(${f(t * 90 + i * 30)})`)
    })
  }
}

export const COLORS = { CREAM, INK, BLUSH, SKIN }
export const FACE = { EYE, PUPIL, MOUTH }
