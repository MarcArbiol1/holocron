/**
 * Miss Belle's behaviour, animated the way a cartoon animator works (pose to pose), not with springs
 * on every part, which made her read as loose pieces.
 *
 *  - ONE CLOCK: her idle is a single gentle bounce on a beat. The whole body bobs to it, squashes on
 *    the down, and the arms swing against it (hands up when the body goes down). The head and hands
 *    sample the same curve a few frames late: overlap without anything moving on its own.
 *  - KEY POSES: every move is a short list of poses with an easing per segment (ease-out into a pose,
 *    ease-in-out for holds, a small overshoot for snaps). Missing channels fall back to the idle pose,
 *    so moves start and end on whatever she was doing.
 *  - WRIST DRAG: gloves trail the hand's own motion a little (the same curve, sampled late).
 *  - ONE SPRING: only the bun, a decorative piece, bounces on its own.
 *  - The face lives on top: eye darts with fixations, blinks (shut fast, open slowly), lip-sync.
 *
 * A final very short, identical smoothing on every channel only hides hand-offs when a move is
 * interrupted. Times are in seconds.
 */
import { neutral, type Pose, type V } from './rig'
import { Spring, clamp, rand, smooth, easeIn, easeOut } from './dyn'

export type ClipName = 'wave' | 'talk' | 'point' | 'jump' | 'sleep' | 'sass' | 'giggle' | 'flex' | 'bored' | 'enter' | 'exit'

// ---------- easing ----------
type Ease = 'linear' | 'in' | 'out' | 'inOut' | 'back'
const EASE: Record<Ease, (u: number) => number> = {
  linear: (u) => u,
  in: (u) => u * u * u,
  out: (u) => 1 - Math.pow(1 - u, 3),
  inOut: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
  back: (u) => { const c = 1.70158 * 1.1, v = u - 1; return 1 + (c + 1) * v * v * v + c * v * v }, // a small overshoot, then settle
}

// ---------- key poses ----------
type Channel = keyof Pose
type Set = Partial<Record<Channel, number | V>>
interface Key { at: number; set: Set; ease?: Ease }
interface Clip {
  dur: number // Infinity = hold the last key until stopped
  keys: Key[]
  /** beat-locked extras on top of the keys (foot taps, z's, giggles) */
  extra?: (g: Pose, t: number) => void
}
/** Hands and head sample their keys a little late (overlap); gloves later still (wrist drag). */
const LAG: Partial<Record<Channel, number>> = { hl: 0.04, hr: 0.04, tilt: 0.05, bun: 0 }

function sample(clip: Clip, c: Channel, t: number, base: number | V): number | V | undefined {
  const keys = clip.keys.filter((k) => k.set[c] !== undefined)
  if (!keys.length) return undefined
  const pts: { at: number; v: number | V; ease: Ease }[] = []
  if (keys[0].at > 0) pts.push({ at: 0, v: base, ease: 'linear' })
  for (const k of keys) pts.push({ at: k.at, v: k.set[c]!, ease: k.ease ?? 'inOut' })
  if (clip.dur !== Infinity && pts[pts.length - 1].at < clip.dur) pts.push({ at: clip.dur, v: base, ease: 'inOut' })
  if (t <= pts[0].at) return pts[0].v
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i].at) {
      const a = pts[i - 1], b = pts[i]
      const u = EASE[b.ease]((t - a.at) / Math.max(1e-6, b.at - a.at))
      if (Array.isArray(a.v)) return [a.v[0] + ((b.v as V)[0] - a.v[0]) * u, a.v[1] + ((b.v as V)[1] - a.v[1]) * u]
      return (a.v as number) + ((b.v as number) - (a.v as number)) * u
    }
  }
  return pts[pts.length - 1].v
}

const tap = (t: number, from: number, beat: number) => (t < from ? 0 : Math.pow(Math.max(0, Math.sin((Math.PI * (t - from)) / beat)), 2))

