/**
 * Stick-figure rig.
 *
 * A pose is a set of WORLD directions in degrees for every body segment,
 * plus the hip position. Direction convention: 0 = pointing right (forward),
 * 90 = pointing up, 180 = left, 270 = down. Lengths are fixed, so a pose is
 * fully described by ~14 numbers. Two poses interpolated = one exercise.
 *
 * This file is pure maths: no React, no DOM. `renderShapes()` returns a list
 * of primitive shapes that React (Figure.tsx) and the Node preview script
 * (scripts/render-anims.ts) both draw.
 */

export type Vec = [number, number]

/** upper = first segment direction, lower = second, end = foot/hand direction. */
export interface Limb {
  upper: number
  lower: number
  end?: number
  /** Length multipliers for foreshortening (a limb pointing toward the viewer looks shorter). */
  k1?: number
  k2?: number
}

export interface Pose {
  hip: Vec
  /** hip -> shoulder */
  torso: number
  /** neck -> head centre */
  head: number
  armNear: Limb
  armFar: Limb
  legNear: Limb
  legFar: Limb
}

export type JointRef =
  | 'wristNear' | 'wristFar' | 'wrists'
  | 'elbowNear' | 'elbowFar'
  | 'shoulder' | 'upperBack' | 'chest' | 'hip'
  | 'kneeNear' | 'kneeFar' | 'ankleNear' | 'ankleFar' | 'toeNear' | 'toeFar'
  | 'head'

export type Prop =
  | { type: 'barbell'; at: JointRef | Vec; front?: boolean }
  | { type: 'dumbbell'; at: JointRef | Vec }
  | { type: 'kettlebell'; at: JointRef | Vec }
  | { type: 'plate'; at: JointRef | Vec }
  | { type: 'bench'; x: number; y: number; w: number; h?: number; angle?: number }
  | { type: 'box'; x: number; y: number; w: number; h: number; label?: string }
  | { type: 'floor'; y?: number }
  | { type: 'bar'; y: number; x1?: number; x2?: number }
  | { type: 'cable'; from: Vec; to: JointRef }
  | { type: 'band'; from: JointRef | Vec; to: JointRef }
  | { type: 'rope'; phase?: number }
  | { type: 'wall'; x: number }
  | { type: 'ball'; at: JointRef | Vec; r?: number }
  | { type: 'handle'; at: JointRef }

export interface Anim {
  id: string
  view: 'side' | 'front'
  keys: Pose[]
  /** ms for the transition from keys[i] to the next key (wraps for 'cycle'). */
  durations: number[]
  /** ms to hold each key before moving on (optional). */
  holds?: number[]
  loop: 'pingpong' | 'cycle'
  props?: Prop[]
  /** Mirror the near limbs onto the far limbs (front view symmetric moves). */
  mirror?: boolean
}

export const LEN = {
  torso: 34,
  neck: 7,
  headR: 9,
  upperArm: 22,
  forearm: 20,
  hand: 5,
  thigh: 30,
  shin: 28,
  foot: 11,
  shoulderW: 9, // front view half shoulder width
  hipW: 6,      // front view half hip width
}

export const FLOOR_Y = 170
export const VIEW = 200

const rad = (d: number) => (d * Math.PI) / 180
/** Move from point p by length l in world direction d (y is flipped for SVG). */
export const step = (p: Vec, d: number, l: number): Vec => [
  p[0] + Math.cos(rad(d)) * l,
  p[1] - Math.sin(rad(d)) * l,
]

/** Shortest-arc interpolation of a direction. */
export function lerpAngle(a: number, b: number, t: number): number {
  const d = ((b - a + 540) % 360) - 180
  return a + d * t
}
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t)

