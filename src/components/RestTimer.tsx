import { useEffect, useState } from 'react'

/** Sticky countdown shown after a set is ticked. Vibrates (if the phone allows) when done. */
export function RestTimer({ endsAt, onDone, onSkip, sound }: { endsAt: number; onDone: () => void; onSkip: () => void; sound: boolean }) {
  const [left, setLeft] = useState(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
  useEffect(() => {
    const id = setInterval(() => {
      const l = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setLeft(l)
      if (l === 0) {
        clearInterval(id)
        try { navigator.vibrate?.([200, 100, 200]) } catch { /* not supported */ }
        if (sound) beep()
        onDone()
      }
    }, 250)
    return () => clearInterval(id)
  }, [endsAt, onDone, sound])
  const m = Math.floor(left / 60)
  const s = left % 60
  return (
    <div className="fixed bottom-20 inset-x-0 z-40 px-4">
      <div className="max-w-xl mx-auto card border-gold-400/40 px-4 py-3 flex items-center gap-3">
        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Rest</div>
        <div className="font-mono text-2xl font-bold flex-1 tabular-nums">{m}:{String(s).padStart(2, '0')}</div>
        <button className="btn-ghost py-1.5 px-3 text-sm" onClick={onSkip}>Skip</button>
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
