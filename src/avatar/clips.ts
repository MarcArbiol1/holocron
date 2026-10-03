/**
 * Miss Belle's behaviour.
 *
 * Every frame the Director builds a TARGET pose (rest + idle life + the current move), then each
 * channel of the real pose follows its target through its own spring (dyn.ts). Heavy parts are
 * slow, hands lag the body, gloves drag behind the hands, the bun wobbles longest: overlap and
 * follow-through come from the springs, not from hand-written curves. Springs step at a fixed
 * 1/120 s, so the motion is the same at 60 fps, 30 fps (Low Power Mode) or through a dropped frame.
 *
 * On top: eye saccades with fixations (and a blink on big glances), asymmetric blinks (shut fast,
 * open slowly), breathing with a jittered rhythm, noise drift, weight shifts, little idle fidgets,
 * and lip-sync that holds each mouth shape long enough to read and closes on pauses.
 */
import { neutral, armAt, type Pose, type V } from './rig'
import { Spring, fbm, clamp, seg, easeIn, easeOut, smooth, rand } from './dyn'

export type ClipName = 'wave' | 'talk' | 'point' | 'jump' | 'sleep' | 'sass' | 'giggle' | 'flex' | 'bored' | 'enter' | 'exit'

// ---------- spring settings per channel: [f Hz, damping, response] ----------
type Cfg = [number, number, number]
const CFG = {
  // limbs and body are close to critically damped: they arrive with a little overshoot, never wobble.
  // Only the bun (a soft thing on top) keeps a loose, bouncy spring.
  x: [2, 0.7, 0], y: [2.2, 0.7, 0], lean: [1.8, 0.7, 0],
  bob: [2.6, 0.62, 0], tilt: [2.4, 0.68, 0.3],
  hand: [4, 0.74, 0], glove: [3.2, 0.62, 0], foot: [5, 0.7, 0], footRot: [6, 0.6, 0],
  squash: [3.6, 0.45, 0], bodySquash: [3.2, 0.55, 0],
  brow: [4.5, 0.6, 1], smile: [5, 0.6, 0.5], mouthW: [8, 0.75, 0], smirk: [4, 0.6, 0], squint: [7, 0.8, 0],
  mouthOpen: [10, 0.7, 0], blush: [2, 1, 0], gaze: [11, 0.95, 1.4], bicep: [5, 0.55, 0], bun: [1.8, 0.22, 0], fx: [3, 1, 0],
} satisfies Record<string, Cfg>
const sp = (k: keyof typeof CFG, x0 = 0) => { const c = CFG[k]; return new Spring(c[0], c[1], c[2], x0) }
const STEP = 1 / 120

/** The move layer: writes targets on top of idle. `t` = seconds since it started. */
interface Clip {
  dur: number // Infinity loops until stopped
  apply: (g: Pose, t: number, d: Director) => void
}

const lerp = (a: number, b: number, w: number) => a + (b - a) * w
const toward = (v: V, to: V, w: number): V => [lerp(v[0], to[0], w), lerp(v[1], to[1], w)]
/** 0 → 1 → 0 envelope: rises over `inn`, holds, falls over `out` before `dur`. */
const env = (t: number, dur: number, inn = 0.25, out = 0.35) => smooth(seg(t, 0, inn)) * (1 - smooth(seg(t, dur - out, dur)))

