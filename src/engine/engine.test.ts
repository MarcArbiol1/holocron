import { describe, expect, it } from 'vitest'
import { EXERCISE_BY_ID, EXERCISES } from '../data/exercises'
import type { Profile, Session } from '../data/types'
import { buildProgram, healthDay, plannedSetsPerMuscle } from './program'
import { recommend } from './recommend'
import { levelFor, sessionXp, THRESHOLDS } from './levels'
import { suggest } from './progression'
import { setsPerMuscle, cardioMinutes, weekStreak } from './recap'
import { buildWarmup } from './warmup'
import { uid } from './ids'

const base: Profile = {
  name: 'Test', age: 22, sex: 'male', heightCm: 180, weightKg: 75, experience: 'novice',
  daysPerWeek: 3, sessionMinutes: 60, equipment: 'gym', goal: 'muscle', createdAt: '2026-08-01T10:00:00.000Z',
}

function session(dayKey: string, endedAt: string, exerciseIds: string[], reps = 10, weight = 40): Session {
  return {
    id: uid(), dayId: 'fullA', dayKey, title: 't', startedAt: endedAt, endedAt, cardio: [],
    exercises: exerciseIds.map((id) => ({ exerciseId: id, sets: [1, 2, 3].map(() => ({ reps, weightKg: weight, rir: 2, done: true })) })),
  }
}

describe('exercise library', () => {
  it('has unique ids and non-empty steps', () => {
    const ids = new Set(EXERCISES.map((e) => e.id))
    expect(ids.size).toBe(EXERCISES.length)
    for (const e of EXERCISES) expect(e.steps.length).toBeGreaterThan(0)
  })
})

describe('buildProgram', () => {
  const variants: Partial<Profile>[] = [
    {}, { daysPerWeek: 1 }, { daysPerWeek: 2 }, { daysPerWeek: 4, experience: 'intermediate' }, { daysPerWeek: 5, experience: 'advanced', goal: 'strength' },
    { daysPerWeek: 6, experience: 'advanced' }, { equipment: 'bodyweight' }, { equipment: 'dumbbells', sessionMinutes: 30 }, { age: 16 }, { age: 70, weightKg: 95 }, { sex: 'female', goal: 'fatloss' },
  ]
  for (const v of variants) {
    it(`builds a valid program for ${JSON.stringify(v)}`, () => {
      const p = buildProgram({ ...base, ...v })
      expect(p.days.length).toBe(v.daysPerWeek ?? base.daysPerWeek)
      for (const d of p.days) {
        if (d.muscles.length) expect(d.blocks.length).toBeGreaterThanOrEqual(3)
        for (const b of d.blocks) {
          expect(EXERCISE_BY_ID[b.exerciseId]).toBeDefined()
          expect(b.sets).toBeGreaterThan(0)
        }
        const ids = d.blocks.map((b) => b.exerciseId)
        expect(new Set(ids).size).toBe(ids.length)
      }
    })
  }
  it('gives youth and older adults reps in reserve >= 2 and no level-3 lifts', () => {
    for (const age of [15, 70]) {
      const p = buildProgram({ ...base, age })
      for (const d of p.days) for (const b of d.blocks) {
        if (EXERCISE_BY_ID[b.exerciseId].category === 'cardio') continue
        expect(b.rir).toBeGreaterThanOrEqual(2)
        expect(EXERCISE_BY_ID[b.exerciseId].level).toBeLessThan(3)
      }
    }
  })
  it('uses only bodyweight/band exercises in bodyweight mode', () => {
    const p = buildProgram({ ...base, equipment: 'bodyweight' })
    for (const d of p.days) for (const b of d.blocks) {
      const ex = EXERCISE_BY_ID[b.exerciseId]
      expect(ex.equipment.some((e) => e === 'bodyweight' || e === 'band' || e === 'jumpRope')).toBe(true)
    }
  })
  it('plans a sensible weekly set count for big muscles', () => {
    const p = buildProgram({ ...base, daysPerWeek: 4, experience: 'intermediate' })
    const sets = plannedSetsPerMuscle(p)
    expect(sets.quads!).toBeGreaterThanOrEqual(8)
    expect(sets.chest!).toBeGreaterThanOrEqual(6)
    expect(sets.lats!).toBeGreaterThanOrEqual(6)
  })
  it('cardio day carries two alternating sessions and wall squats for the health goal', () => {
    const p = buildProgram({ ...base, daysPerWeek: 4, goal: 'health' })
    const cardio = p.days.find((d) => d.id === 'cardio')!
    expect(cardio.cardioPlan?.steady.minutes).toBeGreaterThanOrEqual(25)
    expect(cardio.cardioPlan?.intervals?.style).toBe('intervals')
    expect(cardio.blocks.some((b) => b.exerciseId === 'wallSit' && b.sets === 4 && b.seconds === 120)).toBe(true)
    expect(cardio.blocks.some((b) => EXERCISE_BY_ID[b.exerciseId].category === 'cardio')).toBe(false)
    const older = buildProgram({ ...base, daysPerWeek: 4, age: 70 })
    expect(older.days.find((d) => d.id === 'cardio')!.cardioPlan?.intervals).toBeUndefined()
  })
  it('health day is the minimum-dose full body', () => {
    const d = healthDay(base)
    const patterns = d.blocks.map((b) => EXERCISE_BY_ID[b.exerciseId].pattern)
    expect(patterns).toContain('squat')
    expect(patterns).toContain('pushH')
    expect(patterns).toContain('pullH')
    expect(d.cardioMinutes).toBeGreaterThan(0)
  })
})

