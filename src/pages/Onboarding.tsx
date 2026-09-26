import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { EquipmentAccess, Experience, Goal, Profile, Sex } from '../data/types'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Page } from '../components/ui'
import { NumField } from '../components/NumField'
import { LogoLoader } from '../components/LogoLoader'
import { haptic } from '../lib/haptics'

const SELECTED: React.CSSProperties = {
  background: 'color-mix(in oklab, var(--glow) 12%, transparent)',
  borderColor: 'color-mix(in oklab, var(--glow) 55%, transparent)',
  boxShadow: 'inset 0 1px 0 color-mix(in oklab, var(--ice) 10%, transparent), 0 0 18px color-mix(in oklab, var(--glow) 10%, transparent)',
}

function Choice<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const on = value === o.v
        return (
          <button key={String(o.v)} type="button" onClick={() => { haptic(); onChange(o.v) }}
            className={`press-soft rounded-2xl border px-3 py-2.5 text-left transition-colors duration-200 ${on ? 'selected-pop text-ice' : 'workout-row text-ice'}`}
            style={on ? SELECTED : undefined} aria-pressed={on}>
            <div className="text-sm font-semibold">{o.label}</div>
            {o.hint && <div className="text-[11px] leading-snug text-dim">{o.hint}</div>}
          </button>
        )
      })}
    </div>
  )
}