function lerpLimb(a: Limb, b: Limb, t: number): Limb {
  return {
    upper: lerpAngle(a.upper, b.upper, t),
    lower: lerpAngle(a.lower, b.lower, t),
    end: lerpAngle(a.end ?? 0, b.end ?? 0, t),
    k1: lerp(a.k1 ?? 1, b.k1 ?? 1, t),
    k2: lerp(a.k2 ?? 1, b.k2 ?? 1, t),
  }
}

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    hip: [lerp(a.hip[0], b.hip[0], t), lerp(a.hip[1], b.hip[1], t)],
    torso: lerpAngle(a.torso, b.torso, t),
    head: lerpAngle(a.head, b.head, t),
    armNear: lerpLimb(a.armNear, b.armNear, t),
    armFar: lerpLimb(a.armFar, b.armFar, t),
    legNear: lerpLimb(a.legNear, b.legNear, t),
    legFar: lerpLimb(a.legFar, b.legFar, t),
  }
}

/** Total loop length in ms. */
export function animLength(anim: Anim): number {
  const n = anim.keys.length
  const holds = anim.holds ?? []
  if (anim.loop === 'pingpong') {
    // 0 -> 1 -> ... -> n-1 -> ... -> 0
    let total = 0
    for (let i = 0; i < n - 1; i++) total += anim.durations[i] ?? 800
    total *= 2
    for (let i = 0; i < n; i++) total += (holds[i] ?? 0) * (i === 0 || i === n - 1 ? 1 : 2)
    return total
  }
  let total = 0
  for (let i = 0; i < n; i++) total += (anim.durations[i] ?? 800) + (holds[i] ?? 0)
  return total
}

/** The pose at time t (ms) into the loop. */
export function poseAt(anim: Anim, tMs: number): Pose {
  const n = anim.keys.length
  if (n === 1) return anim.keys[0]
  const holds = anim.holds ?? []
  const L = animLength(anim)
  let t = ((tMs % L) + L) % L

  // Build the segment list: [{from, to, dur}] with holds as from===to segments.
  const segs: { from: number; to: number; dur: number }[] = []
  const order: number[] = anim.loop === 'pingpong'
    ? [...Array.from({ length: n }, (_, i) => i), ...Array.from({ length: n - 2 }, (_, i) => n - 2 - i)]
    : Array.from({ length: n }, (_, i) => i)
  for (let k = 0; k < order.length; k++) {
    const i = order[k]
    const j = order[(k + 1) % order.length]
    if (holds[i]) segs.push({ from: i, to: i, dur: holds[i] })
    const durIdx = anim.loop === 'pingpong' ? Math.min(i, j) : i
    segs.push({ from: i, to: j, dur: anim.durations[durIdx] ?? 800 })
  }
  for (const s of segs) {
    if (t <= s.dur) {
      if (s.from === s.to) return anim.keys[s.from]
      return lerpPose(anim.keys[s.from], anim.keys[s.to], easeInOut(t / s.dur))
    }
    t -= s.dur
  }
  return anim.keys[0]
}

export interface Joints {
  hip: Vec; shoulder: Vec; neck: Vec; head: Vec
  elbowNear: Vec; wristNear: Vec; handNear: Vec
  elbowFar: Vec; wristFar: Vec; handFar: Vec
  kneeNear: Vec; ankleNear: Vec; toeNear: Vec
  kneeFar: Vec; ankleFar: Vec; toeFar: Vec
  /** front view only: separate shoulder / hip roots */
  shoulderNear: Vec; shoulderFar: Vec; hipNear: Vec; hipFar: Vec
}

