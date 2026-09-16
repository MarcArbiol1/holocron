/**
 * Strength-pattern animations: squat, lunge, hinge, push, pull, arms, leg isolation.
 * Owned by the strength batch. Do not edit anims-conditioning.ts from here.
 */
import { FLOOR_Y, LEN, type Anim } from './rig.ts'
import { FLOOR, STAND_HIP_Y, armTo, bothArmsTo, bothLegsTo, legTo, arms, legs, limb, pose, rep, shoulderOf } from './poses.ts'

const A: Record<string, Anim> = {}


/* ---------------- SQUAT PATTERN ---------------- */
{
  // Barbell back squat, side view. Bar rests on the upper back; hands hold it just behind the shoulders.
  const top = pose({ hip: [90, STAND_HIP_Y], torso: 87, head: 90 })
  const sTop = shoulderOf(top.hip, top.torso)
  Object.assign(top, bothArmsTo(sTop, [sTop[0] - 10, sTop[1] - 6], 1))
  const bot = pose({ hip: [78, 142], torso: 55, head: 70 })
  const sBot = shoulderOf(bot.hip, bot.torso)
  Object.assign(bot, bothArmsTo(sBot, [sBot[0] - 12, sBot[1] - 8], 1))
  Object.assign(bot, bothLegsTo(bot.hip, [91, FLOOR_Y - 3], 1))
  A.backSquat = rep('backSquat', 'side', top, bot, { props: [FLOOR, { type: 'barbell', at: 'wrists' }], durations: [1000] })
}

/* ---------------- HORIZONTAL PUSH ---------------- */
{
  // Barbell bench press, side view, head to the left. Bench top at y=120.
  const benchY = 120
  const base = pose({ hip: [108, benchY - 4], torso: 180, head: 180 })
  const s = shoulderOf(base.hip, base.torso)
  const legsOnFloor = bothLegsTo(base.hip, [134, FLOOR_Y - 3], 1)
  const top = { ...base, ...legsOnFloor, ...bothArmsTo(s, [s[0] + 2, s[1] - 41], -1) }
  const bot = { ...base, ...legsOnFloor, ...bothArmsTo(s, [s[0] + 6, s[1] - 2], -1) }
  A.benchPress = rep('benchPress', 'side', top, bot, {
    props: [FLOOR, { type: 'bench', x: 48, y: benchY, w: 100 }, { type: 'barbell', at: 'wrists' }],
    durations: [1000],
  })
}

/* ---------------- HINGE ---------------- */
{
  // Conventional deadlift, side view. Bar starts on the floor over mid-foot.
  const barFloor: [number, number] = [95, FLOOR_Y - 14]
  const bot = pose({ hip: [66, 124], torso: 28, head: 40 })
  const sBot = shoulderOf(bot.hip, bot.torso)
  Object.assign(bot, bothArmsTo(sBot, barFloor, -1))
  Object.assign(bot, bothLegsTo(bot.hip, [94, FLOOR_Y - 3], 1))
  const top = pose({ hip: [90, STAND_HIP_Y], torso: 90, head: 90 })
  const sTop = shoulderOf(top.hip, top.torso)
  Object.assign(top, bothArmsTo(sTop, [sTop[0] + 1, sTop[1] + 41], -1))
  A.deadlift = rep('deadlift', 'side', bot, top, { props: [FLOOR, { type: 'barbell', at: 'wrists' }], durations: [1100], holds: [250, 250] })
}

/* ---------------- VERTICAL PULL ---------------- */
{
  // Pull-up, front view. Bar at y=40; hands stay fixed on it, the body rises.
  const barY = 40
  const handX = 129 // near hand; far hand mirrored
  const bot = pose({ hip: [100, 118], torso: 90, head: 90, ...legs(272, 262, 300) })
  const sBot: [number, number] = [100 + LEN.shoulderW, 118 - LEN.torso]
  bot.armNear = armTo(sBot, [handX, barY], -1)
  const top = pose({ hip: [100, 98], torso: 90, head: 90, ...legs(272, 255, 300) })
  const sTop: [number, number] = [100 + LEN.shoulderW, 98 - LEN.torso]
  top.armNear = armTo(sTop, [handX, barY], -1)
  A.pullUp = rep('pullUp', 'front', bot, top, { props: [{ type: 'bar', y: barY, x1: 40, x2: 160 }], mirror: true, durations: [1000] })
}