const CLIPS: Record<ClipName, Clip> = {
  wave: {
    dur: 2.3,
    keys: [
      { at: 0.14, set: { squash: -0.07, hr: [4, 28], tilt: 2, mouthOpen: 0.3 }, ease: 'out' }, // anticipation
      { at: 0.38, set: { squash: 0.04, hr: [70, -350], tilt: -6, lean: 2, mouthOpen: 0.65, browL: 0.5, browR: 0.55, smile: 1 }, ease: 'back' },
      { at: 0.58, set: { hr: [112, -336], squash: 0 } }, { at: 0.78, set: { hr: [34, -350] } },
      { at: 0.98, set: { hr: [112, -336] } }, { at: 1.18, set: { hr: [34, -350] } },
      { at: 1.38, set: { hr: [98, -340] } }, { at: 1.62, set: { hr: [70, -350] } },
      { at: 1.85, set: { tilt: -6, lean: 2, mouthOpen: 0.65, browL: 0.5, browR: 0.55, smile: 1 } },
    ],
  },
  talk: { dur: Infinity, keys: [] }, // gestures are made live from the words (see Director)
  point: {
    dur: 2.6,
    keys: [
      { at: 0.15, set: { hl: [34, 26], squash: -0.05, lean: 1 }, ease: 'out' }, // pull back
      { at: 0.4, set: { hl: [-205, -215], hlr: 20, lean: -4, tilt: -7, squash: 0.03, lookX: -0.9, lookY: 0.25, browR: 0.75, smirk: 0.5, mouthOpen: 0.55, smile: 1 }, ease: 'back' },
      { at: 0.6, set: { squash: 0 } },
      { at: 2.05, set: { hl: [-198, -210], hlr: 20, lean: -4, tilt: -7, lookX: -0.9, lookY: 0.25, browR: 0.75, smirk: 0.5, mouthOpen: 0.45, smile: 1 } },
    ],
  },
  jump: {
    dur: 1.8,
    keys: [
      { at: 0.2, set: { squash: -0.22, hl: [-6, -40], hr: [6, -40], mouthOpen: 0.2 }, ease: 'out' }, // crouch
      { at: 0.28, set: { squash: 0.18, hop: -110, hl: [-40, -330], hr: [40, -330], fl: [8, -20], fr: [-8, -20], mouthOpen: 0.8, squint: 1, spin: 0 }, ease: 'linear' }, // launch
      { at: 0.5, set: { squash: 0.04, hop: -300, fl: [10, -45], fr: [-10, -45] }, ease: 'out' }, // rise
      { at: 0.72, set: { hop: 0, squash: 0.08, spin: 360, sparkle: 0 }, ease: 'in' }, // fall
      { at: 0.8, set: { squash: -0.26, fl: [0, 0], fr: [0, 0], hl: [-30, -140], hr: [30, -140], sparkle: 1 }, ease: 'out' }, // land
      { at: 1.0, set: { squash: 0.05 }, ease: 'out' },
      { at: 1.2, set: { squash: 0, squint: 1, mouthOpen: 0.7 } },
      { at: 1.5, set: { squint: 1, mouthOpen: 0.6, sparkle: 1, spin: 360 } },
      { at: 1.8, set: { spin: 360 } }, // a full turn ends where it started: never spin back
    ],
  },
  sleep: {
    dur: Infinity,
    keys: [{ at: 1.3, set: { blink: 1, tilt: 10, bob: 12, mouthOpen: 0.12, mouthW: 0.45, smile: 0, hl: [12, 22], hr: [-12, 22], browL: -0.3, browR: -0.3, zzz: 1 }, ease: 'inOut' }],
    extra: (g, t) => { const w = smooth(clamp(t / 1.3)); g.bodySquash += 0.03 * Math.sin(t * 1.3) * w; g.bob += 4 * Math.sin(t * 1.3) * w },
  },
  sass: {
    dur: 3.7,
    keys: [
      { at: 0.18, set: { hl: [-40, -60], hr: [40, -60], squash: -0.04 }, ease: 'out' }, // hands swing out...
      { at: 0.38, set: { hl: [40, -112], hr: [-40, -112], hlr: -70, hrr: 70, tuckL: 1, tuckR: 1, squash: -0.07, lean: 3, tilt: 8, browL: 0.95, browR: -0.35, smirk: 1, smile: 0.45, mouthOpen: 0, lookX: 0, lookY: 0.12 }, ease: 'back' }, // ...and land on the hips
      { at: 0.52, set: { squash: 0 }, ease: 'out' },
      { at: 3.15, set: { hl: [40, -112], hr: [-40, -112], hlr: -70, hrr: 70, tuckL: 1, tuckR: 1, lean: 3, tilt: 8, browL: 0.95, browR: -0.35, smirk: 1, smile: 0.45, mouthOpen: 0, lookY: 0.12 } },
    ],
    extra: (g, t) => { const k = tap(t, 0.7, 0.42) * (t < 3.1 ? 1 : 0); g.frr += -16 * k; g.fr = [g.fr[0], g.fr[1] - 7 * k] },
  },
  giggle: {
    dur: 1.35,
    keys: [
      { at: 0.08, set: { tilt: 7, bob: -12, squint: 1, mouthOpen: 0.55, blush: 1.35, hl: [-16, -24], hr: [16, -24] }, ease: 'out' },
      { at: 0.17, set: { tilt: -7, bob: 0 } }, { at: 0.26, set: { tilt: 6, bob: -10 } }, { at: 0.35, set: { tilt: -6, bob: 0 } },
      { at: 0.46, set: { tilt: 4, bob: -7 } }, { at: 0.58, set: { tilt: -3, bob: 0 } }, { at: 0.72, set: { tilt: 2, bob: -3 } },
      { at: 0.95, set: { tilt: 0, squint: 1, mouthOpen: 0.5, blush: 1.35, hl: [-16, -24], hr: [16, -24] } },
    ],
  },
  flex: {
    dur: 2.6,
    keys: [
      { at: 0.2, set: { hr: [20, -60], squash: -0.04 }, ease: 'out' },
      { at: 0.42, set: { hr: [10, -228], hrr: 150, dirR: -1, bicep: 0.8, tilt: 6, squash: 0.02, lookX: 0.9, lookY: -0.55, browL: 0.5, browR: 0.7, smirk: 0.8, mouthOpen: 0 }, ease: 'back' },
      { at: 0.7, set: { bicep: 1.25, squash: 0 }, ease: 'back' }, { at: 0.95, set: { bicep: 0.85 } },
      { at: 1.2, set: { bicep: 1.25 }, ease: 'back' }, { at: 1.45, set: { bicep: 0.85 } },
      { at: 2.05, set: { hr: [10, -228], hrr: 150, dirR: -1, bicep: 0.85, tilt: 6, lookX: 0.9, lookY: -0.55, browL: 0.5, browR: 0.7, smirk: 0.8, mouthOpen: 0 } },
    ],
  },
  bored: {
    dur: Infinity,
    keys: [{ at: 0.6, set: { hl: [40, -112], hlr: -70, tuckL: 1, browTilt: -0.45, smile: 0.05, mouthW: 0.65, mouthOpen: 0, blink: 0.32, lookX: 0, lookY: 0.12 } }],
    extra: (g, t) => { const k = tap(t, 0.6, 0.6); g.frr += -14 * k; g.fr = [g.fr[0], g.fr[1] - 6 * k] },
  },
  enter: {
    dur: 1.2,
    keys: [
      { at: 0, set: { hop: -900, alpha: 0, hl: [-40, -280], hr: [40, -280], squash: 0.15, mouthOpen: 0.7 } },
      { at: 0.06, set: { alpha: 1 }, ease: 'linear' },
      { at: 0.42, set: { hop: 0, squash: 0.1 }, ease: 'in' }, // falling
      { at: 0.5, set: { squash: -0.3, hl: [-20, -80], hr: [20, -80] }, ease: 'out' }, // splat
      { at: 0.7, set: { squash: 0.06 }, ease: 'out' },
      { at: 0.92, set: { squash: 0, mouthOpen: 0.42 } },
    ],
  },
  exit: {
    dur: 0.75,
    keys: [
      { at: 0.2, set: { squash: -0.2 }, ease: 'out' },
      { at: 0.75, set: { hop: -160, shrink: 1, alpha: 0, sparkle: 1, squash: 0.1, squint: 1 }, ease: 'in' },
    ],
  },
}