export function joints(pose: Pose, view: 'side' | 'front', mirror = false): Joints {
  const hip = pose.hip
  const shoulder = step(hip, pose.torso, LEN.torso)
  const neck = step(shoulder, pose.head, LEN.neck)
  const head = step(neck, pose.head, LEN.headR)

  const armFar = mirror && view === 'front' ? mirrorLimb(pose.armNear) : pose.armFar
  const legFar = mirror && view === 'front' ? mirrorLimb(pose.legNear) : pose.legFar

  // In front view the two arms hang from the two shoulders, legs from the two hips.
  // The torso direction is used to rotate the shoulder line (so a side bend works).
  const perp = pose.torso - 90 // direction along the shoulder line, to the right
  const shoulderNear: Vec = view === 'front' ? step(shoulder, perp, LEN.shoulderW) : shoulder
  const shoulderFar: Vec = view === 'front' ? step(shoulder, perp + 180, LEN.shoulderW) : shoulder
  const hipNear: Vec = view === 'front' ? step(hip, perp, LEN.hipW) : hip
  const hipFar: Vec = view === 'front' ? step(hip, perp + 180, LEN.hipW) : hip

  const elbowNear = step(shoulderNear, pose.armNear.upper, LEN.upperArm * (pose.armNear.k1 ?? 1))
  const wristNear = step(elbowNear, pose.armNear.lower, LEN.forearm * (pose.armNear.k2 ?? 1))
  const handNear = step(wristNear, pose.armNear.end ?? pose.armNear.lower, LEN.hand)
  const elbowFar = step(shoulderFar, armFar.upper, LEN.upperArm * (armFar.k1 ?? 1))
  const wristFar = step(elbowFar, armFar.lower, LEN.forearm * (armFar.k2 ?? 1))
  const handFar = step(wristFar, armFar.end ?? armFar.lower, LEN.hand)

  const kneeNear = step(hipNear, pose.legNear.upper, LEN.thigh * (pose.legNear.k1 ?? 1))
  const ankleNear = step(kneeNear, pose.legNear.lower, LEN.shin * (pose.legNear.k2 ?? 1))
  const toeNear = step(ankleNear, pose.legNear.end ?? 0, LEN.foot)
  const kneeFar = step(hipFar, legFar.upper, LEN.thigh * (legFar.k1 ?? 1))
  const ankleFar = step(kneeFar, legFar.lower, LEN.shin * (legFar.k2 ?? 1))
  const toeFar = step(ankleFar, legFar.end ?? 0, LEN.foot)

  return {
    hip, shoulder, neck, head,
    elbowNear, wristNear, handNear, elbowFar, wristFar, handFar,
    kneeNear, ankleNear, toeNear, kneeFar, ankleFar, toeFar,
    shoulderNear, shoulderFar, hipNear, hipFar,
  }
}

function mirrorLimb(l: Limb): Limb {
  return { upper: 180 - l.upper, lower: 180 - l.lower, end: l.end === undefined ? undefined : 180 - l.end, k1: l.k1, k2: l.k2 }
}

/**
 * Two-bone inverse kinematics: directions for a limb whose root is at `root`
 * and whose end must land on `target`. `bend` = +1 bends the joint toward the
 * left of the root->target line (counter-clockwise), -1 the other way.
 * If the target is out of reach the limb straightens and stretches (k factors).
 */
export function solveLimb(root: Vec, target: Vec, l1: number, l2: number, bend: 1 | -1, end?: number): Limb {
  const dx = target[0] - root[0]
  const dy = -(target[1] - root[1]) // world y up
  const d = Math.hypot(dx, dy)
  const base = (Math.atan2(dy, dx) * 180) / Math.PI
  if (d >= l1 + l2 - 0.01) {
    const k = d / (l1 + l2)
    return { upper: base, lower: base, end, k1: k, k2: k }
  }
  // law of cosines
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
  const a = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI
  const upper = base + bend * a
  const elbow = step(root, upper, l1)
  const lower = (Math.atan2(-(target[1] - elbow[1]), target[0] - elbow[0]) * 180) / Math.PI
  return { upper, lower, end }
}

const mid = (a: Vec, b: Vec): Vec => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

export function resolveRef(ref: JointRef | Vec, j: Joints): Vec {
  if (Array.isArray(ref)) return ref
  switch (ref) {
    case 'wrists': return mid(j.wristNear, j.wristFar)
    case 'upperBack': return step(j.shoulder, 180 + 0, 4) // just behind the shoulder in side view
    case 'chest': return step(j.shoulder, 0, 6)
    default: return j[ref as keyof Joints] as Vec
  }
}

/* ---------- Primitive shapes ---------- */