/* ---------------- SQUAT VARIANTS ---------------- */
{
  // Goblet squat: kettlebell held at the chest, elbows down, sits between the knees.
  const top = pose({ hip: [90, STAND_HIP_Y], torso: 88, head: 90 })
  const sT = shoulderOf(top.hip, top.torso)
  Object.assign(top, bothArmsTo(sT, [sT[0] + 9, sT[1] + 12], -1))
  const bot = pose({ hip: [80, 140], torso: 68, head: 80 })
  const sB = shoulderOf(bot.hip, bot.torso)
  Object.assign(bot, bothArmsTo(sB, [sB[0] + 9, sB[1] + 12], -1))
  Object.assign(bot, bothLegsTo(bot.hip, [92, FLOOR_Y - 3], 1))
  A.gobletSquat = rep('gobletSquat', 'side', top, bot, { props: [FLOOR, { type: 'kettlebell', at: 'wrists' }], durations: [1000] })
}
{
  // Bodyweight squat: arms straight out in front for balance.
  const top = pose({ hip: [90, STAND_HIP_Y], torso: 88, head: 90, ...arms(0, 0) })
  const bot = pose({ hip: [80, 140], torso: 62, head: 78, ...arms(5, 5) })
  Object.assign(bot, bothLegsTo(bot.hip, [92, FLOOR_Y - 3], 1))
  A.bodyweightSquat = rep('bodyweightSquat', 'side', top, bot, { durations: [1000] })
}
{
  // Seated leg press: fixed foot plate at the right; the seat slides so the knees fold toward the chest.
  const plateX = 150
  const seatY = 128
  const mk = (hipX: number) => {
    const p = pose({ hip: [hipX, seatY - 6], torso: 100, head: 95 })
    const s = shoulderOf(p.hip, p.torso)
    Object.assign(p, bothArmsTo(s, [hipX + 10, seatY - 2], -1))
    Object.assign(p, bothLegsTo(p.hip, [plateX - 4, 124], 1, 90))
    return p
  }
  A.legPress = rep('legPress', 'side', mk(50), mk(106), {
    props: [FLOOR, { type: 'box', x: 20, y: seatY, w: 90, h: 8 }, { type: 'box', x: plateX, y: 92, w: 7, h: 56 }, { type: 'box', x: 28, y: 138, w: 6, h: FLOOR_Y - 138 }, { type: 'box', x: 100, y: 138, w: 6, h: FLOOR_Y - 138 }],
    durations: [1000],
  })
}

/* ---------------- LUNGE PATTERN ---------------- */
{
  // Bulgarian split squat: rear foot on a bench behind, front shin near vertical.
  const benchTop = 130
  const mk = (hip: [number, number], torso: number) => {
    const p = pose({ hip, torso, head: torso + 8 })
    const s = shoulderOf(hip, torso)
    Object.assign(p, bothArmsTo(s, [s[0] + 1, s[1] + 41], -1))
    p.legNear = legTo(hip, [100, FLOOR_Y - 3], 1)
    p.legFar = legTo(hip, [140, benchTop - 2], -1, 250)
    return p
  }
  A.splitSquat = rep('splitSquat', 'side', mk([88, 112], 82), mk([86, 142], 75), {
    props: [FLOOR, { type: 'bench', x: 122, y: benchTop, w: 60 }, { type: 'dumbbell', at: 'wristNear' }, { type: 'dumbbell', at: 'wristFar' }],
    durations: [1000],
  })
}
{
  // Reverse lunge: step the far leg back, both knees to ~90, front knee over the ankle.
  const top = pose({ hip: [90, STAND_HIP_Y], torso: 90, head: 90 })
  const sT = shoulderOf(top.hip, top.torso)
  Object.assign(top, bothArmsTo(sT, [sT[0] - 2, sT[1] + 30], -1))
  const bot = pose({ hip: [70, 140], torso: 85, head: 90 })
  const sB = shoulderOf(bot.hip, bot.torso)
  Object.assign(bot, bothArmsTo(sB, [sB[0] - 2, sB[1] + 30], -1))
  bot.legNear = legTo(bot.hip, [92, FLOOR_Y - 3], 1)
  bot.legFar = legTo(bot.hip, [38, FLOOR_Y - 9], 1, -40)
  A.reverseLunge = rep('reverseLunge', 'side', top, bot, { durations: [1000] })
}
{
  // Step-up onto a knee-high box: push with the top leg.
  const boxX = 112, boxTop = 130
  const start = pose({ hip: [82, STAND_HIP_Y], torso: 82, head: 88 })
  const sS = shoulderOf(start.hip, start.torso)
  Object.assign(start, bothArmsTo(sS, [sS[0] + 1, sS[1] + 41], -1))
  start.legNear = legTo(start.hip, [boxX + 14, boxTop - 3], 1)
  start.legFar = legTo(start.hip, [84, FLOOR_Y - 3], 1)
  const hipTop: [number, number] = [boxX + 14, boxTop - 3 - LEN.shin - LEN.thigh]
  const end = pose({ hip: hipTop, torso: 90, head: 90 })
  const sE = shoulderOf(end.hip, end.torso)
  Object.assign(end, bothArmsTo(sE, [sE[0] + 1, sE[1] + 41], -1))
  end.legNear = legTo(hipTop, [boxX + 14, boxTop - 3], 1)
  end.legFar = legTo(hipTop, [boxX + 22, boxTop - 3], 1)
  A.stepUp = rep('stepUp', 'side', start, end, {
    props: [FLOOR, { type: 'box', x: boxX, y: boxTop, w: 52, h: FLOOR_Y - boxTop }],
    durations: [1000],
  })
}

