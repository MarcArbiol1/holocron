import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { EquipmentAccess, Experience, Goal, Profile, Sex } from '../data/types'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Page } from '../components/ui'

function Choice<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => (
        <button key={String(o.v)} type="button" onClick={() => onChange(o.v)}
          className={`rounded-xl px-3 py-2.5 text-left border transition ${value === o.v ? 'border-gold-400 bg-gold-400/10 text-gold-200' : 'border-white/10 bg-ink-700 text-slate-200'}`}>
          <div className="text-sm font-semibold">{o.label}</div>
          {o.hint && <div className="text-[11px] text-slate-400 leading-snug">{o.hint}</div>}
        </button>
      ))}
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
  const up = <K extends keyof Profile>(k: K, v: Profile[K]) => setP({ ...p, [k]: v })
  const valid = p.age >= 12 && p.age <= 99 && p.heightCm >= 120 && p.heightCm <= 230 && p.weightKg >= 30 && p.weightKg <= 250

  return (
    <Page title={existing ? 'Edit your profile' : `Welcome to ${NAMES.app}`} sub={existing ? 'The plan rebuilds when you save.' : 'Six honest answers build your plan.'} back={!!existing}>
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (!valid) return; setProfile({ ...p, createdAt: existing?.createdAt ?? new Date().toISOString() }); nav('/') }}>
        <div className="card p-4 space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={p.name} onChange={(e) => up('name', e.target.value)} placeholder="What should we call you?" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="label">Age</label><input className="input" type="number" inputMode="numeric" value={p.age} onChange={(e) => up('age', Number(e.target.value))} /></div>
            <div><label className="label">Height cm</label><input className="input" type="number" inputMode="numeric" value={p.heightCm} onChange={(e) => up('heightCm', Number(e.target.value))} /></div>
            <div><label className="label">Weight kg</label><input className="input" type="number" inputMode="decimal" value={p.weightKg} onChange={(e) => up('weightKg', Number(e.target.value))} /></div>
          </div>
          <div>
            <label className="label">Sex</label>
            <Choice<Sex> value={p.sex} onChange={(v) => up('sex', v)} options={[{ v: 'male', label: 'Male' }, { v: 'female', label: 'Female' }, { v: 'other', label: 'Other / skip' }]} />
            <p className="text-[11px] text-slate-500 mt-1.5">Used only for the explanation page. The evidence says the plan should not change by sex.</p>
          </div>
        </div>

        <div className="card p-4 space-y-3">
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
            <Choice<Profile['daysPerWeek']> value={p.daysPerWeek} onChange={(v) => up('daysPerWeek', v)} options={[1, 2, 3, 4, 5, 6].map((n) => ({ v: n as Profile['daysPerWeek'], label: `${n} day${n > 1 ? 's' : ''}`, hint: n <= 2 ? 'Full body each time' : n === 3 ? 'Full body or upper/lower/full' : n === 4 ? 'Upper / lower' : 'Push / pull / legs' }))} />
            <p className="text-[11px] text-slate-500 mt-1.5">Be honest. The plan is built for the days you really have, and it adapts if you miss some.</p>
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
        </div>

        <button className="btn-primary w-full" disabled={!valid} type="submit">{existing ? 'Save and rebuild plan' : 'Build my plan'}</button>
        {!valid && <p className="text-xs text-legs text-center">Check age, height and weight.</p>}
      </form>
    </Page>
  )
}