const CLIPS: Record<ClipName, Clip> = {
  // Anticipation dip, raise, 3 wrist-dragged swings of varying size, settle.
  wave: {
    dur: 2.3,
    apply(g, t, d) {
      const w = env(t, 2.3, 0.4, 0.45)
      const antic = Math.sin(Math.PI * seg(t, 0, 0.14)) // a small dip before the raise
      g.hr = toward(g.hr, [10, 26], antic * (1 - seg(t, 0.1, 0.2)))
      // upper arm out to the side, forearm up; the forearm swings around the elbow like a metronome.
      // The swing eases in (no sudden start) and each swing's size blends into the next.
      const ramp = smooth(seg(t, 0.36, 0.62))
      const swing = Math.sin(2 * Math.PI * 2.9 * Math.max(0, t - 0.36)) * d.swingAmp(t) * ramp
      g.hr = toward(g.hr, armAt('R', 12 + 4 * swing, 92 - 24 * swing), w)
      g.lean += 2.5 * w; g.tilt += (-5 + 1.8 * swing) * w // the body answers each swing a little
      g.smile = lerp(g.smile, 1, w); g.mouthOpen = 0.3 * w; g.browL += 0.4 * w; g.browR += 0.45 * w
    },
  },
  // Open-palm beats that change every so often; head nods on emphasis (set by the lip-sync).
  talk: {
    dur: Infinity,
    apply(g, t, d) {
      const w = smooth(seg(t, 0, 0.3))
      g.hl = toward(g.hl, d.gesture, w)
      g.hr = toward(g.hr, [8, -12], 0.5 * w)
      g.lean += 1 * w
    },
  },
  // Pull back, strike past the mark, settle, present; eyes lead toward it.
  point: {
    dur: 2.6,
    apply(g, t) {
      const w = env(t, 2.6, 0.12, 0.45)
      const pull = Math.sin(Math.PI * seg(t, 0, 0.16))
      const over = Math.sin(Math.PI * seg(t, 0.14, 0.42)) * 0.18 // shoots ~18 % past, then settles
      g.hl = toward(g.hl, [40, 30], pull * 0.6)
      g.hl = toward(g.hl, armAt('L', 22 + 14 * over, 38 + 26 * over), w * (1 - pull * 0.6))
      g.hlr += 25 * w
      g.lean += -4 * w; g.tilt += -6 * w
      g.lookX = lerp(g.lookX, -0.9, smooth(seg(t, 0, 0.1)) * w); g.lookY = lerp(g.lookY, 0.25, w)
      g.smile = 1; g.browR += 0.65 * w; g.smirk = 0.45 * w
    },
  },
  // Crouch, launch (stretch), somersault, land (squash), settle; sparkles. Height and spin are direct.
  jump: {
    dur: 1.75,
    apply(g, t) {
      const crouch = Math.sin(Math.PI * seg(t, 0, 0.24))
      const h = Math.sin(Math.PI * seg(t, 0.22, 0.74))
      g.hop = -h * 300
      g.spin = smooth(seg(t, 0.3, 0.7)) * 360
      g.squash += -0.22 * crouch + 0.16 * Math.sin(Math.PI * seg(t, 0.2, 0.42)) - 0.3 * Math.sin(Math.PI * seg(t, 0.72, 0.86))
      g.hl = toward(g.hl, armAt('L', 62, 84), Math.max(h, crouch * 0.4)); g.hr = toward(g.hr, armAt('R', 62, 84), Math.max(h, crouch * 0.4))
      g.fl = [g.fl[0] + 10 * h, g.fl[1] - 40 * h]; g.fr = [g.fr[0] - 10 * h, g.fr[1] - 40 * h]
      g.squint = clamp(h * 2 + seg(t, 0.72, 0.8) * (1 - seg(t, 1.4, 1.75)))
      g.mouthOpen = 0.75 * Math.max(h, Math.sin(Math.PI * seg(t, 0.72, 1))); g.smile = 1
      g.sparkle = Math.sin(Math.PI * seg(t, 0.72, 1.75))
    },
  },
  // Lids drift shut, head sinks, slow deep breaths, z's.
  sleep: {
    dur: Infinity,
    apply(g, t, d) {
      const w = smooth(seg(t, 0, 1.2))
      d.lidHold = Math.max(d.lidHold, smooth(seg(t, 0.2, 1.4)))
      g.tilt += 10 * w; g.bob += 10 * w
      g.bodySquash += 0.03 * Math.sin(t * 1.25) * w
      g.mouthOpen = 0.12 * w; g.mouthW = lerp(1, 0.45, w); g.smile = lerp(g.smile, 0, w)
      g.hl = toward(g.hl, [12, 20], w); g.hr = toward(g.hr, [-12, 20], w)
      g.browL -= 0.3 * w; g.browR -= 0.3 * w
      g.zzz = w
    },
  },
  // Hands swing out and land on the hips (a thump on contact), eyebrow up, smirk, toe tapping.
  sass: {
    dur: 3.6,
    apply(g, t) {
      const w = env(t, 3.6, 0.32, 0.45)
      const arc = Math.sin(Math.PI * seg(t, 0, 0.32)) // the elbows swing out first, then the hands land
      g.hl = toward(g.hl, armAt('L', -12 + 30 * arc, 222 - 50 * arc), w)
      g.hr = toward(g.hr, armAt('R', -12 + 30 * arc, 222 - 50 * arc), w)
      g.tuckL = w; g.tuckR = w
      g.bodySquash += -0.05 * Math.sin(Math.PI * seg(t, 0.3, 0.5))
      g.lean += 3 * w; g.tilt += 8 * w
      g.browL += 0.95 * w; g.browR += -0.35 * w
      g.smirk = w; g.smile = lerp(g.smile, 0.45, w); g.lookX = lerp(g.lookX, 0, w); g.lookY = 0.12 * w
      const tap = Math.max(0, Math.sin(2 * Math.PI * 2 * Math.max(0, t - 0.6))) * w
      g.frr += -16 * tap; g.fr = [g.fr[0], g.fr[1] - 7 * tap]
    },
  },
  // Wobbly giggle: the body shakes, hands down, happy eyes, blush.
  giggle: {
    dur: 1.3,
    apply(g, t) {
      const decay = 1 - seg(t, 0, 1.3)
      g.tilt += Math.sin(t * 24) * 6 * decay
      g.bob -= Math.abs(Math.sin(t * 12)) * 12 * decay
      g.bodySquash += Math.sin(t * 24) * 0.035 * decay
      g.squint = clamp(decay * 2.2); g.mouthOpen = 0.5 * decay + 0.05; g.smile = 1; g.blush = 1.35
      g.hl = toward(g.hl, [-16, -22], decay); g.hr = toward(g.hr, [16, -22], decay)
    },
  },
  // Elbow out, fist up by the head, the bicep pops twice; a satisfied look at it.
  flex: {
    dur: 2.5,
    apply(g, t) {
      const w = env(t, 2.5, 0.3, 0.45)
      const pump = Math.max(0, Math.sin(2 * Math.PI * 1.4 * Math.max(0, t - 0.35)))
      // upper arm out level, forearm up: the classic double-biceps half
      // double biceps: both upper arms out level, forearms up, fists up and out; the bumps pop on each pump
      g.hr = toward(g.hr, armAt('R', -10 + pump * 4, 94 + pump * 10), w); g.hrr = 195 + pump * 8; g.hrLock = w
      g.hl = toward(g.hl, armAt('L', -10 + pump * 4, 94 + pump * 10), w); g.hlr = -195 - pump * 8; g.hlLock = w
      g.bicep = w * (0.9 + 0.5 * pump)
      g.bodySquash += 0.03 * w; g.tilt += 6 * w
      g.lookX = lerp(g.lookX, 0.9 * Math.sign(Math.sin(t * 1.4 * Math.PI)), w); g.lookY = lerp(g.lookY, -0.45, w) // admires one arm, then the other
      g.browL += 0.5 * w; g.browR += 0.7 * w; g.smirk = 0.8 * w; g.squash += 0.04 * pump * w
    },
  },
  // Waiting on you: hand on hip, flat mouth, a foot tapping, half-lidded stare.
  bored: {
    dur: Infinity,
    apply(g, t, d) {
      const w = smooth(seg(t, 0, 0.6))
      const tap = Math.max(0, Math.sin(2 * Math.PI * 1.6 * t)) * w
      g.frr += -14 * tap; g.fr = [g.fr[0], g.fr[1] - 6 * tap]
      g.lookX = lerp(g.lookX, 0, w); g.lookY = lerp(g.lookY, 0.12, w)
      g.browTilt = -0.45 * w; g.smile = lerp(g.smile, 0.05, w); g.mouthW = lerp(1, 0.65, w)
      g.hl = toward(g.hl, armAt('L', -12, 222), w); g.tuckL = w
      d.lidHold = Math.max(d.lidHold, 0.32 * w)
    },
  },
  // Drops in, lands with a squash and a bounce, arms up on the way down.
  enter: {
    dur: 1.2,
    apply(g, t) {
      const fall = seg(t, 0, 0.42)
      g.hop = -(1 - easeIn(fall)) * 900
      g.alpha = clamp(t * 6)
      g.squash += 0.15 * (1 - fall) - 0.34 * Math.sin(Math.PI * seg(t, 0.42, 0.6))
      g.hl = toward(g.hl, armAt('L', 62, 84), 1 - fall); g.hr = toward(g.hr, armAt('R', 62, 84), 1 - fall)
      g.mouthOpen = 0.6 * (1 - seg(t, 0.4, 0.8)); g.smile = 1
    },
  },
  // Crouch, hop, shrink to nothing in a sparkle.
  exit: {
    dur: 0.75,
    apply(g, t) {
      const crouch = Math.sin(Math.PI * seg(t, 0, 0.25))
      const go = smooth(seg(t, 0.2, 0.75))
      g.squash += -0.2 * crouch
      g.hop = -go * 160
      g.shrink = go
      g.alpha = 1 - seg(t, 0.5, 0.75)
      g.sparkle = Math.sin(Math.PI * seg(t, 0.3, 0.75))
      g.squint = 1; g.smile = 1; g.mouthOpen = 0.3
    },
  },
}

