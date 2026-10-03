/**
 * Miss Belle drawn entirely in vector, from Marc's Gemini design: charcoal kettlebell ball with the
 * Holocron cube on her belly, a twisted teal bun, cream cartoon gloves, teal sneakers with cream soles.
 *
 * Every part is a list of pieces (filled shapes and round "tubes"). A layer is drawn in two passes,
 * all outlines first, then all fills: pieces of one layer merge into one shape (the outline only shows
 * on the outside), which is how cartoon cel art hides joints. A first pass over everything in cream
 * gives the sticker edge around the whole character.
 *
 * Coordinates are the original art's pixels. Gloves and sneakers have their own local space with the
 * origin at the wrist / ankle and +y pointing away from the limb (fingers / sole).
 */

export const INK = '#141312'
export const CREAM = '#f2ead8'
const CREAM_SHADE = '#ddd2bc'
const TEAL = '#6fa8a0'
const TEAL_DARK = '#4f857e'
const TEAL_LIGHT = '#b8ddd6'
const BODY = '#2e2b28'
const BODY_LIGHT = '#45413c'
const BODY_DARK = '#1d1b19'
const EMBLEM = '#5fa39b'

export const OUT = 11 // ink outline thickness (each side)
export const EDGE = 16 // cream sticker edge around the whole character

type Piece =
  | { kind: 'fill'; path: Path2D; color: string | CanvasGradient }
  | { kind: 'tube'; path: Path2D; width: number; color: string }

export type Pass = 'edge' | 'ink' | 'fill'

/** Draw a layer's pieces for one pass. Details (highlights, laces, stitches) go in `detail`, fill pass only. */
export function layer(ctx: CanvasRenderingContext2D, pass: Pass, pieces: Piece[], detail?: () => void) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  if (pass === 'fill') {
    for (const p of pieces) {
      if (p.kind === 'fill') { ctx.fillStyle = p.color; ctx.fill(p.path) }
      else { ctx.strokeStyle = p.color; ctx.lineWidth = p.width; ctx.stroke(p.path) }
    }
    detail?.()
    return
  }
  const grow = pass === 'edge' ? OUT + EDGE : OUT
  const color = pass === 'edge' ? CREAM : INK
  ctx.strokeStyle = color; ctx.fillStyle = color
  for (const p of pieces) {
    if (p.kind === 'fill') { ctx.lineWidth = grow * 2; ctx.fill(p.path); ctx.stroke(p.path) }
    else { ctx.lineWidth = p.width + grow * 2; ctx.stroke(p.path) }
  }
}

const ellipse = (cx: number, cy: number, rx: number, ry: number, rot = 0) => { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); return p }
const rrect = (x: number, y: number, w: number, h: number, r: number) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p }
const line = (pts: number[]) => { const p = new Path2D(); p.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) p.lineTo(pts[i], pts[i + 1]); return p }

// ---------------------------------------------------------------- body + bun (ball space)
export const BALL = { cx: 503, cy: 568, r: 255 }

