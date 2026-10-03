/**
 * Miss Belle's moves. A clip is a function of time that writes into a Pose; the Director runs the
 * idle life underneath (breathing, sway, blinks, glances, a bun on a spring) and blends one clip on
 * top, fading it in and out so nothing ever snaps.
 */
import { neutral, lerpPose, type Pose, type V } from './rig'

export type ClipName = 'wave' | 'talk' | 'point' | 'jump' | 'sleep' | 'sass' | 'giggle' | 'flex' | 'bored' | 'enter' | 'exit'

interface Clip {
  /** seconds; Infinity loops until something else plays */
  dur: number
  apply: (p: Pose, t: number) => void
}

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // in-out cubic
const out = (t: number) => 1 - Math.pow(1 - clamp(t), 3)
/** progress of t through [a, b], 0..1 */
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a))
const mixV = (a: V, b: V, w: number): V => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w]

const CLIPS: Record<ClipName, Clip> = {
  // Right hand up beside the head, the glove waggling; leaning into it.
  wave: {
    dur: 2.4,
    apply(p, t) {
      const up = out(seg(t, 0, 0.35)) * (1 - ease(seg(t, 2.0, 2.4)))
      p.hr = mixV(p.hr, [70, -360], up)
      p.hrr += up * (Math.sin(t * 13) * 26 - 10)
      p.tilt += -4 * up
      p.smile = 1; p.mouthOpen = 0.32 * up; p.browL += 0.35 * up; p.browR += 0.35 * up; p.lookX = 0
    },
  },
  // Talking is mostly the mouth (driven by the text in the Director); here, the hands and head.
  talk: {
    dur: Infinity,
    apply(p, t) {
      const g = Math.sin(t * 3.4)
      p.hl = mixV(p.hl, [-62 + g * 14, -70 + g * 18], 0.9)
      p.hlr += g * 8
      p.hr = mixV(p.hr, [6, -14 + Math.sin(t * 2.3 + 1) * 10], 0.6)
      p.tilt += Math.sin(t * 3.1) * 3
      p.bob += Math.abs(Math.sin(t * 6.2)) * -5
      p.browL += Math.max(0, Math.sin(t * 2.3)) * 0.4; p.browR += Math.max(0, Math.sin(t * 2.3 + 0.4)) * 0.4
      p.lookX = 0; p.lookY = 0.1
    },
  },
  // Presenting with the right hand, palm up, toward something on the left (the Start button, a card).
  point: {
    dur: 2.6,
    apply(p, t) {
      const w = out(seg(t, 0, 0.3)) * (1 - ease(seg(t, 2.2, 2.6)))
      p.hl = mixV(p.hl, [-170, -200], w)
      p.hlr += w * 70
      p.lean += -5 * w; p.tilt += -6 * w
      p.lookX = -1 * w + p.lookX * (1 - w); p.lookY = 0.3 * w
      p.smile = 1; p.browR += 0.6 * w; p.smirk = 0.4 * w
    },
  },
  // Anticipation, launch, a full spin, land with a squash, sparkles.
  jump: {
    dur: 1.7,
    apply(p, t) {
      const crouch = Math.sin(Math.PI * seg(t, 0, 0.22))
      const air = seg(t, 0.2, 0.72)
      const height = Math.sin(Math.PI * air)
      const land = Math.sin(Math.PI * seg(t, 0.7, 0.92))
      const settle = Math.sin(Math.PI * 2 * seg(t, 0.9, 1.25)) * (1 - seg(t, 0.9, 1.25))
      p.y -= height * 300
      p.sy *= 1 - 0.16 * crouch + 0.12 * height * (1 - air) - 0.18 * land + 0.05 * settle
      p.sx *= 1 + 0.14 * crouch - 0.08 * height * (1 - air) + 0.16 * land - 0.04 * settle
      p.spin += ease(seg(t, 0.28, 0.68)) * 360
      const arms = Math.max(height, crouch * 0.3)
      p.hl = mixV(p.hl, [-40, -330], arms); p.hr = mixV(p.hr, [40, -330], arms)
      p.fl = [p.fl[0] + 10 * height, p.fl[1] - 40 * height]; p.fr = [p.fr[0] - 10 * height, p.fr[1] - 40 * height]
      p.squint = clamp(height * 2 + seg(t, 0.7, 0.8) * (1 - seg(t, 1.4, 1.7)))
      p.mouthOpen = 0.75 * Math.max(height, land); p.smile = 1
      p.sparkle = Math.sin(Math.PI * seg(t, 0.7, 1.7))
    },
  },
  // Eyes shut, head drooping, slow breaths, z's drifting up. Loops.
  sleep: {
    dur: Infinity,
    apply(p, t) {
      const w = out(seg(t, 0, 0.8))
      p.blink = Math.max(p.blink, w)
      p.tilt += 9 * w + Math.sin(t * 1.3) * 2 * w
      p.bob += (6 + Math.sin(t * 1.3) * 6) * w
      p.bsy *= 1 + Math.sin(t * 1.3) * 0.02 * w
      p.mouthOpen = 0.12 * w; p.mouthW = 1 - 0.55 * w; p.smile = p.smile * (1 - w)
      p.hl = mixV(p.hl, [10, 18], w); p.hr = mixV(p.hr, [-10, 18], w)
      p.browL -= 0.3 * w; p.browR -= 0.3 * w
      p.zzz = w
    },
  },
  // Hands on hips, one eyebrow up, a smirk, a foot tapping. Miss Minutes energy.
  sass: {
    dur: 3.4,
    apply(p, t) {
      const w = out(seg(t, 0, 0.35)) * (1 - ease(seg(t, 3.0, 3.4)))
      p.hl = mixV(p.hl, [34, -88], w); p.hlr = -95 * w; p.hlLock = w
      p.hr = mixV(p.hr, [-34, -88], w); p.hrr = 95 * w; p.hrLock = w
      p.lean += 3 * w; p.tilt += 7 * w
      p.browL += 0.9 * w; p.browR += -0.35 * w
      p.smirk = w; p.smile = 0.45; p.lookX = -0.2 * w; p.lookY = 0.15 * w
      const tap = Math.max(0, Math.sin(t * 9)) * w
      p.frr += -14 * tap; p.fr = [p.fr[0], p.fr[1] - 6 * tap]
    },
  },
  // Tapped: a wobbly giggle with happy eyes and a blush.
  giggle: {
    dur: 1.2,
    apply(p, t) {
      const decay = 1 - seg(t, 0, 1.2)
      p.tilt += Math.sin(t * 28) * 7 * decay
      p.bob -= Math.abs(Math.sin(t * 14)) * 14 * decay
      p.bsx *= 1 + Math.sin(t * 28) * 0.03 * decay
      p.squint = clamp(decay * 2); p.mouthOpen = 0.55 * decay + 0.05; p.smile = 1; p.blush = 1.3
      p.hl = mixV(p.hl, [-18, -24], decay); p.hr = mixV(p.hr, [18, -24], decay)
      p.hlr += Math.sin(t * 28) * 10 * decay; p.hrr -= Math.sin(t * 28) * 10 * decay
    },
  },
  // A tiny bicep flex with the right arm, then a kiss of approval at it.
  flex: {
    dur: 2.4,
    apply(p, t) {
      const w = out(seg(t, 0, 0.3)) * (1 - ease(seg(t, 2.0, 2.4)))
      const pump = Math.sin(Math.PI * 2 * seg(t, 0.3, 1.5)) * w
      // elbow out to the side, fist up by the head: the arm bows outward instead of in
      p.hr = mixV(p.hr, [8, -225 + pump * 18], w); p.hrr = (165 + pump * 8) * w; p.hrLock = w
      p.bendR = w > 0.5 ? -1 : 1
      p.bicep = w * (0.8 + 0.4 * Math.max(0, pump))
      p.bsx *= 1 + 0.03 * w; p.tilt += 6 * w
      p.lookX = 1 * w; p.lookY = -0.6 * w
      p.browL += 0.5 * w; p.browR += 0.7 * w; p.smirk = 0.8 * w; p.smile = 0.8
    },
  },
  // Bored waiting: foot tapping, looking straight at you, flat mouth. Loops.
  bored: {
    dur: Infinity,
    apply(p, t) {
      const w = out(seg(t, 0, 0.5))
      const tap = Math.max(0, Math.sin(t * 7)) * w
      p.frr += -12 * tap; p.fr = [p.fr[0], p.fr[1] - 5 * tap]
      p.lookX = 0; p.lookY = 0.15 * w
      p.browTilt = -0.4 * w; p.smile = p.smile * (1 - w) + 0.05 * w; p.mouthW = 1 - 0.35 * w
      p.hl = mixV(p.hl, [34, -88], w); p.hlr = -95 * w; p.hlLock = w
      p.blink = Math.max(p.blink, 0.3 * w)
    },
  },
  // Drops in from above, lands with a squash and a bounce.
  enter: {
    dur: 1.1,
    apply(p, t) {
      const fall = seg(t, 0, 0.45)
      p.y -= (1 - fall * fall) * 900
      p.alpha = clamp(t * 6)
      const land = Math.sin(Math.PI * seg(t, 0.45, 0.65))
      const settle = Math.sin(Math.PI * 2 * seg(t, 0.62, 1.05)) * (1 - seg(t, 0.62, 1.05))
      p.sy *= 1 + 0.12 * (1 - fall) * (fall > 0 ? 1 : 0) - 0.2 * land + 0.06 * settle
      p.sx *= 1 - 0.06 * (1 - fall) + 0.18 * land - 0.05 * settle
      p.y += -40 * settle
      p.hl = mixV(p.hl, [-40, -260], 1 - fall); p.hr = mixV(p.hr, [40, -260], 1 - fall)
      p.mouthOpen = 0.6 * (1 - seg(t, 0.4, 0.8)); p.smile = 1
    },
  },
  // A hop and a poof: shrinks away to nothing.
  exit: {
    dur: 0.7,
    apply(p, t) {
      const crouch = Math.sin(Math.PI * seg(t, 0, 0.25))
      const go = ease(seg(t, 0.2, 0.7))
      p.sy *= 1 - 0.15 * crouch; p.sx *= 1 + 0.12 * crouch
      p.y -= go * 160
      p.sx *= 1 - go; p.sy *= 1 - go
      p.alpha = 1 - seg(t, 0.45, 0.7)
      p.sparkle = Math.sin(Math.PI * seg(t, 0.3, 0.7))
      p.squint = 1; p.smile = 1; p.mouthOpen = 0.3
    },
  },
}