/** Small idle actions she does on her own now and then (fresh poses each time). */
function idleAction(): Clip {
  const kind = Math.floor(Math.random() * 4)
  if (kind === 0) { // a curious glance to one side, head following the eyes
    const s = Math.random() < 0.5 ? -1 : 1
    return { dur: 1.9, keys: [{ at: 0.22, set: { lookX: 0.9 * s, lookY: -0.1, tilt: 5 * s, lean: s }, ease: 'out' }, { at: 1.35, set: { lookX: 0.9 * s, lookY: -0.1, tilt: 5 * s, lean: s } }] }
  }
  if (kind === 1) { // pats her bun
    return { dur: 2.0, keys: [{ at: 0.35, set: { hl: [96, -410], hlr: -40, tilt: -4, squint: 0.6, smile: 1 }, ease: 'out' }, { at: 0.55, set: { hl: [104, -400] } }, { at: 0.75, set: { hl: [96, -410] } }, { at: 1.3, set: { hl: [96, -410], hlr: -40, tilt: -4, squint: 0.6, smile: 1 } }] }
  }
  if (kind === 2) { // a happy little hop
    return { dur: 0.9, keys: [{ at: 0.12, set: { squash: -0.09 }, ease: 'out' }, { at: 0.3, set: { hop: -50, squash: 0.06 }, ease: 'out' }, { at: 0.46, set: { hop: 0, squash: 0.02 }, ease: 'in' }, { at: 0.56, set: { squash: -0.1 }, ease: 'out' }, { at: 0.75, set: { squash: 0 } }] }
  }
  // raises her brows at you with a little smile
  return { dur: 1.4, keys: [{ at: 0.2, set: { browL: 0.6, browR: 0.6, smile: 1, tilt: 3 }, ease: 'back' }, { at: 0.9, set: { browL: 0.6, browR: 0.6, smile: 1, tilt: 3 } }] }
}

