/**
 * Miss Belle in a page's title row, plus her speech bubble underneath it.
 *
 * Tap her for a line (page-matched lines mixed with the shared pool). On Home she greets you once per
 * launch with a line that knows your plan; on Done she celebrates; elsewhere she waves the first time
 * you open a page and otherwise keeps quiet until tapped. During a workout she is smaller.
 * Tap the bubble to close it; it also closes by itself a few seconds after she finishes talking.
 */
import { useEffect, useRef, useState } from 'react'
import { MissBelle, type BelleApi } from './MissBelle'
import { nextLine, type BelleSpot, type Line } from '../avatar/lines'
import { CHAR_S } from '../avatar/clips'
import { haptic } from '../lib/haptics'

/** Pages she has already greeted since the app launched (module scope: resets on relaunch). */
const greeted = new Set<BelleSpot>()

export function BelleCorner({ spot, lines, small }: { spot: BelleSpot; lines?: Line[]; small?: boolean }) {
  const api = useRef<BelleApi>(null)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const closeAt = useRef<ReturnType<typeof setTimeout>>(undefined)

  const speak = ([line, move]: Line) => {
    clearTimeout(closeAt.current)
    setText('')
    setOpen(true)
    api.current?.say(line, setText, move)
    // close a few seconds after the line has typed out (roughly; punctuation pauses add a little)
    closeAt.current = setTimeout(() => setOpen(false), line.length * CHAR_S * 1000 + 4500)
  }

  useEffect(() => {
    const first = !greeted.has(spot)
    let t: ReturnType<typeof setTimeout> | undefined, t2: ReturnType<typeof setTimeout> | undefined
    // a page counts as greeted only once the greeting really starts (effects can mount twice in development)
    if (spot === 'done') t = setTimeout(() => speak(nextLine('done')), 500)
    else if (first && spot === 'home') t = setTimeout(() => {
      greeted.add(spot)
      api.current?.play('enter')
      t2 = setTimeout(() => speak(lines?.[0] ?? nextLine('home')), 1200)
    }, 100)
    else if (first) t = setTimeout(() => { greeted.add(spot); if (!small) api.current?.play('wave') }, 450)
    return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(closeAt.current) }
  }, []) // once per page visit

  // tapping her: the page's live lines first (once each), then the shuffled pool
  const pending = useRef<Line[]>(lines?.slice(1) ?? [])
  const tap = () => {
    haptic()
    speak(pending.current.shift() ?? nextLine(spot))
  }
  const close = () => { clearTimeout(closeAt.current); setOpen(false); api.current?.stop() }

  return (
    <>
      <button type="button" onClick={tap} aria-label="Talk to Miss Belle" className="relative -mb-1 shrink-0 self-end">
        <MissBelle height={small ? 64 : 96} apiRef={api} />
      </button>
      {open && (
        <button type="button" onClick={close} aria-live="polite" className="belle-bubble mt-3 w-full basis-full rounded-2xl bg-raised px-4 py-2.5 text-left text-sm leading-snug">
          {text || ' '}
        </button>
      )}
    </>
  )
}
