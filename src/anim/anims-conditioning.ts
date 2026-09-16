/**
 * Core, cardio, mobility (THE FORGE drills) and balance animations.
 * Owned by the conditioning batch. Do not edit anims-strength.ts from here.
 */
import { FLOOR_Y, LEN, step, type Anim, type Pose, type Vec } from './rig.ts'
import { FLOOR, STAND_HIP_Y, armTo, bothArmsTo, bothLegsTo, legTo, arms, legs, limb, pose, rep, shoulderOf } from './poses.ts'

const A: Record<string, Anim> = {}

/** World-direction (degrees) of a vector given dx and dy-up. */
const deg = (dx: number, dyUp: number) => (Math.atan2(dyUp, dx) * 180) / Math.PI

/** Hip + torso direction for a straight body line from shoulder to ankle (plank, push-up position). */
function lineBody(shoulder: Vec, ankle: Vec) {
  const dir = deg(ankle[0] - shoulder[0], -(ankle[1] - shoulder[1]))
  const hip = step(shoulder, dir, LEN.torso)
  return { hip, torso: (dir + 180) % 360 }
}
/** Head centre for a hip/torso/head triple. */
function headCentre(hip: Vec, torso: number, head: number): Vec {
  const s = shoulderOf(hip, torso)
  return step(step(s, head, LEN.neck), head, LEN.headR)
}
const kneel = limb(270, 180, 180) // thigh down to a knee on the floor, shin back along the floor
const FLOORP = FLOOR

