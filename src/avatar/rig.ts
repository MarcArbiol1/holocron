/**
 * Miss Belle's puppet rig, drawn on a <canvas>.
 *
 * Why canvas: on iOS Safari a 2D canvas is drawn by the GPU process, while SVG filters run on the CPU
 * every frame (the old cream-outline filter alone cost an estimated 10-40 ms a frame) and every SVG
 * attribute change re-lays-out and repaints the whole drawing. Here a frame is ~12 image draws and
 * ~15 strokes, and the sticker outline is a first pass of pre-grown cream silhouettes underneath.
 *
 * The art is a Gemini drawing on a green screen, cut into layers (public/belle/*.png, plus a cream
 * "-edge" silhouette of each grown by 16 art pixels). The face and the rubber-hose limbs are drawn
 * here. All coordinates are in the original art's pixels (928 × 1140).
 */

import { Limb } from './limb'

export type V = [number, number]

/** The ball (the kettlebell's round body) as a circle in art pixels. */
export const BALL = { cx: 503, cy: 568, r: 255 }
const FEET_Y = 1080 // the floor line, for whole-body squash and lean
const EDGE = 16 // art pixels of cream outline (matches the -edge images)

/** Where each image sits in art pixels: [x, y, w, h] (images include their padding for the outline). */
export const BOX = {
  ball: [224, 289, 559, 559],
  bun: [222, 42, 566, 424],
  gloveL: [122, 718, 194, 236],
  gloveR: [675, 721, 195, 236],
  shoeL: [204, 894, 280, 208],
  shoeR: [525, 898, 269, 206],
} as const
const FILES = { ball: 'ball', bun: 'bun', gloveL: 'glove-l', gloveR: 'glove-r', shoeL: 'shoe-l', shoeR: 'shoe-r' } as const
type PartName = keyof typeof BOX

/** Rest positions of the joints, measured on the drawing. */
export const REST = {
  shoulderL: [262, 615] as V, shoulderR: [748, 618] as V,
  handL: [206, 740] as V, handR: [792, 740] as V,
  hipL: [410, 808] as V, hipR: [580, 808] as V,
  footL: [388, 914] as V, footR: [609, 916] as V,
  bunPivot: [503, 330] as V,
}

export interface Pose {
  // whole character, around the feet
  x: number; y: number; hop: number; lean: number; spin: number; sx: number; sy: number; alpha: number; shrink: number
  // upper body (ball + bun + face + arms), relative to the feet
  bob: number; tilt: number; bsx: number; bsy: number
  bun: number
  // hands: offset from rest in body space, plus extra glove rotation (deg)
  hl: V; hr: V; hlr: number; hrr: number
  /** 0..1: how much hlr/hrr are absolute glove angles instead of extra turn on top of the arm's direction */
  hlLock: number; hrLock: number
  /** a little bicep bump on the right arm (flex), 0..1 */
  bicep: number
  /** >0.5: that glove tucks behind the ball (hand on hip) */
  tuckL: number; tuckR: number
  // feet: offset from rest, plus rotation (deg)
  fl: V; fr: V; flr: number; frr: number
  // face
  lookX: number; lookY: number; blink: number; squint: number
  browL: number; browR: number; browTilt: number
  mouthOpen: number; smile: number; mouthW: number; smirk: number; tongue: number
  blush: number
  // targets used by moves (squash amounts before volume preservation)
  squash: number; bodySquash: number
  // effects
  zzz: number; sparkle: number
}

export const neutral = (): Pose => ({
  x: 0, y: 0, hop: 0, lean: 0, spin: 0, sx: 1, sy: 1, alpha: 1, shrink: 0,
  bob: 0, tilt: 0, bsx: 1, bsy: 1, bun: 0,
  hl: [0, 0], hr: [0, 0], hlr: 0, hrr: 0, hlLock: 0, hrLock: 0, bicep: 0, tuckL: 0, tuckR: 0,
  fl: [0, 0], fr: [0, 0], flr: 0, frr: 0,
  lookX: 0, lookY: 0, blink: 0, squint: 0,
  browL: 0, browR: 0, browTilt: 0,
  mouthOpen: 0, smile: 0.7, mouthW: 1, smirk: 0, tongue: 1,
  blush: 1, squash: 0, bodySquash: 0, zzz: 0, sparkle: 0,
})

