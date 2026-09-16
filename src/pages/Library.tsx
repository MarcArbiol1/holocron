import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EXERCISES } from '../data/exercises'
import { MUSCLES } from '../data/muscles'
import { NAMES } from '../theme/names'
import { Figure } from '../components/Figure'
import { Page } from '../components/ui'

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
    <Page title={NAMES.pages.library} sub={`${EXERCISES.length} exercises, every one animated`}>
      <input className="input" placeholder="Search by name or muscle" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
        {FILTERS.map((x) => <button key={x.key} onClick={() => setF(x.key)} className={`chip shrink-0 ${f === x.key ? 'bg-gold-400 text-ink-950' : 'bg-ink-700 text-slate-300'}`}>{x.label}</button>)}
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {list.map((e) => (
          <li key={e.id}>
            <Link to={`/exercise/${e.id}`} className="card p-2 block">
              <Figure animId={e.anim} size="100%" playing={false} className="rounded-xl w-full h-auto" />
              <div className="mt-1.5 text-sm font-semibold leading-tight">{e.name}</div>
              <div className="text-[11px] text-slate-400 truncate">{e.primary.map((m) => MUSCLES[m].label).join(', ')}</div>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  )
}
