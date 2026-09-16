/** The muscle model used for set counting, recovery and the heat-map. */
export const MUSCLES = {
  chest: { label: 'Chest', group: 'push' },
  frontDelts: { label: 'Front delts', group: 'push' },
  sideDelts: { label: 'Side delts', group: 'push' },
  rearDelts: { label: 'Rear delts', group: 'pull' },
  triceps: { label: 'Triceps', group: 'push' },
  lats: { label: 'Lats', group: 'pull' },
  upperBack: { label: 'Upper back', group: 'pull' },
  biceps: { label: 'Biceps', group: 'pull' },
  forearms: { label: 'Forearms', group: 'pull' },
  lowerBack: { label: 'Lower back', group: 'core' },
  abs: { label: 'Abs', group: 'core' },
  obliques: { label: 'Obliques', group: 'core' },
  quads: { label: 'Quads', group: 'legs' },
  hamstrings: { label: 'Hamstrings', group: 'legs' },
  glutes: { label: 'Glutes', group: 'legs' },
  calves: { label: 'Calves', group: 'legs' },
  hipFlexors: { label: 'Hip flexors', group: 'core' },
} as const

export type Muscle = keyof typeof MUSCLES
export type MuscleGroup = 'push' | 'pull' | 'legs' | 'core'

export const MUSCLE_IDS = Object.keys(MUSCLES) as Muscle[]

/** The muscles that "count" toward the weekly-sets target (the small ones are tracked but not targeted). */
export const TARGET_MUSCLES: Muscle[] = [
  'chest', 'frontDelts', 'sideDelts', 'rearDelts', 'triceps',
  'lats', 'upperBack', 'biceps',
  'quads', 'hamstrings', 'glutes', 'calves',
  'abs', 'lowerBack',
]

export const GROUP_COLOR: Record<MuscleGroup, string> = {
  push: '#f08a3c',
  pull: '#3fa7e0',
  legs: '#e0553f',
  core: '#9b6cf0',
}