/* ---------------- HINGE VARIANTS ---------------- */
{
  // Romanian deadlift: hips back, knees soft, bar slides down the thighs to just below the knee.
  const top = pose({ hip: [90, STAND_HIP_Y], torso: 90, head: 90 })
  const sT = shoulderOf(top.hip, top.torso)
  Object.assign(top, bothArmsTo(sT, [sT[0] + 1, sT[1] + 41], -1))
  const bot = pose({ hip: [72, 116], torso: 18, head: 30 })
  const sB = shoulderOf(bot.hip, bot.torso)
  Object.assign(bot, bothArmsTo(sB, [sB[0] - 2, sB[1] + 41], -1))
  Object.assign(bot, bothLegsTo(bot.hip, [92, FLOOR_Y - 3], 1))
  A.romanianDeadlift = rep('romanianDeadlift', 'side', top, bot, { props: [FLOOR, { type: 'barbell', at: 'wrists' }], durations: [1000] })
}
{
  // Hip thrust: upper back on a bench, bar across the hips, drive to a straight line shoulders-to-knees.
  const benchTop = 124
  const mk = (hip: [number, number], torso: number) => {
    const p = pose({ hip, torso, head: torso - 20 })
    const s = shoulderOf(hip, torso)
    Object.assign(p, bothArmsTo(s, [hip[0] - 2, hip[1] - 4], -1))
    Object.assign(p, bothLegsTo(hip, [132, FLOOR_Y - 3], 1))
    return p
  }
  A.hipThrust = rep('hipThrust', 'side', mk([100, 150], 138), mk([108, 126], 178), {
    props: [FLOOR, { type: 'bench', x: 18, y: benchTop, w: 60 }, { type: 'barbell', at: 'hip' }],
    durations: [900],
  })
}

/* ---------------- HORIZONTAL PUSH VARIANTS ---------------- */
{
  // Dumbbell bench press: same body as the barbell bench, dumbbells drop a little below chest level.
  const benchY = 120
  const base = pose({ hip: [108, benchY - 4], torso: 180, head: 180 })
  const s = shoulderOf(base.hip, base.torso)
  const onFloor = bothLegsTo(base.hip, [134, FLOOR_Y - 3], 1)
  const top = { ...base, ...onFloor, ...bothArmsTo(s, [s[0] + 4, s[1] - 41], -1) }
  const bot = { ...base, ...onFloor, ...bothArmsTo(s, [s[0] + 10, s[1] + 3], -1) }
  A.dbBenchPress = rep('dbBenchPress', 'side', top, bot, {
    props: [FLOOR, { type: 'bench', x: 48, y: benchY, w: 100 }, { type: 'dumbbell', at: 'wristNear' }, { type: 'dumbbell', at: 'wristFar' }],
    durations: [1000],
  })
}
{
  // Incline dumbbell press: back pad at 30 degrees, press perpendicular to the torso.
  const hip: [number, number] = [112, 128]
  const base = pose({ hip, torso: 150, head: 150 })
  const s = shoulderOf(hip, 150)
  const onFloor = bothLegsTo(hip, [140, FLOOR_Y - 3], 1)
  const top = { ...base, ...onFloor, ...bothArmsTo(s, [s[0] + 41 * Math.cos(Math.PI / 3), s[1] - 41 * Math.sin(Math.PI / 3)], -1) }
  const bot = { ...base, ...onFloor, ...bothArmsTo(s, [s[0] + 12, s[1] + 2], -1) }
  A.inclineDbPress = rep('inclineDbPress', 'side', top, bot, {
    props: [FLOOR, { type: 'bench', x: 66, y: 121, w: 60, angle: 30 }, { type: 'box', x: 104, y: 131, w: 36, h: 7 }, { type: 'box', x: 118, y: 138, w: 6, h: FLOOR_Y - 138 }, { type: 'dumbbell', at: 'wristNear' }, { type: 'dumbbell', at: 'wristFar' }],
    durations: [1000],
  })
}
{
  // Push-up: straight line from head to heels, chest to just above the floor, elbows ~45 degrees back.
  const mk = (shoulderY: number) => {
    const shoulder: [number, number] = [76, shoulderY]
    const hip: [number, number] = [shoulder[0] + 31.9, shoulder[1] + 11.6] // torso direction 160
    const p = pose({ hip, torso: 160, head: 160 })
    Object.assign(p, bothArmsTo(shoulder, [78, FLOOR_Y - 3], 1))
    Object.assign(p, bothLegsTo(hip, [162.5, 156.4], 1, 270))
    return p
  }
  A.pushUp = rep('pushUp', 'side', mk(125), mk(150), { durations: [900] })
}
{
  // Knee push-up: knees on the floor, shins raised, straight line from head to knees.
  const mk = (shoulderY: number) => {
    const shoulder: [number, number] = [76, shoulderY]
    const hip: [number, number] = [shoulder[0] + 31.9, shoulder[1] + 11.6]
    const p = pose({ hip, torso: 160, head: 160 })
    Object.assign(p, bothArmsTo(shoulder, [78, FLOOR_Y - 3], 1))
    const kneeY = FLOOR_Y - 5
    const dx = Math.sqrt(Math.max(0, LEN.thigh ** 2 - (kneeY - hip[1]) ** 2))
    const thigh = (Math.atan2(-(kneeY - hip[1]), dx) * 180) / Math.PI
    Object.assign(p, legs(thigh, 35, 300))
    return p
  }
  A.kneePushUp = rep('kneePushUp', 'side', mk(125), mk(150), { durations: [900] })
}
{
  // Seated machine chest press: back on the pad, handles at mid-chest, press to almost straight arms.
  const hip: [number, number] = [70, 122]
  const base = pose({ hip, torso: 92, head: 90 })
  const s = shoulderOf(hip, 92)
  const seated = bothLegsTo(hip, [104, FLOOR_Y - 3], 1)
  const out = { ...base, ...seated, ...bothArmsTo(s, [s[0] + 40, s[1] + 4], -1) }
  const back = { ...base, ...seated, ...bothArmsTo(s, [s[0] + 12, s[1] + 4], -1) }
  A.machineChestPress = rep('machineChestPress', 'side', out, back, {
    props: [FLOOR, { type: 'box', x: 56, y: 78, w: 8, h: 54 }, { type: 'box', x: 50, y: 130, w: 46, h: 7 }, { type: 'box', x: 68, y: 137, w: 6, h: FLOOR_Y - 137 }, { type: 'box', x: 146, y: 60, w: 6, h: FLOOR_Y - 60 }, { type: 'cable', from: [149, 64], to: 'wrists' }, { type: 'handle', at: 'wrists' }],
    durations: [900],
  })
}
{
  // Dips on parallel bars: hands fixed on the bar, lower until the upper arms are parallel to the floor.
  const barPt: [number, number] = [92, 100]
  const top = pose({ hip: [87, 92], torso: 85, head: 90, ...legs(280, 235, 310) })
  const sT = shoulderOf(top.hip, top.torso)
  Object.assign(top, bothArmsTo(sT, barPt, -1))
  const bot = pose({ hip: [82, 124], torso: 70, head: 80, ...legs(275, 235, 310) })
  const sB = shoulderOf(bot.hip, bot.torso)
  Object.assign(bot, bothArmsTo(sB, barPt, -1))
  A.dips = rep('dips', 'side', top, bot, {
    props: [FLOOR, { type: 'box', x: 89, y: 100, w: 6, h: FLOOR_Y - 100 }, { type: 'bar', y: 100, x1: 92 }],
    durations: [1000],
  })
}