// ---------- lip-sync ----------
interface Viseme { open: number; w: number }
function viseme(ch: string): Viseme {
  const c = ch.toLowerCase()
  if (c === 'a') return { open: 0.85, w: 1 }
  if (c === 'o') return { open: 0.7, w: 0.6 }
  if ('ei'.includes(c)) return { open: 0.45, w: 1.15 }
  if ('uwq'.includes(c)) return { open: 0.3, w: 0.55 }
  if ('mbp'.includes(c)) return { open: 0, w: 0.92 } // lips fully closed, always
  if ('fv'.includes(c)) return { open: 0.1, w: 1.05 }
  if (/[a-z]/.test(c)) return { open: 0.3, w: 1 }
  return { open: 0, w: 1 }
}
export const CHAR_S = 0.042
const pause = (ch: string) => (ch === '.' || ch === '!' || ch === '?' ? 0.32 : ch === ',' ? 0.16 : 0)
const MIN_HOLD = 0.08

const BEAT = 1.15 // one idle bounce, seconds
const SMOOTH = 0.05 // half-life of the hand-off smoothing (same for every channel)

/** Critically damped smoothing, exact for any frame time (Holden, "Spring-It-On"). */
function damp(x: number, v: number, goal: number, halflife: number, dt: number): [number, number] {
  const y = (4 * Math.LN2) / halflife / 2
  const j0 = x - goal, j1 = v + j0 * y, e = Math.exp(-y * dt)
  return [e * (j0 + j1 * dt) + goal, e * (v - j1 * y * dt)]
}

