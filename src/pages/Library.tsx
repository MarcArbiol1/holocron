import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EXERCISES } from '../data/exercises'
import { MUSCLES } from '../data/muscles'
import { NAMES } from '../theme/names'
import { Figure } from '../components/Figure'
import { Page } from '../components/ui'
import { haptic } from '../lib/haptics'

const FILTERS = [
  { key: 'all', label: 'All' }, { key: 'push', label: 'Push' }, { key: 'pull', label: 'Pull' }, { key: 'legs', label: 'Legs' }, { key: 'core', label: 'Core' },
  { key: 'cardio', label: 'Cardio' }, { key: 'mobility', label: 'Warm-up' }, { key: 'balance', label: 'Balance' },
] as const

export default function Library() {
  const [q, setQ] = useState('')
  const [f, setF] = useState<(typeof FILTERS)[number]['key']>('all')
  const list = useMemo(() => {
    let l = EXERCISES
    if (f === 'cardio' || f === 'mobility' || f === 'balance') l = l.filter((e) => e.category === f)
    else if (f !== 'all') l = l.filter((e) => e.category !== 'cardio' && e.category !== 'mobility' && e.category !== 'balance' && e.primary.some((m) => MUSCLES[m].group === f))
    if (q.trim()) { const s = q.toLowerCase(); l = l.filter((e) => e.name.toLowerCase().includes(s) || e.primary.some((m) => MUSCLES[m].label.toLowerCase().includes(s))) }
    return l
  }, [q, f])
  return (
    <Page title={NAMES.pages.library} kicker={`${EXERCISES.length} exercises, every one animated`}>
      <div className="aether-rise rise-1 relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-dim" />
        <input type="search" enterKeyHint="search" autoCapitalize="off" autoCorrect="off" className="input pl-10" placeholder="Search by name or muscle" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="aether-rise rise-2 -mx-6 flex gap-1.5 overflow-x-auto px-6 pb-1">
        {FILTERS.map((x) => (
          <button key={x.key} onClick={() => { haptic(); setF(x.key) }} aria-pressed={f === x.key} className={`press chip shrink-0 ${f === x.key ? 'bg-glow text-night' : 'chip-dim'}`}>{x.label}</button>
        ))}
      </div>
      {/* Keyed by the filter: a new filter re-deals the cards, the first few one after another. */}
      <ul key={f} className="aether-rise rise-3 grid grid-cols-2 gap-3">
        {list.map((e, i) => (
          <li key={e.id} className="stagger" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
            <Link to={`/exercise/${e.id}`} onClick={() => haptic()} className="press-soft metric-panel block p-2">
              <Figure animId={e.anim} size="100%" playing={false} className="h-auto w-full rounded-xl" />
              <div className="mt-2 px-1 text-sm font-semibold leading-tight">{e.name}</div>
              <div className="mb-1 px-1 text-[11px] text-dim truncate">{e.primary.map((m) => MUSCLES[m].label).join(', ')}</div>
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="col-span-2 py-8 text-center text-sm text-dim">Nothing matches.</li>}
      </ul>
    </Page>
  )
}