// ---------- lip-sync ----------
interface Viseme { open: number; w: number }
function viseme(ch: string): Viseme {
  const c = ch.toLowerCase()
  if (c === 'a') return { open: 0.85, w: 1 }
  if (c === 'o') return { open: 0.7, w: 0.6 }
  if ('ei'.includes(c)) return { open: 0.45, w: 1.18 }
  if ('uwq'.includes(c)) return { open: 0.3, w: 0.5 }
  if ('mbp'.includes(c)) return { open: 0, w: 0.92 } // lips fully closed, always
  if ('fv'.includes(c)) return { open: 0.1, w: 1.05 }
  if (/[a-z]/.test(c)) return { open: 0.28, w: 1 }
  return { open: 0, w: 1 }
}
/** Seconds per typed character, and the pause after punctuation. */
export const CHAR_S = 0.042
const pause = (ch: string) => (ch === '.' || ch === '!' || ch === '?' ? 0.32 : ch === ',' ? 0.16 : ch === '…' ? 0.4 : 0)
const MIN_HOLD = 0.08 // a mouth shape stays at least this long, or it never reads

/** Runs Miss Belle. Call `frame(nowMs)` once per animation frame; it returns the pose to draw. */
export class Director {
  private clip: ClipName | null = null
  private clipStart = 0
  private clipStop = 0
  private lastT = 0
  private carry = 0 // leftover time for the fixed-step springs
  private pose = neutral()
  private prev = neutral()
  private s = {
    x: sp('x'), y: sp('y'), lean: sp('lean'), bob: sp('bob'), tilt: sp('tilt'),
    hlx: sp('hand'), hly: sp('hand'), hrx: sp('hand'), hry: sp('hand'),
    hlr: sp('glove'), hrr: sp('glove'),
    flx: sp('foot'), fly: sp('foot'), frx: sp('foot'), fry: sp('foot'), flr: sp('footRot'), frr: sp('footRot'),
    squash: sp('squash'), bodySquash: sp('bodySquash'),
    browL: sp('brow'), browR: sp('brow'), browTilt: sp('brow'),
    smile: sp('smile', 0.7), mouthW: sp('mouthW', 1), smirk: sp('smirk'), squint: sp('squint'),
    mouthOpen: sp('mouthOpen'), blush: sp('blush', 1), gx: sp('gaze'), gy: sp('gaze'), bicep: sp('bicep'),
    bun: sp('bun'), zzz: sp('fx'), sparkle: sp('fx'),
  }
  // idle life
  private breathPhase = 0
  private breathRate = 0.26
  private shiftAt = 3
  private shift: V = [0, 0]
  private fidgetAt = 4
  private fidget: { kind: string; at: number } | null = null
  private gazeAt = 1
  private gaze: V = [0, 0]
  private blinkAt = -10
  private nextBlink = 1.8
  private lastVy = 0
  private lastBodyY = 0
  /** a clip can hold the lids partly shut (sleep, bored) */
  lidHold = 0
  // talking
  private text = ''
  lineText = ''
  private textStart = 0
  private times: number[] = []
  private mouthShape: Viseme = { open: 0, w: 1 }
  private shapeSince = 0
  private emphasis = 0
  gesture: V = armAt('L', -40, 35)
  private gestureAt = 0
  private swing: number[] = []
  shown = 0
  onClipEnd?: (name: ClipName) => void