describe('recommend', () => {
  const now = new Date('2026-09-10T18:00:00.000Z') // Thursday
  const program = buildProgram(base)
  it('starts with the first day for a new user', () => {
    const r = recommend(base, program, [], now)
    expect(r.mode).toBe('plan')
    expect(r.day.key).toBe(program.days[0].key)
  })
  it('advances the rotation', () => {
    const s = session(program.days[0].key, '2026-09-08T18:00:00.000Z', ['gobletSquat', 'dbBenchPress'])
    const r = recommend(base, program, [s], now)
    expect(r.day.key).toBe(program.days[1].key)
  })
  it('switches to the health session after two weeks of low attendance', () => {
    const s = session(program.days[0].key, '2026-08-20T18:00:00.000Z', ['gobletSquat'])
    const r = recommend(base, program, [s], now)
    expect(r.mode).toBe('health')
    expect(r.day.id).toBe('health')
  })
  it('does not put you back on the same muscles within 48 hours', () => {
    const p4 = buildProgram({ ...base, daysPerWeek: 4, experience: 'intermediate', cardioDay: false })
    // Did lower yesterday and upper the day before -> next in rotation is upper-2 (fine, >48h)
    const s1 = session('upper-1', '2026-09-08T18:00:00.000Z', ['benchPress', 'barbellRow', 'overheadPress', 'pullUp'], 8, 60)
    const s2 = session('lower-1', '2026-09-09T18:00:00.000Z', ['backSquat', 'deadlift', 'splitSquat'], 8, 80)
    const r = recommend({ ...base, daysPerWeek: 4, experience: 'intermediate', cardioDay: false }, p4, [s1, s2], now)
    expect(r.day.id).toBe('upper')
    // Did upper 20 hours ago -> the rotation would say lower... which is fine; but if lower was 20h ago too, recovery mode
    const s3 = session('upper-2', '2026-09-10T00:00:00.000Z', ['benchPress', 'barbellRow', 'overheadPress', 'pullUp'], 8, 60)
    const s4 = session('lower-2', '2026-09-10T10:00:00.000Z', ['backSquat', 'deadlift', 'splitSquat'], 8, 80)
    const r2 = recommend({ ...base, daysPerWeek: 6, experience: 'intermediate' }, buildProgram({ ...base, daysPerWeek: 6, experience: 'intermediate' }), [s1, s2, s3, s4], now)
    // nothing lifted is recovered: either a recovery/cardio verdict or the rotation's own cardio day
    expect(['recovery', 'cardio', 'done'].includes(r2.mode) || r2.day.id === 'cardio').toBe(true)
  })
  it('hands out cardio once the planned week is done', () => {
    const s = [1, 2, 3].map((i) => session(program.days[i - 1].key, `2026-09-0${6 + i}T18:00:00.000Z`, ['gobletSquat']))
    const r = recommend(base, program, s, now)
    expect(['cardio', 'done']).toContain(r.mode)
  })
})

