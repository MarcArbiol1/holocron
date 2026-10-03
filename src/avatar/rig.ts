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
const ARM_LEN = Math.hypot(REST.handL[0] - REST.shoulderL[0], REST.handL[1] - REST.shoulderL[1]) * 1.08
const LEG_LEN = Math.hypot(REST.footL[0] - REST.hipL[0], REST.footL[1] - REST.hipL[1]) * 1.05

export interface Pose {
  // whole character, around the feet
  x: number; y: number; hop: number; lean: number; spin: number; sx: number; sy: number; alpha: number; shrink: number
  // upper body (ball + bun + face + arms), relative to the feet
  bob: number; tilt: number; bsx: number; bsy: number
  bun: number
  // hands: offset from rest in body space, plus extra glove rotation (deg)
  hl: V; hr: V
  /** extra glove turn (deg) on top of the auto-rotation that follows the end of the arm */
  hlr: number; hrr: number
  /** bend direction of each arm, −1..1 (1 = elbow out to her side; smaller values flatten the bend) */
  dirL: number; dirR: number
  /** a little bicep bump on the right arm (flex), 0..1 */
  bicep: number
  /** > 0.5: that glove is tucked behind the body (hands on hips) */
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
  hl: [0, 0], hr: [0, 0], hlr: 0, hrr: 0, dirL: 1, dirR: 1, bicep: 0, tuckL: 0, tuckR: 0,
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

/**
 * A rubber-hose limb, the way Battle Axe's RubberHose builds one: a hose of constant length L bent into
 * a circular arc between the socket `a` and the end `b`. When b is nearly L away the hose eases straight
 * (soft IK, so it never "pops"); beyond L the end is pulled back to L, so a limb can never come apart.
 * `dir` (−1..1) picks which way it bows; values near 0 flatten the bend. Returns sample points along the
 * hose and the heading at the end, which the glove or sneaker follows (auto-rotate).
 */
export interface Hose { pts: V[]; end: V; heading: number }
const SAMPLES = 14
function hose(a: V, target: V, L: number, dir: number): Hose {
  let dx = target[0] - a[0], dy = target[1] - a[1]
  let d = Math.hypot(dx, dy) || 1e-6
  const phi = Math.atan2(dy, dx)
  // soft IK: the effective reach approaches L smoothly instead of snapping straight
  const k = 0.08 * L
  if (d > L - k) d = L - k * Math.exp(-(d - (L - k)) / k)
  dx = Math.cos(phi) * d; dy = Math.sin(phi) * d
  const end: V = [a[0] + dx, a[1] + dy]
  const flat = Math.min(1, Math.abs(dir)), sgn = dir >= 0 ? 1 : -1
  // solve sin(t)/t = d/L for the half bend angle t (Newton)
  const kk = Math.min(0.9999, d / L)
  let t = Math.min(3, Math.sqrt(6 * (1 - kk)))
  for (let i = 0; i < 12; i++) { const f = Math.sin(t) / t - kk, fp = (t * Math.cos(t) - Math.sin(t)) / (t * t); t = Math.min(Math.PI - 1e-4, Math.max(1e-4, t - f / fp)) }
  t *= flat // flattening = less bend
  const r = t > 1e-4 ? (d / 2) / Math.sin(t) : 1e9
  const a0 = phi - sgn * t
  const pts: V[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const u = i / SAMPLES
    if (t <= 1e-4) { pts.push([a[0] + dx * u, a[1] + dy * u]); continue }
    const h = a0 + sgn * 2 * t * u
    pts.push([a[0] + r * sgn * (Math.sin(h) - Math.sin(a0)), a[1] - r * sgn * (Math.cos(h) - Math.cos(a0))])
  }
  pts[SAMPLES] = end
  return { pts, end, heading: ((phi + sgn * t) * 180) / Math.PI }
}

// Glove/sneaker anchor points inside their images (art pixels from the image's top-left).
const GLOVE_AT = { L: [REST.handL[0] - BOX.gloveL[0], REST.handL[1] - BOX.gloveL[1]] as V, R: [REST.handR[0] - BOX.gloveR[0], REST.handR[1] - BOX.gloveR[1]] as V }
const SHOE_AT = { L: [REST.footL[0] - BOX.shoeL[0], REST.footL[1] - BOX.shoeL[1]] as V, R: [REST.footR[0] - BOX.shoeR[0], REST.footR[1] - BOX.shoeR[1]] as V }
// Bend sides: her right arm (on our left) bows outward to the left, the other to the right.
const SIDE = { L: -1, R: 1 }
const REST_HEAD = {
  armL: hose(REST.shoulderL, REST.handL, ARM_LEN, SIDE.L).heading, armR: hose(REST.shoulderR, REST.handR, ARM_LEN, SIDE.R).heading,
  legL: hose(REST.hipL, REST.footL, LEG_LEN, SIDE.L).heading, legR: hose(REST.hipR, REST.footR, LEG_LEN, SIDE.R).heading,
}

// ---------- the face, in ball space ----------
// Proportions measured on Marc's reference: tall eyes set close, big pupils sitting low, a pie-cut highlight,
// lashes on the outer corners, heavy short brows, big low blush, an open grin with a tongue.
const EYE = { L: [408, 478] as V, R: [584, 478] as V, rx: 54, ry: 80 }
const PUPIL = { rx: 38, ry: 55, drop: 12 }
const MOUTH: V = [496, 612]
const CREAM = '#f2ead8', INK = '#141312', BLUSH = '#e5705d', SKIN = '#2b2926', TEAL = '#5cdcce', MOUTH_IN = '#3a0d0a'

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
  armL: Hose; armR: Hose; legL: Hose; legR: Hose
  glove: { L: M; R: M }; shoe: { L: M; R: M }
  bicep: V
}