/* ---------------- VERTICAL PUSH ---------------- */
{
  // Barbell overhead press, front view: bar from the front of the shoulders to straight arms overhead.
  const sNear: [number, number] = [100 + LEN.shoulderW, STAND_HIP_Y - LEN.torso]
  const bot = pose({ hip: [100, STAND_HIP_Y], ...legs(268, 268, 300) })
  bot.armNear = armTo(sNear, [sNear[0] + 9, sNear[1] - 3], -1)
  const top = pose({ hip: [100, STAND_HIP_Y], ...legs(268, 268, 300) })
  top.armNear = armTo(sNear, [sNear[0] + 3, sNear[1] - 40], -1)
  A.overheadPress = rep('overheadPress', 'front', bot, top, { props: [FLOOR, { type: 'barbell', at: 'wrists' }], mirror: true, durations: [1000] })
}
{
  // Dumbbell shoulder press, front view: from ear level with elbows out to straight arms overhead.
  const sNear: [number, number] = [100 + LEN.shoulderW, STAND_HIP_Y - LEN.torso]
  const bot = pose({ hip: [100, STAND_HIP_Y], ...legs(268, 268, 300) })
  bot.armNear = armTo(sNear, [sNear[0] + 24, sNear[1] - 16], -1)
  const top = pose({ hip: [100, STAND_HIP_Y], ...legs(268, 268, 300) })
  top.armNear = armTo(sNear, [sNear[0] + 5, sNear[1] - 40], -1)
  A.dbShoulderPress = rep('dbShoulderPress', 'front', bot, top, { props: [FLOOR, { type: 'dumbbell', at: 'wristNear' }, { type: 'dumbbell', at: 'wristFar' }], mirror: true, durations: [1000] })
}