export default function Onboarding() {
  const nav = useNavigate()
  const existing = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const [p, setP] = useState<Profile>(existing ?? {
    name: '', age: 20, sex: 'male', heightCm: 175, weightKg: 70, experience: 'novice', daysPerWeek: 3, sessionMinutes: 60, equipment: 'gym', goal: 'muscle', createdAt: new Date().toISOString(),
  })
  const up = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((prev) => ({ ...prev, [k]: v }))
  const valid = p.age >= 12 && p.age <= 99 && p.heightCm >= 120 && p.heightCm <= 230 && p.weightKg >= 30 && p.weightKg <= 250
  const [building, setBuilding] = useState<'new' | 'rebuild' | null>(null)
  const buildTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(buildTimer.current), [])

  // The plan builds in a few milliseconds; the logo gets one full loop so the moment reads as work being done.
  const build = () => {
    setBuilding(existing ? 'rebuild' : 'new')
    setProfile({ ...p, createdAt: existing?.createdAt ?? new Date().toISOString() })
    buildTimer.current = setTimeout(() => nav('/', { replace: true }), 4400)
  }

  if (building) return <LogoLoader label={building === 'rebuild' ? 'Rebuilding your plan' : 'Forging your plan'} />

  return (
    <Page title={existing ? 'Edit your profile' : `Welcome to ${NAMES.app}`} kicker={existing ? 'The plan rebuilds when you save.' : 'Six honest answers build your plan.'} back={!!existing}>
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (!valid) return; haptic('success'); build() }}>
        <div className="metric-panel aether-rise rise-1 space-y-4 p-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={p.name} onChange={(e) => up('name', e.target.value)} placeholder="What should we call you?" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="label">Age</label><NumField className="input font-mono" mode="numeric" ariaLabel="Age" value={p.age || undefined} onChange={(v) => up('age', v ?? 0)} /></div>
            <div><label className="label">Height cm</label><NumField className="input font-mono" mode="numeric" ariaLabel="Height in cm" value={p.heightCm || undefined} onChange={(v) => up('heightCm', v ?? 0)} /></div>
            <div><label className="label">Weight kg</label><NumField className="input font-mono" mode="decimal" ariaLabel="Weight in kg" value={p.weightKg || undefined} onChange={(v) => up('weightKg', v ?? 0)} /></div>
          </div>
          <div>
            <label className="label">Sex</label>
            <Choice<Sex> value={p.sex} onChange={(v) => up('sex', v)} options={[{ v: 'male', label: 'Male' }, { v: 'female', label: 'Female' }, { v: 'other', label: 'Other / skip' }]} />
            <p className="mt-2 text-[11px] leading-snug text-dim">Used only for the explanation page. The evidence says the plan should not change by sex.</p>
          </div>
        </div>

        <div className="metric-panel aether-rise rise-2 space-y-4 p-4">
          <div>
            <label className="label">Lifting experience</label>
            <Choice<Experience> value={p.experience} onChange={(v) => up('experience', v)} options={[
              { v: 'novice', label: 'New or under 6 months', hint: 'Full-body sessions, 8 to 12 reps' },
              { v: 'intermediate', label: '6 months to 2 years', hint: 'Splits, 6 to 12 reps' },
              { v: 'advanced', label: 'Over 2 years, consistent', hint: 'Higher volume, heavier' },
            ]} />
          </div>
          <div>
            <label className="label">Days per week you will actually show up</label>
            <Choice<Profile['daysPerWeek']> value={p.daysPerWeek} onChange={(v) => up('daysPerWeek', v)} options={[1, 2, 3, 4, 5, 6].map((n) => ({ v: n as Profile['daysPerWeek'], label: `${n} day${n > 1 ? 's' : ''}`, hint: n <= 2 ? 'Full body each time' : n === 3 ? 'Two lifting days + cardio' : n === 4 ? 'Chest & back / legs / arms + cardio' : n === 5 ? 'Adds an upper day' : 'Push / pull / legs + cardio' }))} />
            <p className="mt-2 text-[11px] leading-snug text-dim">Be honest. The plan is built for the days you really have, and it adapts if you miss some.</p>
          </div>
          <div>
            <label className="label">Session length</label>
            <Choice<Profile['sessionMinutes']> value={p.sessionMinutes} onChange={(v) => up('sessionMinutes', v)} options={[30, 45, 60, 75].map((n) => ({ v: n as Profile['sessionMinutes'], label: `${n} min` }))} />
          </div>
          <div>
            <label className="label">Equipment</label>
            <Choice<EquipmentAccess> value={p.equipment} onChange={(v) => up('equipment', v)} options={[
              { v: 'gym', label: 'Full gym' }, { v: 'dumbbells', label: 'Dumbbells at home', hint: 'plus a bench or sturdy chair' }, { v: 'bodyweight', label: 'Bodyweight only', hint: 'bands welcome' },
            ]} />
          </div>
          <div>
            <label className="label">Main goal</label>
            <Choice<Goal> value={p.goal} onChange={(v) => up('goal', v)} options={[
              { v: 'health', label: 'Health and energy' }, { v: 'muscle', label: 'Build muscle' }, { v: 'strength', label: 'Get strong', hint: 'heavier, fewer reps' }, { v: 'fatloss', label: 'Lose fat', hint: 'more cardio minutes' },
            ]} />
          </div>
          <div>
            <label className="label">Separate cardio day</label>
            <Choice<'yes' | 'no'> value={(p.cardioDay ?? true) ? 'yes' : 'no'} onChange={(v) => up('cardioDay', v === 'yes')} options={[
              { v: 'yes', label: 'Yes, one visit is cardio', hint: 'Mount Doom: 30 to 40 min; the lifting days keep their full volume' },
              { v: 'no', label: 'No, short finishers only', hint: 'All visits are lifting days' },
            ]} />
            <p className="text-[11px] text-dim mt-1.5">Needs 3 or more days. Aerobic work plus lifting carries the lowest mortality risk in the big cohorts.</p>
          </div>
        </div>

        <div className="aether-rise rise-3 space-y-2">
          <button className="btn-primary w-full" disabled={!valid} type="submit">{existing ? 'Save and rebuild plan' : 'Build my plan'}</button>
          {!valid && <p className="swap-in text-center text-xs text-legs">Check age, height and weight.</p>}
        </div>
      </form>
    </Page>
  )
}
