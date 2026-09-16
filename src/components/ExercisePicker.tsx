import { useMemo, useState } from 'react'
import { EXERCISES } from '../data/exercises'
import { isAvailable } from '../engine/program'
import { useStore } from '../store/store'
import { Figure } from './Figure'
import { MUSCLES } from '../data/muscles'

/** Full-screen sheet to choose an exercise. `only` limits it to some ids (swap alternatives). */
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
    <div className="fixed inset-0 z-50 bg-ink-900/95 backdrop-blur flex flex-col">
      <div className="safe-top border-b border-white/5">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <h2 className="font-bold flex-1">{title}</h2>
          <button className="btn-ghost py-1.5 px-3 text-sm" onClick={onClose}>Close</button>
        </div>
        <div className="max-w-xl mx-auto px-4 pb-3">
          <input autoFocus className="input" placeholder="Search by name or muscle" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ul className="max-w-xl mx-auto px-4 py-2 divide-y divide-white/5">
          {list.map((e) => (
            <li key={e.id}>
              <button className="w-full py-2 flex items-center gap-3 text-left" onClick={() => onPick(e.id)}>
                <Figure animId={e.anim} size={48} playing={false} className="rounded-lg shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{e.name}</div>
                  <div className="text-xs text-slate-400 truncate">{e.primary.map((m) => MUSCLES[m].label).join(', ')}</div>
                </div>
              </button>
            </li>
          ))}
          {!list.length && <li className="py-8 text-center text-sm text-slate-500">Nothing matches.</li>}
        </ul>
      </div>
    </div>
  )
}