/* ---------------- SHOULDER ISOLATION ---------------- */
{
  // Lateral raise, front view: dumbbells from the sides to shoulder height, elbows leading.
  const sNear: [number, number] = [100 + LEN.shoulderW, STAND_HIP_Y - LEN.torso]
  const bot = pose({ hip: [100, STAND_HIP_Y], ...legs(268, 268, 300) })
  bot.armNear = armTo(sNear, [sNear[0] + 8, sNear[1] + 40], -1)
  const top = pose({ hip: [100, STAND_HIP_Y], ...legs(268, 268, 300) })
  top.armNear = armTo(sNear, [sNear[0] + 39, sNear[1] + 1], 1)
  A.lateralRaise = rep('lateralRaise', 'front', bot, top, { props: [FLOOR, { type: 'dumbbell', at: 'wristNear' }, { type: 'dumbbell', at: 'wristFar' }], mirror: true, durations: [1000] })
}
{
  // Face pull: rope from a pulley at face height pulled to the face with high elbows, staggered stance.
  const hip: [number, number] = [88, STAND_HIP_Y]
  const base = pose({ hip, torso: 90, head: 90 })
  const s = shoulderOf(hip, 90)
  base.legNear = legTo(hip, [104, FLOOR_Y - 3], 1)
  base.legFar = legTo(hip, [72, FLOOR_Y - 3], 1)
  const out = { ...base, ...bothArmsTo(s, [s[0] + 40, s[1] - 6], 1) }
  const inn = { ...base, ...bothArmsTo(s, [s[0] + 8, s[1] - 8], 1) }
  A.facePull = rep('facePull', 'side', out, inn, {
    props: [FLOOR, { type: 'box', x: 170, y: 40, w: 6, h: FLOOR_Y - 40 }, { type: 'cable', from: [173, 68], to: 'wrists' }, { type: 'handle', at: 'wrists' }],
    durations: [900],
  })
}
{
  // Reverse fly: hinged to ~20 degrees, arms swing from hanging to level with the shoulders.
  const hip: [number, number] = [80, 118]
  const base = pose({ hip, torso: 22, head: 30 })
  const s = shoulderOf(hip, 22)
  Object.assign(base, bothLegsTo(hip, [92, FLOOR_Y - 3], 1))
  const bot = { ...base, ...bothArmsTo(s, [s[0] + 2, s[1] + 41], -1) }
  const top = { ...base, ...arms(150, 150, undefined, 0.85, 0.85) }
  A.reverseFly = rep('reverseFly', 'side', bot, top, { props: [FLOOR, { type: 'dumbbell', at: 'wristNear' }, { type: 'dumbbell', at: 'wristFar' }], durations: [900] })
}

/* ---------------- HORIZONTAL PULL ---------------- */
{
  // Barbell row: hinged to ~45 degrees, bar pulled from straight arms to the lower ribs.
  const hip: [number, number] = [78, 120]
  const base = pose({ hip, torso: 45, head: 55 })
  const s = shoulderOf(hip, 45)
  Object.assign(base, bothLegsTo(hip, [92, FLOOR_Y - 3], 1))
  const bot = { ...base, ...bothArmsTo(s, [s[0] + 2, s[1] + 41], 1) }
  const top = { ...base, ...bothArmsTo(s, [s[0] - 6, s[1] + 14], 1) }
  A.barbellRow = rep('barbellRow', 'side', bot, top, { props: [FLOOR, { type: 'barbell', at: 'wrists' }], durations: [900] })
}
{
  // One-arm dumbbell row: far hand and knee on the bench, near arm rows the dumbbell to the hip.
  const benchTop = 130
  const hip: [number, number] = [100, 112]
  const base = pose({ hip, torso: 25, head: 30 })
  const s = shoulderOf(hip, 25)
  base.legNear = legTo(hip, [114, FLOOR_Y - 3], 1)
  base.legFar = legTo(hip, [58, benchTop - 3], 1, 200)
  base.armFar = armTo(s, [s[0] + 4, benchTop - 2], -1)
  const bot = { ...base, armNear: armTo(s, [s[0] + 1, s[1] + 41], -1) }
  const top = { ...base, armNear: armTo(s, [s[0] - 10, s[1] + 12], -1) }
  A.dbRow = rep('dbRow', 'side', bot, top, {
    props: [FLOOR, { type: 'bench', x: 40, y: benchTop, w: 108 }, { type: 'dumbbell', at: 'wristNear' }],
    durations: [900],
  })
}
{
  // Seated cable row: chest up, handle pulled from straight arms to the stomach with elbows back.
  const hip: [number, number] = [70, 124]
  const s0 = shoulderOf(hip, 82)
  const s1 = shoulderOf(hip, 94)
  const legsOut = bothLegsTo(hip, [146, 148], 1, 80)
  const out = pose({ hip, torso: 82, head: 85, ...legsOut, ...bothArmsTo(s0, [s0[0] + 41, s0[1] + 12], -1) })
  const inn = pose({ hip, torso: 94, head: 90, ...legsOut, ...bothArmsTo(s1, [hip[0] + 14, hip[1] - 10], -1) })
  A.seatedCableRow = rep('seatedCableRow', 'side', out, inn, {
    props: [FLOOR, { type: 'box', x: 40, y: 130, w: 60, h: 7 }, { type: 'box', x: 64, y: 137, w: 6, h: FLOOR_Y - 137 }, { type: 'box', x: 150, y: 128, w: 6, h: 36 }, { type: 'box', x: 176, y: 100, w: 6, h: FLOOR_Y - 100 }, { type: 'cable', from: [178, 116], to: 'wrists' }, { type: 'handle', at: 'wrists' }],
    durations: [900],
  })
}
{
  // Chest-supported row: face-down on a 30-degree pad, dumbbells rowed to the ribs.
  const hip: [number, number] = [80, 126]
  const base = pose({ hip, torso: 30, head: 30 })
  const s = shoulderOf(hip, 30)
  Object.assign(base, bothLegsTo(hip, [56, FLOOR_Y - 3], -1))
  const bot = { ...base, ...bothArmsTo(s, [s[0] + 1, s[1] + 41], -1) }
  const top = { ...base, ...bothArmsTo(s, [s[0] + 3, s[1] + 8], -1) }
  A.chestSupportedRow = rep('chestSupportedRow', 'side', bot, top, {
    props: [FLOOR, { type: 'bench', x: 66, y: 118, w: 60, angle: -30 }, { type: 'box', x: 92, y: 125, w: 6, h: FLOOR_Y - 125 }, { type: 'dumbbell', at: 'wristNear' }, { type: 'dumbbell', at: 'wristFar' }],
    durations: [900],
  })
}
{
  // Inverted row: hanging under a bar with heels on the floor, body straight, chest to the bar.
  const barPt: [number, number] = [80, 90]
  const ankle: [number, number] = [166, 163]
  const mk = (shoulder: [number, number], bend: 1 | -1) => {
    const hip: [number, number] = [shoulder[0] + 31.9, shoulder[1] + 11.6]
    const p = pose({ hip, torso: 160, head: 160 })
    Object.assign(p, bothArmsTo(shoulder, barPt, bend))
    Object.assign(p, bothLegsTo(hip, ankle, 1, 90))
    return p
  }
  A.invertedRow = rep('invertedRow', 'side', mk([100, 132], 1), mk([84, 104], 1), {
    props: [FLOOR, { type: 'box', x: 76, y: 88, w: 6, h: FLOOR_Y - 88 }, { type: 'bar', y: 90, x1: 80 }],
    durations: [900],
  })
}

