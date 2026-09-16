/**
 * Derived facts about the user. Every number here is traced in docs/EVIDENCE.md.
 */
import type { Profile } from '../data/types'

export type AgeBracket = 'youth' | 'adult' | 'older'

export const bmi = (p: Pick<Profile, 'heightCm' | 'weightKg'>) => p.weightKg / Math.pow(p.heightCm / 100, 2)

export function bmiLabel(v: number): string {
  if (v < 18.5) return 'under'
  if (v < 25) return 'healthy'
  if (v < 30) return 'over'
  return 'obese'
}

/** <18 youth (NSCA youth rules), 65+ older adult (WHO balance rule). */
export const ageBracket = (age: number): AgeBracket => (age < 18 ? 'youth' : age >= 65 ? 'older' : 'adult')

/** Morton 2018: gains plateau at about 1.6 g protein per kg per day. */
export const proteinTarget = (p: Pick<Profile, 'weightKg'>) => Math.round(p.weightKg * 1.6)

/** Prefer low-impact cardio when joints carry more load (BMI >= 30) or for older adults. */
export const preferLowImpact = (p: Profile) => bmi(p) >= 30 || ageBracket(p.age) === 'older'

/**
 * Weekly moderate-equivalent cardio minutes to aim for.
 * WHO 2020: 150 min moderate (or 75 vigorous). Donnelly 2009 (ACSM): >250 min/week
 * for clinically meaningful weight loss.
 */
export function weeklyCardioTarget(p: Profile): number {
  if (p.goal === 'fatloss') return 250
  return 150
}

/** Plain-language lines shown on the profile page. */
export function profileFacts(p: Profile): string[] {
  const b = bmi(p)
  const facts = [
    `BMI ${b.toFixed(1)} (${bmiLabel(b)} range). It only changes your cardio choices, not your lifting plan.`,
    `Protein target about ${proteinTarget(p)} g per day (1.6 g per kg; more does not add muscle).`,
    `Cardio target ${weeklyCardioTarget(p)} moderate minutes a week. Vigorous minutes count double.`,
  ]
  const br = ageBracket(p.age)
  if (br === 'youth') facts.push('Under 18: technique first, lighter loads, never to failure. Lifting is safe with good form.')
  if (br === 'older') facts.push('65+: balance work is added three days a week and sets stop well short of failure.')
  if (p.sex !== 'other') facts.push('Sex does not change the plan: men and women respond to the same training the same way.')
  return facts
}
