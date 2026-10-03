/**
 * A two-bone limb (upper arm + forearm, or thigh + shin) solved with analytic IK, the standard rig of
 * games and of After Effects tools like Duik and RubberHose's "realism" mode. Both bones stay straight
 * and keep their length; the only soft thing is a small rounded elbow where they meet. Nothing wobbles
 * on its own: the limb goes exactly where the (spring-smoothed) hand target sends it.
 *
 * Which side the elbow bends to comes from a pole direction (elbows point out and down, knees out).
 * When a pose makes the elbow change sides, it swings through over ~0.15 s instead of snapping, which
 * is how a real elbow looks when it turns in 3D and is seen flat.
 */
export type V = [number, number]

export class Limb {
  root: V = [0, 0]
  joint: V = [0, 0]
  end: V = [0, 0]
  readonly upper: number
  readonly lower: number
  private pole: V
  private side = 1
  constructor(upper: number, lower: number, pole: V, root: V, end: V) {
    this.upper = upper; this.lower = lower; this.pole = pole
    this.side = this.wanted(root, end)
    this.solve(root, end, 0)
  }

  /** Which side the elbow should be on for this root → end, by the pole (+1 / −1). */
  private wanted(root: V, end: V): number {
    const dx = end[0] - root[0], dy = end[1] - root[1], d = Math.hypot(dx, dy) || 1e-6
    const dot = (-dy / d) * this.pole[0] + (dx / d) * this.pole[1]
    // a small dead zone so the elbow doesn't flicker when the arm points along the pole
    return Math.abs(dot) < 0.12 ? this.side : Math.sign(dot)
  }

  /** Put the root at `root` and the end as close to `target` as the bones reach. */
  solve(root: V, target: V, dt: number) {
    const u = this.upper, l = this.lower
    let dx = target[0] - root[0], dy = target[1] - root[1]
    const raw = Math.hypot(dx, dy) || 1e-6
    const d = Math.min(Math.max(raw, Math.abs(u - l) + 1), (u + l) * 0.999)
    dx = (dx / raw) * d; dy = (dy / raw) * d
    const want = this.wanted(root, target)
    const k = dt > 0 ? Math.min(1, dt * 13) : 1
    this.side += (want - this.side) * k
    // law of cosines: how far along root→end the elbow sits, and how far out to the side
    const a = (u * u - l * l + d * d) / (2 * d)
    const h = Math.sqrt(Math.max(0, u * u - a * a))
    const nx = -dy / d, ny = dx / d
    this.root = root
    this.end = [root[0] + dx, root[1] + dy]
    this.joint = [root[0] + (dx / d) * a + nx * h * this.side, root[1] + (dy / d) * a + ny * h * this.side]
  }

  /** Direction of the lower bone (degrees): the glove / sneaker turns with it. */
  heading(): number { return (Math.atan2(this.end[1] - this.joint[1], this.end[0] - this.joint[0]) * 180) / Math.PI }

  /** Two straight bones with a small rounded joint. */
  trace(ctx: CanvasRenderingContext2D, round = 16) {
    const [r, j, e] = [this.root, this.joint, this.end]
    const r1 = Math.min(round, this.upper * 0.4), r2 = Math.min(round, this.lower * 0.4)
    const a: V = towards(j, r, r1), b: V = towards(j, e, r2)
    ctx.beginPath(); ctx.moveTo(r[0], r[1]); ctx.lineTo(a[0], a[1]); ctx.quadraticCurveTo(j[0], j[1], b[0], b[1]); ctx.lineTo(e[0], e[1])
  }
  /** A point 60 % along the upper bone, pushed `out` px toward the side the lower bone folds to (the bicep). */
  bicep(out: number): V {
    const mx = this.root[0] + (this.joint[0] - this.root[0]) * 0.6, my = this.root[1] + (this.joint[1] - this.root[1]) * 0.6
    const dx = this.joint[0] - this.root[0], dy = this.joint[1] - this.root[1], d = Math.hypot(dx, dy) || 1
    let nx = -dy / d, ny = dx / d
    if (nx * (this.end[0] - this.joint[0]) + ny * (this.end[1] - this.joint[1]) < 0) { nx = -nx; ny = -ny }
    return [mx + nx * out, my + ny * out]
  }
}

/** The point `dist` from `from` toward `to`. */
function towards(from: V, to: V, dist: number): V {
  const dx = to[0] - from[0], dy = to[1] - from[1], d = Math.hypot(dx, dy) || 1e-6
  return [from[0] + (dx / d) * dist, from[1] + (dy / d) * dist]
}
