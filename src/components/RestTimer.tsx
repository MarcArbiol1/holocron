import { useEffect, useState } from 'react'
import { haptic } from '../lib/haptics'
import { beep as liveBeep, liveActive, updateLive } from '../lib/live'

/** Floating glass countdown shown after a set is ticked. Buzzes (where the phone allows) and optionally beeps when done. */
export function RestTimer({ endsAt, onDone, onSkip, sound, label = 'Rest' }: { endsAt: number; onDone: () => void; onSkip: () => void; sound: boolean; label?: string }) {
  const [left, setLeft] = useState(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
  useEffect(() => {
    const id = setInterval(() => {
      const l = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setLeft(l)
      // Lock screen / Dynamic Island card, when the live timer is on.
      if (liveActive()) updateLive(`Rest ${Math.floor(l / 60)}:${String(l % 60).padStart(2, '0')}`, label)
      if (l === 0) {
        clearInterval(id)
        haptic('warning')
        if (sound) { if (liveActive()) liveBeep(); else beep() }
        onDone()
      }
    }, 250)
    return () => clearInterval(id)
  }, [endsAt, onDone, sound, label])
  const m = Math.floor(left / 60)
  const s = left % 60
  return (
    <div className="fixed inset-x-0 z-40 px-5" style={{ bottom: 'max(6.75rem, calc(env(safe-area-inset-bottom) + 6rem))' }}>
      <div className="glass mx-auto flex max-w-[390px] items-center gap-3 rounded-[1.8rem] px-5 py-3">
        <div className="kicker">Rest</div>
        <div className="flex-1 font-mono text-2xl font-bold tabular-nums text-ice">{m}:{String(s).padStart(2, '0')}</div>
        <button className="btn-ghost py-1.5 px-3 text-sm" onClick={() => { haptic(); onSkip() }}>Skip</button>
      </div>
    </div>
  )
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.frequency.value = 880
    g.gain.setValueAtTime(0.2, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    o.start(); o.stop(ctx.currentTime + 0.5)
  } catch { /* ignore */ }
}