/** Runs Miss Belle. Call `frame(nowMs)` once per animation frame; it returns the pose to draw. */
export class Director {
  private clip: Clip | null = null
  private clipName: ClipName | null = null
  private clipStart = 0
  private clipStop = 0
  private lastT = 0
  private out = neutral()
  private vel = new Map<string, number>()
  private bun = new Spring(1.8, 0.3, 0)
  private lastBodyY = 0
  private lastVy = 0
  private actionAt = 5
  // eyes
  private gazeAt = 1.2
  private gaze: V = [0, 0]
  private blinkAt = -10
  private nextBlink = 1.8
  // talking
  private text = ''
  lineText = ''
  private textStart = 0
  private times: number[] = []
  private mouthShape: Viseme = { open: 0, w: 1 }
  private shapeSince = 0
  private gestureFrom: V = [0, 0]
  private gestureTo: V = [0, 0]
  private gestureAt = 0
  private gestureNext = 0
  private nod = 0
  shown = 0
  onClipEnd?: (name: ClipName) => void

  play(name: ClipName, now: number) { this.start(CLIPS[name], name, now) }
  private start(c: Clip, name: ClipName | null, now: number) { this.clip = c; this.clipName = name; this.clipStart = now; this.clipStop = 0 }
  stop(now: number) { if (this.clip && this.clip.dur === Infinity && !this.clipStop) this.clipStop = now }
  say(text: string, now: number) {
    this.text = text; this.lineText = text; this.textStart = now
    let t = 0
    this.times = Array.from(text).map((ch) => { const at = t; t += CHAR_S + pause(ch); return at })
    this.play('talk', now)
  }
  get current() { return this.clipName }