  play(name: ClipName, now: number) {
    this.clip = name; this.clipStart = now; this.clipStop = 0
    if (name === 'wave') this.swing = [rand(0.85, 1.15), rand(0.85, 1.15), rand(0.7, 0.95)]
  }
  stop(now: number) { if (this.clip && CLIPS[this.clip].dur === Infinity && !this.clipStop) this.clipStop = now }
  /** Talk; with `move`, she performs that move while she talks (lip-sync runs on top of any move). */
  say(text: string, now: number, move?: ClipName) {
    this.text = text; this.lineText = text; this.textStart = now
    let t = 0
    this.times = Array.from(text).map((ch) => { const at = t; t += CHAR_S + pause(ch); return at })
    this.play(move && CLIPS[move].dur !== Infinity ? move : 'talk', now)
  }
  get current() { return this.clip }
  /** Wave amplitude for the swing at time t (each swing a little different, the last one smaller). */
  swingAmp(t: number) {
    const x = Math.max(0, t - 0.36) * 2.9, i = Math.floor(x), f = smooth(x - i)
    const a = this.swing[Math.min(i, this.swing.length - 1)] ?? 1, b = this.swing[Math.min(i + 1, this.swing.length - 1)] ?? 1
    return a + (b - a) * f
  }

  frame(nowMs: number): Pose {
    const now = nowMs / 1000
    const dt = clamp(now - (this.lastT || now - 1 / 60), 0, 0.05) // a long stall does not make her jump
    this.lastT = now
    const g = neutral() // the target pose

    // ---- idle: breathing (inhale 40 %, exhale 60 %, rhythm jittered every breath) ----
    this.breathPhase += dt * this.breathRate
    if (this.breathPhase >= 1) { this.breathPhase -= 1; this.breathRate = 0.26 * rand(0.88, 1.12) }
    const ph = this.breathPhase
    const breath = ph < 0.4 ? smooth(ph / 0.4) : 1 - smooth((ph - 0.4) / 0.6)
    g.bodySquash = 0.02 * breath
    g.bob = -5 * breath
    // drift: layered noise per part, different speeds, never repeating
    g.tilt = 2.4 * fbm(now, 0.22, 1)
    g.lean = 1.2 * fbm(now, 0.15, 2) + this.shift[0]
    g.x = this.shift[1]
    g.hl = [3 * fbm(now, 0.5, 3), -3 * breath + 3 * fbm(now, 0.45, 4)]
    g.hr = [3 * fbm(now, 0.5, 5), -3 * breath + 3 * fbm(now, 0.45, 6)]
    // weight shifts every 4-10 s
    if (now > this.shiftAt) { this.shift = [rand(-2.2, 2.2), rand(-10, 10)]; this.shiftAt = now + rand(4, 10) }
    // little fidgets when nothing else is going on
    if (!this.clip && !this.text && now > this.fidgetAt) {
      this.fidget = { kind: ['brows', 'bounce', 'hands', 'smirk'][Math.floor(Math.random() * 4)], at: now }
      this.fidgetAt = now + rand(3, 8)
    }
    if (this.fidget) {
      const ft = now - this.fidget.at, e = Math.sin(Math.PI * seg(ft, 0, 0.9))
      if (this.fidget.kind === 'brows') { g.browL += 0.45 * e; g.browR += 0.45 * e }
      if (this.fidget.kind === 'bounce') g.squash += -0.08 * Math.sin(Math.PI * seg(ft, 0, 0.25)) + 0.05 * Math.sin(Math.PI * seg(ft, 0.25, 0.5))
      if (this.fidget.kind === 'hands') { g.hl = [g.hl[0] - 14 * e, g.hl[1] - 10 * e]; g.hr = [g.hr[0] + 14 * e, g.hr[1] - 10 * e] }
      if (this.fidget.kind === 'smirk') g.smirk = 0.6 * e
      if (ft > 0.9) this.fidget = null
    }
    // ---- eyes: saccades with fixations; mostly back to you; blink on a big glance ----
    if (now > this.gazeAt) {
      const atYou = this.gaze[0] === 0 && this.gaze[1] === 0
      const next: V = atYou && Math.random() < 0.55 ? [rand(-0.85, 0.85), rand(-0.35, 0.3)] : [0, 0]
      if (Math.hypot(next[0] - this.gaze[0], next[1] - this.gaze[1]) > 0.7 && Math.random() < 0.6) this.blinkAt = now
      this.gaze = next
      this.gazeAt = now + (atYou ? rand(1.2, 3.5) : rand(0.4, 1.1))
    }
    g.lookX = this.gaze[0] + 0.03 * fbm(now, 2.5, 7) // micro-jitter while fixating
    g.lookY = this.gaze[1] + 0.03 * fbm(now, 2.5, 8)
    g.tilt += this.gaze[0] * 2.5 // the head follows the eyes (its spring is slower, so it trails)

    // ---- the move on top ----
    this.lidHold = 0
    if (this.clip) {
      const c = CLIPS[this.clip]
      const t = now - this.clipStart
      if (c.dur === Infinity && this.clipStop) {
        // a looping move fading out: blend its targets away over 0.4 s
        const w = 1 - smooth(seg(now - this.clipStop, 0, 0.4))
        const ref = { ...g, hl: [...g.hl] as V, hr: [...g.hr] as V, fl: [...g.fl] as V, fr: [...g.fr] as V }
        c.apply(g, t, this)
        blend(ref, g, w)
        this.lidHold *= w
        if (w <= 0) this.end()
      } else {
        c.apply(g, t, this)
        if (t >= c.dur) this.end()
      }
    }

    // ---- talking: shapes held long enough to read, closed on pauses, nod on emphasis ----
    if (this.text) {
      const t = now - this.textStart
      let i = 0
      while (i < this.times.length && this.times[i] <= t) i++
      this.shown = i
      const done = i >= this.times.length
      const ch = this.text[Math.max(0, i - 1)] ?? ' '
      const wanted = done ? { open: 0, w: 1 } : viseme(ch)
      if (now - this.shapeSince > MIN_HOLD || wanted.open === 0) {
        if (wanted.open !== this.mouthShape.open || wanted.w !== this.mouthShape.w) { this.mouthShape = wanted; this.shapeSince = now }
      }
      g.mouthOpen = this.mouthShape.open * (1 + this.emphasis * 0.25); g.mouthW = this.mouthShape.w
      if ('!?'.includes(ch) || ch !== ch.toLowerCase()) this.emphasis = 1
      this.emphasis = Math.max(0, this.emphasis - dt * 3)
      g.browL += 0.35 * this.emphasis; g.browR += 0.35 * this.emphasis; g.tilt += 3 * this.emphasis
      // a new hand beat every so often
      if (now > this.gestureAt) { { const up = rand(-55, -20); this.gesture = armAt('L', up, up + rand(60, 95)) }; this.gestureAt = now + rand(0.6, 1.3) }
      if (done && t > this.times[this.times.length - 1] + 0.5) { this.text = ''; if (this.clip === 'talk') this.stop(now) }
    }

    // ---- blinks: shut in 100 ms (accelerating), 50 ms closed, open in 200 ms (slowing) ----
    if (now > this.nextBlink) { this.blinkAt = now; this.nextBlink = now + (Math.random() < 0.12 ? 0.35 : rand(2, 6)) }
    const bt = now - this.blinkAt
    const blink = bt < 0.1 ? easeIn(bt / 0.1) : bt < 0.15 ? 1 : bt < 0.35 ? 1 - easeOut((bt - 0.15) / 0.2) : 0
    const lidFollow = Math.max(0, g.lookY) * 0.35 // looking down lowers the lids

    // ---- springs, in fixed 1/120 s steps ----
    this.carry += dt
    while (this.carry >= STEP) { this.prev = this.pose; this.pose = this.follow(g, STEP); this.carry -= STEP }
    // Screen frames rarely line up with the 1/120 s steps (some frames get 0 steps, the next 2), which
    // judders. Draw the blend between the last two steps at the frame's exact time ("fix your timestep").
    const out = interp(this.prev, this.pose, this.carry / STEP)
    out.blink = Math.max(blink, this.lidHold, lidFollow)
    return out
  }

