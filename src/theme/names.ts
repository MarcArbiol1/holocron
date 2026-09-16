/**
 * EVERY themed name in the app lives here and nowhere else.
 *
 * Why: some of these words (Holocron, Padawan, Mordor, Palantir) are borrowed
 * from films and books. Using a word is not a copyright problem, but if the app
 * ever went on an app store or made money, a trademark owner could ask for a
 * rename. Keeping the names in one file means a rename is a five-minute job.
 * See docs/IP-NOTES.md for the research behind that.
 */
export const NAMES = {
  app: 'Holocron',
  tagline: 'Your training, archived.',

  pages: {
    home: 'The Holocron',      // today's recommendation + level
    forge: 'THE FORGE',        // warm-up that pops up before each session
    session: 'The Quest',      // the live workout logger
    palantir: 'The Palantir',  // week / month recap
    library: 'The Archive',    // exercise library with animations
    order: 'The Order',        // levels and XP
    routines: 'The War Room',  // your routine days
    settings: 'Settings',
  },

  /** Routine day names, keyed by the day id used in src/engine/program.ts */
  days: {
    legs: 'Mordor',
    lower: 'Mordor',
    push: 'The Siege',
    pull: 'The Drawbridge',
    upper: 'The Citadel',
    fullA: 'The Fellowship I',
    fullB: 'The Fellowship II',
    fullC: 'The Fellowship III',
    health: 'The Fellowship',
    cardio: 'Mount Doom',
    core: 'The Keep',
    mobility: 'The Shire',
    custom: 'Free Quest',
  } as const,

  /** Level ladder, lowest first. XP thresholds live in src/engine/levels.ts */
  levels: [
    'Recruit',
    'Padawan',
    'Initiate',
    'Adventurer',
    'Warrior',
    'Knight',
    'Elite',
    'Champion',
    'Master',
    'Legend',
    'Mythic',
    'Ascended',
  ] as const,
} as const

export type DayId = keyof typeof NAMES.days
export type LevelName = (typeof NAMES.levels)[number]