// ---------- 2D affine maths (a b c d e f, as canvas setTransform takes them) ----------
export type M = [number, number, number, number, number, number]
const mul = (m: M, n: M): M => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]]
const T = (x: number, y: number): M => [1, 0, 0, 1, x, y]
const S = (sx: number, sy: number, ox: number, oy: number): M => mul(mul(T(ox, oy), [sx, 0, 0, sy, 0, 0]), T(-ox, -oy))
const Rd = (deg: number, ox: number, oy: number): M => { const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return mul(mul(T(ox, oy), [c, s, -s, c, 0, 0]), T(-ox, -oy)) }
const ap = (m: M, p: V): V => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]]

// Glove/sneaker anchor points inside their images (art pixels from the image's top-left).
const GLOVE_AT = { L: [REST.handL[0] - BOX.gloveL[0], REST.handL[1] - BOX.gloveL[1]] as V, R: [REST.handR[0] - BOX.gloveR[0], REST.handR[1] - BOX.gloveR[1]] as V }
const SHOE_AT = { L: [REST.footL[0] - BOX.shoeL[0], REST.footL[1] - BOX.shoeL[1]] as V, R: [REST.footR[0] - BOX.shoeR[0], REST.footR[1] - BOX.shoeR[1]] as V }

// ---------- the face, in ball space ----------
const EYE = { L: [398, 470] as V, R: [592, 472] as V, rx: 52, ry: 74 }
const PUPIL = { rx: 30, ry: 46 }
const MOUTH: V = [494, 622]
const CREAM = '#f2ead8', INK = '#141312', BLUSH = '#d9644e', SKIN = '#2b2926', TEAL = '#5cdcce'

/** The images, loaded once and shared by every Miss Belle on the page. */
export type Images = Record<PartName, { img: HTMLImageElement; edge: HTMLImageElement }>
let shared: Promise<Images> | null = null
export function loadImages(base: string): Promise<Images> {
  if (shared) return shared
  const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src })
  shared = Promise.all((Object.keys(BOX) as PartName[]).map(async (k) => [k, { img: await load(`${base}${FILES[k]}.png`), edge: await load(`${base}${FILES[k]}-edge.png`) }] as const))
    .then((pairs) => Object.fromEntries(pairs) as Images)
  return shared
}

/** The geometry of one frame, computed once and drawn twice (cream edge pass, then colour pass). */
interface Frame {
  root: M; body: M; bun: M
  armL: Limb; armR: Limb; legL: Limb; legR: Limb
  glove: { L: M; R: M }; shoe: { L: M; R: M }
}

// Arms and legs are two straight bones with a rounded joint (limb.ts). An arm is a little longer than
// the shoulder→hand distance of the drawing, so at rest it hangs almost straight with a soft elbow.
export const ARM = { upper: 74, lower: 72 }
const LEG = { upper: 57, lower: 56 }
// which way the joints point: elbows out (and a little down), knees out
const POLE = { armL: [-1, 0.15] as V, armR: [1, 0.15] as V, legL: [-1, -0.2] as V, legR: [1, -0.2] as V }

/** The four limbs of one Miss Belle (each remembers which side its elbow/knee is on). */
export class Limbs {
  armL = new Limb(ARM.upper, ARM.lower, POLE.armL, REST.shoulderL, REST.handL)
  armR = new Limb(ARM.upper, ARM.lower, POLE.armR, REST.shoulderR, REST.handR)
  legL = new Limb(LEG.upper, LEG.lower, POLE.legL, REST.hipL, REST.footL)
  legR = new Limb(LEG.upper, LEG.lower, POLE.legR, REST.hipR, REST.footR)
  rest = { armL: this.armL.heading(), armR: this.armR.heading(), legL: this.legL.heading(), legR: this.legR.heading() }
}

/**
 * Where the hand goes for a pose given as joint angles (forward kinematics), as an offset from the
 * hand's rest point, ready for Pose.hl / Pose.hr. Angles in degrees: 0 = straight out to her side,
 * 90 = straight up, −90 = straight down, 180 = across toward her middle. Clips use this so every
 * pose has a clean, readable elbow instead of a hand dropped somewhere in space.
 */