function geometry(p: Pose, base: M): Frame {
  // one hierarchy: root (feet on the floor) → body → shoulder sockets; hips ride the body too.
  // spin turns her around her middle, lean tips her over her feet, squash is about the feet.
  const root = mul(base, mul(mul(mul(T(p.x, p.y + p.hop), Rd(p.spin, BALL.cx, 700)), Rd(p.lean, 500, FEET_Y)), S(p.sx, p.sy, 500, FEET_Y)))
  const bodyLocal = mul(mul(T(0, p.bob), Rd(p.tilt, BALL.cx, BALL.cy)), S(p.bsx, p.bsy, BALL.cx, BALL.cy + BALL.r))
  const body = mul(root, bodyLocal)
  // arms: sockets sit inside the ball's silhouette and ride the body; hands are placed in body space
  const sL = ap(bodyLocal, REST.shoulderL), sR = ap(bodyLocal, REST.shoulderR)
  const hL = ap(bodyLocal, [REST.handL[0] + p.hl[0], REST.handL[1] + p.hl[1]])
  const hR = ap(bodyLocal, [REST.handR[0] + p.hr[0], REST.handR[1] + p.hr[1]])
  const armL = hose(sL, hL, ARM_LEN, SIDE.L * p.dirL), armR = hose(sR, hR, ARM_LEN, SIDE.R * p.dirR)
  // gloves sit exactly on the hose end and turn with it (auto-rotate), plus the pose's own offset
  const gl = armL.heading - REST_HEAD.armL + p.hlr, gr = armR.heading - REST_HEAD.armR + p.hrr
  const glove = {
    L: mul(root, mul(T(armL.end[0] - GLOVE_AT.L[0], armL.end[1] - GLOVE_AT.L[1]), Rd(gl, GLOVE_AT.L[0], GLOVE_AT.L[1]))),
    R: mul(root, mul(T(armR.end[0] - GLOVE_AT.R[0], armR.end[1] - GLOVE_AT.R[1]), Rd(gr, GLOVE_AT.R[0], GLOVE_AT.R[1]))),
  }
  // legs: hip sockets ride the body (not its squash); feet stay planted unless a move lifts them
  const hipM = mul(T(0, p.bob), Rd(p.tilt * 0.5, BALL.cx, BALL.cy))
  const pL = ap(hipM, REST.hipL), pR = ap(hipM, REST.hipR)
  const legL = hose(pL, [REST.footL[0] + p.fl[0], REST.footL[1] + p.fl[1]], LEG_LEN, SIDE.L)
  const legR = hose(pR, [REST.footR[0] + p.fr[0], REST.footR[1] + p.fr[1]], LEG_LEN, SIDE.R)
  // sneakers follow the leg a little (they mostly stay flat on the floor)
  const sl = (legL.heading - REST_HEAD.legL) * 0.35 + p.flr, sr = (legR.heading - REST_HEAD.legR) * 0.35 + p.frr
  const shoe = {
    L: mul(root, mul(T(legL.end[0] - SHOE_AT.L[0], legL.end[1] - SHOE_AT.L[1]), Rd(sl, SHOE_AT.L[0], SHOE_AT.L[1]))),
    R: mul(root, mul(T(legR.end[0] - SHOE_AT.R[0], legR.end[1] - SHOE_AT.R[1]), Rd(sr, SHOE_AT.R[0], SHOE_AT.R[1]))),
  }
  const bun = mul(body, Rd(p.bun, REST.bunPivot[0], REST.bunPivot[1]))
  // the bicep bulges from the middle of the right arm, on the outside of its bend
  const mid = armR.pts[Math.floor(armR.pts.length / 2)]
  const chordMid: V = [(armR.pts[0][0] + armR.end[0]) / 2, (armR.pts[0][1] + armR.end[1]) / 2]
  const ox = mid[0] - chordMid[0], oy = mid[1] - chordMid[1], ol = Math.hypot(ox, oy) || 1
  return { root, body, bun, armL, armR, legL, legR, glove, shoe, bicep: [mid[0] + (ox / ol) * 14, mid[1] + (oy / ol) * 14] }
}