export type Shape =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; width: number; dash?: string; opacity?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill?: string; stroke?: string; width?: number; opacity?: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; fill?: string; stroke?: string; rx?: number; angle?: number; opacity?: number }
  | { kind: 'path'; d: string; stroke: string; width: number; fill?: string; opacity?: number }
  | { kind: 'text'; x: number; y: number; text: string; fill: string; size: number; opacity?: number }

export const COLORS = {
  near: '#f1f5f9',
  far: '#64748b',
  farFront: '#cbd5e1',
  torso: '#f1f5f9',
  weight: '#f5b84a',
  weightDark: '#b57912',
  gear: '#475569',
  gearLight: '#64748b',
  floor: '#334155',
  cable: '#94a3b8',
}

const LIMB_W = 5.5

function limbLines(a: Vec, b: Vec, c: Vec, d: Vec | null, color: string, opacity = 1): Shape[] {
  const s: Shape[] = [
    { kind: 'line', x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: color, width: LIMB_W, opacity },
    { kind: 'line', x1: b[0], y1: b[1], x2: c[0], y2: c[1], stroke: color, width: LIMB_W, opacity },
  ]
  if (d) s.push({ kind: 'line', x1: c[0], y1: c[1], x2: d[0], y2: d[1], stroke: color, width: LIMB_W - 1, opacity })
  return s
}