/* ================= CORE ================= */
{
  // Plank: forearms on the floor, straight line from head to heels, toes tucked.
  const build = (lift: number): Pose => {
    const shoulder: Vec = [62, 145 - lift]
    const ankle: Vec = [152, FLOOR_Y - LEN.foot - lift]
    const { hip, torso } = lineBody(shoulder, ankle)
    return pose({ hip, torso, head: torso, ...arms(270, 0, 0), ...bothLegsTo(hip, ankle, 1, 270) })
  }
  A.plank = rep('plank', 'side', build(0), build(1.5), { durations: [1600], holds: [200, 200] })
}
{
  // Side plank seen from the front: bottom forearm on the floor, top arm up, feet stacked.
  const build = (lift: number): Pose => {
    const hip: Vec = [110, 147 - lift]
    const torso = 165
    const perp = torso - 90
    const hipNear = step(hip, perp, LEN.hipW)
    const hipFar = step(hip, perp + 180, LEN.hipW)
    return pose({
      hip, torso, head: torso,
      armNear: limb(90, 90, 90),
      armFar: limb(270, 0, 0),
      legNear: legTo(hipNear, [166, 158], 1, 270),
      legFar: legTo(hipFar, [165, 159], 1, 270),
    })
  }
  A.sidePlank = { id: 'sidePlank', view: 'front', keys: [build(0), build(2)], durations: [1600], holds: [200, 200], loop: 'pingpong', props: [FLOORP] }
}
{
  // Dead bug: on the back, arms up, knees over hips; opposite arm and leg reach out and hover.
  const hip: Vec = [100, FLOOR_Y - 6]
  const base = pose({ hip, torso: 180, head: 180 })
  const kneeUp = limb(90, 0, 300)
  const a: Pose = { ...base, ...arms(90, 90, 90), legNear: kneeUp, legFar: kneeUp }
  const b: Pose = { ...base, armNear: limb(172, 172, 172), armFar: limb(90, 90, 90), legNear: kneeUp, legFar: limb(10, 5, 280) }
  A.deadBug = rep('deadBug', 'side', a, b, { durations: [1000], holds: [200, 300] })
}
{
  // Bird dog: hands and knees, then near arm forward and far leg back, both level with the torso.
  const knee: Vec = [85, FLOOR_Y - 3]
  const hip: Vec = [85, knee[1] - LEN.thigh]
  const shoulder: Vec = [117, FLOOR_Y - 3 - LEN.upperArm - LEN.forearm]
  const torso = deg(shoulder[0] - hip[0], -(shoulder[1] - hip[1]))
  const base = pose({ hip, torso, head: torso - 8 })
  const a: Pose = { ...base, ...arms(270, 270, 0), legNear: kneel, legFar: kneel }
  const b: Pose = { ...base, armNear: limb(15, 15, 15), armFar: limb(270, 270, 0), legNear: kneel, legFar: limb(178, 178, 270) }
  A.birdDog = rep('birdDog', 'side', a, b, { durations: [900], holds: [200, 500] })
}
{
  // Hanging knee raise: hang from a bar, curl the knees to the chest.
  const a = pose({ hip: [100, 106], torso: 90, head: 90, ...arms(90, 90, 90), ...legs(270, 268, 300) })
  const b = pose({ hip: [104, 103], torso: 96, head: 92, ...arms(90, 90, 90), ...legs(85, 280, 300) })
  A.hangingKneeRaise = rep('hangingKneeRaise', 'side', a, b, { props: [{ type: 'bar', y: 30, x1: 100 }], durations: [900], holds: [150, 250] })
}
{
  // Cable crunch: kneeling, rope at the forehead, ribs curl toward the hips.
  const knee: Vec = [100, FLOOR_Y - 3]
  const hip: Vec = [100, knee[1] - LEN.thigh]
  const mk = (torso: number, head: number, off: Vec): Pose => {
    const hc = headCentre(hip, torso, head)
    return pose({ hip, torso, head, ...bothArmsTo(shoulderOf(hip, torso), [hc[0] + off[0], hc[1] + off[1]], -1), legNear: kneel, legFar: kneel })
  }
  A.cableCrunch = rep('cableCrunch', 'side', mk(85, 85, [8, -1]), mk(40, 20, [6, 4]), {
    props: [FLOORP, { type: 'box', x: 172, y: 12, w: 12, h: 158 }, { type: 'cable', from: [172, 22], to: 'wrists' }],
    durations: [900],
  })
}
{
  // Crunch: on the back, knees bent, hands by the ears, shoulders curl off the floor.
  const hip: Vec = [105, FLOOR_Y - 6]
  const legsBent = bothLegsTo(hip, [142, FLOOR_Y - 3], 1, 0)
  const mk = (torso: number, head: number): Pose => {
    const hc = headCentre(hip, torso, head)
    return pose({ hip, torso, head, ...bothArmsTo(shoulderOf(hip, torso), [hc[0] + 2, hc[1] - 4], -1), ...legsBent })
  }
  A.crunch = rep('crunch', 'side', mk(180, 180), mk(158, 128), { durations: [800] })
}
{
  // Pallof press seen from the front: cable pulls from the right, hands press straight out (foreshortened).
  const hip: Vec = [100, STAND_HIP_Y]
  const a = pose({ hip, torso: 90, head: 90, armNear: limb(330, 195, 195, 0.7, 0.9), ...legs(278, 278, 300) })
  const b = pose({ hip, torso: 90, head: 90, armNear: limb(265, 265, 265, 0.55, 0.55), ...legs(278, 278, 300) })
  A.palloffPress = rep('palloffPress', 'front', a, b, {
    props: [FLOORP, { type: 'box', x: 180, y: 20, w: 10, h: 150 }, { type: 'cable', from: [180, 88], to: 'wrists' }],
    durations: [800], holds: [200, 400], mirror: true,
  })
}
{
  // Hollow hold: lower back on the floor, shoulders and straight legs hover, arms overhead.
  const mk = (lift: number): Pose => pose({ hip: [100, FLOOR_Y - 8], torso: 165 + lift, head: 150 + lift, ...arms(160 + lift, 160 + lift, 160), ...legs(12 + lift, 12 + lift, 12) })
  A.hollowHold = rep('hollowHold', 'side', mk(0), mk(2), { durations: [1500], holds: [200, 200] })
}
{
  // Lying leg raise: hands under the hips, straight legs go from hovering to vertical.
  const base = pose({ hip: [100, FLOOR_Y - 6], torso: 180, head: 180, ...arms(0, 0, 0) })
  A.lyingLegRaise = rep('lyingLegRaise', 'side', { ...base, ...legs(3, 3, 330) }, { ...base, ...legs(88, 88, 340) }, { durations: [900] })
}