  private end() { const n = this.clip!; this.clip = null; this.onClipEnd?.(n) }

  /** Run every channel through its spring; direct channels (hop, spin, alpha, locks...) pass straight through. */
  private follow(g: Pose, dt: number): Pose {
    const s = this.s
    const p = neutral()
    p.x = s.x.update(dt, g.x); p.y = s.y.update(dt, g.y); p.lean = s.lean.update(dt, g.lean)
    p.bob = s.bob.update(dt, g.bob); p.tilt = s.tilt.update(dt, g.tilt)
    p.hl = [s.hlx.update(dt, g.hl[0]), s.hly.update(dt, g.hl[1])]
    p.hr = [s.hrx.update(dt, g.hr[0]), s.hry.update(dt, g.hr[1])]
    // gloves drag behind the hands' motion (wrist follow-through), then spring back
    p.hlr = s.hlr.update(dt, g.hlr - s.hlx.yd * 0.04)
    p.hrr = s.hrr.update(dt, g.hrr - s.hrx.yd * 0.04)
    p.fl = [s.flx.update(dt, g.fl[0]), s.fly.update(dt, g.fl[1])]
    p.fr = [s.frx.update(dt, g.fr[0]), s.fry.update(dt, g.fr[1])]
    p.flr = s.flr.update(dt, g.flr); p.frr = s.frr.update(dt, g.frr)
    // squash & stretch keep the volume: sx = 1/√sy
    const sq = s.squash.update(dt, g.squash), bsq = s.bodySquash.update(dt, g.bodySquash)
    p.sy = (1 + sq) * (1 - g.shrink); p.sx = (1 / Math.sqrt(Math.max(0.3, 1 + sq))) * (1 - g.shrink)
    p.bsy = 1 + bsq; p.bsx = 1 / Math.sqrt(Math.max(0.3, 1 + bsq))
    p.browL = s.browL.update(dt, g.browL); p.browR = s.browR.update(dt, g.browR); p.browTilt = s.browTilt.update(dt, g.browTilt)
    p.smile = s.smile.update(dt, g.smile); p.mouthW = s.mouthW.update(dt, g.mouthW); p.smirk = s.smirk.update(dt, g.smirk)
    p.squint = clamp(s.squint.update(dt, g.squint)); p.mouthOpen = Math.max(0, s.mouthOpen.update(dt, g.mouthOpen))
    p.blush = s.blush.update(dt, g.blush)
    p.lookX = s.gx.update(dt, g.lookX); p.lookY = s.gy.update(dt, g.lookY)
    p.bicep = Math.max(0, s.bicep.update(dt, g.bicep))
    p.zzz = clamp(s.zzz.update(dt, g.zzz)); p.sparkle = clamp(s.sparkle.update(dt, g.sparkle))
    // direct channels
    p.hop = g.hop; p.spin = g.spin; p.alpha = g.alpha; p.shrink = g.shrink
    p.hlLock = g.hlLock; p.hrLock = g.hrLock; p.tuckL = g.tuckL; p.tuckR = g.tuckR; p.tongue = g.tongue
    // the bun hangs on a loose spring driven by the body's vertical acceleration and head tilt
    const bodyY = p.y + p.hop + p.bob
    const vy = (bodyY - this.lastBodyY) / dt
    const ay = (vy - this.lastVy) / dt
    this.lastBodyY = bodyY; this.lastVy = vy
    p.bun = clamp(s.bun.update(dt, -p.tilt * 0.6 - clamp(ay / 700, -14, 14)), -20, 20)
    return p
  }
}

/** a + (b − a)·w for every channel, as a new pose. */
function interp(a: Pose, b: Pose, w: number): Pose {
  const out = { ...b }
  for (const k of Object.keys(a) as (keyof Pose)[]) {
    const va = a[k] as number | V, vb = b[k] as number | V
    if (Array.isArray(va)) (out as unknown as Record<string, V>)[k] = [lerp(va[0], (vb as V)[0], w), lerp(va[1], (vb as V)[1], w)]
    else (out as unknown as Record<string, number>)[k] = lerp(va, vb as number, w)
  }
  return out
}

/** Blend b toward a by (1 − w): used to fade a looping move's targets out. */
function blend(a: Pose, b: Pose, w: number) {
  for (const k of Object.keys(a) as (keyof Pose)[]) {
    const va = a[k] as number | V, vb = b[k] as number | V
    if (Array.isArray(va)) (b as unknown as Record<string, V>)[k] = [lerp(va[0], (vb as V)[0], w), lerp(va[1], (vb as V)[1], w)]
    else (b as unknown as Record<string, number>)[k] = lerp(va, vb as number, w)
  }
}