/** Everything to draw for one frame, back to front. */
export function renderShapes(anim: Anim, pose: Pose): Shape[] {
  const j = joints(pose, anim.view, anim.mirror)
  const out: Shape[] = []
  const props = anim.props ?? []

  // 1. background props (floor, wall, bench, boxes, bar, cable anchors)
  for (const p of props) {
    if (p.type === 'floor') {
      const y = p.y ?? FLOOR_Y
      out.push({ kind: 'line', x1: 6, y1: y, x2: VIEW - 6, y2: y, stroke: COLORS.floor, width: 3 })
    } else if (p.type === 'wall') {
      out.push({ kind: 'line', x1: p.x, y1: 20, x2: p.x, y2: FLOOR_Y, stroke: COLORS.floor, width: 4 })
    } else if (p.type === 'bench') {
      const h = p.h ?? 7
      out.push({ kind: 'rect', x: p.x, y: p.y, w: p.w, h, fill: COLORS.gear, rx: 3, angle: p.angle })
      // legs
      out.push({ kind: 'line', x1: p.x + 10, y1: p.y + h, x2: p.x + 10, y2: FLOOR_Y, stroke: COLORS.gear, width: 4 })
      out.push({ kind: 'line', x1: p.x + p.w - 10, y1: p.y + h, x2: p.x + p.w - 10, y2: FLOOR_Y, stroke: COLORS.gear, width: 4 })
    } else if (p.type === 'box') {
      out.push({ kind: 'rect', x: p.x, y: p.y, w: p.w, h: p.h, fill: COLORS.gear, rx: 4 })
      if (p.label) out.push({ kind: 'text', x: p.x + p.w / 2, y: p.y + p.h / 2 + 3, text: p.label, fill: '#0b0c10', size: 7 })
    } else if (p.type === 'bar') {
      if (anim.view === 'front') {
        out.push({ kind: 'line', x1: p.x1 ?? 30, y1: p.y, x2: p.x2 ?? VIEW - 30, y2: p.y, stroke: COLORS.gearLight, width: 4 })
      } else {
        out.push({ kind: 'circle', cx: (p.x1 ?? 100), cy: p.y, r: 4, fill: COLORS.gearLight })
      }
    }
  }

  // 2. far limbs (in front view both sides face the viewer, so only a subtle shade difference)
  const farColor = anim.view === 'front' ? COLORS.farFront : COLORS.far
  out.push(...limbLines(j.hipFar, j.kneeFar, j.ankleFar, j.toeFar, farColor))
  out.push(...limbLines(j.shoulderFar, j.elbowFar, j.wristFar, j.handFar, farColor))

  // 3. torso + head
  if (anim.view === 'front') {
    // shoulders line, hips line, and a torso body
    out.push({ kind: 'line', x1: j.shoulderFar[0], y1: j.shoulderFar[1], x2: j.shoulderNear[0], y2: j.shoulderNear[1], stroke: COLORS.torso, width: LIMB_W + 1 })
    out.push({ kind: 'line', x1: j.hipFar[0], y1: j.hipFar[1], x2: j.hipNear[0], y2: j.hipNear[1], stroke: COLORS.torso, width: LIMB_W + 1 })
    out.push({ kind: 'path', d: `M${j.shoulderFar[0]},${j.shoulderFar[1]} L${j.shoulderNear[0]},${j.shoulderNear[1]} L${j.hipNear[0]},${j.hipNear[1]} L${j.hipFar[0]},${j.hipFar[1]} Z`, stroke: COLORS.torso, width: 2, fill: COLORS.torso, opacity: 0.9 })
  } else {
    out.push({ kind: 'line', x1: j.hip[0], y1: j.hip[1], x2: j.shoulder[0], y2: j.shoulder[1], stroke: COLORS.torso, width: LIMB_W + 2 })
  }
  out.push({ kind: 'line', x1: j.shoulder[0], y1: j.shoulder[1], x2: j.neck[0], y2: j.neck[1], stroke: COLORS.torso, width: LIMB_W - 1 })
  out.push({ kind: 'circle', cx: j.head[0], cy: j.head[1], r: LEN.headR, fill: COLORS.torso })

  // 4. near limbs
  out.push(...limbLines(j.hipNear, j.kneeNear, j.ankleNear, j.toeNear, COLORS.near))
  out.push(...limbLines(j.shoulderNear, j.elbowNear, j.wristNear, j.handNear, COLORS.near))

  // 5. foreground props (weights, cables, bands, rope, balls)
  for (const p of props) {
    if (p.type === 'barbell') {
      const at = resolveRef(p.at, j)
      if (anim.view === 'front' || p.front) {
        out.push({ kind: 'line', x1: at[0] - 48, y1: at[1], x2: at[0] + 48, y2: at[1], stroke: COLORS.gearLight, width: 3.5 })
        for (const sx of [-1, 1]) {
          out.push({ kind: 'rect', x: at[0] + sx * 40 - 3, y: at[1] - 12, w: 6, h: 24, fill: COLORS.weight, rx: 1.5 })
          out.push({ kind: 'rect', x: at[0] + sx * 46 - 2.5, y: at[1] - 9, w: 5, h: 18, fill: COLORS.weightDark, rx: 1.5 })
        }
      } else {
        // side view: the plate is a circle end-on, the bar a dot
        out.push({ kind: 'circle', cx: at[0], cy: at[1], r: 11, fill: COLORS.weight, opacity: 0.95 })
        out.push({ kind: 'circle', cx: at[0], cy: at[1], r: 7.5, fill: COLORS.weightDark })
        out.push({ kind: 'circle', cx: at[0], cy: at[1], r: 2.5, fill: COLORS.gearLight })
      }
    } else if (p.type === 'plate') {
      const at = resolveRef(p.at, j)
      out.push({ kind: 'circle', cx: at[0], cy: at[1], r: 10, fill: COLORS.weight })
      out.push({ kind: 'circle', cx: at[0], cy: at[1], r: 3, fill: COLORS.weightDark })
    } else if (p.type === 'dumbbell') {
      const at = resolveRef(p.at, j)
      out.push({ kind: 'rect', x: at[0] - 7, y: at[1] - 4, w: 14, h: 8, fill: COLORS.weight, rx: 2 })
      out.push({ kind: 'rect', x: at[0] - 2, y: at[1] - 2, w: 4, h: 4, fill: COLORS.weightDark, rx: 1 })
    } else if (p.type === 'kettlebell') {
      const at = resolveRef(p.at, j)
      out.push({ kind: 'circle', cx: at[0], cy: at[1] + 9, r: 8, fill: COLORS.weight })
      out.push({ kind: 'path', d: `M${at[0] - 5},${at[1] + 3} Q${at[0]},${at[1] - 6} ${at[0] + 5},${at[1] + 3}`, stroke: COLORS.weightDark, width: 3 })
    } else if (p.type === 'cable') {
      const to = resolveRef(p.to, j)
      out.push({ kind: 'line', x1: p.from[0], y1: p.from[1], x2: to[0], y2: to[1], stroke: COLORS.cable, width: 2, dash: '4 3' })
      out.push({ kind: 'circle', cx: p.from[0], cy: p.from[1], r: 5, fill: COLORS.gear })
      out.push({ kind: 'rect', x: to[0] - 4, y: to[1] - 3, w: 8, h: 6, fill: COLORS.gearLight, rx: 2 })
    } else if (p.type === 'band') {
      const from = resolveRef(p.from, j)
      const to = resolveRef(p.to, j)
      out.push({ kind: 'line', x1: from[0], y1: from[1], x2: to[0], y2: to[1], stroke: COLORS.weight, width: 2.5 })
    } else if (p.type === 'ball') {
      const at = resolveRef(p.at, j)
      out.push({ kind: 'circle', cx: at[0], cy: at[1], r: p.r ?? 8, fill: COLORS.weight })
    } else if (p.type === 'handle') {
      const at = resolveRef(p.at, j)
      out.push({ kind: 'rect', x: at[0] - 4, y: at[1] - 3, w: 8, h: 6, fill: COLORS.gearLight, rx: 2 })
    } else if (p.type === 'rope') {
      // jump rope: an arc under/over the figure depending on phase (0..1)
      const ph = p.phase ?? 0
      const cx = j.hip[0]
      const top = j.head[1] - 20
      const bottom = FLOOR_Y + 2
      const y = ph < 0.5 ? bottom : top
      const bulge = ph < 0.5 ? 26 : -26
      out.push({ kind: 'path', d: `M${j.wristNear[0]},${j.wristNear[1]} Q${cx},${y + bulge} ${j.wristFar[0]},${j.wristFar[1]}`, stroke: COLORS.cable, width: 2 })
    }
  }
  return out
}