  frame(nowMs: number): Pose {
    const now = nowMs / 1000
    const dt = clamp(now - (this.lastT || now - 1 / 60), 0, 0.05)
    this.lastT = now

    // ---- idle: one beat for the whole body ----
    const idle = (lag: number): Pose => {
      const g = neutral()
      const ph = (((now - lag) % BEAT) + BEAT) % BEAT / BEAT
      const down = 0.5 + 0.5 * Math.cos(2 * Math.PI * ph) // 1 on the beat, 0 half way
      g.bob = 6 * down
      g.squash = -0.022 * down + 0.012 * (1 - down)
      const sway = Math.sin((2 * Math.PI * (now - lag)) / (BEAT * 2)) // the head sways over two beats
      g.tilt = 1.8 * sway
      g.lean = 0.6 * sway
      g.hl = [0, -5 * down]; g.hr = [0, -5 * down] // arms swing against the body
      g.mouthOpen = 0.42; g.smile = 0.95
      return g
    }
    const g = idle(0)
    const late = idle(0.06)
    g.tilt = late.tilt; g.hl = late.hl; g.hr = late.hr // head and hands follow the beat a few frames behind

    // ---- now and then, a little idle action ----
    if (!this.clip && !this.text && now > this.actionAt) { this.start(idleAction(), null, now); this.actionAt = now + rand(5, 10) }

    // ---- the current move, sampled from its key poses ----
    if (this.clip) {
      const c = this.clip, t = now - this.clipStart
      let w = 1
      if (c.dur === Infinity && this.clipStop) w = 1 - smooth(clamp((now - this.clipStop) / 0.45))
      for (const ch of Object.keys(g) as Channel[]) {
        const lag = LAG[ch] ?? 0
        const v = sample(c, ch, Math.max(0, t - lag), g[ch] as number | V)
        if (v === undefined) continue
        if (Array.isArray(v)) { const b = g[ch] as V; (g as unknown as Record<string, V>)[ch] = [b[0] + (v[0] - b[0]) * w, b[1] + (v[1] - b[1]) * w] }
        else (g as unknown as Record<string, number>)[ch] = (g[ch] as number) + (v - (g[ch] as number)) * w
      }
      c.extra?.(g, t)
      // wrist drag: gloves trail the hand's own motion (the same keys, sampled a touch late)
      for (const [hand, rot] of [['hl', 'hlr'], ['hr', 'hrr']] as const) {
        const a = sample(c, hand, Math.max(0, t - 0.07), [0, 0]) as V | undefined, b = sample(c, hand, Math.max(0, t - 0.09), [0, 0]) as V | undefined
        if (a && b) (g as unknown as Record<string, number>)[rot] += clamp((b[0] - a[0]) * -0.9, -22, 22) * w
      }
      const done = c.dur === Infinity ? this.clipStop && now - this.clipStop > 0.45 : t >= c.dur
      if (done) { const n = this.clipName; this.clip = null; this.clipName = null; if (n) this.onClipEnd?.(n) }
    }

    // ---- talking: gestures land on beats, the mouth follows the letters ----
    if (this.text) {
      const t = now - this.textStart
      let i = 0
      while (i < this.times.length && this.times[i] <= t) i++
      this.shown = i
      const done = i >= this.times.length
      const ch = this.text[Math.max(0, i - 1)] ?? ' '
      const wanted = done ? { open: 0.42, w: 1 } : viseme(ch)
      if (now - this.shapeSince > MIN_HOLD || wanted.open === 0) {
        if (wanted.open !== this.mouthShape.open || wanted.w !== this.mouthShape.w) { this.mouthShape = wanted; this.shapeSince = now }
      }
      g.mouthOpen = this.mouthShape.open; g.mouthW = this.mouthShape.w
      // a new open-palm gesture every so often, snapped into with a little overshoot
      const stressed = '!?'.includes(ch) || ch !== ch.toLowerCase()
      if (now > this.gestureNext || (stressed && now - this.gestureAt > 0.35)) {
        this.gestureFrom = this.gestureTo
        this.gestureTo = [rand(-90, -40), rand(-150, -60)]
        this.gestureAt = now; this.gestureNext = now + rand(0.55, 1.0)
        if (stressed) this.nod = 1
      }
      const u = EASE.back(clamp((now - this.gestureAt) / 0.22))
      g.hl = [g.hl[0] + this.gestureFrom[0] + (this.gestureTo[0] - this.gestureFrom[0]) * u, g.hl[1] + this.gestureFrom[1] + (this.gestureTo[1] - this.gestureFrom[1]) * u]
      this.nod = Math.max(0, this.nod - dt * 3)
      g.tilt += 4 * this.nod; g.browL += 0.4 * this.nod; g.browR += 0.4 * this.nod
      if (done && t > this.times[this.times.length - 1] + 0.5) { this.text = ''; this.gestureTo = [0, 0]; if (this.clipName === 'talk') this.stop(now) }
    } else if (this.gestureTo[0] !== 0 || this.gestureTo[1] !== 0) {
      this.gestureTo = [0, 0]
    }

    // ---- eyes: dart away now and then, hold, come back to you; often blink on a big glance ----
    if (now > this.gazeAt) {
      const atYou = this.gaze[0] === 0 && this.gaze[1] === 0
      const next: V = atYou && Math.random() < 0.5 ? [rand(-0.8, 0.8), rand(-0.3, 0.25)] : [0, 0]
      if (Math.hypot(next[0] - this.gaze[0], next[1] - this.gaze[1]) > 0.7 && Math.random() < 0.6) this.blinkAt = now
      this.gaze = next
      this.gazeAt = now + (atYou ? rand(1.5, 4) : rand(0.5, 1.2))
    }
    if (g.lookX === 0 && g.lookY === 0) { g.lookX = this.gaze[0]; g.lookY = this.gaze[1] }
    if (now > this.nextBlink) { this.blinkAt = now; this.nextBlink = now + (Math.random() < 0.12 ? 0.35 : rand(2, 5.5)) }
    const bt = now - this.blinkAt
    const blink = bt < 0.1 ? easeIn(bt / 0.1) : bt < 0.15 ? 1 : bt < 0.35 ? 1 - easeOut((bt - 0.15) / 0.2) : 0

    return this.finish(g, dt, Math.max(blink, g.blink, Math.max(0, g.lookY) * 0.3))
  }