/** The kettlebell ball with soft shading and the Holocron cube emblem. */
export function bodyPieces(ctx: CanvasRenderingContext2D): Piece[] {
  const g = ctx.createRadialGradient(BALL.cx - 90, BALL.cy - 110, 30, BALL.cx, BALL.cy, BALL.r)
  g.addColorStop(0, BODY_LIGHT); g.addColorStop(0.55, BODY); g.addColorStop(1, BODY_DARK)
  return [{ kind: 'fill', path: ellipse(BALL.cx, BALL.cy, BALL.r, BALL.r), color: g }]
}
export function bodyDetail(ctx: CanvasRenderingContext2D) {
  // a crescent of shade on her right side and a soft rim light on the left
  ctx.save()
  ctx.beginPath(); ctx.arc(BALL.cx, BALL.cy, BALL.r, 0, Math.PI * 2); ctx.clip()
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.arc(BALL.cx + 60, BALL.cy + 40, BALL.r, 0, Math.PI * 2); ctx.arc(BALL.cx - 30, BALL.cy - 30, BALL.r, 0, Math.PI * 2, true); ctx.fill('evenodd')
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 10
  ctx.beginPath(); ctx.arc(BALL.cx, BALL.cy, BALL.r - 22, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke()
  ctx.restore()
  // the Holocron cube: a little isometric cube with the four-point star on its top face
  const ex = BALL.cx, ey = BALL.cy + 190, s = 34
  ctx.strokeStyle = EMBLEM; ctx.lineWidth = 6; ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(ex, ey - s); ctx.lineTo(ex + s * 0.9, ey - s * 0.5); ctx.lineTo(ex + s * 0.9, ey + s * 0.55); ctx.lineTo(ex, ey + s * 1.05); ctx.lineTo(ex - s * 0.9, ey + s * 0.55); ctx.lineTo(ex - s * 0.9, ey - s * 0.5); ctx.closePath()
  ctx.moveTo(ex - s * 0.9, ey - s * 0.5); ctx.lineTo(ex, ey); ctx.lineTo(ex + s * 0.9, ey - s * 0.5); ctx.moveTo(ex, ey); ctx.lineTo(ex, ey + s * 1.05)
  ctx.stroke()
  ctx.fillStyle = EMBLEM
  const sx = ex, sy = ey - s * 0.5, r = s * 0.42
  ctx.beginPath(); ctx.moveTo(sx, sy - r); ctx.quadraticCurveTo(sx + r * 0.12, sy - r * 0.12, sx + r, sy); ctx.quadraticCurveTo(sx + r * 0.12, sy + r * 0.12, sx, sy + r); ctx.quadraticCurveTo(sx - r * 0.12, sy + r * 0.12, sx - r, sy); ctx.quadraticCurveTo(sx - r * 0.12, sy - r * 0.12, sx, sy - r); ctx.fill()
}

const BUN_W = 62
/** The handle's centre line: up from the left of the ball, over the top, down to the right. */
function arch(t: number): [number, number] {
  const p0 = [392, 372], c1 = [300, 36], c2 = [716, 36], p3 = [618, 372]
  const u = 1 - t
  return [u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1]]
}
/**
 * The bun is the kettlebell handle twisted like a rope: two strands wind around the arch from the top
 * of the left leg down the right one. Returns the strand pieces split at every crossing, tagged over/under.
 */
function bunRope(): { path: Path2D; over: boolean }[] {
  const N = 160, TWISTS = 2, AMP = 24
  const strands: [number, number][][] = [[], []]
  const phase: number[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const [x, y] = arch(t)
    const [x2, y2] = arch(Math.min(1, t + 0.002)), [x0, y0] = arch(Math.max(0, t - 0.002))
    const tx = x2 - x0, ty = y2 - y0, tl = Math.hypot(tx, ty) || 1
    const nx = -ty / tl, ny = tx / tl
    const ramp = Math.min(1, Math.max(0, (t - 0.16) / 0.14)) // the left leg is plain, the twist starts near the top
    const ph = 2 * Math.PI * TWISTS * Math.max(0, t - 0.16) / 0.84
    phase.push(ph)
    for (const k of [0, 1]) { const o = AMP * ramp * Math.sin(ph + k * Math.PI); strands[k].push([x + nx * o, y + ny * o]) }
  }
  // split at crossings (every half turn); which strand is on top alternates
  const out: { path: Path2D; over: boolean }[] = []
  for (const k of [0, 1]) {
    let start = 0
    for (let i = 1; i <= N; i++) {
      const crossing = Math.floor(phase[i] / Math.PI) !== Math.floor(phase[i - 1] / Math.PI)
      if (crossing || i === N) {
        const seg = new Path2D(); seg.moveTo(strands[k][start][0], strands[k][start][1])
        for (let j = start + 1; j <= i; j++) seg.lineTo(strands[k][j][0], strands[k][j][1])
        const half = Math.floor(phase[Math.max(start, i - 1)] / Math.PI)
        out.push({ path: seg, over: (half + k) % 2 === 0 })
        start = i
      }
    }
  }
  return out
}
export function drawBun(ctx: CanvasRenderingContext2D, pass: Pass) {
  const rope = bunRope()
  if (pass === 'edge') { layer(ctx, 'edge', rope.map((r) => ({ kind: 'tube', path: r.path, width: BUN_W, color: TEAL }))); return }
  if (pass !== 'fill') return
  // strands under the crossings first, then the ones on top, each outlined, filled and lit
  for (const r of [...rope.filter((x) => !x.over), ...rope.filter((x) => x.over)]) {
    layer(ctx, 'ink', [{ kind: 'tube', path: r.path, width: BUN_W, color: TEAL }])
    layer(ctx, 'fill', [{ kind: 'tube', path: r.path, width: BUN_W, color: TEAL }], () => {
      ctx.save(); ctx.translate(3, 8); ctx.strokeStyle = TEAL_DARK; ctx.globalAlpha *= 0.55; ctx.lineWidth = BUN_W * 0.38; ctx.stroke(r.path); ctx.restore()
      ctx.save(); ctx.translate(-8, -13); ctx.strokeStyle = TEAL_LIGHT; ctx.lineWidth = 9; ctx.globalAlpha *= 0.9; ctx.stroke(r.path); ctx.restore()
    })
  }
}

