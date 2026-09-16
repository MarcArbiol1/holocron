/**
 * Pose helpers. Exercises live in anims.ts; this file has the vocabulary
 * they are written in. All directions: 0 = forward (right), 90 = up.
 */
import { FLOOR_Y, LEN, solveLimb, step, type Anim, type Limb, type Pose, type Vec } from './rig.ts'

export const STAND_HIP_Y = FLOOR_Y - LEN.shin - LEN.thigh - 3 // ankle sits 3 above the floor line

export const limb = (upper: number, lower: number, end?: number, k1?: number, k2?: number): Limb => ({ upper, lower, end, k1, k2 })

/** Neutral standing pose, facing right, arms hanging. */
export const STAND: Pose = {
  hip: [90, STAND_HIP_Y],
  torso: 90,
  head: 90,
  armNear: limb(270, 270),
  armFar: limb(270, 270),
  legNear: limb(270, 270, 0),
  legFar: limb(270, 270, 0),
}

export function pose(over: Partial<Pose>): Pose {
  return { ...STAND, ...over }
}
export const arms = (upper: number, lower: number, end?: number, k1?: number, k2?: number) => ({
  armNear: limb(upper, lower, end, k1, k2),
  armFar: limb(upper, lower, end, k1, k2),
})
export const legs = (upper: number, lower: number, end = 0, k1?: number, k2?: number) => ({
  legNear: limb(upper, lower, end, k1, k2),
  legFar: limb(upper, lower, end, k1, k2),
})

/** Where the shoulder is for a given hip + torso direction. */
export const shoulderOf = (hip: Vec, torso: number): Vec => step(hip, torso, LEN.torso)

/** Arm directions so the wrist lands on `target`. bend +1 = elbow bends counter-clockwise. */
export function armTo(shoulder: Vec, target: Vec, bend: 1 | -1 = -1, end?: number): Limb {
  return solveLimb(shoulder, target, LEN.upperArm, LEN.forearm, bend, end)
}
/** Leg directions so the ankle lands on `target`. bend -1 = knee forward (normal). */
export function legTo(hip: Vec, target: Vec, bend: 1 | -1 = 1, foot = 0): Limb {
  return solveLimb(hip, target, LEN.thigh, LEN.shin, bend, foot)
}

/** Both arms to the same target. */
export function bothArmsTo(shoulder: Vec, target: Vec, bend: 1 | -1 = -1, end?: number) {
  const l = armTo(shoulder, target, bend, end)
  return { armNear: l, armFar: { ...l } }
}
export function bothLegsTo(hip: Vec, target: Vec, bend: 1 | -1 = 1, foot = 0) {
  const l = legTo(hip, target, bend, foot)
  return { legNear: l, legFar: { ...l } }
}

export const FLOOR = { type: 'floor' as const }

/** Convenience for a two-key ping-pong exercise. */
export function rep(id: string, view: 'side' | 'front', a: Pose, b: Pose, opts: Partial<Anim> = {}): Anim {
  return {
    id,
    view,
    keys: [a, b],
    durations: [opts.durations?.[0] ?? 900],
    holds: opts.holds ?? [150, 150],
    loop: 'pingpong',
    props: opts.props ?? [FLOOR],
    mirror: opts.mirror,
  }
}
