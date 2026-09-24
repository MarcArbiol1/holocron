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

---

# Part 3: balance review (24 Sep 2026)

**Complaint:** after two weeks on the app Marc reported that almost every workout was leg-heavy, with very little chest, biceps or triceps.

**Finding: correct.** Simulating the plans showed why the first audit missed it:

- The three full-body templates (which every 1 to 4-day plan and the health day use) had **no biceps or triceps slot at all**. Arms only appeared on upper, push and pull days, i.e. plans of 4+ days for intermediates.
- Both full-body days used the **same chest exercise** (the variant logic only applied to keys ending in `-2`), so chest was one movement repeated: 6 weekly sets against 11 for the glutes.
- **Every full-body day opened with a leg lift** (squat on A, Romanian deadlift on B, squat on C, squat on the health day), and THE FORGE's ramp-up sets followed it. With the cardio day (a bike) and the leg-led warm-up, the felt experience was "legs every visit".
- Bodyweight users had **no side-delt and no vertical-press exercise**; the upper template wasted its second chest slot on a duplicate flat press and, at 60 minutes, cut the triceps work.
- The audit only checked six big muscles (chest, lats, upper back, quads, hamstrings, glutes), so a plan with zero direct arm work passed.

**Exercise library review (82 entries).** Legs were well covered (4 squats, 3 lunges, 5 hinges, 2 glute, 2 calf, leg extension, leg curl). Chest had 7 presses and **no isolation move**; biceps had 3 curls, none for the stretched position and none for band-only users; triceps had 4; side delts had a single exercise; there was no machine shoulder press for novices, no incline barbell press, no second bodyweight push angle. Fourteen exercises were added, each with its own coded animation checked on a contact sheet: incline barbell bench press, dumbbell chest fly, machine chest fly (pec deck), machine shoulder press, pike push-up, decline push-up, close-grip lat pulldown, incline dumbbell curl, band curl, close-grip bench press, diamond push-up, triceps kickback, band pushdown, band lateral raise. Library: 96 exercises.

**Builder changes (`PROGRAM_VERSION` 5 -> 6):**

1. Full-body templates rebuilt: A = squat, press, row, hinge, overhead press, curl, extension, core, calves. B = press (second angle), hinge, row, lunge, vertical pull, extension, lateral raise, curl, core, rear delts. C = row, press (third angle), lunge, hip thrust, fly, curl, rear delts, lateral raise, leg curl, side plank.
2. Variants are now per pattern and per rotation: the n-th day that carries a pattern gets the n-th option, so day B presses incline or machine while A presses flat, and the 4-day upper/lower/full plan's full day no longer repeats the upper and lower days' lifts. Second visits (`-2` keys) keep variant 2 throughout. Side delts never vary (the only alternative is the band fallback).
3. Upper day: press, row, overhead press, pulldown, second press, curl, lateral raise, extension, rear delts. Push day and pull day put the arm slot before the delt slot so a 45-minute session still has one.
4. New patterns and pools: `chestIso` (fly / pec deck), pike push-up as the bodyweight vertical press, band curl, band pushdown and band lateral raise as the no-dumbbell arm and delt work, incline curl first for intermediates and advanced.

**New audit rules** (all 81 profiles, 0 violations):

| Rule | Check | Tolerance |
|---|---|---|
| Direct arm work on every non-leg lifting day | a biceps or triceps pattern present | sessions of 45+ min; not for a strength goal (four heavy lifts with 3-min rests fill the hour) or an advanced lifter's 45-min session (2.5-min rests do the same) |
| Legs never outnumber the upper body in a full-body day | leg-only exercises <= upper-only exercises | core and balance not counted |
| The opener rotates | not every non-leg day starts with a leg exercise | plans with 2+ such days |
| Two chest angles | >= 2 distinct press exercises when 2+ days carry a press | only when the equipment offers 2+ presses |
| Small-muscle floors | weekly fractional sets >= share of the band's low end | biceps and triceps 50%; side delts 40% (25% for advanced lifters on upper/lower layouts, where the second chest press wins the last 60-minute slot and the recap shows the gap); rear delts 25% (half-credit from every row and pulldown); 60-min sessions with 3+ lifting days; not for a strength goal |
| Upper back over-target | as glutes and hamstrings: 2.2x the band's high end | it collects half-credit from every row, pulldown, hinge, overhead press and rear-delt move |

**What the plans look like now** (novice, gym, 3 days, 60 min): day A = goblet squat, dumbbell bench, cable row, Romanian deadlift, dumbbell shoulder press, curl, overhead extension, plank, calf raise. Day B = machine chest press, single-leg RDL, chest-supported row, Bulgarian split squat, lat pulldown, pushdown, lateral raise, incline curl, hanging knee raise, face pull. Weekly fractional sets: chest 6, biceps 8.5, triceps 13, quads 6, hamstrings 7.5, glutes 11 (was chest 6, biceps 4.5 from rows only, triceps 9 from presses only, with zero arm exercises).

**Still true:** a 3-day plan with a cardio day has only two lifting days, so every muscle sits near the bottom of its band; the plan notes say so, and switching the cardio day off in the profile gives a third lifting day (full body C).

## Second round, same day: "make a good workout plan"

Marc, on the 4-day plan (The Citadel / Mordor / The Fellowship / Mount Doom): the Citadel and Mordor are good, Mordor lacks the seated leg extension, the Fellowship repeats the other two days, and there is no biceps/triceps day with some forearm work.

**Changes (`PROGRAM_VERSION` 7):**

1. **The Arnold split** for intermediate and advanced lifters with weights and 60-minute sessions: chest and back (The Citadel), legs (Mordor), shoulders and arms (The Armoury), plus the cardio day. Five days adds an upper day (The Watchtower). Three days without the cardio day is the same three lifting days. Evidence: Schoenfeld 2019, volume-matched frequency makes no difference (part 3 of `EVIDENCE.md`).
2. **Chest and back day:** bench, barbell row, incline press, pulldown, cable row, fly, face pull.
3. **Leg day** gains the leg extension (intermediate and advanced only: novices' quads are already at the top of the band from squat plus lunge) ahead of the calf raise.
4. **Shoulders and arms day:** overhead press, overhead extension, incline curl, pushdown, wrist curl, barbell curl, lateral raise, face pull (reverse curl or farmer's carry when time allows).
5. **Forearm work added** (new `forearm` pattern): dumbbell wrist curl, reverse curl, farmer's carry (timed), hammer curl. Library: 99 exercises.
6. **Fallbacks:** under an hour, or with bodyweight only, the higher-frequency upper/lower/full layout stays (a 45-minute day cannot hold a muscle's weekly volume; an arms day has nothing to do without weights). The plan notes say so and how to change it.
7. **Equipment bug fixed:** a bench or a pull-up bar no longer unlocks an exercise on its own (dumbbell-only users were being given the barbell bench press).

**Audit rules added:** the twice-a-week frequency check is waived on the Arnold split when the muscle's own day reaches 75% of the band's low end; a shoulders-and-arms day must carry 2 biceps, 2 triceps and 1 forearm exercise at 60 minutes; a 60-minute leg day must carry the leg extension; the chest-and-back day is exempt from the arm-work rule when the week has an arms day. 81 profiles, 0 violations; 33 tests.
