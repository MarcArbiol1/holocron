/**
 * What Miss Belle says. Each line can carry the move she makes while saying it.
 *
 * Pages have their own TVA-flavoured lines; every page also draws from the shared pool (Marvel and
 * X-Men, Star Wars, Lord of the Rings, gym parodies and Codex facts), so she rarely repeats herself.
 * Real film lines are short and credited; most lines are parodies.
 */
import type { ClipName } from './clips'

export type Line = [text: string, clip?: ClipName]
export type BelleSpot = 'home' | 'routines' | 'palantir' | 'library' | 'exercise' | 'order' | 'codex' | 'forge' | 'session' | 'done' | 'settings' | 'history' | 'onboarding'

const PAGE: Record<BelleSpot, Line[]> = {
  home: [
    ["Hi there! I'm Miss Belle, and welcome to the Training Variance Authority!", 'wave'],
    ['Rest day? Even the TVA takes lunch, sugar.', 'sass'],
    ['The Sacred Training Plan was written for you. Wouldn\'t want a Nexus event, would we?', 'sass'],
    ['For all reps, always.', 'flex'],
    ['Those rings won\'t close themselves. Well, they could. But that would be a variance.', 'point'],
  ],
  routines: [
    ['Every day, every set, perfectly scheduled. Deviate and… well. Let\'s not.', 'sass'],
    ['I wrote this plan myself, sugar. Mostly.', 'point'],
    ['The War Room. Where leg days are planned and never, ever skipped.', 'sass'],
    ['Perfectly balanced, as all things should be. Push and pull.', 'point'],
  ],
  palantir: [
    ['The Palantir sees everything. Including the leg day you skipped.', 'sass'],
    ['Look at that chart! The Time-Keepers would be so proud.', 'jump'],
    ['Numbers don\'t lie, sugar. They just wait for you to look.', 'point'],
    ['A long look into the Palantir never hurt anyone. Ask Saruman. Actually, don\'t.', 'giggle'],
  ],
  library: [
    ['Ninety-nine exercises, all drawn by hand. Well, by code. Don\'t tell anyone.', 'giggle'],
    ['Pick one, any one. They all lead to gains.', 'point'],
    ['Small muscles, big impact. Ask Ant-Man.', 'flex'],
  ],
  exercise: [
    ['Slow on the way down. Gravity is a free coach.', 'point'],
    ['Full range, sugar. Half-reps don\'t count in this timeline.', 'sass'],
    ['Stop one or two reps before failure. Close enough to grow, far enough to come back tomorrow.', 'point'],
  ],
  order: [
    ['Everybody starts as a Recruit. Even me. Okay, not me.', 'giggle'],
    ['Consistency gets you promoted. That\'s not a threat. Mostly.', 'sass'],
    ['Mutant and proud. Level and proud. Same thing.', 'flex'],
  ],
  codex: [
    ['Ten hard sets a week, per muscle. Schoenfeld said so, and I believe in him.', 'point'],
    ['Every rule in here has a paper behind it. I read them all. Twice.', 'sass'],
    ['Science, sugar. The only magic the TVA allows.', 'giggle'],
  ],
  forge: [
    ['Warm muscles lift more. Cold ones file complaints.', 'point'],
    ['Maximum effort! But first, the warm-up.', 'flex'],
    ['A few easy sets now, and the heavy ones feel lighter later. That\'s just physics.', 'point'],
  ],
  session: [
    ['I can do this all day. Can you?', 'flex'],
    ['Another!', 'jump'],
    ['Language!', 'sass'],
    ['Breathe, sugar. The rest timer is on your side.', 'point'],
    ['Log your reps in reserve. Not even Professor X can read your mind.', 'sass'],
  ],
  done: [
    ['Session archived for all time. Always.', 'jump'],
    ['Wakanda forever! And you, forever in the archive.', 'jump'],
    ['Look at you. The Time-Keepers are taking notes.', 'flex'],
  ],
  settings: [
    ['Careful with that Erase button. I\'d hate to prune you.', 'sass'],
    ['Fiddling with the timeline? I\'m watching, sugar.', 'sass'],
  ],
  history: [
    ['A fixed point in time. Can\'t change it now, and why would you?', 'point'],
    ['Look how far you\'ve come since then.', 'flex'],
  ],
  onboarding: [
    ["Hi there! I'm Miss Belle, and welcome to the Training Variance Authority!", 'wave'],
    ['Six honest answers, and I build your Sacred Training Plan. No pressure.', 'point'],
  ],
}