export function armAt(side: 'L' | 'R', upperDeg: number, lowerDeg: number): V {
  const out = side === 'L' ? -1 : 1
  const s = side === 'L' ? REST.shoulderL : REST.shoulderR, h = side === 'L' ? REST.handL : REST.handR
  const u = (upperDeg * Math.PI) / 180, l = (lowerDeg * Math.PI) / 180
  const x = s[0] + out * (ARM.upper * Math.cos(u) + ARM.lower * Math.cos(l))
  const y = s[1] - (ARM.upper * Math.sin(u) + ARM.lower * Math.sin(l))
  return [x - h[0], y - h[1]]
}

function geometry(p: Pose, base: M, limbs: Limbs, dt: number): Frame {
  // whole body: spin around her middle, lean over her feet, squash around the feet
  const root = mul(base, mul(mul(mul(T(p.x, p.y + p.hop), Rd(p.spin, BALL.cx, 700)), Rd(p.lean, 500, FEET_Y)), S(p.sx, p.sy, 500, FEET_Y)))
  const bodyLocal = mul(mul(T(0, p.bob), Rd(p.tilt, BALL.cx, BALL.cy)), S(p.bsx, p.bsy, BALL.cx, BALL.cy + BALL.r))
  const body = mul(root, bodyLocal)
  // arms: shoulders ride with the body; the hand target is placed in body space
  const sL = ap(bodyLocal, REST.shoulderL), sR = ap(bodyLocal, REST.shoulderR)
  limbs.armL.solve(sL, ap(bodyLocal, [REST.handL[0] + p.hl[0], REST.handL[1] + p.hl[1]]), dt)
  limbs.armR.solve(sR, ap(bodyLocal, [REST.handR[0] + p.hr[0], REST.handR[1] + p.hr[1]]), dt)
  // gloves sit on the wrist and turn with the forearm (or hold an absolute angle when a pose locks them)
  const eL = limbs.armL.end, eR = limbs.armR.end
  const autoL = limbs.armL.heading() - limbs.rest.armL, autoR = limbs.armR.heading() - limbs.rest.armR
  const gl = (autoL + p.hlr) * (1 - p.hlLock) + p.hlr * p.hlLock
  const gr = (autoR + p.hrr) * (1 - p.hrLock) + p.hrr * p.hrLock
  const glove = {
    L: mul(root, mul(T(eL[0] - GLOVE_AT.L[0], eL[1] - GLOVE_AT.L[1]), Rd(gl, GLOVE_AT.L[0], GLOVE_AT.L[1]))),
    R: mul(root, mul(T(eR[0] - GLOVE_AT.R[0], eR[1] - GLOVE_AT.R[1]), Rd(gr, GLOVE_AT.R[0], GLOVE_AT.R[1]))),
  }
  // legs: hips ride with the body (but not its squash), feet stay put unless a move lifts them;
  // when the hips come down the knees bend out
  const hipM = mul(T(0, p.bob * 0.6), Rd(p.tilt * 0.4, BALL.cx, BALL.cy))
  const pL = ap(hipM, REST.hipL), pR = ap(hipM, REST.hipR)
  limbs.legL.solve(pL, [REST.footL[0] + p.fl[0], REST.footL[1] + p.fl[1]], dt)
  limbs.legR.solve(pR, [REST.footR[0] + p.fr[0], REST.footR[1] + p.fr[1]], dt)
  const kL = limbs.legL.end, kR = limbs.legR.end
  const sl = (limbs.legL.heading() - limbs.rest.legL) * 0.3 + p.flr, sr = (limbs.legR.heading() - limbs.rest.legR) * 0.3 + p.frr
  const shoe = {
    L: mul(root, mul(T(kL[0] - SHOE_AT.L[0], kL[1] - SHOE_AT.L[1]), Rd(sl, SHOE_AT.L[0] - 60, SHOE_AT.L[1] + 150))),
    R: mul(root, mul(T(kR[0] - SHOE_AT.R[0], kR[1] - SHOE_AT.R[1]), Rd(sr, SHOE_AT.R[0] - 40, SHOE_AT.R[1] + 150))),
  }
  const bun = mul(body, Rd(p.bun, REST.bunPivot[0], REST.bunPivot[1]))
  return { root, body, bun, armL: limbs.armL, armR: limbs.armR, legL: limbs.legL, legR: limbs.legR, glove, shoe }
}