/* ================= CARDIO ================= */
{
  // Incline treadmill walk: 4-key walking cycle on a deck with a console post in front.
  const hip: Vec = [96, STAND_HIP_Y]
  const fwd = limb(290, 282, 15)
  const mid = limb(270, 270, 0)
  const back = limb(250, 258, 325)
  const swing = limb(278, 238, 310)
  const armF = limb(292, 335, 335)
  const armB = limb(245, 285, 285)
  const armM = limb(270, 300, 300)
  const k = (ln: ReturnType<typeof limb>, lf: ReturnType<typeof limb>, an: ReturnType<typeof limb>, af: ReturnType<typeof limb>, dy: number): Pose =>
    pose({ hip: [hip[0], hip[1] + dy], torso: 86, head: 90, legNear: ln, legFar: lf, armNear: an, armFar: af })
  A.inclineWalk = {
    id: 'inclineWalk', view: 'side', loop: 'cycle',
    keys: [k(fwd, back, armB, armF, 0), k(mid, swing, armM, armM, -1), k(back, fwd, armF, armB, 0), k(swing, mid, armM, armM, -1)],
    durations: [350, 350, 350, 350],
    props: [{ type: 'box', x: 30, y: FLOOR_Y, w: 130, h: 6 }, { type: 'box', x: 160, y: 90, w: 5, h: 86 }, { type: 'box', x: 150, y: 88, w: 16, h: 5 }],
  }
}
{
  // Easy run: knee drive, landing under the hips, push-off, heel recovery. Torso leans slightly forward.
  const drive = limb(335, 275, 300)
  const push = limb(252, 244, 300)
  const land = limb(280, 268, 0)
  const recover = limb(262, 160, 250)
  const armF = limb(300, 10, 10)
  const armB = limb(230, 320, 320)
  const armM = limb(270, 355, 355)
  const k = (ln: ReturnType<typeof limb>, lf: ReturnType<typeof limb>, an: ReturnType<typeof limb>, af: ReturnType<typeof limb>, y: number): Pose =>
    pose({ hip: [96, y], torso: 80, head: 86, legNear: ln, legFar: lf, armNear: an, armFar: af })
  A.run = {
    id: 'run', view: 'side', loop: 'cycle',
    keys: [k(drive, push, armB, armF, 104), k(land, recover, armM, armM, 109), k(push, drive, armF, armB, 104), k(recover, land, armM, armM, 109)],
    durations: [260, 260, 260, 260],
    props: [FLOORP],
  }
}
{
  // Stationary bike: seated, leaning to the bars, feet trace a circle around the crank.
  const hip: Vec = [95, 112]
  const torso = 62
  const s = shoulderOf(hip, torso)
  const armsOn = bothArmsTo(s, [147, 100], -1)
  const crank: Vec = [112, 148]
  const R = 13
  const ankleAt = (p: number): Vec => [crank[0] + R * Math.cos((p * Math.PI) / 180), crank[1] - R * Math.sin((p * Math.PI) / 180)]
  const k = (p: number): Pose => pose({ hip, torso, head: 72, ...armsOn, legNear: legTo(hip, ankleAt(p), 1, 0), legFar: legTo(hip, ankleAt(p + 180), 1, 0) })
  A.bike = {
    id: 'bike', view: 'side', loop: 'cycle',
    keys: [k(0), k(-90), k(180), k(90)],
    durations: [300, 300, 300, 300],
    props: [FLOORP, { type: 'box', x: 56, y: 164, w: 104, h: 6 }, { type: 'box', x: 94, y: 120, w: 5, h: 46 }, { type: 'box', x: 84, y: 116, w: 22, h: 5 }, { type: 'box', x: 150, y: 101, w: 5, h: 63 }, { type: 'box', x: 144, y: 97, w: 14, h: 5 }],
  }
}
{
  // Rowing machine: catch -> drive -> finish -> recovery. Feet fixed on the plate, handle on a chain.
  const ankle: Vec = [138, 156]
  const mk = (hip: Vec, torso: number, head: number, handle: Vec, bend: 1 | -1): Pose =>
    pose({ hip, torso, head, ...bothArmsTo(shoulderOf(hip, torso), handle, bend), ...bothLegsTo(hip, ankle, 1, 60) })
  A.rower = {
    id: 'rower', view: 'side', loop: 'cycle',
    keys: [mk([112, 150], 62, 65, [168, 128], -1), mk([92, 150], 82, 84, [140, 126], -1), mk([82, 150], 105, 100, [90, 126], -1), mk([100, 150], 70, 74, [152, 128], -1)],
    durations: [420, 360, 420, 520],
    props: [FLOORP, { type: 'box', x: 40, y: 160, w: 112, h: 5 }, { type: 'box', x: 146, y: 140, w: 6, h: 28 }, { type: 'box', x: 170, y: 96, w: 14, h: 74 }, { type: 'cable', from: [170, 126], to: 'wrists' }, { type: 'handle', at: 'wrists' }],
  }
}
{
  // Elliptical: upright, feet glide on an ellipse, hands on the moving handles swinging opposite the legs.
  const hip: Vec = [94, 106]
  const s = shoulderOf(hip, 88)
  const c: Vec = [98, 150]
  const ankleAt = (p: number): Vec => [c[0] + 22 * Math.cos((p * Math.PI) / 180), c[1] - 7 * Math.sin((p * Math.PI) / 180)]
  const k = (p: number): Pose => {
    const cp = Math.cos((p * Math.PI) / 180)
    return pose({ hip, torso: 88, head: 90, armNear: armTo(s, [122 - 8 * cp, 92], -1), armFar: armTo(s, [122 + 8 * cp, 92], -1), legNear: legTo(hip, ankleAt(p), 1, 0), legFar: legTo(hip, ankleAt(p + 180), 1, 0) })
  }
  A.elliptical = {
    id: 'elliptical', view: 'side', loop: 'cycle',
    keys: [k(0), k(-90), k(180), k(90)],
    durations: [320, 320, 320, 320],
    props: [FLOORP, { type: 'box', x: 50, y: 164, w: 110, h: 6 }, { type: 'box', x: 112, y: 50, w: 6, h: 114 }],
  }
}
{
  // Jump rope seen from the front: elbows in, wrists turn, small hops on the balls of the feet.
  const ground = pose({ hip: [100, 108], torso: 90, head: 90, armNear: limb(285, 345, 345), legNear: limb(279, 276, 350) })
  const air = pose({ hip: [100, 100], torso: 90, head: 90, armNear: limb(285, 15, 15), legNear: limb(277, 277, 300) })
  A.jumpRope = rep('jumpRope', 'front', ground, air, { durations: [230], holds: [60, 0], mirror: true, props: [FLOORP, { type: 'rope', phase: 0 }] })
}
{
  // Burpee: jump -> crouch -> plank -> push-up -> plank -> crouch.
  const handsX = 88
  const jump = pose({ hip: [72, 96], torso: 90, head: 90, ...arms(95, 95, 95), ...legs(275, 275, 300) })
  const crouchHip: Vec = [66, 142]
  const crouch = pose({ hip: crouchHip, torso: 35, head: 50, ...bothArmsTo(shoulderOf(crouchHip, 35), [handsX, FLOOR_Y - 3], -1), ...bothLegsTo(crouchHip, [80, FLOOR_Y - 3], 1, 0) })
  const plankS: Vec = [handsX, 125]
  const plankA: Vec = [173.5, FLOOR_Y - LEN.foot]
  const pl = lineBody(plankS, plankA)
  const plank = pose({ hip: pl.hip, torso: pl.torso, head: pl.torso, ...arms(270, 270, 0), ...bothLegsTo(pl.hip, plankA, 1, 270) })
  const downS: Vec = [handsX, 150]
  const downA: Vec = [176, FLOOR_Y - LEN.foot + 2]
  const dn = lineBody(downS, downA)
  const down = pose({ hip: dn.hip, torso: dn.torso, head: dn.torso, ...bothArmsTo(downS, [handsX, FLOOR_Y - 3], -1), ...bothLegsTo(dn.hip, downA, 1, 270) })
  A.burpee = { id: 'burpee', view: 'side', loop: 'cycle', keys: [jump, crouch, plank, down, plank, crouch], durations: [380, 320, 320, 380, 320, 320], props: [FLOORP] }
}
{
  // Jumping jacks from the front: feet together arms down <-> feet apart arms overhead.
  const a = pose({ hip: [100, 108], torso: 90, head: 90, armNear: limb(280, 280, 280), legNear: limb(272, 272, 340) })
  const b = pose({ hip: [100, 106], torso: 90, head: 90, armNear: limb(65, 80, 80), legNear: limb(290, 290, 340) })
  A.jumpingJacks = rep('jumpingJacks', 'front', a, b, { durations: [300], holds: [40, 40], mirror: true })
}
{
  // Mountain climbers: push-up position (head to the left), knees drive to the chest alternately.
  const s: Vec = [78, 125]
  const ext: Vec = [163.5, FLOOR_Y - LEN.foot]
  const { hip, torso } = lineBody(s, ext)
  const base = pose({ hip, torso, head: torso + 4, ...arms(270, 270, 0) })
  const kneeIn = limb(150, 285, 300)
  const extended = legTo(hip, ext, 1, 270)
  const midN = legTo(hip, [138, 160], -1, 300)
  const midF = legTo(hip, [141, 161], -1, 300)
  A.mountainClimbers = {
    id: 'mountainClimbers', view: 'side', loop: 'cycle',
    keys: [{ ...base, legNear: kneeIn, legFar: extended }, { ...base, legNear: midN, legFar: midF }, { ...base, legNear: extended, legFar: kneeIn }, { ...base, legNear: midF, legFar: midN }],
    durations: [240, 240, 240, 240],
    props: [FLOORP],
  }
}
{
  // Stair climber: hands light on the rail, feet alternate between a high and a low step.
  const high: Vec = [138, 123]
  const low: Vec = [122, 143]
  const mk = (hip: Vec, near: Vec, far: Vec): Pose =>
    pose({ hip, torso: 80, head: 85, ...bothArmsTo(shoulderOf(hip, 80), [146, 90], -1), legNear: legTo(hip, near, 1, 0), legFar: legTo(hip, far, 1, 0) })
  A.stairClimber = rep('stairClimber', 'side', mk([114, 88], high, low), mk([114, 90], low, high), {
    durations: [520], holds: [80, 80],
    props: [FLOORP, { type: 'box', x: 150, y: 60, w: 6, h: 110 }, { type: 'box', x: 126, y: 126, w: 24, h: 44 }, { type: 'box', x: 112, y: 146, w: 22, h: 24 }],
  })
}
{
  // High knees: running on the spot, each knee to hip height, arms pumping.
  const up = limb(5, 275, 300)
  const stance = limb(268, 268, 340)
  const hopN = limb(285, 255, 320)
  const hopF = limb(255, 285, 320)
  const armF = limb(300, 15, 15)
  const armB = limb(235, 320, 320)
  const armM = limb(270, 350, 350)
  const k = (ln: ReturnType<typeof limb>, lf: ReturnType<typeof limb>, an: ReturnType<typeof limb>, af: ReturnType<typeof limb>, y: number): Pose =>
    pose({ hip: [96, y], torso: 90, head: 90, legNear: ln, legFar: lf, armNear: an, armFar: af })
  A.highKnees = {
    id: 'highKnees', view: 'side', loop: 'cycle',
    keys: [k(up, stance, armB, armF, 110), k(hopN, hopF, armM, armM, 106), k(stance, up, armF, armB, 110), k(hopF, hopN, armM, armM, 106)],
    durations: [220, 220, 220, 220],
    props: [FLOORP],
  }
}

