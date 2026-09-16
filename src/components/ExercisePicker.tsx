import { useMemo, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { EXERCISES } from '../data/exercises'
import { isAvailable } from '../engine/program'
import { useStore } from '../store/store'
import { Figure } from './Figure'
import { MUSCLES } from '../data/muscles'
import { haptic } from '../lib/haptics'

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
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-night/95 text-ice backdrop-blur-xl">
      <div className="safe-top" style={{ borderBottom: '1px solid color-mix(in oklab, var(--ice) 7%, transparent)' }}>
        <div className="mx-auto flex max-w-[430px] items-center gap-3 px-6 py-4">
          <h2 className="flex-1 text-lg font-semibold">{title}</h2>
          <button className="btn-ghost py-1.5 px-3 text-sm" onClick={() => { haptic(); onClose() }}>Close</button>
        </div>
        <div className="mx-auto max-w-[430px] px-6 pb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
            <input autoFocus className="input pl-9" placeholder="Search by name or muscle" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="mx-auto max-w-[430px] space-y-2 px-6 py-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {list.map((e) => (
            <li key={e.id}>
              <button className="workout-row flex w-full items-center gap-3 rounded-2xl p-2.5 text-left" onClick={() => { haptic(); onPick(e.id) }}>
                <Figure animId={e.anim} size={48} playing={false} className="shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{e.name}</div>
                  <div className="truncate text-xs text-dim">{e.primary.map((m) => MUSCLES[m].label).join(', ')}</div>
                </div>
                <ChevronRight className="size-4 text-dim" />
              </button>
            </li>
          ))}
          {!list.length && <li className="py-8 text-center text-sm text-dim">Nothing matches.</li>}
        </ul>
      </div>
    </div>
  )
}
