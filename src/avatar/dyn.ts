/**
 * Motion maths for Miss Belle.
 *
 * Clips no longer write poses; they write TARGETS, and every channel follows its target through a
 * second-order system (a spring with mass): f = speed in Hz, z = damping (<1 bounces, 1 = critically
 * damped), r = initial response (0 = eases in, >1 overshoots at the start, <0 anticipates by moving
 * the wrong way first). That one change gives momentum, overlap (parts with lower f trail behind),
 * follow-through and smooth hand-offs between clips.
 *
 * Second-order dynamics after t3ssel8r, "Giving Personality to Procedural Animations using Math"
 * (stable for any frame time via the pole-matching branch). Noise is a small 1D value-noise fBm with
 * non-integer octave ratios, so idle motion never repeats.
 */

export class Spring {
  private xp: number
  y: number
  yd = 0
  private k1: number; private k2: number; private k3: number
  private w: number; private z: number; private d: number
  constructor(f: number, z: number, r: number, x0 = 0) {
    this.w = 2 * Math.PI * f
    this.z = z
    this.d = this.w * Math.sqrt(Math.abs(z * z - 1))
    this.k1 = z / (Math.PI * f)
    this.k2 = 1 / (this.w * this.w)
    this.k3 = (r * z) / (2 * Math.PI * f)
    this.xp = x0
    this.y = x0
  }
  /** Advance by T seconds toward target x. */
  update(T: number, x: number): number {
    const xd = (x - this.xp) / T
    this.xp = x
    let k1s: number, k2s: number
    if (this.w * T < this.z) {
      // fast enough frame: plain semi-implicit Euler, clamped for stability
      k1s = this.k1
      k2s = Math.max(this.k2, (T * T) / 2 + (T * this.k1) / 2, T * this.k1)
    } else {
      // pole matching: exact for this frame length
      const t1 = Math.exp(-this.z * this.w * T)
      const a = 2 * t1 * (this.z <= 1 ? Math.cos(T * this.d) : Math.cosh(T * this.d))
      const b = t1 * t1
      const t2 = T / (1 + b - a)
      k1s = (1 - b) * t2
      k2s = T * t2
    }
    this.y += T * this.yd
    this.yd += (T * (x + this.k3 * xd - this.y - k1s * this.yd)) / k2s
    return this.y
  }
  /** Jump straight to a value (no motion). */
  reset(x: number) { this.xp = x; this.y = x; this.yd = 0 }
}

// ---------- noise ----------
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}
/** Smooth 1D value noise in [-1, 1]. */
export function noise(x: number, seed: number): number {
  const i = Math.floor(x), f = x - i
  const u = f * f * (3 - 2 * f)
  const a = hash(i + seed * 57.13), b = hash(i + 1 + seed * 57.13)
  return (a + (b - a) * u) * 2 - 1
}
/** Three octaves with non-integer ratios: drifts like a living thing, never loops. */
export function fbm(t: number, freq: number, seed: number): number {
  return (noise(t * freq, seed) + 0.5 * noise(t * freq * 2.03, seed + 11) + 0.25 * noise(t * freq * 4.1, seed + 23)) / 1.75
}

// ---------- small curve helpers ----------
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v))
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a))
export const easeIn = (t: number) => t * t
export const easeOut = (t: number) => 1 - (1 - t) * (1 - t)
export const smooth = (t: number) => t * t * (3 - 2 * t)
export const rand = (a: number, b: number) => a + Math.random() * (b - a)