/** Mouth openness for a character while talking. */
function viseme(ch: string): { open: number; w: number } {
  const c = ch.toLowerCase()
  if ('ao'.includes(c)) return { open: 0.8, w: 0.85 }
  if ('ei'.includes(c)) return { open: 0.45, w: 1.15 }
  if ('uw'.includes(c)) return { open: 0.35, w: 0.6 }
  if ('mbp'.includes(c)) return { open: 0, w: 0.9 }
  if (/[a-z]/.test(c)) return { open: 0.22, w: 1 }
  return { open: 0.02, w: 1 }
}

/** Seconds per typed character, and the extra pause after punctuation. */
export const CHAR_S = 0.038
const pause = (ch: string) => (ch === '.' || ch === '!' || ch === '?' ? 0.28 : ch === ',' ? 0.14 : 0)

/**
 * Runs Miss Belle. Call `frame(now)` once per animation frame; it returns the pose to render.
 * `play` starts a clip; `say` starts talking (and reports how many characters are visible).
 */
export class Director {
  private clip: ClipName | null = null
  private clipStart = 0
  private clipEnd = 0 // when a looping clip was told to stop (for the fade-out)
  private text = ''
  /** the last line said (kept after talking ends, for the bubble) */
  lineText = ''
  private textStart = 0
  private times: number[] = [] // the time each character appears
  private nextBlink = 1.5
  private blinkAt = -10
  private glanceAt = 0
  private look: V = [0, 0]
  private lookTo: V = [0, 0]
  private bunAngle = 0
  private bunVel = 0
  private lastY = 0
  private lastVy = 0
  private lastT = 0
  /** characters of the current line that should be visible (for the speech bubble) */
  shown = 0
  onClipEnd?: (name: ClipName) => void