/** A bicep bump on each upper arm, lying along it on the side the forearm folds to. */
function biceps(ctx: CanvasRenderingContext2D, g: Frame, k: number, grow: number) {
  ctx.beginPath()
  for (const a of [g.armL, g.armR]) {
    const c = a.bicep(20), ang = Math.atan2(a.joint[1] - a.root[1], a.joint[0] - a.root[0])
    ctx.moveTo(c[0] + Math.cos(ang) * (44 + grow) * k, c[1] + Math.sin(ang) * (44 + grow) * k)
    ctx.ellipse(c[0], c[1], (44 + grow) * k, (34 + grow) * k, ang, 0, Math.PI * 2)
  }
  ctx.fill()
  if (grow) return
  // a cream contour line on top of each bump, the cartoon shorthand that makes it read as a muscle
  const s0 = ctx.strokeStyle, w0 = ctx.lineWidth
  ctx.strokeStyle = CREAM; ctx.lineWidth = 6
  for (const a of [g.armL, g.armR]) {
    const c = a.bicep(20), ang = Math.atan2(a.joint[1] - a.root[1], a.joint[0] - a.root[0])
    const out = a.bicep(21)[1] < c[1] || a.bicep(21)[0] !== c[0] ? Math.atan2(a.bicep(21)[1] - c[1], a.bicep(21)[0] - c[0]) : ang
    ctx.beginPath(); ctx.ellipse(c[0], c[1], 30 * k, 20 * k, ang, out - ang - 0.9, out - ang + 0.9); ctx.stroke()
  }
  ctx.strokeStyle = s0; ctx.lineWidth = w0
}
const setM = (ctx: CanvasRenderingContext2D, m: M) => ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5])
function limb(ctx: CanvasRenderingContext2D, l: Limb, round: number) { l.trace(ctx, round); ctx.stroke() }
function part(ctx: CanvasRenderingContext2D, im: Images, k: PartName, m: M, edge: boolean, placed: boolean) {
  setM(ctx, m)
  const b = BOX[k]
  ctx.drawImage(edge ? im[k].edge : im[k].img, placed ? 0 : b[0], placed ? 0 : b[1], b[2], b[3])
}

/** Draw one frame. `base` maps art pixels to canvas pixels; `t` (s) drives decorative effects. */
export function draw(ctx: CanvasRenderingContext2D, im: Images, p: Pose, base: M, t: number, limbs: Limbs, dt: number) {
  const g = geometry(p, base, limbs, dt)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha))
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'

  // pass 1: the cream sticker outline, every part grown by EDGE
  ctx.strokeStyle = CREAM; ctx.fillStyle = CREAM
  setM(ctx, g.root)
  ctx.lineWidth = 46 + EDGE * 2; limb(ctx, g.legL, 14); limb(ctx, g.legR, 14)
  ctx.lineWidth = 38 + EDGE * 2; limb(ctx, g.armL, 18); limb(ctx, g.armR, 18)
  if (p.bicep > 0.01) biceps(ctx, g, p.bicep, EDGE)
  part(ctx, im, 'shoeL', g.shoe.L, true, true); part(ctx, im, 'shoeR', g.shoe.R, true, true)
  part(ctx, im, 'bun', g.bun, true, false); part(ctx, im, 'ball', g.body, true, false)
  part(ctx, im, 'gloveL', g.glove.L, true, true); part(ctx, im, 'gloveR', g.glove.R, true, true)

  // pass 2: the character
  ctx.strokeStyle = INK; ctx.fillStyle = INK
  setM(ctx, g.root)
  ctx.lineWidth = 46; limb(ctx, g.legL, 14); limb(ctx, g.legR, 14)
  part(ctx, im, 'shoeL', g.shoe.L, false, true); part(ctx, im, 'shoeR', g.shoe.R, false, true)
  setM(ctx, g.root)
  ctx.lineWidth = 38; limb(ctx, g.armL, 18); limb(ctx, g.armR, 18)
  if (p.bicep > 0.01) biceps(ctx, g, p.bicep, 0)
  // a hand on the hip tucks behind the ball, so it reads as resting on her side, not floating over her tummy
  const tuckL = p.tuckL > 0.5, tuckR = p.tuckR > 0.5
  if (tuckL) part(ctx, im, 'gloveL', g.glove.L, false, true)
  if (tuckR) part(ctx, im, 'gloveR', g.glove.R, false, true)
  part(ctx, im, 'bun', g.bun, false, false)
  part(ctx, im, 'ball', g.body, false, false)
  setM(ctx, g.body)
  face(ctx, p)
  if (!tuckL) part(ctx, im, 'gloveL', g.glove.L, false, true)
  if (!tuckR) part(ctx, im, 'gloveR', g.glove.R, false, true)

  effects(ctx, p, g.root, t)
}