/* ================= MOBILITY (THE FORGE) ================= */
{
  // Arm circles from the front: arms straight out, hands trace small circles (up, in, down, out).
  const hip: Vec = [100, STAND_HIP_Y]
  const k = (d: number, kk: number): Pose => pose({ hip, torso: 90, head: 90, armNear: limb(d, d, d, kk, kk), legNear: limb(276, 276, 340) })
  A.armCircles = { id: 'armCircles', view: 'front', loop: 'cycle', keys: [k(15, 0.95), k(0, 0.6), k(345, 0.95), k(0, 1)], durations: [300, 300, 300, 300], props: [FLOORP], mirror: true }
}
{
  // Leg swings: one hand on a rack, outside leg swings forward and back from the hip.
  const hip: Vec = [76, STAND_HIP_Y]
  const s = shoulderOf(hip, 90)
  const base = pose({ hip, torso: 90, head: 90, armNear: armTo(s, [118, 92], -1), armFar: limb(270, 270), legFar: limb(270, 270, 0) })
  A.legSwings = rep('legSwings', 'side', { ...base, legNear: limb(310, 310, 40) }, { ...base, legNear: limb(230, 230, 320) }, { durations: [520], holds: [0, 0], props: [FLOORP, { type: 'wall', x: 122 }] })
}
{
  // Hip circles from the front: hands on hips, hips trace a circle under a still head.
  const target: Vec = [100, 75]
  const k = (dx: number, dy: number): Pose => {
    const hip: Vec = [100 + dx, STAND_HIP_Y + dy]
    const torso = deg(target[0] - hip[0], -(target[1] - hip[1]))
    const perp = torso - 90
    const sN = step(target, perp, LEN.shoulderW)
    const sF = step(target, perp + 180, LEN.shoulderW)
    const hN = step(hip, perp, LEN.hipW)
    const hF = step(hip, perp + 180, LEN.hipW)
    return pose({ hip, torso, head: 90, armNear: armTo(sN, [hN[0] + 3, hN[1] - 3], 1), armFar: armTo(sF, [hF[0] - 3, hF[1] - 3], -1), legNear: legTo(hN, [110, 167], 1, 0), legFar: legTo(hF, [90, 167], -1, 180) })
  }
  A.hipCircles = { id: 'hipCircles', view: 'front', loop: 'cycle', keys: [k(6, 0), k(0, 3), k(-6, 0), k(0, -3)], durations: [350, 350, 350, 350], props: [FLOORP] }
}
{
  // Cat-cow: hands and knees; cow = head up and belly down, cat = head down and back rounded up.
  const shoulder: Vec = [117, 125]
  const mk = (hip: Vec, head: number): Pose => {
    const torso = deg(shoulder[0] - hip[0], -(shoulder[1] - hip[1]))
    const kneeDir = deg(85 - hip[0], -(FLOOR_Y - 3 - hip[1]))
    return pose({ hip, torso, head, ...arms(270, 270, 0), ...legs(kneeDir, 180, 180) })
  }
  A.catCow = rep('catCow', 'side', mk([85, 140], 60), mk([85, 136], 300), { durations: [1100], holds: [300, 300] })
}
{
  // Lunge with rotation: long lunge, hands inside the front foot, then the inside arm reaches to the ceiling.
  const hip: Vec = [80, 134]
  const torso = 20
  const s = shoulderOf(hip, torso)
  const base = pose({ hip, torso, head: 30, legNear: legTo(hip, [112, FLOOR_Y - 3], 1, 0), legFar: legTo(hip, [32, 158], -1, 280) })
  const a: Pose = { ...base, ...bothArmsTo(s, [106, FLOOR_Y - 3], -1) }
  const b: Pose = { ...base, head: 70, armNear: limb(90, 90, 90), armFar: armTo(s, [106, FLOOR_Y - 3], -1) }
  A.worldsGreatest = rep('worldsGreatest', 'side', a, b, { durations: [900], holds: [300, 500] })
}
{
  // Inchworm: stand -> fold with hands on the floor -> walk the hands out to a plank -> walk the feet back in.
  const ankle: Vec = [64.5, FLOOR_Y - 3]
  const stand = pose({ hip: [64.5, STAND_HIP_Y], torso: 90, head: 90 })
  const foldHip: Vec = [62, 114]
  const fold = pose({ hip: foldHip, torso: 285, head: 300, ...bothArmsTo(shoulderOf(foldHip, 285), [95, FLOOR_Y - 3], -1), ...bothLegsTo(foldHip, ankle, 1, 0) })
  const pS: Vec = [150, 125]
  const pA: Vec = [64.5, FLOOR_Y - LEN.foot]
  const pl = lineBody(pS, pA)
  const plank = pose({ hip: pl.hip, torso: pl.torso, head: pl.torso, ...arms(270, 270, 0), ...bothLegsTo(pl.hip, pA, -1, 270) })
  A.inchworm = { id: 'inchworm', view: 'side', loop: 'cycle', keys: [stand, fold, plank, fold], durations: [450, 600, 600, 450], props: [FLOORP] }
}
{
  // Band pull-apart from the front: straight arms in front (foreshortened) open out to the sides.
  const hip: Vec = [100, STAND_HIP_Y]
  const a = pose({ hip, torso: 90, head: 90, armNear: limb(350, 350, 350, 0.3, 0.3), legNear: limb(276, 276, 340) })
  const b = pose({ hip, torso: 90, head: 90, armNear: limb(0, 0, 0), legNear: limb(276, 276, 340) })
  A.bandPullApart = rep('bandPullApart', 'front', a, b, { durations: [700], mirror: true, props: [FLOORP, { type: 'band', from: 'wristFar', to: 'wristNear' }] })
}
{
  // Band shoulder pass-through: straight arms travel from in front of the hips, overhead, to behind.
  const hip: Vec = [90, STAND_HIP_Y]
  const k = (d: number): Pose => pose({ hip, torso: 90, head: 90, ...arms(d, d, d) })
  A.shoulderDislocates = { id: 'shoulderDislocates', view: 'side', loop: 'pingpong', keys: [k(300), k(90), k(240)], durations: [700, 700], holds: [200, 100, 200], props: [FLOORP, { type: 'handle', at: 'wrists' }] }
}
{
  // Thoracic rotation: hands and knees, one hand behind the head, elbow sweeps from down to the ceiling.
  const knee: Vec = [85, FLOOR_Y - 3]
  const hip: Vec = [85, knee[1] - LEN.thigh]
  const shoulder: Vec = [117, 125]
  const torso = deg(shoulder[0] - hip[0], -(shoulder[1] - hip[1]))
  const base = pose({ hip, torso, armFar: limb(270, 270, 0), legNear: kneel, legFar: kneel })
  const a: Pose = { ...base, head: 350, armNear: armTo(shoulder, [128, 118], -1) }
  const b: Pose = { ...base, head: 40, armNear: armTo(shoulder, [128, 116], 1) }
  A.thoracicRotation = rep('thoracicRotation', 'side', a, b, { durations: [900], holds: [300, 300] })
}
{
  // Ankle rocks: half-kneeling, front knee rocks forward over the toes with the heel down.
  const ankle: Vec = [118, FLOOR_Y - 3]
  const knee: Vec = [80, FLOOR_Y - 3]
  const mk = (hip: Vec, torso: number, hands: Vec): Pose => {
    const kneeDir = deg(knee[0] - hip[0], -(knee[1] - hip[1]))
    return pose({ hip, torso, head: 90, ...bothArmsTo(shoulderOf(hip, torso), hands, -1), legNear: legTo(hip, ankle, 1, 0), legFar: limb(kneeDir, 180, 180) })
  }
  A.ankleRocks = rep('ankleRocks', 'side', mk([86, 138], 90, [108, 142]), mk([96, 141], 85, [112, 140]), { durations: [700] })
}