describe('levels + xp', () => {
  it('thresholds rise and levels map correctly', () => {
    for (let i = 1; i < THRESHOLDS.length; i++) expect(THRESHOLDS[i]).toBeGreaterThan(THRESHOLDS[i - 1])
    expect(levelFor(0).name).toBe('Recruit')
    expect(levelFor(500).name).toBe('Padawan')
    expect(levelFor(60000).name).toBe('Ascended')
    expect(levelFor(499).progress).toBeCloseTo(499 / 500)
  })
  it('awards base + sets + week bonus', () => {
    const s = session('fullA', '2026-09-10T18:00:00.000Z', ['gobletSquat', 'dbBenchPress'])
    const xp = sessionXp(s, [], { ...base, daysPerWeek: 1 })
    expect(xp.base).toBe(100)
    expect(xp.sets).toBe(30)
    expect(xp.week).toBe(150)
    expect(xp.total).toBe(280 + xp.prs)
  })
})

describe('progression', () => {
  const block = { exerciseId: 'dbBenchPress', sets: 3, repMin: 8, repMax: 12, restSec: 90, rir: 2, alternatives: [] }
  it('suggests more weight after hitting the top of the range with reps to spare', () => {
    const s = session('fullA', '2026-09-08T18:00:00.000Z', ['dbBenchPress'], 12, 20)
    expect(suggest(block, [s]).trend).toBe('up')
    expect(suggest(block, [s]).weightKg).toBe(22.5)
  })
  it('suggests less weight after missing the bottom of the range twice', () => {
    const s = session('fullA', '2026-09-08T18:00:00.000Z', ['dbBenchPress'], 6, 20)
    expect(suggest(block, [s]).trend).toBe('down')
  })
  it('is honest on the first attempt', () => {
    expect(suggest(block, []).trend).toBe('new')
  })
})

describe('recap', () => {
  it('counts fractional sets and cardio', () => {
    const s = session('fullA', '2026-09-08T18:00:00.000Z', ['benchPress'])
    s.cardio = [{ exerciseId: 'bike', minutes: 10, intensity: 'moderate' }, { exerciseId: 'run', minutes: 5, intensity: 'vigorous' }]
    const sets = setsPerMuscle([s])
    expect(sets.chest).toBe(3)
    expect(cardioMinutes([s])).toBe(20)
  })
  it('streak counts full weeks', () => {
    const p: Profile = { ...base, daysPerWeek: 1 }
    const s = [session('fullA', '2026-08-31T18:00:00.000Z', ['gobletSquat']), session('fullA', '2026-09-07T18:00:00.000Z', ['gobletSquat'])]
    expect(weekStreak(s, p, new Date('2026-09-10T18:00:00.000Z'))).toBe(2)
  })
})

describe('warmup', () => {
  it('builds ramp sets from the last working weight', () => {
    const program = buildProgram({ ...base, experience: 'intermediate', daysPerWeek: 4 })
    const lower = program.days.find((d) => d.id === 'lower')!
    const s = session('lower-1', '2026-09-05T18:00:00.000Z', [lower.blocks[0].exerciseId], 8, 80)
    const w = buildWarmup(lower, { ...base, experience: 'intermediate', daysPerWeek: 4 }, [s])
    expect(w.ramp?.sets[0].weightKg).toBe(40)
    expect(w.ramp?.sets[1].weightKg).toBe(55)
    expect(w.dynamic.length).toBeGreaterThan(2)
  })
})