  play(name: ClipName, now: number) {
    this.clip = name
    this.clipStart = now
    this.clipEnd = 0
  }
  stop(now: number) {
    if (this.clip && CLIPS[this.clip].dur === Infinity && !this.clipEnd) this.clipEnd = now
  }
  say(text: string, now: number) {
    this.text = text
    this.lineText = text
    this.textStart = now
    let t = 0
    this.times = Array.from(text).map((ch) => { const at = t; t += CHAR_S + pause(ch); return at })
    this.play('talk', now)
  }
  get talking() { return this.text !== '' }
  get current() { return this.clip }

  frame(nowMs: number): Pose {
    const now = nowMs / 1000
    const dt = Math.min(0.05, Math.max(0.001, now - (this.lastT || now)))
    this.lastT = now
    const base = neutral()

    // --- idle life ---
    base.bsy = 1 + 0.014 * Math.sin(now * 1.9)
    base.bsx = 1 - 0.009 * Math.sin(now * 1.9)
    base.bob = -5 * Math.sin(now * 1.9)
    base.tilt = 1.6 * Math.sin(now * 1.15)
    base.hl = [0, 5 * Math.sin(now * 1.9 + 0.6)]
    base.hr = [0, 5 * Math.sin(now * 1.9 + 1.1)]
    base.hlr = 3 * Math.sin(now * 1.3); base.hrr = -3 * Math.sin(now * 1.3 + 0.5)
    // glances: she looks at you; every few seconds a short glance somewhere, then straight back
    if (now > this.glanceAt) {
      const away = this.lookTo[0] === 0 && this.lookTo[1] === 0 && Math.random() < 0.5
      this.lookTo = away ? [Math.random() * 1.6 - 0.8, Math.random() * 0.5 - 0.25] : [0, 0]
      this.glanceAt = now + (away ? 0.7 + Math.random() * 0.6 : 3 + Math.random() * 4)
    }
    this.look = [this.look[0] + (this.lookTo[0] - this.look[0]) * Math.min(1, dt * 9), this.look[1] + (this.lookTo[1] - this.look[1]) * Math.min(1, dt * 9)]
    base.lookX = this.look[0]; base.lookY = this.look[1]
    // blinks: every 2-5 s, sometimes a double
    if (now > this.nextBlink) {
      this.blinkAt = now
      this.nextBlink = now + (Math.random() < 0.18 ? 0.32 : 2 + Math.random() * 3)
    }
    const bt = now - this.blinkAt
    base.blink = bt < 0.09 ? bt / 0.09 : bt < 0.13 ? 1 : bt < 0.27 ? 1 - (bt - 0.13) / 0.14 : 0

    // --- the clip on top ---
    let pose = base
    if (this.clip) {
      const c = CLIPS[this.clip]
      const t = now - this.clipStart
      const p = { ...base, hl: [...base.hl] as V, hr: [...base.hr] as V, fl: [...base.fl] as V, fr: [...base.fr] as V }
      c.apply(p, t)
      let w = 1
      if (c.dur === Infinity) {
        if (this.clipEnd) w = 1 - clamp((now - this.clipEnd) / 0.35)
      }
      pose = w < 1 ? lerpPose(base, p, ease(w)) : p
      const done = c.dur !== Infinity ? t >= c.dur : this.clipEnd && now - this.clipEnd >= 0.35
      if (done) {
        const name = this.clip
        this.clip = null
        this.onClipEnd?.(name)
      }
    }

    // --- talking: mouth shapes follow the characters as they appear ---
    if (this.text) {
      const t = now - this.textStart
      let i = 0
      while (i < this.times.length && this.times[i] <= t) i++
      this.shown = i
      const ch = this.text[Math.max(0, i - 1)] ?? ' '
      const v = viseme(ch)
      const flutter = 0.08 * Math.sin(t * 40)
      const target = i >= this.times.length ? 0 : v.open + flutter
      pose.mouthOpen = pose.mouthOpen + (target - pose.mouthOpen) * 0.85
      pose.mouthW = v.w
      if (i >= this.times.length && t > this.times[this.times.length - 1] + 0.6) {
        this.text = ''
        if (this.clip === 'talk') this.stop(now)
      }
    }

    // --- secondary motion: the bun lags behind the body like it's on a spring ---
    const vy = (pose.y + pose.bob - this.lastY) / dt
    const ay = (vy - this.lastVy) / dt
    this.lastY = pose.y + pose.bob; this.lastVy = vy
    const target = -pose.tilt * 0.5 - clamp(ay / 900, -12, 12)
    this.bunVel += ((target - this.bunAngle) * 140 - this.bunVel * 9) * dt
    this.bunAngle += this.bunVel * dt
    pose.bun = clamp(this.bunAngle, -18, 18)
    return pose
  }
}