/* ================= BALANCE ================= */
{
  // Single-leg stand from the front: one knee lifted (thigh foreshortened), arms out a little, gentle sway.
  const k = (dx: number, torso: number): Pose => pose({
    hip: [100 + dx, STAND_HIP_Y], torso, head: 90,
    armNear: limb(300, 285, 285), armFar: limb(240, 255, 255),
    legNear: limb(270, 270, 300, 0.35, 1), legFar: limb(269, 269, 0),
  })
  A.singleLegStand = rep('singleLegStand', 'front', k(0, 90), k(1.5, 88.5), { durations: [1500], holds: [200, 200] })
}
{
  // Heel-to-toe walk from the front: feet placed one directly in front of the other on a line.
  const hip: Vec = [100, 108]
  const hN: Vec = [106, 108]
  const hF: Vec = [94, 108]
  const base = pose({ hip, torso: 90, head: 90, armNear: limb(300, 285, 285), armFar: limb(240, 255, 255) })
  const a: Pose = { ...base, legNear: legTo(hN, [100, 146], 1, 300), legFar: legTo(hF, [100, 160], -1, 300) }
  const b: Pose = { ...base, legNear: legTo(hN, [100, 160], 1, 300), legFar: legTo(hF, [100, 146], -1, 300) }
  A.heelToeWalk = rep('heelToeWalk', 'front', a, b, { durations: [600], holds: [100, 100] })
}
{
  // Sit-to-stand: from a chair, lean forward, stand without hands (arms folded), sit back slowly.
  const ankle: Vec = [108, 165]
  const fold = (s: Vec) => bothArmsTo(s, [s[0] + 8, s[1] + 11], -1)
  const sit = (() => { const hip: Vec = [78, 137]; const s = shoulderOf(hip, 90); return pose({ hip, torso: 90, head: 90, ...fold(s), ...legs(0, 270, 0) }) })()
  const lean = (() => { const hip: Vec = [86, 132]; const s = shoulderOf(hip, 50); return pose({ hip, torso: 50, head: 60, ...fold(s), ...bothLegsTo(hip, ankle, 1, 0) }) })()
  const stand = (() => { const hip: Vec = [108, 107]; const s = shoulderOf(hip, 90); return pose({ hip, torso: 90, head: 90, ...fold(s), ...legs(270, 270, 0) }) })()
  A.sitToStand = { id: 'sitToStand', view: 'side', loop: 'pingpong', keys: [sit, lean, stand], durations: [400, 600], holds: [300, 0, 300], props: [FLOORP, { type: 'bench', x: 40, y: 141, w: 45 }] }
}

// ---- END ----
/* ---------------- WALL SQUAT HOLD ---------------- */
{
  // Back flat on a wall at x=60, thighs level, shins vertical; a 2 px breathing rise so it is not frozen.
  const wallX = 62
  const mk = (dy: number) => {
    const hip: [number, number] = [wallX + 4, 132 + dy]
    const p = pose({ hip, torso: 90, head: 90 })
    p.legNear = legTo(hip, [wallX + 34, FLOOR_Y - 3], 1)
    p.legFar = legTo(hip, [wallX + 36, FLOOR_Y - 3], 1)
    const sh = shoulderOf(hip, 90)
    p.armNear = armTo(sh, [sh[0] + 24, sh[1] + 30], -1)
    p.armFar = armTo(sh, [sh[0] + 24, sh[1] + 30], -1)
    return p
  }
  A.wallSit = rep('wallSit', 'side', mk(0), mk(-2), { props: [FLOOR, { type: 'wall', x: wallX - 2 }], durations: [1600], holds: [300, 300] })
}

export const CONDITIONING = A