// ---------------------------------------------------------------- gloves (local: wrist at 0,0, fingers toward +y)
export interface GloveOpts { thumb: 1 | -1; spread: number; curl: number }

export function glovePieces(o: GloveOpts): Piece[] {
  const pcs: Piece[] = []
  const len = 54 * (1 - 0.6 * o.curl)
  // three chunky fingers fanning out from the palm (curling shortens them into a fist)
  for (let i = -1; i <= 1; i++) {
    const a = (i * (10 + 14 * o.spread) * Math.PI) / 180
    const bx = i * 31, by = 116
    pcs.push({ kind: 'tube', path: line([bx, by, bx + Math.sin(a) * len, by + Math.cos(a) * len]), width: 44, color: CREAM })
  }
  // the thumb, on the side toward the body
  const ta = ((o.thumb * (52 + 22 * o.spread)) * Math.PI) / 180
  pcs.push({ kind: 'tube', path: line([o.thumb * 44, 74, o.thumb * 44 + Math.sin(ta) * 44, 74 + Math.cos(ta) * 44]), width: 42, color: CREAM })
  // the palm, overlapping the rolled cuff so they read as one glove
  pcs.push({ kind: 'fill', path: ellipse(0, 86, 62, 56), color: CREAM })
  pcs.push({ kind: 'fill', path: rrect(-42, -6, 84, 50, 20), color: CREAM })
  return pcs
}
export function gloveDetail(ctx: CanvasRenderingContext2D, o: GloveOpts) {
  ctx.strokeStyle = INK; ctx.lineCap = 'round'
  // the cuff's edge, and three stitches on the back of the hand
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-40, 40); ctx.quadraticCurveTo(0, 50, 40, 40); ctx.stroke()
  ctx.lineWidth = 6
  for (const x of [-20, 0, 20]) { ctx.beginPath(); ctx.moveTo(x, 66); ctx.lineTo(x + o.thumb * 2, 98); ctx.stroke() }
  ctx.save(); ctx.globalAlpha *= 0.45; ctx.fillStyle = CREAM_SHADE; ctx.beginPath(); ctx.ellipse(-o.thumb * 14, 126, 46, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore()
}

// ---------------------------------------------------------------- sneakers (local: ankle at 0,0, sole toward +y, toe toward `toe`)
export function shoePieces(toe: 1 | -1): Piece[] {
  const sole = new Path2D(); sole.roundRect(toe === 1 ? -64 : -154, 104, 218, 34, 17)
  return [
    { kind: 'fill', path: rrect(-34, -6, 68, 44, 15), color: CREAM }, // sock
    { kind: 'fill', path: ellipse(toe * 30, 76, 90, 44), color: TEAL }, // upper
    { kind: 'fill', path: ellipse(toe * 92, 92, 56, 40), color: CREAM }, // toe cap
    { kind: 'fill', path: sole, color: CREAM }, // sole
  ]
}
export function shoeDetail(ctx: CanvasRenderingContext2D, toe: 1 | -1) {
  // the toe cap's edge over the upper, and the seam above the sole
  ctx.strokeStyle = INK; ctx.lineWidth = 7
  ctx.beginPath(); ctx.ellipse(toe * 92, 92, 56, 40, 0, toe === 1 ? Math.PI * 0.62 : Math.PI * 1.62, toe === 1 ? Math.PI * 1.38 : Math.PI * 0.38, toe === 1); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(toe === 1 ? -54 : 54, 106); ctx.lineTo(toe * 140, 106); ctx.stroke()
  // laces: cream bars with an ink rim, climbing the tongue
  for (let i = 0; i < 3; i++) {
    const x = toe * (2 + i * 20), y = 46 + i * 9
    ctx.strokeStyle = INK; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(x - toe * 14, y - 5); ctx.lineTo(x + toe * 12, y + 4); ctx.stroke()
    ctx.strokeStyle = CREAM; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x - toe * 14, y - 5); ctx.lineTo(x + toe * 12, y + 4); ctx.stroke()
  }
  ctx.save(); ctx.globalAlpha *= 0.55; ctx.strokeStyle = TEAL_LIGHT; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(toe * 18, 72, 60, 26, 0, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke(); ctx.restore()
}