/* ---------------- VERTICAL PULL VARIANTS ---------------- */
{
  // Chin-up, front view: narrow underhand grip, elbows finish in front of the body.
  const barY = 40
  const handX = 114
  const bot = pose({ hip: [100, 118], torso: 90, head: 90, ...legs(272, 262, 300) })
  const sBot: [number, number] = [100 + LEN.shoulderW, 118 - LEN.torso]
  bot.armNear = armTo(sBot, [handX, barY], 1)
  const top = pose({ hip: [100, 96], torso: 90, head: 90, ...legs(272, 255, 300) })
  const sTop: [number, number] = [100 + LEN.shoulderW, 96 - LEN.torso]
  top.armNear = armTo(sTop, [handX, barY], 1)
  A.chinUp = rep('chinUp', 'front', bot, top, { props: [{ type: 'bar', y: barY, x1: 40, x2: 160 }], mirror: true, durations: [1000] })
}
{
  // Lat pulldown, side view: thighs under the pad, bar pulled from overhead to the upper chest, elbows down and back.
  const hip: [number, number] = [70, 122]
  const s = shoulderOf(hip, 95)
  const seated = bothLegsTo(hip, [104, FLOOR_Y - 3], 1)
  const up = pose({ hip, torso: 95, head: 95, ...seated, ...bothArmsTo(s, [s[0] + 14, s[1] - 39], -1) })
  const down = pose({ hip, torso: 95, head: 95, ...seated, ...bothArmsTo(s, [s[0] + 10, s[1] + 6], -1) })
  A.latPulldown = rep('latPulldown', 'side', up, down, {
    props: [FLOOR, { type: 'box', x: 50, y: 130, w: 46, h: 7 }, { type: 'box', x: 68, y: 137, w: 6, h: FLOOR_Y - 137 }, { type: 'box', x: 84, y: 110, w: 22, h: 6 }, { type: 'box', x: 150, y: 10, w: 6, h: FLOOR_Y - 10 }, { type: 'cable', from: [150, 14], to: 'wrists' }, { type: 'handle', at: 'wrists' }],
    durations: [900],
  })
}

