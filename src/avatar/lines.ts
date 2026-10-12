/**
 * What Miss Belle says. Each line can carry the move she makes while saying it.
 *
 * Pages have their own TVA-flavoured lines; every page also draws from the shared pool (Marvel and
 * X-Men, Star Wars, Lord of the Rings, gym parodies and Codex facts). She remembers what she said
 * recently across launches (localStorage), so a line only comes back once most of the others have had
 * their turn. Real film lines are short and credited; most lines are parodies.
 */
import type { ClipName } from './clips'

export type Line = [text: string, clip?: ClipName]
export type BelleSpot = 'home' | 'routines' | 'palantir' | 'library' | 'exercise' | 'order' | 'codex' | 'forge' | 'session' | 'done' | 'settings' | 'history' | 'onboarding'

const PAGE: Record<BelleSpot, Line[]> = {
  home: [
    ["Hi there! I'm Miss Belle, and welcome to the Training Variance Authority!", 'wave'],
    ['The Sacred Training Plan was written for you. Wouldn\'t want a Nexus event, would we?', 'sass'],
    ['For all reps, always.', 'flex'],
    ['Those rings won\'t close themselves. Well, they could. But that would be a variance.', 'point'],
    ['Whatever it takes. Starting with today.', 'flex'],
  ],
  routines: [
    ['Every day, every set, perfectly scheduled. Deviate and… well. Let\'s not.', 'sass'],
    ['I wrote this plan myself, sugar. Mostly.', 'point'],
    ['The War Room. Where leg days are planned and never, ever skipped.', 'sass'],
    ['Perfectly balanced, as all things should be. Push and pull.', 'point'],
    ['Four days a week? I wrote it myself, sugar.', 'giggle'],
    ['Every day has a name. Every name has a purpose. Mostly suffering.', 'sass'],
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
    ['Browsing the archive? Very Wong of you.', 'giggle'],
  ],
  exercise: [
    ['Slow on the way down. Gravity is a free coach.', 'point'],
    ['Full range, sugar. Half-reps don\'t count in this timeline.', 'sass'],
    ['Stop one or two reps before failure. Close enough to grow, far enough to come back tomorrow.', 'point'],
    ['Hips back, chest up. And no, half-reps don\'t count in this timeline.', 'sass'],
    ['Control the weight. Don\'t let the weight control you.', 'point'],
  ],
  order: [
    ['Everybody starts as a Recruit. Even me. Okay, not me.', 'giggle'],
    ['Consistency gets you promoted. That\'s not a threat. Mostly.', 'sass'],
    ['Mutant and proud. Level and proud. Same thing.', 'flex'],
    ['Recruit, huh? Everybody starts somewhere.', 'point'],
    ['Knight in ten weeks if you\'re consistent. That\'s not a threat. Mostly.', 'sass'],
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
    ['Maximum effort! Right after the stretching.', 'flex'],
  ],
  session: [
    ['I can do this all day. Can you?', 'flex'],
    ['Another!', 'jump'],
    ['Language!', 'sass'],
    ['Breathe, sugar. The rest timer is on your side.', 'point'],
    ['Log your reps in reserve. Not even Professor X can read your mind.', 'sass'],
    ['A couple of sets left. I can do this all day. Can you?', 'flex'],
    ['Rest\'s over when the timer says so. Not a second before, sugar.', 'point'],
  ],
  done: [
    ['Session archived for all time. Always.', 'jump'],
    ['Wakanda forever! And you, forever in the archive.', 'jump'],
    ['Look at you. The Time-Keepers are taking notes.', 'flex'],
    ['I am Iron Man. Well, you are. Today, anyway.', 'flex'],
    ['Avengers, assemble! Oh wait, you already did the work.', 'jump'],
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
  ['"I am Iron Man." Said nobody after skipping a session.', 'sass'],
  ['Hulk smash! Then Hulk stretch. Hulk not reckless.', 'flex'],
  ['I understood that reference. It was "progressive overload".', 'giggle'],
  ['Groot only says three words. You only need three: one more set.', 'giggle'],
  ['We have a Hulk. You have a deload week. Use it.', 'point'],
  ['Wanda rewrote reality. You can rewrite your bench PR.', 'flex'],
  // X-Men
  ['Wolverine heals in seconds. You need 48 hours. Respect the rest day.', 'point'],
  ['Mutant and proud.', 'flex'],
  ['Not even Professor X can read your mind. Log your reps.', 'sass'],
  ['To me, my X-Men! I mean, to the squat rack.', 'point'],
  ['Logan would never skip a rest day. He just heals through it. You can\'t.', 'sass'],
  ['Cerebro found one mutant who hasn\'t trained this week. It\'s you, sugar.', 'sass'],
  // Star Wars
  ['Do or do not. There is no "skip leg day".', 'sass'],
  ['Size matters not. Form does.', 'point'],
  ['I find your lack of protein disturbing.', 'sass'],
  ['The Force is strong with this one. So are the quads.', 'flex'],
  ['These aren\'t the dumbbells you\'re looking for. They\'re heavier.', 'giggle'],
  ['Stay on target. Stay on target!', 'point'],
  ['This is the way. To the gym.', 'point'],
  ['Never tell me the odds. Tell me the reps.', 'sass'],
  ['Patience you must have. Muscle takes weeks, young Padawan.', 'point'],
  // Lord of the Rings
  ['One does not simply walk into Mordor. One squats into it.', 'sass'],
  ['Even the smallest set can change the course of the future.', 'point'],
  ['All we have to decide is what to do with the reps that are given to us.', 'point'],
  ['You shall not pass… on leg day.', 'sass'],
  ['Fly, you fools! To the gym!', 'jump'],
  ['Second breakfast is a recovery strategy. Look it up.', 'giggle'],
  ['Not all those who wander are lost. Some are looking for a free bench.', 'giggle'],
  ['I would have followed you, my brother. My captain. To leg day.', 'flex'],
  // gym parodies and TVA
  ['For all reps, always.', 'flex'],
  ['Skipping a session? That\'s a Nexus event, sugar.', 'sass'],
  ['The Time-Keepers see every rep. Make them count.', 'point'],
  ['I\'d hate to have to prune you. So don\'t make me.', 'sass'],
  ['Hydrate, sugar. Even kettlebells sweat.', 'giggle'],
  ['Nobody escapes the TVA. Or the progressive overload.', 'sass'],
  ['Reset charges are for timelines, sugar. Not for skipping legs.', 'sass'],
  // Codex facts
  ['Muscles grow while you sleep. Seven hours, sugar. Minimum.', 'point'],
  ['Protein: about 1.6 grams per kilo of body weight a day is plenty for most people.', 'point'],
  ['Training a muscle twice a week beats once, for the same number of sets.', 'point'],
  ['Heavy or light, sets close to failure build muscle. Pick what you enjoy.', 'flex'],
  ['A little cardio helps your heart and won\'t steal your gains.', 'point'],
  ['Walking counts. More steps a day, a longer life. It\'s in the Codex.', 'point'],
  ['Stretching under load builds muscle too. Lengthened positions, sugar.', 'point'],
]

const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)]