const setM = (ctx: CanvasRenderingContext2D, m: M) => ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5])
function limb(ctx: CanvasRenderingContext2D, h: Hose) {
  ctx.beginPath(); ctx.moveTo(h.pts[0][0], h.pts[0][1])
  for (let i = 1; i < h.pts.length; i++) ctx.lineTo(h.pts[i][0], h.pts[i][1])
  ctx.stroke()
}
function part(ctx: CanvasRenderingContext2D, im: Images, k: PartName, m: M, edge: boolean, placed: boolean) {
  setM(ctx, m)
  const b = BOX[k]
  ctx.drawImage(edge ? im[k].edge : im[k].img, placed ? 0 : b[0], placed ? 0 : b[1], b[2], b[3])
}

/** Draw one frame. `base` maps art pixels to canvas pixels; `t` (s) drives decorative effects. */
export function draw(ctx: CanvasRenderingContext2D, im: Images, p: Pose, base: M, t: number) {
  const g = geometry(p, base)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha))
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'

  // pass 1: the cream sticker outline, every part grown by EDGE
  ctx.strokeStyle = CREAM; ctx.fillStyle = CREAM
  setM(ctx, g.root)
  ctx.lineWidth = 46 + EDGE * 2; limb(ctx, g.legL); limb(ctx, g.legR)
  ctx.lineWidth = 38 + EDGE * 2; limb(ctx, g.armL); limb(ctx, g.armR)
  if (p.bicep > 0.01) { ctx.beginPath(); ctx.ellipse(g.bicep[0], g.bicep[1], (48 + EDGE) * p.bicep, (38 + EDGE) * p.bicep, 0, 0, Math.PI * 2); ctx.fill() }
  part(ctx, im, 'shoeL', g.shoe.L, true, true); part(ctx, im, 'shoeR', g.shoe.R, true, true)
  part(ctx, im, 'bun', g.bun, true, false); part(ctx, im, 'ball', g.body, true, false)
  part(ctx, im, 'gloveL', g.glove.L, true, true); part(ctx, im, 'gloveR', g.glove.R, true, true)

  // pass 2: back to front: legs, sneakers, arms (sockets hidden behind the ball), bun, ball, face, gloves
  ctx.strokeStyle = INK; ctx.fillStyle = INK
  setM(ctx, g.root)
  ctx.lineWidth = 46; limb(ctx, g.legL); limb(ctx, g.legR)
  part(ctx, im, 'shoeL', g.shoe.L, false, true); part(ctx, im, 'shoeR', g.shoe.R, false, true)
  setM(ctx, g.root)
  ctx.lineWidth = 38; limb(ctx, g.armL); limb(ctx, g.armR)
  if (p.bicep > 0.01) { ctx.beginPath(); ctx.ellipse(g.bicep[0], g.bicep[1], 48 * p.bicep, 38 * p.bicep, 0, 0, Math.PI * 2); ctx.fill() }
  // a glove tucked behind the body (hands on hips) is drawn before the ball, so only the wrist shows
  if (p.tuckL > 0.5) part(ctx, im, 'gloveL', g.glove.L, false, true)
  if (p.tuckR > 0.5) part(ctx, im, 'gloveR', g.glove.R, false, true)
  part(ctx, im, 'bun', g.bun, false, false)
  part(ctx, im, 'ball', g.body, false, false)
  setM(ctx, g.body)
  face(ctx, p)
  if (p.tuckL <= 0.5) part(ctx, im, 'gloveL', g.glove.L, false, true)
  if (p.tuckR <= 0.5) part(ctx, im, 'gloveR', g.glove.R, false, true)

  effects(ctx, p, g.root, t)
}