/* ---------------- ARMS ---------------- */
{
  // Dumbbell curl: elbows pinned at the sides, only the forearms move.
  const bot = pose({ ...arms(270, 270) })
  const top = pose({ ...arms(270, 66) })
  A.dbCurl = rep('dbCurl', 'side', bot, top, { props: [FLOOR, { type: 'dumbbell', at: 'wristNear' }, { type: 'dumbbell', at: 'wristFar' }], durations: [800] })
}
{
  // Hammer curl: alternating arms, palms facing each other.
  const a = pose({ armNear: limb(270, 66), armFar: limb(270, 270) })
  const b = pose({ armNear: limb(270, 270), armFar: limb(270, 66) })
  A.hammerCurl = rep('hammerCurl', 'side', a, b, { props: [FLOOR, { type: 'dumbbell', at: 'wristNear' }, { type: 'dumbbell', at: 'wristFar' }], durations: [900] })
}
{
  // Barbell curl, front view: bar from the thighs to the shoulders with the elbows still.
  const bot = pose({ hip: [100, STAND_HIP_Y], ...legs(268, 268, 300), armNear: limb(275, 275) })
  const top = pose({ hip: [100, STAND_HIP_Y], ...legs(268, 268, 300), armNear: limb(275, 84, undefined, 1, 0.85) })
  A.barbellCurl = rep('barbellCurl', 'front', bot, top, { props: [FLOOR, { type: 'barbell', at: 'wrists' }], mirror: true, durations: [900] })
}
{
  // Cable triceps pushdown: elbows tucked, forearms swing from above parallel to straight arms.
  const hip: [number, number] = [86, STAND_HIP_Y]
  const base = pose({ hip, torso: 88, head: 85 })
  Object.assign(base, bothLegsTo(hip, [90, FLOOR_Y - 3], 1))
  const up = { ...base, ...arms(268, 30) }
  const down = { ...base, ...arms(268, 292) }
  A.tricepsPushdown = rep('tricepsPushdown', 'side', up, down, {
    props: [FLOOR, { type: 'box', x: 150, y: 10, w: 6, h: FLOOR_Y - 10 }, { type: 'cable', from: [150, 30], to: 'wrists' }, { type: 'handle', at: 'wrists' }],
    durations: [800],
  })
}
{
  // Overhead triceps extension: elbows stay up and forward, forearms fold behind the head.
  const top = pose({ ...arms(90, 90) })
  const bot = pose({ ...arms(88, 215) })
  A.overheadTricepsExt = rep('overheadTricepsExt', 'side', top, bot, { props: [FLOOR, { type: 'dumbbell', at: 'wrists' }], durations: [900] })
}
{
  // Lying triceps extension: upper arms fixed, bar lowered toward the forehead.
  const benchY = 120
  const base = pose({ hip: [108, benchY - 4], torso: 180, head: 180 })
  const onFloor = bothLegsTo(base.hip, [134, FLOOR_Y - 3], 1)
  const top = { ...base, ...onFloor, ...arms(100, 100) }
  const bot = { ...base, ...onFloor, ...arms(100, 192) }
  A.skullCrusher = rep('skullCrusher', 'side', top, bot, {
    props: [FLOOR, { type: 'bench', x: 48, y: benchY, w: 100 }, { type: 'barbell', at: 'wrists' }],
    durations: [900],
  })
}
{
  // Bench dip: hands on the bench edge behind, hips just in front of it, upper arms to parallel.
  const benchTop = 124
  const handPt: [number, number] = [78, benchTop]
  const ankle: [number, number] = [130, FLOOR_Y - 4]
  const mk = (shoulder: [number, number]) => {
    const hip: [number, number] = [shoulder[0] - 34 * Math.cos((88 * Math.PI) / 180), shoulder[1] + 34 * Math.sin((88 * Math.PI) / 180)]
    const p = pose({ hip, torso: 88, head: 90 })
    Object.assign(p, bothArmsTo(shoulder, handPt, -1))
    Object.assign(p, bothLegsTo(hip, ankle, 1, 60))
    return p
  }
  A.benchDip = rep('benchDip', 'side', mk([84, 82]), mk([86, 104]), {
    props: [FLOOR, { type: 'bench', x: 18, y: benchTop, w: 62 }],
    durations: [900],
  })
}