/** Lines that know where you are in your plan (built on Home from the live state). Wording varies each time. */
export function homeLines(o: { active?: string; today?: string; mode?: string; daysAway?: number; streak?: number; neglected?: { title: string; days: number } }): Line[] {
  if (o.active) return [[pick([
    `Your ${o.active} session is still open, sugar. Those sets won't finish themselves.`,
    `${o.active} is still running. I'm timing you, sugar.`,
  ]), 'point']]
  const out: Line[] = []
  if (o.daysAway !== undefined && o.daysAway >= 6) out.push([pick([
    `Oh, hi! It's been ${o.daysAway} days. Your variant was getting… concerning.`,
    `Dormammu, you've come to bargain. ${o.daysAway} days away. Just one session.`,
    `${o.daysAway} days, sugar. Whatever it takes to come back, we start lighter.`,
    `Long time no see! ${o.daysAway} days. No guilt, sugar. We just start a little lighter.`,
  ]), 'sass'])
  if (o.neglected) out.push([pick([
    `You haven't visited ${o.neglected.title} in ${o.neglected.days} days. It misses you.`,
    `${o.neglected.title}: last seen ${o.neglected.days} days ago. The Time-Keepers noticed.`,
  ]), 'sass'])
  if (o.mode === 'done') out.push([pick(['Week complete! Avengers, assemble… on the couch.', 'Every session this week, done. Perfectly balanced.']), 'jump'])
  else if (o.mode === 'recovery') out.push([pick(['Recovery day. Muscles grow while you rest, so rest like you mean it.', 'Rest day! Even the TVA takes lunch, sugar.', 'Rest day. Muscles grow while you sleep. Go eat something.']), 'sleep'])
  else if (o.today) out.push([pick([
    `Today's Sacred Training Plan says ${o.today}. Wouldn't want a Nexus event, would we?`,
    `Today is ${o.today}. I checked the timeline twice.`,
    `${o.today} today, sugar. For all reps, always.`,
  ]), 'point'])
  if (o.streak && o.streak >= 2) out.push([`${o.streak}-week streak. You're becoming dangerous, sugar.`, 'flex'])
  return out
}

/**
 * The next line for a page. Page lines and the shared pool are mixed (page lines a little more likely),
 * and anything she said recently on ANY page is skipped. The memory survives relaunches (localStorage),
 * because an installed iPhone app relaunches often and a fresh deck each time felt like the same few lines.
 */
const SEEN_KEY = 'holocron-belle-seen'
const loadSeen = (): string[] => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') } catch { return [] } }
export function remember(text: string) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...loadSeen().filter((t) => t !== text), text].slice(-60))) } catch { /* private mode: no memory */ }
}
export function nextLine(spot: BelleSpot): Line {
  const page = PAGE[spot], pool = [...page, ...ANYWHERE.filter((l) => !page.some((p) => p[0] === l[0]))]
  const seen = new Set(loadSeen())
  // forget the oldest once nearly everything has been said, so there is always a choice
  const fresh = pool.filter((l) => !seen.has(l[0]))
  const choices = fresh.length >= 3 ? fresh : pool.filter((l) => !loadSeen().slice(-8).includes(l[0]))
  const freshPage = choices.filter((l) => page.includes(l))
  const line = freshPage.length && Math.random() < 0.35 ? pick(freshPage) : pick(choices)
  remember(line[0])
  return line
}
