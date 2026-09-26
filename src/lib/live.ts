/**
 * "Live" session helpers for a web app on iOS:
 *
 * 1. Lock screen / Dynamic Island: a web app cannot create a Live Activity
 *    (that is native ActivityKit only). What it CAN do is play audio and set
 *    Media Session metadata, which iOS shows as a Now Playing card on the lock
 *    screen and as the media pill in the Dynamic Island. We loop a silent WAV
 *    and put the rest countdown in the track title. Must start from a tap.
 *    Known to be fragile on iOS 26 (WebKit bug 295518), hence opt-in.
 * 2. Beep at the end of a rest through the same audio element, so it sounds
 *    even when the screen is off.
 * 3. Screen Wake Lock while the session page is open (iOS 18.4+ in installed apps).
 */

let audio: HTMLAudioElement | null = null
let silentUrl: string | null = null
let beepUrl: string | null = null
let lock: WakeLockSentinel | null = null

/** Build a tiny 8-bit mono WAV as a blob URL. */
function wav(seconds: number, freq: number, volume: number): string {
  const rate = 8000
  const n = Math.floor(rate * seconds)
  const buf = new ArrayBuffer(44 + n)
  const v = new DataView(buf)
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVE'); str(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true)
  str(36, 'data'); v.setUint32(40, n, true)
  for (let i = 0; i < n; i++) {
    const env = freq ? Math.min(1, (n - i) / (rate * 0.05)) : 0 // short fade-out on the beep
    const s = freq ? Math.sin((2 * Math.PI * freq * i) / rate) * volume * env : 0
    v.setUint8(44 + i, 128 + Math.round(s * 127))
  }
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))
}

function element(): HTMLAudioElement {
  if (audio) return audio
  silentUrl = silentUrl ?? wav(1, 0, 0)
  beepUrl = beepUrl ?? wav(0.45, 880, 0.6)
  audio = document.createElement('audio')
  audio.setAttribute('playsinline', '')
  audio.preload = 'auto'
  document.body.appendChild(audio)
  return audio
}

export const liveSupported = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator

/** Start the silent loop + Now Playing card. Call from a user gesture. */
export async function startLive(title: string, artist: string): Promise<boolean> {
  try {
    const a = element()
    const nav = navigator as Navigator & { audioSession?: { type: string } }
    if (nav.audioSession) nav.audioSession.type = 'playback'
    a.loop = true
    a.src = silentUrl!
    await a.play()
    updateLive(title, artist)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('pause', () => { /* keep alive; the timer is not media */ })
      navigator.mediaSession.setActionHandler('play', () => { a.play().catch(() => {}) })
      navigator.mediaSession.setActionHandler('stop', () => stopLive())
    }
    return true
  } catch {
    return false
  }
}

export function updateLive(title: string, artist: string): void {
  if (!('mediaSession' in navigator)) return
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title, artist, album: 'Holocron',
      artwork: [{ src: `${import.meta.env.BASE_URL}icon-512.png`, sizes: '512x512', type: 'image/png' }],
    })
    navigator.mediaSession.playbackState = 'playing'
  } catch { /* ignore */ }
}

export const liveActive = () => !!audio && !audio.paused && audio.src === silentUrl

/** Beep through the live element (audible in the background) or a fresh one. */
export async function beep(): Promise<void> {
  try {
    const a = element()
    const wasLive = liveActive()
    a.loop = false
    a.src = beepUrl!
    await a.play()
    if (wasLive) {
      a.onended = () => { a.onended = null; a.loop = true; a.src = silentUrl!; a.play().catch(() => {}) }
    }
  } catch { /* ignore */ }
}

export function stopLive(): void {
  try {
    if (audio) { audio.onended = null; audio.pause(); audio.removeAttribute('src'); audio.load() }
    if ('mediaSession' in navigator) { navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = 'none' }
  } catch { /* ignore */ }
}

/** Keep the screen on while the session page is visible. */
let wantAwake = false
let requesting = false
export async function keepAwake(on: boolean): Promise<void> {
  wantAwake = on
  try {
    if (!('wakeLock' in navigator)) return
    if (on && !lock && !requesting) {
      requesting = true
      const got = await navigator.wakeLock.request('screen').finally(() => { requesting = false })
      // The workout may have ended while the request was in flight: give the lock straight back.
      if (!wantAwake) { await got.release(); return }
      lock = got
      got.addEventListener('release', () => { if (lock === got) lock = null })
    } else if (!on && lock) {
      const l = lock
      lock = null
      await l.release()
    }
  } catch { lock = null }
}
