import { useEffect, useState } from 'react'
import { haptic } from '../lib/haptics'
import { beep as liveBeep, liveActive, updateLive } from '../lib/live'
import { useLeave } from '../lib/motion'

/**
 * Floating glass countdown shown after a set is ticked. Lives at the app level (App.tsx), so it keeps
 * counting when you open an exercise page mid-rest. Buzzes where the phone allows and optionally beeps.
 */
export function RestTimer({ endsAt, startedAt, onDone, onSkip, sound, label = 'Rest' }: { endsAt: number; startedAt: number; onDone: () => void; onSkip: () => void; sound: boolean; label?: string }) {
  const [left, setLeft] = useState(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
  const { leaving, leave } = useLeave()
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
        leave(onDone)
      }
    }, 250)
    return () => clearInterval(id)
  }, [endsAt, onDone, sound, label]) // eslint-disable-line react-hooks/exhaustive-deps
  const m = Math.floor(left / 60)
  const s = left % 60
  const total = Math.max(1, endsAt - startedAt)
  // The bar drains as one CSS animation over the whole rest (compositor-driven, smooth at any frame
  // rate); a negative delay starts it at the right point when the timer is re-shown mid-rest.
  const [elapsed] = useState(() => Math.min(total, Math.max(0, Date.now() - startedAt)))
  return (
    <div className="rest-timer fixed inset-x-0 z-40 px-5" data-leaving={leaving} style={{ bottom: 'max(6.75rem, calc(env(safe-area-inset-bottom) + 6rem))' }}>
      <div className="glass mx-auto max-w-[390px] overflow-hidden rounded-[1.8rem]">
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="min-w-0 flex-1">
            <div className="kicker truncate">Rest · {label}</div>
            <div key={left <= 3 ? left : 'run'} className={`origin-left font-mono text-2xl font-bold tabular-nums text-ice ${left <= 3 && left > 0 ? 'rest-final' : ''}`}>{m}:{String(s).padStart(2, '0')}</div>
          </div>
          <button className="btn-ghost py-1.5 px-3 text-sm" onClick={() => { haptic(); leave(onSkip) }}>Skip</button>
        </div>
        <div className="h-1 w-full" style={{ background: 'color-mix(in oklab, var(--ice) 8%, transparent)' }}>
          <div key={endsAt} className="h-full origin-left bg-glow" style={{ animation: `rest-drain ${total}ms linear ${-elapsed}ms both` }} />
        </div>
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