function face(ctx: CanvasRenderingContext2D, p: Pose) {
  const a0 = ctx.globalAlpha
  // blush
  ctx.globalAlpha = a0 * Math.min(1, p.blush * 0.9)
  ctx.fillStyle = BLUSH
  ctx.beginPath(); ctx.arc(322, 556, 33, 0, Math.PI * 2); ctx.moveTo(699, 560); ctx.arc(666, 560, 33, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = a0
  // eyes: open (with lids) → shut curves when the lids are fully down → happy arcs when squinting
  // eye shapes swap instantly, as in hand-drawn cartoons (a cross-fade shows two pairs of eyes at once)
  const happy = p.squint > 0.5
  const shut = !happy && p.blink > 0.9
  const open = !happy && !shut
  const lx = p.lookX * 16, ly = p.lookY * 20
  const lid = Math.max(0, Math.min(1, p.blink)) * (EYE.ry * 2 + 8)
  if (open) {
    ctx.globalAlpha = a0
    for (const e of [EYE.L, EYE.R]) {
      ctx.save()
      ctx.beginPath(); ctx.ellipse(e[0], e[1], EYE.rx, EYE.ry, 0, 0, Math.PI * 2)
      ctx.fillStyle = CREAM; ctx.fill(); ctx.clip()
      ctx.fillStyle = INK
      ctx.beginPath(); ctx.ellipse(e[0] + lx, e[1] + 4 + ly, PUPIL.rx, PUPIL.ry, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = CREAM // the pie-cut highlight of 1930s cartoon eyes
      ctx.beginPath(); ctx.moveTo(e[0] + 4 + lx, e[1] - 8 + ly); ctx.lineTo(e[0] + 36 + lx, e[1] - 32 + ly); ctx.lineTo(e[0] + 36 + lx, e[1] + 2 + ly); ctx.closePath(); ctx.fill()
      if (lid > 0.5) { ctx.fillStyle = SKIN; ctx.fillRect(e[0] - EYE.rx - 4, e[1] - EYE.ry - 4, EYE.rx * 2 + 8, lid) }
      ctx.restore()
      ctx.strokeStyle = INK; ctx.lineWidth = 7
      ctx.beginPath(); ctx.ellipse(e[0], e[1], EYE.rx, EYE.ry, 0, 0, Math.PI * 2); ctx.stroke()
    }
  }
  ctx.strokeStyle = INK; ctx.lineWidth = 9
  if (shut) {
    ctx.globalAlpha = a0
    for (const e of [EYE.L, EYE.R]) { ctx.beginPath(); ctx.moveTo(e[0] - 42, e[1] + 4); ctx.quadraticCurveTo(e[0], e[1] + 40, e[0] + 42, e[1] + 4); ctx.stroke() }
  }
  if (happy) {
    ctx.globalAlpha = a0
    for (const e of [EYE.L, EYE.R]) { ctx.beginPath(); ctx.moveTo(e[0] - 40, e[1] + 14); ctx.quadraticCurveTo(e[0], e[1] - 40, e[0] + 40, e[1] + 14); ctx.stroke() }
  }
  ctx.globalAlpha = a0
  // brows
  ctx.lineWidth = 8
  for (const [e, raise, side] of [[EYE.L, p.browL, -1], [EYE.R, p.browR, 1]] as const) {
    const y = e[1] - 100 - raise * 24
    const inner = side === -1 ? e[0] + 36 : e[0] - 36, outer = side === -1 ? e[0] - 40 : e[0] + 40
    ctx.beginPath(); ctx.moveTo(outer, y - p.browTilt * 8); ctx.quadraticCurveTo(e[0], y - 18, inner, y + p.browTilt * 16); ctx.stroke()
  }
  // nose
  ctx.lineWidth = 6
  ctx.beginPath(); ctx.moveTo(478, 548); ctx.quadraticCurveTo(492, 532, 506, 548); ctx.stroke()
  // mouth
  const w = 72 * p.mouthW, cx = MOUTH[0], cy = MOUTH[1], lift = p.smile * 20
  const L: V = [cx - w, cy - lift - p.smirk * 14], R: V = [cx + w, cy - lift + p.smirk * 10]
  if (p.mouthOpen <= 0.06) {
    ctx.lineWidth = 8
    ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.quadraticCurveTo(cx, cy + p.smile * 34, R[0], R[1]); ctx.stroke()
  } else {
    const top = cy - lift * 0.15 + (p.smile < 0 ? -p.smile * 10 : 0)
    const bottom = cy + 12 + p.mouthOpen * 92 + Math.max(0, p.smile) * 20
    ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.quadraticCurveTo(cx, top, R[0], R[1]); ctx.quadraticCurveTo(cx, bottom, L[0], L[1]); ctx.closePath()
    ctx.fillStyle = INK; ctx.fill()
    ctx.save(); ctx.clip()
    ctx.fillStyle = CREAM; ctx.fillRect(cx - 90, cy - 40, 180, 34 + 16 * Math.min(1, p.mouthOpen))
    ctx.fillStyle = BLUSH; ctx.beginPath(); ctx.ellipse(cx + 12, bottom - 6, 38, 10 + 26 * Math.min(1, p.mouthOpen) * p.tongue, 0, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
    // re-trace the mouth: after the clip the current path is the tongue's, which drew a stray oval
    ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.quadraticCurveTo(cx, top, R[0], R[1]); ctx.quadraticCurveTo(cx, bottom, L[0], L[1]); ctx.closePath()
    ctx.lineWidth = 6; ctx.stroke()
  }
}

function effects(ctx: CanvasRenderingContext2D, p: Pose, root: M, t: number) {
  const a0 = ctx.globalAlpha
  if (p.zzz > 0.01) {
    setM(ctx, root)
    ctx.fillStyle = CREAM
    ctx.font = '800 90px -apple-system, system-ui, sans-serif'
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.45 + i / 3) % 1
      ctx.globalAlpha = a0 * p.zzz * Math.sin(ph * Math.PI)
      const s = 0.6 + ph * 0.8
      ctx.save(); ctx.translate(640 + ph * 150 + i * 10, 300 - ph * 260); ctx.scale(s, s); ctx.fillText(i === 2 ? 'Z' : 'z', 0, 0); ctx.restore()
    }
  }
  if (p.sparkle > 0.01) {
    setM(ctx, root)
    ctx.fillStyle = TEAL
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + t * 0.6
      const r = 380 + Math.sin(t * 3 + i) * 30
      const sc = 0.6 + 0.5 * Math.abs(Math.sin(t * 5 + i * 1.7))
      ctx.globalAlpha = a0 * p.sparkle
      ctx.save(); ctx.translate(BALL.cx + Math.cos(a) * r, BALL.cy - 60 + Math.sin(a) * r * 0.75); ctx.rotate(t * 1.6 + i * 0.5); ctx.scale(sc, sc)
      ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(4, -4, 26, 0); ctx.quadraticCurveTo(4, 4, 0, 26); ctx.quadraticCurveTo(-4, 4, -26, 0); ctx.quadraticCurveTo(-4, -4, 0, -26); ctx.fill()
      ctx.restore()
    }
  }
  ctx.globalAlpha = a0
}