/** Serialise shapes to an SVG string (used by the preview script and thumbnails). */
export function shapesToSvg(shapes: Shape[], size = VIEW): string {
  const parts = shapes.map((s) => {
    const op = s.opacity !== undefined ? ` opacity="${s.opacity}"` : ''
    switch (s.kind) {
      case 'line':
        return `<line x1="${f(s.x1)}" y1="${f(s.y1)}" x2="${f(s.x2)}" y2="${f(s.y2)}" stroke="${s.stroke}" stroke-width="${s.width}" stroke-linecap="round"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}${op}/>`
      case 'circle':
        return `<circle cx="${f(s.cx)}" cy="${f(s.cy)}" r="${s.r}" fill="${s.fill ?? 'none'}"${s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.width ?? 2}"` : ''}${op}/>`
      case 'rect': {
        const tr = s.angle ? ` transform="rotate(${s.angle} ${f(s.x + s.w / 2)} ${f(s.y + s.h / 2)})"` : ''
        return `<rect x="${f(s.x)}" y="${f(s.y)}" width="${f(s.w)}" height="${f(s.h)}" fill="${s.fill ?? 'none'}"${s.stroke ? ` stroke="${s.stroke}"` : ''} rx="${s.rx ?? 0}"${tr}${op}/>`
      }
      case 'path':
        return `<path d="${s.d}" stroke="${s.stroke}" stroke-width="${s.width}" fill="${s.fill ?? 'none'}" stroke-linecap="round" stroke-linejoin="round"${op}/>`
      case 'text':
        return `<text x="${f(s.x)}" y="${f(s.y)}" fill="${s.fill}" font-size="${s.size}" text-anchor="middle" font-family="sans-serif">${s.text}</text>`
    }
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" width="${size}" height="${size}"><rect width="${VIEW}" height="${VIEW}" fill="#12141b"/>${parts.join('')}</svg>`
}

const f = (n: number) => Math.round(n * 10) / 10