/* ---------------- LEG ISOLATION ---------------- */
{
  // Leg extension: seated, shins swing from vertical to straight with a pause at the top.
  const hip: [number, number] = [70, 122]
  const s = shoulderOf(hip, 95)
  const armsDown = bothArmsTo(s, [hip[0] + 6, hip[1] + 4], -1)
  const bot = pose({ hip, torso: 95, head: 92, ...armsDown, ...legs(0, 272, 0) })
  const top = pose({ hip, torso: 95, head: 92, ...armsDown, ...legs(2, 2, 75) })
  A.legExtension = rep('legExtension', 'side', bot, top, {
    props: [FLOOR, { type: 'box', x: 56, y: 78, w: 8, h: 54 }, { type: 'box', x: 50, y: 130, w: 52, h: 7 }, { type: 'box', x: 70, y: 137, w: 6, h: FLOOR_Y - 137 }, { type: 'ball', at: 'ankleNear', r: 5 }],
    durations: [900],
    holds: [150, 350],
  })
}
{
  // Lying leg curl: face-down, heels curl toward the glutes, hips stay on the bench.
  const benchY = 120
  const base = pose({ hip: [100, benchY - 4], torso: 180, head: 180, ...arms(270, 270) })
  const flat = { ...base, ...legs(0, 0, 300) }
  const curled = { ...base, ...legs(0, 100, 30) }
  A.legCurl = rep('legCurl', 'side', flat, curled, {
    props: [FLOOR, { type: 'bench', x: 40, y: benchY, w: 110 }, { type: 'ball', at: 'ankleNear', r: 5 }],
    durations: [900],
  })
}
{
  // Standing calf raise on a step: heels drop below the step, then rise as high as possible.
  const mk = (ankle: [number, number], foot: number) => {
    const hip: [number, number] = [ankle[0], ankle[1] - LEN.shin - LEN.thigh]
    const p = pose({ hip, torso: 90, head: 90, ...legs(270, 270, foot) })
    const s = shoulderOf(hip, 90)
    Object.assign(p, bothArmsTo(s, [136, s[1] + 12], -1))
    return p
  }
  A.standingCalfRaise = rep('standingCalfRaise', 'side', mk([88, 161], 25), mk([90, 148], -45), {
    props: [FLOOR, { type: 'box', x: 97, y: 156, w: 40, h: FLOOR_Y - 156 }, { type: 'wall', x: 140 }],
    durations: [900],
    holds: [200, 300],
  })
}
{
  // Seated calf raise: pad on the knees, heels rise and fall under the pad.
  const hip: [number, number] = [70, 122]
  const s = shoulderOf(hip, 95)
  const armsDown = bothArmsTo(s, [hip[0] + 24, hip[1] - 6], -1)
  const low = pose({ hip, torso: 95, head: 92, ...armsDown, ...legs(-6, 268, 22) })
  const high = pose({ hip, torso: 95, head: 92, ...armsDown, ...legs(10, 276, -38) })
  A.seatedCalfRaise = rep('seatedCalfRaise', 'side', low, high, {
    props: [FLOOR, { type: 'box', x: 50, y: 130, w: 44, h: 7 }, { type: 'box', x: 68, y: 137, w: 6, h: FLOOR_Y - 137 }, { type: 'box', x: 92, y: 106, w: 18, h: 6 }, { type: 'box', x: 104, y: 160, w: 22, h: FLOOR_Y - 160 }],
    durations: [800],
    holds: [200, 300],
  })
}

/* ---------------- HINGE / GLUTE EXTRAS ---------------- */
{
  // Glute bridge: on the floor, shoulders stay down, hips rise to a straight line shoulders-to-knees.
  const shoulder: [number, number] = [66, 160]
  const ankle: [number, number] = [128, FLOOR_Y - 4]
  const low = pose({ hip: [100, 160], torso: 180, head: 180, ...arms(0, 0) })
  Object.assign(low, bothLegsTo(low.hip, ankle, 1))
  const high = pose({ hip: [95.4, 143], torso: 210, head: 200, ...arms(-2, -2) })
  Object.assign(high, bothLegsTo(high.hip, ankle, 1))
  void shoulder
  A.gluteBridge = rep('gluteBridge', 'side', low, high, { durations: [900], holds: [150, 300] })
}
{
  // Kettlebell swing: hinge with the bell hiked behind the hips, then snap the hips to float it to chest height.
  const bot = pose({ hip: [72, 118], torso: 25, head: 35 })
  const sB = shoulderOf(bot.hip, bot.torso)
  Object.assign(bot, bothArmsTo(sB, [64, 150], -1))
  Object.assign(bot, bothLegsTo(bot.hip, [92, FLOOR_Y - 3], 1))
  const top = pose({ hip: [90, STAND_HIP_Y], torso: 90, head: 90, ...arms(0, 0) })
  A.kettlebellSwing = rep('kettlebellSwing', 'side', bot, top, { props: [FLOOR, { type: 'kettlebell', at: 'wrists' }], durations: [600], holds: [80, 120] })
}
{
  // Back extension on a 45-degree bench: hinge at the hips from folded to a straight line, never past it.
  const hip: [number, number] = [82, 115]
  const mk = (torso: number) => {
    const p = pose({ hip, torso, head: torso, ...legs(217, 217, 300) })
    const s = shoulderOf(hip, torso)
    Object.assign(p, bothArmsTo(s, [s[0] - 6 * Math.cos((torso * Math.PI) / 180), s[1] - 8], -1))
    return p
  }
  A.backExtension = rep('backExtension', 'side', mk(300), mk(37), {
    props: [FLOOR, { type: 'box', x: 64, y: 117, w: 30, h: 10 }, { type: 'box', x: 76, y: 127, w: 6, h: FLOOR_Y - 127 }, { type: 'box', x: 30, y: 146, w: 18, h: 8 }, { type: 'box', x: 36, y: 154, w: 6, h: FLOOR_Y - 154 }],
    durations: [900],
    holds: [150, 250],
  })
}

export const STRENGTH = A