  /** Short identical smoothing on every channel (hides hand-offs), volume-preserving squash, the bun. */
  private finish(g: Pose, dt: number, blink: number): Pose {
    const o = this.out
    const direct = new Set<Channel>(['hop', 'spin', 'alpha', 'shrink', 'blink', 'lookX', 'lookY'])
    for (const ch of Object.keys(g) as Channel[]) {
      if (direct.has(ch)) continue
      const tv = g[ch]
      if (Array.isArray(tv)) {
        const cur = o[ch] as V
        const [x0, v0] = damp(cur[0], this.vel.get(ch + '0') ?? 0, tv[0], SMOOTH, dt)
        const [x1, v1] = damp(cur[1], this.vel.get(ch + '1') ?? 0, tv[1], SMOOTH, dt)
        this.vel.set(ch + '0', v0); this.vel.set(ch + '1', v1)
        ;(o as unknown as Record<string, V>)[ch] = [x0, x1]
      } else {
        const [x, v] = damp(o[ch] as number, this.vel.get(ch) ?? 0, tv as number, SMOOTH, dt)
        this.vel.set(ch, v)
        ;(o as unknown as Record<string, number>)[ch] = x
      }
    }
    // eyes jump (saccades) rather than glide: a very fast smoothing
    const [lx, lvx] = damp(o.lookX, this.vel.get('lx') ?? 0, g.lookX, 0.025, dt); this.vel.set('lx', lvx); o.lookX = lx
    const [ly, lvy] = damp(o.lookY, this.vel.get('ly') ?? 0, g.lookY, 0.025, dt); this.vel.set('ly', lvy); o.lookY = ly
    o.hop = g.hop; o.spin = ((g.spin % 360) + 360) % 360; o.alpha = g.alpha; o.shrink = g.shrink; o.blink = blink
    const p: Pose = { ...o, hl: [...o.hl] as V, hr: [...o.hr] as V, fl: [...o.fl] as V, fr: [...o.fr] as V }
    // squash & stretch keep her volume, around the feet
    const sq = Math.max(-0.5, o.squash), bsq = Math.max(-0.5, o.bodySquash)
    p.sy = (1 + sq) * (1 - o.shrink); p.sx = (1 / Math.sqrt(1 + sq)) * (1 - o.shrink)
    p.bsy = 1 + bsq; p.bsx = 1 / Math.sqrt(1 + bsq)
    p.mouthOpen = Math.max(0, p.mouthOpen); p.bicep = Math.max(0, p.bicep); p.squint = clamp(p.squint)
    p.zzz = clamp(p.zzz); p.sparkle = clamp(p.sparkle)
    // the bun: the one free-swinging part, pushed by the body's vertical acceleration and the head tilt
    const bodyY = p.y + p.hop + p.bob
    const vy = (bodyY - this.lastBodyY) / Math.max(dt, 1e-3)
    const ay = (vy - this.lastVy) / Math.max(dt, 1e-3)
    this.lastBodyY = bodyY; this.lastVy = vy
    p.bun = clamp(this.bun.update(Math.max(dt, 1e-3), -p.tilt * 0.6 - clamp(ay / 900, -12, 12)), -18, 18)
    return p
  }
}