function face(ctx: CanvasRenderingContext2D, p: Pose) {
  const a0 = ctx.globalAlpha
  // blush: big soft ovals, low and to the outside
  ctx.globalAlpha = a0 * Math.min(1, p.blush * 0.85)
  ctx.fillStyle = BLUSH
  ctx.beginPath(); ctx.ellipse(318, 590, 42, 32, 0, 0, Math.PI * 2); ctx.moveTo(716, 590); ctx.ellipse(674, 590, 42, 32, 0, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = a0
  // eyes: open (with lids) → shut curves when the lids are fully down → happy arcs when squinting
  // eye shapes swap instantly, as in hand-drawn cartoons (a cross-fade shows two pairs of eyes at once)
  const happy = p.squint > 0.5 ? 1 : 0
  const shut = p.blink > 0.9 && !happy ? 1 : 0
  const open = !happy && !shut ? 1 : 0
  const lx = p.lookX * 14, ly = p.lookY * 16
  const lid = Math.max(0, Math.min(1, p.blink)) * (EYE.ry * 2 + 8)
  if (open) {
    ctx.globalAlpha = a0
    for (const [e, side] of [[EYE.L, -1], [EYE.R, 1]] as const) {
      ctx.save()
      ctx.beginPath(); ctx.ellipse(e[0], e[1], EYE.rx, EYE.ry, 0, 0, Math.PI * 2)
      ctx.fillStyle = CREAM; ctx.fill(); ctx.clip()
      const px = e[0] + lx, py = e[1] + PUPIL.drop + ly
      ctx.fillStyle = INK
      ctx.beginPath(); ctx.ellipse(px, py, PUPIL.rx, PUPIL.ry, 0, 0, Math.PI * 2); ctx.fill()
      // the pie-cut highlight: a cream wedge from the pupil's centre to its upper edge, plus a small glint
      ctx.fillStyle = CREAM
      ctx.beginPath(); ctx.moveTo(px + 2, py - 6); ctx.lineTo(px - 30, py - 50); ctx.lineTo(px + 8, py - 58); ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.arc(px + 16, py + 22, 7, 0, Math.PI * 2); ctx.fill()
      if (lid > 0.5) { ctx.fillStyle = SKIN; ctx.fillRect(e[0] - EYE.rx - 4, e[1] - EYE.ry - 4, EYE.rx * 2 + 8, lid) }
      ctx.restore()
      ctx.strokeStyle = INK; ctx.lineWidth = 8
      ctx.beginPath(); ctx.ellipse(e[0], e[1], EYE.rx, EYE.ry, 0, 0, Math.PI * 2); ctx.stroke()
      // lashes ride on the upper lid: three flicks at the outer corner
      const lidY = e[1] - EYE.ry + Math.max(0, lid - 4)
      lashes(ctx, e, side, lidY)
    }
  }
  ctx.strokeStyle = INK; ctx.lineWidth = 10
  if (shut) {
    ctx.globalAlpha = a0
    for (const [e, side] of [[EYE.L, -1], [EYE.R, 1]] as const) {
      ctx.beginPath(); ctx.moveTo(e[0] - 46, e[1] + 6); ctx.quadraticCurveTo(e[0], e[1] + 42, e[0] + 46, e[1] + 6); ctx.stroke()
      // closed-eye lashes hang from the outer end of the lid line
      const ox = e[0] + side * 46
      ctx.lineWidth = 8
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(ox - side * i * 12, e[1] + 8 + i * 6); ctx.lineTo(ox + side * (14 - i * 4), e[1] + 26 + i * 8); ctx.stroke() }
      ctx.lineWidth = 10
    }
  }
  if (happy) {
    ctx.globalAlpha = a0
    for (const e of [EYE.L, EYE.R]) { ctx.beginPath(); ctx.moveTo(e[0] - 44, e[1] + 16); ctx.quadraticCurveTo(e[0], e[1] - 44, e[0] + 44, e[1] + 16); ctx.stroke() }
  }
  ctx.globalAlpha = a0
  // brows: short and heavy, arched
  ctx.lineWidth = 12
  for (const [e, raise, side] of [[EYE.L, p.browL, -1], [EYE.R, p.browR, 1]] as const) {
    const y = e[1] - EYE.ry - 30 - raise * 22
    const inner = e[0] - side * 30, outer = e[0] + side * 34
    ctx.beginPath(); ctx.moveTo(inner, y + p.browTilt * 14); ctx.quadraticCurveTo(e[0], y - 20, outer, y - p.browTilt * 6 + 4); ctx.stroke()
  }
  // nose: a small hook
  ctx.lineWidth = 7
  ctx.beginPath(); ctx.moveTo(482, 566); ctx.quadraticCurveTo(496, 550, 510, 566); ctx.stroke()
  // mouth: a wide grin; closed it is a smile line, open it is a "D" with teeth on top and a tongue
  const w = 88 * p.mouthW, cx = MOUTH[0], cy = MOUTH[1], lift = p.smile * 22
  const L: V = [cx - w, cy - lift - p.smirk * 14], R: V = [cx + w, cy - lift + p.smirk * 10]
  if (p.mouthOpen <= 0.06) {
    ctx.lineWidth = 9
    ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.quadraticCurveTo(cx, cy + p.smile * 32, R[0], R[1]); ctx.stroke()
  } else {
    const top = cy - lift * 0.35 + (p.smile < 0 ? -p.smile * 10 : 0)
    const bottom = cy + 18 + p.mouthOpen * 130 + Math.max(0, p.smile) * 22
    const lowY = 0.5 * (L[1] + R[1]) / 2 + 0.5 * bottom // the lowest point of the bottom curve
    const shape = () => { ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.quadraticCurveTo(cx, top, R[0], R[1]); ctx.quadraticCurveTo(cx, bottom, L[0], L[1]); ctx.closePath() }
    shape()
    ctx.fillStyle = MOUTH_IN; ctx.fill()
    ctx.save(); ctx.clip()
    // teeth: a cream band under the top lip; tongue: resting in the bottom of the mouth
    ctx.fillStyle = CREAM; ctx.fillRect(cx - 120, Math.min(L[1], R[1]) - 30, 240, 30 + (top - Math.min(L[1], R[1])) * 0.5 + 12 + 8 * Math.min(1, p.mouthOpen))
    ctx.fillStyle = BLUSH; ctx.beginPath(); ctx.ellipse(cx + 12, lowY + 6, 50 * p.mouthW, (16 + 30 * Math.min(1, p.mouthOpen)) * p.tongue, 0, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
    shape() // the outline follows the mouth, not the last shape drawn inside it
    ctx.lineWidth = 8; ctx.stroke()
  }
}

/** Three curled lashes at the eye's outer top corner (side −1 = her right eye, on our left). */
function lashes(ctx: CanvasRenderingContext2D, e: V, side: number, lidY: number) {
  ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.lineCap = 'round'
  for (let i = 0; i < 3; i++) {
    const a = (-Math.PI / 2) + side * (0.55 + i * 0.32) // around the upper outer arc
    const bx = e[0] + Math.cos(a) * EYE.rx * 0.98
    const by = Math.max(lidY, e[1] + Math.sin(a) * EYE.ry * 0.98)
    const len = 24 - i * 3
    const dx = Math.cos(a) * len + side * 6, dy = Math.sin(a) * len - 6
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + dx * 0.6, by + dy * 0.2, bx + dx, by + dy); ctx.stroke()
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