/** Lines that can come up on any page. */
const ANYWHERE: Line[] = [
  // Marvel
  ['"I can do this all day." Captain America knew about volume.', 'flex'],
  ['On your left. That\'s what I\'ll say on cardio day.', 'sass'],
  ['"Another!" said Thor, about his drink. I say it about sets.', 'jump'],
  ['Maximum effort!', 'flex'],
  ['I am inevitable. So is leg day.', 'sass'],
  ['That\'s my secret, sugar. I\'m always sore.', 'giggle'],
  ['Perfectly balanced, as all things should be. Push and pull.', 'point'],
  ['Dormammu, I\'ve come to bargain. Just one session.', 'point'],
  ['I looked at 14,000,605 futures. You skip legs in every one we lose.', 'point'],
  ['With great power comes great recovery.', 'point'],
  ['Whatever it takes.', 'flex'],
  ['Avengers, assemble! Okay, one avenger. You.', 'jump'],
  ['I\'m here to talk to you about the Mordor Initiative.', 'sass'],
  ['City\'s flying, robots everywhere, and you\'re worried about 5 kg dumbbells?', 'sass'],
  ['Excelsior!', 'jump'],
  // X-Men
  ['Wolverine heals in seconds. You need 48 hours. Respect the rest day.', 'point'],
  ['Mutant and proud.', 'flex'],
  ['Not even Professor X can read your mind. Log your reps.', 'sass'],
  ['To me, my X-Men! I mean, to the squat rack.', 'point'],
  // Star Wars
  ['Do or do not. There is no "skip leg day".', 'sass'],
  ['Size matters not. Form does.', 'point'],
  ['I find your lack of protein disturbing.', 'sass'],
  ['The Force is strong with this one. So are the quads.', 'flex'],
  ['These aren\'t the dumbbells you\'re looking for. They\'re heavier.', 'giggle'],
  ['Stay on target. Stay on target!', 'point'],
  // Lord of the Rings
  ['One does not simply walk into Mordor. One squats into it.', 'sass'],
  ['Even the smallest set can change the course of the future.', 'point'],
  ['All we have to decide is what to do with the reps that are given to us.', 'point'],
  ['You shall not pass… on leg day.', 'sass'],
  ['Fly, you fools! To the gym!', 'jump'],
  ['Second breakfast is a recovery strategy. Look it up.', 'giggle'],
  // gym parodies and TVA
  ['For all reps, always.', 'flex'],
  ['Skipping a session? That\'s a Nexus event, sugar.', 'sass'],
  ['The Time-Keepers see every rep. Make them count.', 'point'],
  ['I\'d hate to have to prune you. So don\'t make me.', 'sass'],
  ['Hydrate, sugar. Even kettlebells sweat.', 'giggle'],
  // Codex facts
  ['Muscles grow while you sleep. Seven hours, sugar. Minimum.', 'point'],
  ['Protein: about 1.6 grams per kilo of body weight a day is plenty for most people.', 'point'],
  ['Training a muscle twice a week beats once, for the same number of sets.', 'point'],
  ['Heavy or light, sets close to failure build muscle. Pick what you enjoy.', 'flex'],
  ['A little cardio helps your heart and won\'t steal your gains.', 'point'],
]

/** Lines that know where you are in your plan (built on Home from the live state). */
export function homeLines(o: { active?: string; today?: string; mode?: string; daysAway?: number; streak?: number }): Line[] {
  if (o.active) return [[`Your ${o.active} session is still open, sugar. Those sets won't finish themselves.`, 'point']]
  const out: Line[] = []
  if (o.daysAway !== undefined && o.daysAway >= 6) out.push([`Oh, hi! It's been ${o.daysAway} days. Your variant was getting… concerning.`, 'sass'])
  if (o.mode === 'done') out.push(['Week complete! Avengers, assemble… on the couch.', 'jump'])
  else if (o.mode === 'recovery') out.push(['Recovery day. Muscles grow while you rest, so rest like you mean it.', 'sleep'])
  else if (o.today) out.push([`Today's Sacred Training Plan says ${o.today}. Wouldn't want a Nexus event, would we?`, 'point'])
  if (o.streak && o.streak >= 2) out.push([`${o.streak}-week streak. You're becoming dangerous, sugar.`, 'flex'])
  return out
}

/** A shuffled deck per page, so a line doesn't come back until the deck runs out. */
const decks = new Map<string, Line[]>()
export function nextLine(spot: BelleSpot): Line {
  let deck = decks.get(spot)
  if (!deck || deck.length === 0) {
    const pool = [...PAGE[spot], ...PAGE[spot], ...ANYWHERE] // page lines twice as likely
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]] }
    deck = pool
    decks.set(spot, deck)
  }
  return deck.pop()!
}
