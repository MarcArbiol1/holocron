/**
 * Miss Belle's rehearsal room (#/belle): every move on a button, at full size and at the size she will
 * have in the corner of a page, so Marc can judge the animation before she goes into the app.
 */
import { useRef, useState } from 'react'
import { Page } from '../components/ui'
import { MissBelle, type BelleApi } from '../components/MissBelle'
import type { ClipName } from '../avatar/clips'
import { haptic } from '../lib/haptics'

const LINES = [
  "Hi there! I'm Miss Belle, and welcome to the Training Variance Authority!",
  "Today's Sacred Training Plan says The Citadel. Wouldn't want a Nexus event, would we?",
  "The Palantir sees everything, sugar. Including the leg day you skipped.",
  'I can do this all day.',
  "Oh, hi! It's been 9 days. Your variant was getting... concerning.",
]

const MOVES: { clip: ClipName; label: string }[] = [
  { clip: 'enter', label: 'Enter' }, { clip: 'wave', label: 'Wave' }, { clip: 'point', label: 'Present' },
  { clip: 'jump', label: 'Celebrate' }, { clip: 'sass', label: 'Sass' }, { clip: 'flex', label: 'Flex' },
  { clip: 'giggle', label: 'Giggle' }, { clip: 'sleep', label: 'Sleep' }, { clip: 'bored', label: 'Bored' },
  { clip: 'exit', label: 'Poof' },
]

export default function BelleLab() {
  const big = useRef<BelleApi>(null)
  const small = useRef<BelleApi>(null)
  const [bubble, setBubble] = useState('')
  const [line, setLine] = useState(0)
  const both = (fn: (b: BelleApi) => void) => { if (big.current) fn(big.current); if (small.current) fn(small.current) }

  const talk = () => {
    haptic()
    const text = LINES[line % LINES.length]
    setLine(line + 1)
    big.current?.say(text, setBubble)
    small.current?.say(text)
  }

  return (
    <Page title="Miss Belle" sub="Rehearsal room" back>
      <section className="metric-panel relative overflow-hidden px-4 pb-6 pt-10">
        <div className="flex items-end justify-center gap-6">
          <MissBelle height={260} apiRef={big} onTap={() => { haptic(); both((b) => b.play('giggle')) }} />
          <MissBelle height={96} apiRef={small} onTap={() => { haptic(); both((b) => b.play('giggle')) }} />
        </div>
        <p className="mt-4 min-h-[44px] rounded-2xl bg-raised px-4 py-2.5 text-sm" aria-live="polite">{bubble || 'Tap Talk, or tap her.'}</p>
      </section>
      <section className="space-y-3">
        <button className="btn-primary w-full" onClick={talk}>Talk</button>
        <div className="grid grid-cols-3 gap-2">
          {MOVES.map((m) => (
            <button key={m.clip} className="btn-small w-full" onClick={() => { haptic(); both((b) => b.play(m.clip)) }}>{m.label}</button>
          ))}
          <button className="btn-small w-full" onClick={() => { haptic(); both((b) => b.stop()) }}>Stop</button>
        </div>
        <p className="list-footer">Big = rehearsal size. Small = the size she will have in the corner of each page.</p>
      </section>
    </Page>
  )
}
