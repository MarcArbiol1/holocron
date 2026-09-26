import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { AREAS, CODEX, type Area, type Strength } from '../data/codex'
import { NAMES } from '../theme/names'
import { Page } from '../components/ui'
import { haptic } from '../lib/haptics'

const STRENGTH: Record<Strength, { label: string; cls: string }> = {
  strong: { label: 'Strong evidence', cls: 'chip-glow' },
  moderate: { label: 'Moderate evidence', cls: 'chip-ice' },
  weak: { label: 'Weak evidence', cls: 'chip-dim' },
}

export default function Codex() {
  const [area, setArea] = useState<Area | 'all'>('all')
  const rules = area === 'all' ? CODEX : CODEX.filter((r) => r.area === area)
  return (
    <Page title={NAMES.pages.codex} kicker="Why the app does what it does" sub={`${CODEX.length} rules, each with its paper`} back>
      <div className="aether-rise flex gap-1.5 overflow-x-auto pb-1 -mx-6 px-6">
        {(['all', ...Object.keys(AREAS)] as (Area | 'all')[]).map((a) => (
          <button key={a} onClick={() => { haptic(); setArea(a) }} aria-pressed={area === a} className={`press chip shrink-0 ${area === a ? 'bg-glow text-night' : 'chip-dim'}`}>{a === 'all' ? 'All' : AREAS[a]}</button>
        ))}
      </div>
      <ul key={area} className="space-y-3">
        {rules.map((r, i) => (
          <li key={r.id} className="metric-panel stagger p-4" style={{ '--i': Math.min(i, 6) } as React.CSSProperties}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold leading-tight">{r.title}</h2>
              <span className={`${STRENGTH[r.strength].cls} shrink-0`}>{STRENGTH[r.strength].label}</span>
            </div>
            <p className="mt-2 text-sm text-ice leading-relaxed">{r.rule}</p>
            <p className="mt-2 text-sm text-dim leading-relaxed">{r.why}</p>
            <p className="mt-3 text-[11px] text-dim">
              {r.source}
              {r.doi && (
                <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-glow">doi <ExternalLink className="size-3" /></a>
              )}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-dim leading-relaxed">Rules are population averages from published studies, not medical advice. The full list with numbers lives in the repo as docs/EVIDENCE.md and docs/AUDIT.md.</p>
    </Page>
  )
}
