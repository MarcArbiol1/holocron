import { levelFor, THRESHOLDS, totalXp } from '../engine/levels'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Bar, Page, Section } from '../components/ui'

export default function Order() {
  const sessions = useStore((s) => s.sessions)
  const xp = totalXp(sessions)
  const lv = levelFor(xp)
  return (
    <Page title={NAMES.pages.order} sub={`${lv.name} · ${xp} XP`}>
      <div className="card p-4 space-y-2">
        <div className="flex justify-between text-sm"><span className="font-semibold">{lv.name}</span><span className="text-slate-400">{lv.next ? `${lv.span - lv.into} XP to ${lv.next}` : 'Ascended'}</span></div>
        <Bar value={lv.into} max={lv.span} />
      </div>
      <Section title="The ladder">
        <ol className="card divide-y divide-white/5">
          {NAMES.levels.map((name, i) => (
            <li key={name} className={`px-4 py-2.5 flex items-center justify-between ${i === lv.index ? 'bg-gold-400/10' : ''}`}>
              <div className="flex items-center gap-3">
                <span className={`h-7 w-7 rounded-full text-xs font-bold flex items-center justify-center ${i <= lv.index ? 'bg-gold-400 text-ink-950' : 'bg-ink-700 text-slate-500'}`}>{i + 1}</span>
                <span className={i <= lv.index ? 'font-semibold' : 'text-slate-400'}>{name}</span>
              </div>
              <span className="text-xs text-slate-500 tabular-nums">{THRESHOLDS[i]} XP</span>
            </li>
          ))}
        </ol>
      </Section>
      <Section title="How XP is earned">
        <ul className="card p-4 text-sm text-slate-300 space-y-1">
          <li>+100 for every session you finish</li>
          <li>+5 per hard set (up to 40 sets)</li>
          <li>+2 per moderate cardio minute, vigorous counts double (up to 60)</li>
          <li>+150 the moment a week hits your planned session count</li>
          <li>+50 for each new estimated-1RM record (up to 3 per session)</li>
          <li className="text-xs text-slate-500 pt-1">Consistency out-earns heroics on purpose: at three sessions a week you reach Knight in about ten weeks and Ascended in about a year and a half.</li>
        </ul>
      </Section>
    </Page>
  )
}
