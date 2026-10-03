/**
 * A soft limb: a chain of points with constant total length (Verlet integration + distance
 * constraints), pinned at the socket and pulled to the hand/foot target. It is how games make
 * noodle arms: the limb can never stretch into a stick, it sags a little under gravity, it bows
 * outward like a rubber hose, and when the hand moves fast the middle of the arm lags behind and
 * whips, then settles. Drawn as a smooth curve through the points.
 */
export type V = [number, number]

export interface LimbOpts {
  length: number // total length (art pixels)
  segments?: number
  gravity?: number // px/s² pulling the middle down (sag)
  bow?: number // px/s² sideways push on the middle (rubber-hose bend), signed: + = to the right
  damping?: number // 0..1 velocity kept per second-ish (lower = calmer)
  stiffness?: number // 0..1 how much the limb resists folding (keeps it a smooth curve, no kinks)
}

const STEP = 1 / 120

export class SoftLimb {
  readonly pts: V[]
  private prev: V[]
  private seg: number
  private carry = 0
  private o: Required<LimbOpts>
  constructor(o: Required<LimbOpts>, root: V, end: V) {
    this.o = o
    const n = o.segments
    this.seg = o.length / n
    this.pts = Array.from({ length: n + 1 }, (_, i) => [root[0] + ((end[0] - root[0]) * i) / n, root[1] + ((end[1] - root[1]) * i) / n] as V)
    this.prev = this.pts.map((p) => [p[0], p[1]] as V)
  }
  static make(o: LimbOpts, root: V, end: V) {
    return new SoftLimb({ segments: 10, gravity: 900, bow: 0, damping: 0.985, stiffness: 0.5, ...o }, root, end)
  }

  /** Advance by dt seconds with the socket at `root` and the hand/foot wanting to be at `target`. */
  update(dt: number, root: V, target: V) {
    this.carry = Math.min(this.carry + dt, 0.1)
    while (this.carry >= STEP) { this.step(root, target); this.carry -= STEP }
  }

  private step(root: V, target: V) {
    const { pts, prev, seg } = this
    const n = pts.length - 1
    const L = this.o.length
    // the end goes to the target, but never further than the limb can reach
    let ex = target[0] - root[0], ey = target[1] - root[1]
    const d = Math.hypot(ex, ey) || 1e-6
    if (d > L * 0.985) { ex = (ex / d) * L * 0.985; ey = (ey / d) * L * 0.985 }
    const end: V = [root[0] + ex, root[1] + ey]
    // Verlet: inner points keep their velocity (damped) and feel gravity + the sideways bow
    const dt2 = STEP * STEP
    for (let i = 1; i < n; i++) {
      const p = pts[i], q = prev[i]
      const vx = (p[0] - q[0]) * this.o.damping, vy = (p[1] - q[1]) * this.o.damping
      q[0] = p[0]; q[1] = p[1]
      // the bow pushes perpendicular to the root→end line, strongest in the middle
      const w = Math.sin((Math.PI * i) / n)
      const nx = -ey / d, ny = ex / d
      p[0] += vx + (this.o.bow * nx * w) * dt2
      p[1] += vy + (this.o.gravity * w + this.o.bow * ny * w) * dt2
    }
    pts[0][0] = root[0]; pts[0][1] = root[1]; prev[0][0] = root[0]; prev[0][1] = root[1]
    pts[n][0] = end[0]; pts[n][1] = end[1]; prev[n][0] = end[0]; prev[n][1] = end[1]
    // constraints: each segment keeps its length; points two apart stay far enough apart (no kinks)
    const minSpan = seg * 2 * (0.55 + 0.4 * this.o.stiffness)
    for (let it = 0; it < 14; it++) {
      for (let i = 0; i < n; i++) relax(pts[i], pts[i + 1], seg, i === 0, i + 1 === n)
      for (let i = 0; i + 2 <= n; i++) push(pts[i], pts[i + 2], minSpan, i === 0, i + 2 === n)
    }
    // one FABRIK pass (back from the hand, then forward from the socket): every segment ends up exactly
    // its length, so the limb can never stretch, whatever the relaxation above left over
    for (let i = n - 1; i >= 1; i--) place(pts[i], pts[i + 1], seg)
    for (let i = 1; i <= n - 1; i++) place(pts[i], pts[i - 1], seg)
  }

  /** Direction (degrees) the limb arrives at its end: the glove/sneaker turns to it. */
  endHeading(): number {
    const n = this.pts.length - 1
    const a = this.pts[n - 2], b = this.pts[n]
    return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
  }

  /** A smooth curve through the points (midpoint quadratic smoothing). */
  trace(ctx: CanvasRenderingContext2D) {
    const p = this.pts
    ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1])
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2
      ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my)
    }
    ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1])
  }
  /** The point halfway along the limb (for the bicep bump). */
  middle(): V { return this.pts[Math.floor(this.pts.length / 2)] }
}

/** Move a and b toward distance `len` (pinned ends don't move). */
function relax(a: V, b: V, len: number, aPinned: boolean, bPinned: boolean) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const d = Math.hypot(dx, dy) || 1e-6
  const diff = (d - len) / d
  const wa = aPinned ? 0 : bPinned ? 1 : 0.5, wb = bPinned ? 0 : aPinned ? 1 : 0.5
  a[0] += dx * diff * wa; a[1] += dy * diff * wa
  b[0] -= dx * diff * wb; b[1] -= dy * diff * wb
}
/** Put `a` exactly `len` from `b`, in the direction it already lies. */
function place(a: V, b: V, len: number) {
  const dx = a[0] - b[0], dy = a[1] - b[1], d = Math.hypot(dx, dy) || 1e-6
  a[0] = b[0] + (dx / d) * len; a[1] = b[1] + (dy / d) * len
}
/** Keep a and b at least `min` apart. */
function push(a: V, b: V, min: number, aPinned: boolean, bPinned: boolean) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const d = Math.hypot(dx, dy) || 1e-6
  if (d >= min) return
  const diff = (d - min) / d
  const wa = aPinned ? 0 : bPinned ? 1 : 0.5, wb = bPinned ? 0 : aPinned ? 1 : 0.5
  a[0] += dx * diff * wa; a[1] += dy * diff * wa
  b[0] -= dx * diff * wb; b[1] -= dy * diff * wb
}
