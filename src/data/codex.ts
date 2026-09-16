/**
 * The Codex: every rule the app applies, in plain words, with the paper behind it.
 * Mirrors docs/EVIDENCE.md and docs/AUDIT.md. Keep the two in sync.
 */
export type Strength = 'strong' | 'moderate' | 'weak'
export type Area = 'health' | 'plan' | 'physique' | 'cardio' | 'recovery' | 'safety'

export interface Rule {
  id: string
  area: Area
  title: string
  /** What the app does. */
  rule: string
  /** Why, in one or two sentences a beginner can follow. */
  why: string
  source: string
  doi?: string
  strength: Strength
}

export const AREAS: Record<Area, string> = {
  health: 'Health and long life',
  plan: 'How the plan is built',
  physique: 'Muscle and strength',
  cardio: 'Cardio',
  recovery: 'Recovery',
  safety: 'Safety and special cases',
}

export const CODEX: Rule[] = [
  { id: 'who', area: 'health', title: 'The weekly minimum', rule: '150 to 300 minutes of moderate cardio a week (or 75 to 150 vigorous) plus muscle work on at least 2 days; 65+ add balance work 3 days a week.', why: 'This is the global guideline every other rule sits on. Vigorous minutes count double in the recap.', source: 'WHO guidelines, Bull et al. 2020, Br J Sports Med', doi: '10.1136/bjsports-2020-102955', strength: 'strong' },
  { id: 'mortality', area: 'health', title: 'Lifting and living longer', rule: 'About 30 to 60 minutes of lifting a week gives most of the reduction in risk of dying early; adding cardio lowers it further.', why: 'Sixteen cohorts pooled: muscle-strengthening cut all-cause mortality 10 to 17%. Aerobic plus 1 to 2 lifting sessions a week was the best combination.', source: 'Momma et al. 2022; Gorzelitz et al. 2022, Br J Sports Med', doi: '10.1136/bjsports-2021-105061', strength: 'strong' },
  { id: 'split', area: 'plan', title: 'Days become a split', rule: '1 to 2 days: full body. 3: full body or upper/lower/full. 4: upper/lower twice. 5 to 6: push/pull/legs. Novices lift at most 4 days.', why: 'The split is only a scheduling tool: it exists so every muscle is trained about twice a week with the days you actually have.', source: 'ACSM position stand 2009; Ramos-Campo 2024, J Strength Cond Res', doi: '10.1249/MSS.0b013e3181915670', strength: 'strong' },
  { id: 'frequency', area: 'physique', title: 'Every muscle twice a week', rule: 'Each muscle is trained on at least two days a week when you train 3 or more days.', why: 'Meta-analysis: twice a week beat once for muscle growth; spreading the same sets over more days did not matter beyond that.', source: 'Schoenfeld, Ogborn & Krieger 2016, Sports Med', doi: '10.1007/s40279-016-0543-8', strength: 'strong' },
  { id: 'volume', area: 'physique', title: 'How many sets', rule: 'Weekly target per muscle: beginners 6 to 10 hard sets, intermediates 10 to 16, advanced 12 to 20. A set for a secondary muscle counts half.', why: 'Growth starts around 4 weekly sets and each extra set buys a little less. Beyond about 20 the return is small.', source: 'Schoenfeld 2017; Baz-Valle 2022; Pelland 2026, Sports Med', doi: '10.1007/s40279-025-02344-w', strength: 'strong' },
  { id: 'load', area: 'physique', title: 'Heavy or light', rule: 'Beginners 8 to 12 reps; intermediates 6 to 12; a strength goal uses 3 to 6. Light and heavy both build muscle when sets are taken close to failure.', why: 'Twenty-one studies: growth was the same across loads, but only heavy loads made people strong at heavy lifts.', source: 'Schoenfeld et al. 2017, J Strength Cond Res', doi: '10.1519/JSC.0000000000002200', strength: 'strong' },
  { id: 'failure', area: 'physique', title: 'How close to failure', rule: 'Finish sets 1 to 3 reps short of failure for muscle; strength does not need it. Under 18 and 65+ stop 2 to 3 reps short.', why: 'Growth improves as sets get closer to failure, but going all the way adds little and costs recovery.', source: 'Refalo 2023; Robinson 2024, Sports Med', doi: '10.1007/s40279-024-02069-2', strength: 'moderate' },
  { id: 'rest', area: 'physique', title: 'Rest between sets', rule: 'Beginners 1.5 minutes on big lifts; trained lifters 2 to 3. About a minute on small lifts.', why: 'Three minutes beat one for strength and growth in trained men; beginners do fine with 60 to 120 seconds.', source: 'Schoenfeld 2016; Grgic 2018, Sports Med', doi: '10.1007/s40279-017-0788-x', strength: 'strong' },
  { id: 'order', area: 'plan', title: 'Big lifts first', rule: 'Compound lifts come before isolation work in every day.', why: 'Exercises done first get more reps and greater strength gains, so the ones that matter go first.', source: 'ACSM 2009; Simão et al. 2012, Sports Med', doi: '10.2165/11597240-000000000-00000', strength: 'strong' },
  { id: 'recover', area: 'recovery', title: '48 hours between hits', rule: 'A muscle is not scheduled again within 48 hours; the app skips days whose muscles are still recovering.', why: 'Muscle protein building stays raised for about two days after a session.', source: 'Phillips 1997; Damas 2016, J Physiol', doi: '10.1113/JP272472', strength: 'strong' },
  { id: 'timebox', area: 'plan', title: 'Sessions fit your time', rule: 'Each day is filled in priority order until your session length is used up, warm-up included. Cardio takes what is left.', why: 'When time is short, one leg push, one hinge, one upper push and one upper pull is the minimum that still works.', source: 'Iversen et al. 2021, Sports Med', doi: '10.1007/s40279-021-01490-1', strength: 'strong' },
  { id: 'lowattendance', area: 'health', title: 'When you have been away', rule: 'Two or fewer visits in the last 14 days switches you to a full-body session plus cardio.', why: 'With rare visits, every visit has to touch every muscle, and lifting plus aerobic work is the best health return per visit.', source: 'Schoenfeld 2016; Momma 2022; Gorzelitz 2022', strength: 'moderate' },
  { id: 'warmup', area: 'safety', title: 'THE FORGE', rule: 'A few minutes of easy cardio, dynamic moves for the joints about to work, then 2 light ramp-up sets. No long static stretches before lifting.', why: 'Warm-ups improved performance in four out of five studies; static stretches held over 60 seconds measurably weaken the next lift.', source: 'Fradkin 2010; Simic 2013; Behm 2016; Abad 2011', doi: '10.1111/j.1600-0838.2012.01444.x', strength: 'strong' },
  { id: 'hiit', area: 'cardio', title: 'Intervals or steady', rule: 'Both raise fitness; intervals gain a little more per minute. Total weekly minutes matter more than how they are spread.', why: 'Twenty-eight trials: intervals raised VO2max slightly more than steady work. "Weekend warriors" who fit the minutes into 1 to 2 days did about as well as people spreading them out.', source: 'Milanović 2015; Wen 2019; dos Santos 2022, JAMA Intern Med', doi: '10.1001/jamainternmed.2022.2488', strength: 'strong' },
  { id: 'age', area: 'safety', title: 'Younger and older', rule: 'Under 18: 8 or more reps, 3 reps in reserve, no advanced lifts. 65+: 1 to 3 sets, stop 2 reps short, low impact, a balance exercise every lifting day.', why: 'Lifting is safe for teenagers with good technique; older lifters train the same way with more care.', source: 'Faigenbaum 2009 (NSCA); Fragala 2019 (NSCA); WHO 2020', doi: '10.1519/JSC.0000000000003230', strength: 'strong' },
  { id: 'sex', area: 'plan', title: 'Sex changes nothing', rule: 'The plan is identical for men and women, and does not track menstrual phase.', why: 'Meta-analysis found the same relative gains in both sexes, and phase-based programming has no solid support yet.', source: 'Roberts, Nuckols & Krieger 2020; Colenso-Semple 2023', doi: '10.1519/JSC.0000000000003521', strength: 'strong' },
  { id: 'weight', area: 'health', title: 'Weight and protein', rule: 'BMI only changes cardio choices (low impact first at 30+). Protein target about 1.6 g per kg of body weight a day. Fat-loss goal: 250+ cardio minutes a week.', why: 'Muscle gain plateaus near 1.6 g/kg; heavier bodies load the knees more; weight loss needs more weekly minutes.', source: 'Morton 2018, Br J Sports Med; Donnelly 2009 (ACSM); Messier 2005', doi: '10.1136/bjsports-2017-097608', strength: 'strong' },
  { id: 'core', area: 'physique', title: 'Abs and belly fat', rule: 'Core work is programmed for strength and spine health. It does not burn belly fat.', why: 'Six weeks of daily ab exercises changed abdominal fat by nothing. Fat loss is whole-body.', source: 'Vispute 2011, J Strength Cond Res; McGill 2010', doi: '10.1519/JSC.0b013e3181fb4a46', strength: 'strong' },
  { id: 'deload', area: 'recovery', title: 'Easy weeks', rule: 'Not scheduled. Vary the load over time; an easy week every month or so is common practice.', why: 'Periodised training beats none for strength, but the one trial on deload timing found no benefit, so the app does not force one.', source: 'Williams 2017; Coleman 2024, PeerJ', doi: '10.7717/peerj.16777', strength: 'weak' },
]
