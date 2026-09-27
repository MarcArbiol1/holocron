import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, Search } from 'lucide-react'
import { EXERCISES } from '../data/exercises'
import { isAvailable } from '../engine/program'
import { useStore } from '../store/store'
import { Figure } from './Figure'
import { MUSCLES } from '../data/muscles'
import { haptic } from '../lib/haptics'
import { useLeave } from '../lib/motion'

/** Full-screen glass sheet to choose an exercise. `only` limits it to some ids (swap alternatives). */
export function ExercisePicker({ onPick, onClose, only, title = 'Add an exercise' }: { onPick: (id: string) => void; onClose: () => void; only?: string[]; title?: string }) {
  const profile = useStore((s) => s.profile)
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    let l = EXERCISES.filter((e) => e.category !== 'mobility' && e.category !== 'balance')
    if (only) l = l.filter((e) => only.includes(e.id))
    if (profile) l = l.filter((e) => isAvailable(e, profile.equipment))
    if (q.trim()) {
      const s = q.toLowerCase()
      l = l.filter((e) => e.name.toLowerCase().includes(s) || e.primary.some((m) => MUSCLES[m].label.toLowerCase().includes(s)))
    }
    return l
  }, [q, only, profile])
  const { leaving, leave } = useLeave()
  const close = () => leave(onClose)
  // The page underneath must not scroll while the sheet is up (iOS scrolls the body through fixed layers).
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  // Drag the sheet down by its top bar to dismiss (HIG Sheets: support swipe to dismiss).
  const [drag, setDrag] = useState(0)
  const startY = useRef<number | null>(null)
  const onDown = (e: React.PointerEvent) => { startY.current = e.clientY; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
  const onMove = (e: React.PointerEvent) => { if (startY.current !== null) setDrag(Math.max(0, e.clientY - startY.current)) }
  const onUp = () => { if (startY.current === null) return; startY.current = null; if (drag > 110) close(); else setDrag(0) }
  return createPortal(
    <div className="confirm-backdrop fixed inset-0 z-50" data-leaving={leaving} onClick={close}>
      <div className="picker-panel ios-sheet absolute inset-x-0 bottom-0 top-[calc(env(safe-area-inset-top)+12px)] mx-auto flex max-w-[430px] flex-col text-ice" data-leaving={leaving} role="dialog" aria-modal="true" aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}>
        <div className="touch-none select-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <div className="mx-auto mt-[6px] h-[5px] w-9 rounded-full bg-[#7f7f7f]/60" aria-hidden="true" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 pb-2 pt-2.5">
            <button className="justify-self-start text-base text-glow" onPointerDown={(e) => e.stopPropagation()} onClick={() => { haptic(); close() }}>Cancel</button>
            <h2 className="text-base font-semibold">{title}</h2>
            <span />
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-[18px] -translate-y-1/2 text-dim" />
            <input autoFocus={!only} type="search" enterKeyHint="search" autoCapitalize="off" autoCorrect="off" className="input !rounded-[10px] !py-[7px] pl-9" placeholder="Search by name or muscle" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {list.length ? (
              <ul className="ios-list" style={{ '--sep-inset': '76px', background: 'var(--raised)' } as React.CSSProperties}>
                {list.map((e, i) => (
                  <li key={e.id} className="picker-row" style={{ animationDelay: `${Math.min(i, 10) * 25 + 80}ms` }}>
                    <button className="workout-row ios-row" onClick={() => { if (leaving) return; haptic(); leave(() => onPick(e.id)) }}>
                      <Figure animId={e.anim} size={48} playing={false} className="shrink-0 rounded-[10px]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base">{e.name}</div>
                        <div className="truncate text-sm text-dim">{e.primary.map((m) => MUSCLES[m].label).join(', ')}</div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-[color:var(--faint)]" strokeWidth={2.6} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="py-8 text-center text-sm text-dim">Nothing matches.</p>}
          </div>
        </div>
      </div>
    </div>
  , document.body)
}
