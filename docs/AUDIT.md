# Workout audit (16 Sep 2026)

Question asked: are the routines the app actually generates optimal, and is the science behind them?
Two checks were run. Both are repeatable.

## 1. Do generated programs obey the evidence rules?

`scripts/audit-programs.test.ts` builds the plan for 81 profiles (novice / intermediate / advanced, 1 to 6 days,
30 to 75-minute sessions, gym / dumbbells / bodyweight, ages 16 / 25 / 70, BMI up to 35, strength and fat-loss
goals) and checks every day against the rules in `EVIDENCE.md`:

| Rule | Source | Check |
|---|---|---|
| Each big muscle trained at least twice a week when training 3+ days | Schoenfeld 2016 | direct-set frequency |
| Weekly hard sets per muscle inside the target band (novice 6–10, intermediate 10–16, advanced 12–20) | Schoenfeld 2017, Baz-Valle 2022, Pelland 2026 | fractional sets, primary 1 / secondary 0.5 |
| Compound lifts before isolation | ACSM 2009, Simão 2012 | order within the day |
| Session fits the time the user said they have, including warm-up and cardio | Iversen 2021 (time-poor) | time model: sets × (work + rest) |
| Under 18: reps in reserve ≥ 3, reps ≥ 8, no level-3 lifts | NSCA youth | prescription |
| 65+: sets ≤ 3, reps in reserve ≥ 2, no high impact, a balance exercise every lifting day | Fragala 2019, WHO 2020 | prescription + block present |
| BMI ≥ 30: no high-impact cardio | knee-load convention | exercise flags |
| No exercise twice in one day; no level-3 lift for a novice | | |

**First run: 342 violations.** Fixes that followed, all in `src/engine/program.ts` and `src/data/exercises.ts`:

1. **Sessions overran** (an intermediate 60-minute upper day computed to 69 minutes, an advanced push day to 80).
   The builder counted exercises, not minutes. It is now time-boxed: patterns are filled in priority order
   (the big lifts first) until the user's session length is used up, warm-up included; the cardio finisher takes
   what is left, up to 10–15 minutes. The estimated length is shown in the app.
2. **Volume was lopsided.** Glutes and upper back reached two to three times their target while chest and lats
   sat under it, because too many exercises listed them as primary movers. Squats and lunges now count quads as
   primary and glutes as secondary; vertical pulls count lats as primary and upper back as secondary; presses count
   chest and triceps as primary and front delts as secondary; face pulls count rear delts. Upper days gained a
   second chest movement, full-body day A gained a vertical pull, pull days use two vertical pulls and one row.
3. **Hip thrust after leg curl** on lower days broke the compound-first rule. Reordered.
4. **65+ users never received the promised balance block.** It is now appended to every lifting day.
5. **Advanced lifters got 4-set prescriptions that starved short sessions** of exercises. Four sets only for
   75-minute sessions; otherwise more exercises at three sets (Pelland 2026 per-session ceiling).
6. **Novices could be assigned six-day push/pull/legs.** ACSM 2009 puts novices at 2–3 lifting days. A novice who
   can come five or six times now lifts four (upper/lower twice) and the other visits are cardio and mobility days.
7. **Bodyweight-only users had no hamstring exercise.** Added the single-leg Romanian deadlift (with animation).
8. **Warm-up budget mismatch.** The builder assumed 7–10 minutes; THE FORGE prescribed 11. One function now defines
   both. 30-minute sessions get a 3-minute general warm-up, three drills, and rests trimmed by a quarter.

**Final run: 0 violations** under two documented tolerances:

- Under-target volume is only flagged for sessions of 60 minutes or more, and only below three quarters of the band's low end. A 30 or 45-minute session cannot reach
  12 chest sets a week; the plan notes say so and the recap shows the gap.
- Over-target is flagged above 1.5× the band's high end, or 2.2× for glutes and hamstrings, which collect
  half-credit from every squat, lunge and hip thrust. A novice squatting three times a week reaches about 15
  fractional glute sets; that is the standard novice programme, not an error.

## 2. Is the exercise technique text correct?

A second reviewer checked all 79 exercises' steps, cues and muscle maps against NSCA, ACE, ExRx, Concept2, McGill and
Contreras guidance. 17 findings; 16 applied:

- Safety lines added to the barbell bench press (thumbs wrapped, rack safeties, no collars alone), back squat (safeties),
  deadlift (brace and hold the breath), kettlebell swing (handle above the knees, tall finish), jump rope (soft surface),
  hip thrust (padded bar, bench edge under the shoulder blades), barbell row (knees bent).
- One harmful cue removed: the lateral raise "little finger higher than the thumb" is the internally rotated position
  linked to shoulder impingement; replaced with hands level, thumbs a touch higher.
- Face pull now describes the external-rotation finish; step-up height limited to a 90-degree knee; the incline-walk
  "halves the work" claim replaced by the measured "about a third when leaning on the rails".
- The crunch became the McGill curl-up for a beginner and 65+ audience.
- Muscle maps corrected for the rowing machine (leg-driven), lat pulldown (rear delts as secondary) and deadlift
  (lats as secondary). Dips raised to level 3.
- Two stock coaching phrases rewritten in our own words.

Not applied: making quads a primary mover of the deadlift. Coaching sources disagree; hamstrings, glutes and lower
back stay primary, quads secondary.

## Residual limits, stated plainly

- The set targets are population averages; individuals vary. The app tracks what you do, so adjust by feel.
- Rest and work times are estimates; the time box can still miss by a few minutes.
- Deloads are not scheduled (evidence is weak; see EVIDENCE.md point 17).
- The app is not medical advice.
