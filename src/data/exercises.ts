/**
 * The exercise library. Every step, cue and mistake here was written for this
 * project in plain words (no text copied from other sites; a couple of standard
 * coaching sayings are paraphrased). Form was checked against NSCA, ACE, ExRx and
 * McGill guidance in Sep 2026; see docs/AUDIT.md. `anim` points at an
 * animation in src/anim/anims.ts; muscles feed the set counter and the heat-map.
 */
import type { Exercise } from './types'

type Short = Omit<Exercise, 'secondary' | 'cues' | 'mistakes'> & Partial<Pick<Exercise, 'secondary' | 'cues' | 'mistakes'>>
const ex = (e: Short): Exercise => ({ secondary: [], cues: [], mistakes: [], ...e })

export const EXERCISES: Exercise[] = [
  /* ================= SQUAT ================= */
  ex({
    id: 'backSquat', name: 'Barbell back squat', pattern: 'squat', category: 'compound',
    primary: ['quads'], secondary: ['glutes', 'hamstrings', 'lowerBack', 'abs'], equipment: ['barbell'], level: 2, anim: 'backSquat',
    steps: ['Set the rack safeties a little below your bottom position so you can bail on a missed rep, then set the bar on your upper back, hands just wider than your shoulders.', 'Stand with feet shoulder-width apart, toes turned slightly out.', 'Take a breath, brace your stomach, and sit down between your hips as if onto a low chair.', 'Go until your thighs are at least level with the floor, then drive the floor away and stand up.'],
    cues: ['Knees track over the toes', 'Chest up, eyes forward', 'Whole foot stays flat'],
    mistakes: ['Heels lifting off the floor', 'Knees collapsing inward', 'Rounding the lower back at the bottom'],
  }),
  ex({
    id: 'gobletSquat', name: 'Goblet squat', pattern: 'squat', category: 'compound',
    primary: ['quads'], secondary: ['glutes', 'abs'], equipment: ['dumbbell', 'kettlebell'], level: 1, anim: 'gobletSquat',
    steps: ['Hold one dumbbell or kettlebell against your chest with both hands.', 'Feet shoulder-width, toes slightly out.', 'Sit straight down, elbows going between your knees.', 'Stand back up by pushing the floor away.'],
    cues: ['Weight stays glued to the chest', 'Elbows inside the knees at the bottom'],
    mistakes: ['Leaning far forward', 'Half reps'],
  }),
  ex({
    id: 'legPress', name: 'Leg press', pattern: 'squat', category: 'compound',
    primary: ['quads'], secondary: ['glutes', 'hamstrings'], equipment: ['machine'], level: 1, anim: 'legPress',
    steps: ['Sit with your back flat against the pad, feet shoulder-width on the platform.', 'Release the safety and lower the platform until your knees are near 90 degrees.', 'Press back up without locking your knees hard.'],
    cues: ['Lower back stays on the pad', 'Push through the whole foot'],
    mistakes: ['Hips lifting off the seat at the bottom', 'Locking knees at the top'],
  }),
  ex({
    id: 'bodyweightSquat', name: 'Bodyweight squat', pattern: 'squat', category: 'compound',
    primary: ['quads'], secondary: ['glutes', 'abs'], equipment: ['bodyweight'], level: 1, anim: 'bodyweightSquat',
    steps: ['Feet shoulder-width, arms out in front for balance.', 'Sit down as low as you comfortably can with a flat back.', 'Stand up and squeeze your glutes at the top.'],
    cues: ['Knees over toes', 'Heels down'],
    mistakes: ['Rushing the reps', 'Rounding the back'],
  }),
  ex({
    id: 'splitSquat', name: 'Bulgarian split squat', pattern: 'lunge', category: 'compound',
    primary: ['quads'], secondary: ['glutes', 'hamstrings', 'abs'], equipment: ['bench', 'dumbbell', 'bodyweight'], level: 2, unilateral: true, anim: 'splitSquat',
    steps: ['Stand a big step in front of a bench and rest the top of one foot on it.', 'Lower straight down until the back knee is near the floor.', 'Drive through the front foot to stand up. Do all reps, then switch legs.'],
    cues: ['Front shin roughly vertical', 'Torso tall, slight forward lean is fine'],
    mistakes: ['Front foot too close to the bench', 'Bouncing the back knee off the floor'],
  }),
  ex({
    id: 'reverseLunge', name: 'Reverse lunge', pattern: 'lunge', category: 'compound',
    primary: ['quads'], secondary: ['glutes', 'hamstrings', 'abs'], equipment: ['bodyweight', 'dumbbell'], level: 1, unilateral: true, anim: 'reverseLunge',
    steps: ['Stand tall. Step one foot back and lower until both knees are at about 90 degrees.', 'Push through the front heel to return to standing.', 'Alternate legs.'],
    cues: ['Front knee over the ankle', 'Hips square to the front'],
    mistakes: ['Short steps that push the front knee far past the toes', 'Leaning sideways'],
  }),
  ex({
    id: 'stepUp', name: 'Step-up', pattern: 'lunge', category: 'compound',
    primary: ['quads'], secondary: ['glutes', 'hamstrings', 'calves'], equipment: ['bench', 'bodyweight', 'dumbbell'], level: 1, unilateral: true, anim: 'stepUp',
    steps: ['Place one whole foot on a step low enough that the knee bends to about 90 degrees; knee height is the upper limit, and a low step is right when starting out.', 'Push through that foot to stand on the box; bring the other foot up.', 'Step down with control and repeat, then switch legs.'],
    cues: ['Push with the top leg, not the bottom leg'],
    mistakes: ['Jumping off the back foot', 'Letting the knee cave inward'],
  }),

  /* ================= HINGE ================= */
  ex({
    id: 'deadlift', name: 'Conventional deadlift', pattern: 'hinge', category: 'compound',
    primary: ['hamstrings', 'glutes', 'lowerBack'], secondary: ['quads', 'upperBack', 'lats', 'forearms', 'abs'], equipment: ['barbell'], level: 2, anim: 'deadlift',
    steps: ['Stand with the bar over the middle of your feet, feet hip-width apart.', 'Hinge at the hips and bend the knees to grip the bar just outside your legs.', 'Flatten your back, pull the slack out of the bar, take a big breath into your belly and brace as if about to be punched.', 'Push the floor away and stand up, holding the breath until you lock out.', 'Lower by pushing the hips back first, then bending the knees once the bar passes them.'],
    cues: ['Bar stays close to the shins and thighs', 'Chest up, back flat', 'Squeeze glutes at the top'],
    mistakes: ['Rounding the lower back', 'Bar drifting forward', 'Leaning back at the top'],
  }),
  ex({
    id: 'romanianDeadlift', name: 'Romanian deadlift', pattern: 'hinge', category: 'compound',
    primary: ['hamstrings', 'glutes'], secondary: ['lowerBack', 'upperBack', 'forearms'], equipment: ['barbell', 'dumbbell'], level: 2, anim: 'romanianDeadlift',
    steps: ['Stand holding the bar at your hips, knees slightly bent.', 'Push your hips back and let the bar slide down your thighs, keeping your back flat.', 'Stop when you feel a strong stretch in the hamstrings (usually just below the knee).', 'Drive the hips forward to stand tall.'],
    cues: ['Hips go back, not down', 'Bar touches the legs the whole way', 'The stretch at the bottom is the point: control it, do not rush through it'],
    mistakes: ['Bending the knees into a squat', 'Rounding the back to go lower'],
  }),
  ex({
    id: 'singleLegRdl', name: 'Single-leg Romanian deadlift', pattern: 'hinge', category: 'compound', unilateral: true,
    primary: ['hamstrings', 'glutes'], secondary: ['lowerBack', 'abs', 'calves'], equipment: ['bodyweight', 'dumbbell', 'kettlebell'], level: 2, anim: 'singleLegRdl',
    steps: ['Stand on one leg with a soft knee, the other foot just off the floor. Hold a light weight in the opposite hand, or nothing.', 'Hinge at the hip: the chest goes forward as the free leg reaches straight back, until your torso and back leg are close to one line.', 'Stop when you feel the stretch in the standing hamstring, then squeeze the glute to stand tall. Do all reps, then switch legs.'],
    cues: ['Hips stay square to the floor, do not open them', 'Back flat, back leg and torso move together like a seesaw'],
    mistakes: ['Rounding the back to reach lower', 'Twisting the hips open', 'Bending the standing knee into a squat'],
  }),
  ex({
    id: 'hipThrust', name: 'Hip thrust', pattern: 'glute', category: 'compound',
    primary: ['glutes'], secondary: ['hamstrings', 'quads'], equipment: ['bench', 'barbell', 'bodyweight'], level: 1, anim: 'hipThrust',
    steps: ['Sit on the floor with the bench edge just under your shoulder blades and a padded bar or weight across your hips.', 'Feet flat, knees bent. Drive your hips up until your body is a straight line from shoulders to knees.', 'Pause and squeeze, then lower with control.'],
    cues: ['Chin tucked, eyes forward', 'Shins vertical at the top'],
    mistakes: ['Arching the lower back at the top', 'Pushing through the toes'],
  }),
  ex({
    id: 'gluteBridge', name: 'Glute bridge', pattern: 'glute', category: 'isolation',
    primary: ['glutes'], secondary: ['hamstrings', 'abs'], equipment: ['bodyweight'], level: 1, anim: 'gluteBridge',
    steps: ['Lie on your back, knees bent, feet flat near your hips.', 'Squeeze your glutes to lift your hips until your body is straight from shoulders to knees.', 'Hold a second and lower slowly.'],
    cues: ['Ribs down, no back arch'],
    mistakes: ['Pushing with the lower back instead of the glutes'],
  }),
  ex({
    id: 'kettlebellSwing', name: 'Kettlebell swing', pattern: 'hinge', category: 'compound',
    primary: ['glutes', 'hamstrings'], secondary: ['lowerBack', 'abs', 'forearms'], equipment: ['kettlebell'], level: 2, intensity: 'vigorous', anim: 'kettlebellSwing',
    steps: ['Stand feet shoulder-width, kettlebell a step in front of you.', 'Hinge, grab it, and hike it back between your legs, keeping the handle above knee height.', 'Snap the hips forward so the bell floats to chest height; finish standing tall like a plank, not leaning back. Let it fall and hinge again.'],
    cues: ['Arms stay straight and relaxed; the hips throw the bell', 'Flat back at the bottom', 'Handle never drops below the knees'],
    mistakes: ['Squatting instead of hinging', 'Lifting with the shoulders'],
  }),
  ex({
    id: 'backExtension', name: 'Back extension', pattern: 'hinge', category: 'isolation',
    primary: ['lowerBack', 'glutes'], secondary: ['hamstrings'], equipment: ['machine', 'bodyweight'], level: 1, anim: 'backExtension',
    steps: ['Set the pad just below your hip bones, ankles locked in.', 'Fold at the hips with a flat back, then rise until your body is a straight line.', 'Do not go past straight.'],
    cues: ['Squeeze glutes at the top'],
    mistakes: ['Hyper-extending the spine at the top', 'Swinging'],
  }),

  /* ================= HORIZONTAL PUSH ================= */
  ex({
    id: 'benchPress', name: 'Barbell bench press', pattern: 'pushH', category: 'compound',
    primary: ['chest', 'triceps'], secondary: ['frontDelts'], equipment: ['barbell', 'bench'], level: 2, anim: 'benchPress',
    steps: ['Lie on the bench with eyes under the bar, feet flat on the floor.', 'Grip a bit wider than your shoulders with thumbs wrapped around the bar, and pull your shoulder blades together and down.', 'Unrack, lower the bar to the lower chest with elbows at about 45 degrees from your sides.', 'Press back up to above the shoulders.', 'No spotter? Bench inside a rack with the safety arms set just below chest height, and leave the collars off so you can tip the plates off if a rep fails.'],
    cues: ['Shoulder blades pinched, chest up', 'Wrists straight over the elbows', 'Feet drive into the floor', 'Thumbs around the bar, always'],
    mistakes: ['Elbows flared straight out to the sides', 'Bouncing the bar off the chest', 'Lifting the hips off the bench'],
  }),
  ex({
    id: 'dbBenchPress', name: 'Dumbbell bench press', pattern: 'pushH', category: 'compound',
    primary: ['chest', 'triceps'], secondary: ['frontDelts'], equipment: ['dumbbell', 'bench'], level: 1, anim: 'dbBenchPress',
    steps: ['Lie back with a dumbbell in each hand at chest level, palms forward.', 'Press both up until your arms are straight above your shoulders.', 'Lower with control until you feel a stretch across the chest.'],
    cues: ['Slight arc: dumbbells come together at the top', 'Shoulder blades pinned', 'Go for a full stretch at the bottom; that half of the rep does the most'],
    mistakes: ['Dropping the elbows too low and straining the shoulders', 'Clanking the dumbbells together'],
  }),
  ex({
    id: 'inclineDbPress', name: 'Incline dumbbell press', pattern: 'pushH', category: 'compound',
    primary: ['chest'], secondary: ['frontDelts', 'triceps'], equipment: ['dumbbell', 'bench'], level: 1, anim: 'inclineDbPress',
    steps: ['Set the bench to about 30 degrees.', 'Press the dumbbells from shoulder level to straight arms above the upper chest.', 'Lower slowly.'],
    cues: ['Elbows a little below shoulder height at the bottom'],
    mistakes: ['Bench set too steep (turns it into a shoulder press)'],
  }),
  ex({
    id: 'pushUp', name: 'Push-up', pattern: 'pushH', category: 'compound',
    primary: ['chest', 'triceps'], secondary: ['frontDelts', 'abs'], equipment: ['bodyweight'], level: 1, anim: 'pushUp',
    steps: ['Hands slightly wider than shoulders, body in a straight line from head to heels.', 'Lower your chest to just above the floor, elbows at about 45 degrees.', 'Press back up to straight arms.'],
    cues: ['Squeeze glutes and stomach so the hips do not sag', 'Head in line with the spine'],
    mistakes: ['Hips sagging or piking up', 'Half reps'],
  }),
  ex({
    id: 'declinePushUp', name: 'Decline push-up (feet raised)', pattern: 'pushH', category: 'compound',
    primary: ['chest'], secondary: ['frontDelts', 'triceps', 'abs'], equipment: ['bodyweight', 'bench'], level: 2, anim: 'declinePushUp',
    steps: ['Put your feet on a bench or step and your hands on the floor a little wider than your shoulders.', 'Lower your chest toward the floor with the elbows about 45 degrees from the body.', 'Press back up to straight arms. The higher the feet, the more it works the upper chest and shoulders.'],
    cues: ['One straight line from head to heels', 'Brace the stomach so the hips do not sag'],
    mistakes: ['Hips sagging', 'Head craning forward to reach the floor'],
  }),
  ex({
    id: 'kneePushUp', name: 'Knee push-up', pattern: 'pushH', category: 'compound',
    primary: ['chest', 'triceps'], secondary: ['frontDelts', 'abs'], equipment: ['bodyweight'], level: 1, anim: 'kneePushUp',
    steps: ['Same as a push-up but with your knees on the floor and body straight from head to knees.', 'Lower the chest to the floor and press up.'],
    cues: ['Straight line from head to knees'],
    mistakes: ['Bending at the hips'],
  }),
  ex({
    id: 'machineChestPress', name: 'Machine chest press', pattern: 'pushH', category: 'compound',
    primary: ['chest', 'triceps'], secondary: ['frontDelts'], equipment: ['machine'], level: 1, anim: 'machineChestPress',
    steps: ['Set the seat so the handles are at mid-chest height.', 'Press the handles forward until your arms are almost straight.', 'Return slowly until your hands are level with your chest.'],
    cues: ['Shoulders back against the pad'],
    mistakes: ['Shrugging the shoulders forward'],
  }),
  ex({
    id: 'dips', name: 'Dips', pattern: 'pushH', category: 'compound',
    primary: ['chest', 'triceps'], secondary: ['frontDelts'], equipment: ['bodyweight'], level: 3, anim: 'dips',
    steps: ['Support yourself on parallel bars with straight arms.', 'Lean slightly forward and lower until your upper arms are about parallel to the floor.', 'Press back to the top.'],
    cues: ['Shoulders down, away from the ears'],
    mistakes: ['Going so deep the shoulders hurt', 'Swinging the legs'],
  }),

  ex({
    id: 'inclineBenchPress', name: 'Incline barbell bench press', pattern: 'pushH', category: 'compound',
    primary: ['chest'], secondary: ['frontDelts', 'triceps'], equipment: ['barbell', 'bench'], level: 2, anim: 'inclineBenchPress',
    steps: ['Set the bench to about 30 degrees and the safeties just below chest height, then lie back with your eyes under the bar.', 'Grip a little wider than your shoulders with the thumbs wrapped, and unrack the bar over your upper chest.', 'Lower the bar to the top of the chest, just below the collarbones, elbows about 45 degrees from your sides.', 'Press up and slightly back so the bar finishes over your shoulders.'],
    cues: ['Feet flat, shoulder blades pulled back and down', 'Bar touches the upper chest, never the neck'],
    mistakes: ['Bench set too steep, which turns it into a shoulder press', 'Bouncing the bar off the chest', 'Elbows flared straight out to the sides'],
  }),
  ex({
    id: 'dumbbellFly', name: 'Dumbbell chest fly', pattern: 'chestIso', category: 'isolation',
    primary: ['chest'], secondary: ['frontDelts'], equipment: ['dumbbell', 'bench'], level: 1, anim: 'dumbbellFly',
    steps: ['Lie on a flat bench with a light dumbbell in each hand pressed above your chest, palms facing each other.', 'With a slight bend in the elbows, open your arms in a wide arc until you feel a stretch across the chest and the hands are about level with the shoulders.', 'Bring the dumbbells back together above the chest along the same arc, as if hugging a tree.'],
    cues: ['Elbows stay slightly bent the whole way', 'Go light: the stretch at the bottom is the part that grows', 'Squeeze the chest at the top instead of clanging the weights'],
    mistakes: ['Bending the elbows more on the way up, which turns it into a press', 'Dropping heavy weights far below the bench, which strains the shoulders'],
  }),
  ex({
    id: 'pecDeck', name: 'Machine chest fly (pec deck)', pattern: 'chestIso', category: 'isolation',
    primary: ['chest'], secondary: ['frontDelts'], equipment: ['machine'], level: 1, anim: 'pecDeck',
    steps: ['Set the seat so the handles sit at chest height and your upper arms are level with the floor.', 'Sit tall with your back on the pad and hold the handles with a slight bend in the elbows.', 'Bring the handles together in front of your chest in a wide arc and squeeze for a second.', 'Open back out slowly until you feel a stretch across the chest.'],
    cues: ['Shoulders down, chest up', 'A slow arc, not a push'],
    mistakes: ['Rounding forward to bring the handles together', 'Letting the weight stack bang at the bottom'],
  }),
  /* ================= VERTICAL PUSH ================= */
  ex({
    id: 'overheadPress', name: 'Barbell overhead press', pattern: 'pushV', category: 'compound',
    primary: ['frontDelts', 'triceps'], secondary: ['sideDelts', 'upperBack', 'abs'], equipment: ['barbell'], level: 2, anim: 'overheadPress',
    steps: ['Hold the bar at the front of your shoulders, hands just wider than the shoulders.', 'Brace, and press the bar straight up, moving your head back slightly to let it pass.', 'Finish with the bar over the middle of your head, then lower to the shoulders.'],
    cues: ['Glutes and stomach tight so the back does not arch', 'Push your head "through" at the top'],
    mistakes: ['Leaning back to turn it into an incline press', 'Bar travelling forward in an arc'],
  }),
  ex({
    id: 'dbShoulderPress', name: 'Dumbbell shoulder press', pattern: 'pushV', category: 'compound',
    primary: ['frontDelts', 'triceps'], secondary: ['sideDelts', 'upperBack'], equipment: ['dumbbell'], level: 1, anim: 'dbShoulderPress',
    steps: ['Sit or stand with a dumbbell at each shoulder, palms forward.', 'Press both up until your arms are straight overhead.', 'Lower to ear level.'],
    cues: ['Do not lock the elbows hard at the top'],
    mistakes: ['Arching the lower back', 'Dumbbells drifting forward'],
  }),
  ex({
    id: 'lateralRaise', name: 'Dumbbell lateral raise', pattern: 'sideDelt', category: 'isolation',
    primary: ['sideDelts'], secondary: [], equipment: ['dumbbell', 'cable'], level: 1, anim: 'lateralRaise',
    steps: ['Stand with a light dumbbell in each hand at your sides.', 'Raise both arms out to the sides until they are level with your shoulders, elbows slightly bent.', 'Lower slowly.'],
    cues: ['Lead with the elbows', 'Hands level with the floor or thumbs a touch higher, never tipped down'],
    mistakes: ['Swinging the weights up with the body', 'Going far above shoulder height'],
  }),
  ex({
    id: 'facePull', name: 'Cable face pull', pattern: 'rearDelt', category: 'isolation',
    primary: ['rearDelts'], secondary: ['upperBack'], equipment: ['cable', 'band'], level: 1, anim: 'facePull',
    steps: ['Set a rope at face height. Hold the ends with thumbs pointing back.', 'Pull the rope toward your face, spreading the ends apart, elbows high.', 'Finish with the hands beside your ears and knuckles pointing at the ceiling, squeeze the shoulder blades, then return slowly.'],
    cues: ['Elbows finish level with the shoulders', 'Rotate the hands up at the end'],
    mistakes: ['Using too much weight and leaning back'],
  }),
  ex({
    id: 'reverseFly', name: 'Dumbbell reverse fly', pattern: 'rearDelt', category: 'isolation',
    primary: ['rearDelts'], secondary: ['upperBack'], equipment: ['dumbbell'], level: 1, anim: 'reverseFly',
    steps: ['Hinge forward until your chest is nearly parallel to the floor, light dumbbells hanging down.', 'Raise both arms out to the sides, squeezing the shoulder blades.', 'Lower slowly.'],
    cues: ['Elbows slightly bent and fixed'],
    mistakes: ['Standing up during the rep'],
  }),

  ex({
    id: 'machineShoulderPress', name: 'Machine shoulder press', pattern: 'pushV', category: 'compound',
    primary: ['frontDelts', 'triceps'], secondary: ['sideDelts', 'upperBack'], equipment: ['machine'], level: 1, anim: 'machineShoulderPress',
    steps: ['Set the seat so the handles start about level with your ears and your back is flat on the pad.', 'Press the handles up until the arms are straight, without slamming the elbows locked.', 'Lower slowly back to ear level.'],
    cues: ['Ribs down, no arching off the pad', 'Head stays still'],
    mistakes: ['Handles set too low, which strains the shoulders at the bottom', 'Bouncing the stack'],
  }),
  ex({
    id: 'pikePushUp', name: 'Pike push-up', pattern: 'pushV', category: 'compound',
    primary: ['frontDelts', 'triceps'], secondary: ['sideDelts', 'upperBack', 'abs'], equipment: ['bodyweight'], level: 2, anim: 'pikePushUp',
    steps: ['Start in a push-up position, then walk your feet in and push your hips high so your body makes an upside-down V.', 'Bend the elbows and lower the top of your head toward the floor between your hands.', 'Press back up until the arms are straight. Put your feet on a step to make it harder.'],
    cues: ['Hips stay high the whole time', 'Elbows point back at about 45 degrees, not straight out'],
    mistakes: ['Letting the hips drop, which turns it into a push-up', 'Looking forward instead of at the floor'],
  }),
  ex({
    id: 'bandLateralRaise', name: 'Band lateral raise', pattern: 'sideDelt', category: 'isolation',
    primary: ['sideDelts'], secondary: [], equipment: ['band'], level: 1, anim: 'bandLateralRaise',
    steps: ['Stand on the middle of a band and hold an end in each hand at your sides.', 'Raise both arms out to the sides until they are level with your shoulders, elbows slightly bent.', 'Lower slowly. Hold the band lower down, or widen your stance, to make it harder.'],
    cues: ['Lead with the elbows', 'Hands level with the floor, never tipped down'],
    mistakes: ['Shrugging the shoulders up', 'Swinging the body'],
  }),
  /* ================= HORIZONTAL PULL ================= */
  ex({
    id: 'barbellRow', name: 'Barbell row', pattern: 'pullH', category: 'compound',
    primary: ['lats', 'upperBack'], secondary: ['biceps', 'rearDelts', 'lowerBack', 'forearms'], equipment: ['barbell'], level: 2, anim: 'barbellRow',
    steps: ['Knees slightly bent, hinge at the hips until your torso is about 45 degrees, bar hanging at straight arms. Tight hamstrings? Bend the knees a little more rather than rounding.', 'Pull the bar to your lower ribs, driving the elbows back.', 'Lower under control without rounding the back.'],
    cues: ['Back flat, hips still', 'Squeeze the shoulder blades at the top'],
    mistakes: ['Jerking the torso up to move the bar', 'Rounding the back'],
  }),
  ex({
    id: 'dbRow', name: 'One-arm dumbbell row', pattern: 'pullH', category: 'compound',
    primary: ['lats', 'upperBack'], secondary: ['biceps', 'rearDelts', 'forearms'], equipment: ['dumbbell', 'bench'], level: 1, unilateral: true, anim: 'dbRow',
    steps: ['Put one hand and knee on a bench, the other foot on the floor, back flat.', 'Pull the dumbbell to your hip, elbow going back and up.', 'Lower to a full stretch. Do all reps then switch sides.'],
    cues: ['Elbow close to the body', 'Shoulder stays down, not shrugged'],
    mistakes: ['Twisting the torso to lift', 'Pulling with the arm only'],
  }),
  ex({
    id: 'seatedCableRow', name: 'Seated cable row', pattern: 'pullH', category: 'compound',
    primary: ['lats', 'upperBack'], secondary: ['biceps', 'rearDelts', 'forearms'], equipment: ['cable'], level: 1, anim: 'seatedCableRow',
    steps: ['Sit tall with feet on the platform and a slight knee bend.', 'Pull the handle to your stomach, squeezing the shoulder blades.', 'Let the arms straighten fully with the chest still up.'],
    cues: ['Chest up throughout'],
    mistakes: ['Rocking the torso back and forth'],
  }),
  ex({
    id: 'chestSupportedRow', name: 'Chest-supported dumbbell row', pattern: 'pullH', category: 'compound',
    primary: ['lats', 'upperBack'], secondary: ['biceps', 'rearDelts'], equipment: ['dumbbell', 'bench'], level: 1, anim: 'chestSupportedRow',
    steps: ['Lie face-down on a bench set to about 30 degrees, dumbbells hanging.', 'Row both dumbbells up to your ribs.', 'Lower slowly.'],
    cues: ['Chest stays glued to the bench'],
    mistakes: ['Shrugging the shoulders'],
  }),
  ex({
    id: 'invertedRow', name: 'Inverted row', pattern: 'pullH', category: 'compound',
    primary: ['lats', 'upperBack'], secondary: ['biceps', 'rearDelts', 'abs'], equipment: ['bodyweight', 'barbell'], level: 1, anim: 'invertedRow',
    steps: ['Set a bar at hip height and hang underneath it with straight arms, heels on the floor, body straight.', 'Pull your chest to the bar.', 'Lower with control.'],
    cues: ['Body straight like a plank'],
    mistakes: ['Hips sagging'],
  }),

  /* ================= VERTICAL PULL ================= */
  ex({
    id: 'pullUp', name: 'Pull-up', pattern: 'pullV', category: 'compound',
    primary: ['lats'], secondary: ['upperBack', 'biceps', 'forearms', 'abs'], equipment: ['pullupBar', 'bodyweight'], level: 3, anim: 'pullUp',
    steps: ['Hang from the bar with hands a bit wider than shoulders, palms away.', 'Pull your chest toward the bar, driving the elbows down.', 'Lower all the way to straight arms.'],
    cues: ['Start each rep by pulling the shoulder blades down', 'Chin over the bar'],
    mistakes: ['Kipping / swinging', 'Half range at the bottom'],
  }),
  ex({
    id: 'chinUp', name: 'Chin-up', pattern: 'pullV', category: 'compound',
    primary: ['lats', 'biceps'], secondary: ['upperBack', 'forearms'], equipment: ['pullupBar', 'bodyweight'], level: 2, anim: 'chinUp',
    steps: ['Hang with palms facing you, hands shoulder-width.', 'Pull until your chin clears the bar.', 'Lower to straight arms.'],
    cues: ['Elbows drive down toward the hips'],
    mistakes: ['Swinging'],
  }),
  ex({
    id: 'latPulldown', name: 'Lat pulldown', pattern: 'pullV', category: 'compound',
    primary: ['lats'], secondary: ['upperBack', 'rearDelts', 'biceps', 'forearms'], equipment: ['cable', 'machine'], level: 1, anim: 'latPulldown',
    steps: ['Sit with thighs under the pads, grip the bar wider than shoulders.', 'Lean back slightly and pull the bar to the top of your chest.', 'Return slowly to straight arms.'],
    cues: ['Elbows down and back', 'Chest up'],
    mistakes: ['Pulling behind the neck', 'Leaning far back and using body weight'],
  }),
  ex({
    id: 'closeGripPulldown', name: 'Close-grip lat pulldown', pattern: 'pullV', category: 'compound',
    primary: ['lats'], secondary: ['upperBack', 'biceps', 'forearms'], equipment: ['cable', 'machine'], level: 1, anim: 'latPulldown',
    steps: ['Attach the V-handle (palms facing each other) and sit with your thighs under the pad.', 'Lean back a touch, chest up, and pull the handle to your upper chest with the elbows driving down and back.', 'Let the arms straighten fully at the top so the lats stretch before the next rep.'],
    cues: ['Elbows finish beside the ribs', 'Full stretch at the top'],
    mistakes: ['Leaning far back and rowing it', 'Shrugging the shoulders up at the top'],
  }),
  ex({
    id: 'bandPulldown', name: 'Band pulldown', pattern: 'pullV', category: 'compound',
    primary: ['lats'], secondary: ['upperBack', 'biceps'], equipment: ['band'], level: 1, anim: 'latPulldown',
    steps: ['Anchor a band high. Kneel or sit and grip it overhead.', 'Pull the elbows down to your sides.', 'Return slowly.'],
    cues: ['Elbows down, not back'],
    mistakes: ['Shrugging'],
  }),

  /* ================= ARMS ================= */
  ex({
    id: 'dbCurl', name: 'Dumbbell biceps curl', pattern: 'biceps', category: 'isolation',
    primary: ['biceps'], secondary: ['forearms'], equipment: ['dumbbell'], level: 1, anim: 'dbCurl',
    steps: ['Stand with a dumbbell in each hand, palms forward.', 'Curl the weights to your shoulders without moving the upper arms.', 'Lower slowly to straight arms.'],
    cues: ['Elbows pinned to your sides', 'Straighten fully at the bottom: the stretched half of the curl grows more than the top'],
    mistakes: ['Swinging the body', 'Stopping short of straight arms'],
  }),
  ex({
    id: 'hammerCurl', name: 'Hammer curl', pattern: 'biceps', category: 'isolation',
    primary: ['biceps', 'forearms'], secondary: [], equipment: ['dumbbell'], level: 1, anim: 'hammerCurl',
    steps: ['Same as a curl but with palms facing each other the whole time.', 'Curl up, lower slowly.'],
    cues: ['Thumbs up throughout'],
    mistakes: ['Swinging'],
  }),
  ex({
    id: 'barbellCurl', name: 'Barbell curl', pattern: 'biceps', category: 'isolation',
    primary: ['biceps'], secondary: ['forearms'], equipment: ['barbell'], level: 1, anim: 'barbellCurl',
    steps: ['Hold the bar with palms up, shoulder-width.', 'Curl to the shoulders with the elbows still.', 'Lower slowly.'],
    cues: ['Elbows stay by the ribs'],
    mistakes: ['Leaning back to cheat the weight up'],
  }),
  ex({
    id: 'inclineDbCurl', name: 'Incline dumbbell curl', pattern: 'biceps', category: 'isolation',
    primary: ['biceps'], secondary: ['forearms'], equipment: ['dumbbell', 'bench'], level: 1, anim: 'inclineDbCurl',
    steps: ['Set the bench to about 45 to 60 degrees and sit back with a dumbbell in each hand, arms hanging straight down behind your body, palms forward.', 'Curl both dumbbells up without moving the upper arms.', 'Lower slowly all the way to straight arms and feel the stretch in the biceps at the bottom.'],
    cues: ['Upper arms stay behind the body: that stretched position is what grows more', 'Shoulders stay back on the pad'],
    mistakes: ['Swinging the elbows forward to help', 'Cutting the bottom of the movement short'],
  }),
  ex({
    id: 'bandCurl', name: 'Band curl', pattern: 'biceps', category: 'isolation',
    primary: ['biceps'], secondary: ['forearms'], equipment: ['band'], level: 1, anim: 'bandCurl',
    steps: ['Stand on the middle of a band with both feet and hold an end in each hand, palms forward.', 'Curl your hands to your shoulders without moving the upper arms.', 'Lower slowly to straight arms. Widen your stance to make it harder.'],
    cues: ['Elbows pinned to your sides', 'Straighten fully at the bottom'],
    mistakes: ['Leaning back to finish the rep', 'Stopping short of straight arms'],
  }),
  ex({
    id: 'tricepsPushdown', name: 'Cable triceps pushdown', pattern: 'triceps', category: 'isolation',
    primary: ['triceps'], secondary: [], equipment: ['cable'], level: 1, anim: 'tricepsPushdown',
    steps: ['Hold a bar or rope at chest height with elbows tucked to your sides.', 'Push down until your arms are straight.', 'Return until the forearms are just above parallel.'],
    cues: ['Only the forearms move'],
    mistakes: ['Elbows drifting forward', 'Leaning on the cable'],
  }),
  ex({
    id: 'overheadTricepsExt', name: 'Overhead triceps extension', pattern: 'triceps', category: 'isolation',
    primary: ['triceps'], secondary: [], equipment: ['dumbbell', 'cable'], level: 1, anim: 'overheadTricepsExt',
    steps: ['Hold one dumbbell overhead with both hands.', 'Bend the elbows to lower it behind your head.', 'Extend back to straight arms.'],
    cues: ['Elbows point forward, close to the head', 'Overhead works the long head in its stretched position, which is why it beats pushdowns for size'],
    mistakes: ['Elbows flaring wide', 'Arching the lower back'],
  }),
  ex({
    id: 'skullCrusher', name: 'Lying triceps extension', pattern: 'triceps', category: 'isolation',
    primary: ['triceps'], secondary: [], equipment: ['barbell', 'dumbbell', 'bench'], level: 2, anim: 'skullCrusher',
    steps: ['Lie on a bench holding the bar above your chest.', 'Bend the elbows to lower the bar toward your forehead.', 'Extend back up.'],
    cues: ['Upper arms stay still, slightly angled back'],
    mistakes: ['Elbows flaring', 'Moving the shoulders'],
  }),
  ex({
    id: 'benchDip', name: 'Bench dip', pattern: 'triceps', category: 'compound',
    primary: ['triceps'], secondary: ['chest', 'frontDelts'], equipment: ['bench', 'bodyweight'], level: 1, anim: 'benchDip',
    steps: ['Hands on the edge of a bench behind you, legs out in front.', 'Lower until the upper arms are about parallel to the floor.', 'Press back up.'],
    cues: ['Stay close to the bench'],
    mistakes: ['Going too deep and pinching the shoulders'],
  }),

  ex({
    id: 'closeGripBench', name: 'Close-grip bench press', pattern: 'triceps', category: 'compound',
    primary: ['triceps'], secondary: ['chest', 'frontDelts'], equipment: ['barbell', 'bench'], level: 2, anim: 'closeGripBench',
    steps: ['Lie on the bench with the safeties set and grip the bar about shoulder-width apart, not narrower, thumbs wrapped.', 'Unrack and lower the bar to your lower chest with the elbows tucked close to your sides.', 'Press back up, driving with the triceps, until the arms are straight.'],
    cues: ['Elbows brush the ribs on the way down', 'Wrists stacked over the elbows'],
    mistakes: ['Hands too close together, which strains the wrists', 'Elbows flaring out'],
  }),
  ex({
    id: 'diamondPushUp', name: 'Diamond push-up', pattern: 'triceps', category: 'compound',
    primary: ['triceps'], secondary: ['chest', 'frontDelts', 'abs'], equipment: ['bodyweight'], level: 2, anim: 'diamondPushUp',
    steps: ['Get into a push-up position with your hands together under your chest, thumbs and index fingers touching in a diamond.', 'Lower your chest to your hands with the elbows tucked close to the body.', 'Press back up until the arms are straight. Do them from the knees if you cannot do 8 from the toes.'],
    cues: ['One straight line from head to heels', 'Elbows point back, not out'],
    mistakes: ['Hips sagging or piking up', 'Head dropping toward the floor'],
  }),
  ex({
    id: 'tricepsKickback', name: 'Dumbbell triceps kickback', pattern: 'triceps', category: 'isolation',
    primary: ['triceps'], secondary: [], equipment: ['dumbbell'], level: 1, anim: 'tricepsKickback',
    steps: ['Hold a light dumbbell in each hand and hinge forward with a flat back, upper arms alongside the body and parallel to the floor.', 'Straighten the arms until they are fully extended behind you, then pause.', 'Lower the forearms back to 90 degrees without letting the elbows drop.'],
    cues: ['Upper arms stay still and high', 'A fully straight arm at the top is the working part'],
    mistakes: ['Swinging the weights', 'Elbows dropping as you tire'],
  }),
  ex({
    id: 'bandPushdown', name: 'Band triceps pushdown', pattern: 'triceps', category: 'isolation',
    primary: ['triceps'], secondary: [], equipment: ['band'], level: 1, anim: 'bandPushdown',
    steps: ['Anchor a band above head height (a door anchor or a bar) and hold both ends with the elbows tucked to your sides, forearms just above parallel.', 'Push down until your arms are straight, then squeeze.', 'Return slowly with the elbows still in place.'],
    cues: ['Only the forearms move', 'Stand tall instead of leaning on the band'],
    mistakes: ['Elbows drifting forward', 'Standing so close that the band goes slack at the bottom'],
  }),
  /* ---- forearms ---- */
  ex({
    id: 'wristCurl', name: 'Dumbbell wrist curl', pattern: 'forearm', category: 'isolation',
    primary: ['forearms'], secondary: [], equipment: ['dumbbell'], level: 1, anim: 'wristCurl',
    steps: ['Sit with your forearms resting on your thighs, palms up, a light dumbbell in each hand and the wrists just past the knees.', 'Let the weight roll down toward the fingers, then curl the wrists up as far as they go.', 'Lower slowly. Light weight, 12 to 20 reps.'],
    cues: ['Only the wrists move', 'Full range: open the hand at the bottom, squeeze at the top'],
    mistakes: ['Lifting the forearms off the thighs', 'Going heavy and jerking the wrists'],
  }),
  ex({
    id: 'reverseCurl', name: 'Reverse curl (palms down)', pattern: 'forearm', category: 'isolation',
    primary: ['forearms', 'biceps'], secondary: [], equipment: ['barbell', 'dumbbell'], level: 1, anim: 'barbellCurl',
    steps: ['Hold a bar or dumbbells with the palms facing down, hands shoulder-width apart.', 'Curl to shoulder height without moving the upper arms, wrists straight.', 'Lower slowly to straight arms. It is much lighter than a normal curl.'],
    cues: ['Wrists flat, knuckles up', 'Elbows pinned to the sides'],
    mistakes: ['Letting the wrists bend back', 'Swinging the body'],
  }),
  ex({
    id: 'farmersCarry', name: "Farmer's carry", pattern: 'forearm', category: 'isolation', timed: true,
    primary: ['forearms'], secondary: ['upperBack', 'abs', 'calves'], equipment: ['dumbbell', 'kettlebell'], level: 1, anim: 'farmersCarry',
    steps: ['Pick up a heavy dumbbell or kettlebell in each hand from a squat, not a bend.', 'Stand tall, shoulders back, and walk for 30 to 40 seconds with short quick steps.', 'Set the weights down with a straight back, rest, repeat.'],
    cues: ['Chest up, eyes ahead', 'Grip hard: the forearms are the point'],
    mistakes: ['Leaning to one side', 'Shrugging the shoulders up to the ears'],
  }),
  /* ================= LEG ISOLATION ================= */
  ex({
    id: 'legExtension', name: 'Leg extension', pattern: 'quadIso', category: 'isolation',
    primary: ['quads'], secondary: [], equipment: ['machine'], level: 1, anim: 'legExtension',
    steps: ['Sit with the pad on your shins just above the ankles.', 'Straighten the legs fully and pause.', 'Lower slowly.'],
    cues: ['Hold the top for a second'],
    mistakes: ['Dropping the weight on the way down'],
  }),
  ex({
    id: 'legCurl', name: 'Lying leg curl', pattern: 'hamIso', category: 'isolation',
    primary: ['hamstrings'], secondary: ['calves'], equipment: ['machine'], level: 1, anim: 'legCurl',
    steps: ['Lie face-down with the pad just above your heels.', 'Curl your heels toward your glutes.', 'Lower slowly.'],
    cues: ['Hips stay on the bench'],
    mistakes: ['Lifting the hips'],
  }),
  ex({
    id: 'standingCalfRaise', name: 'Standing calf raise', pattern: 'calf', category: 'isolation',
    primary: ['calves'], secondary: [], equipment: ['bodyweight', 'machine', 'dumbbell'], level: 1, anim: 'standingCalfRaise',
    steps: ['Stand with the balls of your feet on a step, heels hanging.', 'Rise as high as you can onto your toes.', 'Lower until you feel a stretch, and pause.'],
    cues: ['Full stretch at the bottom, full squeeze at the top', 'The stretched bottom half is where the growth is: pause there'],
    mistakes: ['Bouncing', 'Only doing the top half'],
  }),
  ex({
    id: 'seatedCalfRaise', name: 'Seated calf raise', pattern: 'calf', category: 'isolation',
    primary: ['calves'], secondary: [], equipment: ['machine'], level: 1, anim: 'seatedCalfRaise',
    steps: ['Sit with the pad on your knees and the balls of your feet on the platform.', 'Raise the heels as high as possible, then lower for a stretch.'],
    cues: ['Slow on the way down'],
    mistakes: ['Short bouncy reps'],
  }),

  /* ================= CORE ================= */
  ex({
    id: 'plank', name: 'Plank', pattern: 'coreAnti', category: 'core', timed: true,
    primary: ['abs'], secondary: ['obliques', 'glutes', 'frontDelts'], equipment: ['bodyweight'], level: 1, anim: 'plank',
    steps: ['Forearms on the floor, elbows under shoulders, legs straight.', 'Squeeze glutes and stomach so your body is one straight line.', 'Breathe and hold.'],
    cues: ['Push the floor away with the forearms', 'Ribs pulled down'],
    mistakes: ['Hips sagging', 'Hips too high', 'Holding your breath'],
  }),
  ex({
    id: 'sidePlank', name: 'Side plank', pattern: 'coreLateral', category: 'core', timed: true, unilateral: true,
    primary: ['obliques'], secondary: ['abs', 'glutes'], equipment: ['bodyweight'], level: 1, anim: 'sidePlank',
    steps: ['Lie on your side, forearm on the floor, elbow under the shoulder.', 'Lift your hips so your body is a straight line. Hold, then switch sides.'],
    cues: ['Stack the feet or stagger them', 'Hips forward'],
    mistakes: ['Hips dropping'],
  }),
  ex({
    id: 'deadBug', name: 'Dead bug', pattern: 'coreAnti', category: 'core',
    primary: ['abs'], secondary: ['hipFlexors'], equipment: ['bodyweight'], level: 1, anim: 'deadBug',
    steps: ['Lie on your back, arms straight up, knees bent over your hips.', 'Press your lower back into the floor. Slowly extend one arm overhead and the opposite leg out.', 'Return and switch sides.'],
    cues: ['Lower back stays flat on the floor the whole time'],
    mistakes: ['Back arching as the leg lowers'],
  }),
  ex({
    id: 'birdDog', name: 'Bird dog', pattern: 'coreAnti', category: 'core',
    primary: ['lowerBack', 'abs'], secondary: ['glutes'], equipment: ['bodyweight'], level: 1, anim: 'birdDog',
    steps: ['On hands and knees, back flat.', 'Reach one arm forward and the opposite leg back until both are level with your torso.', 'Hold, return, switch sides.'],
    cues: ['Hips stay level', 'Reach long rather than high'],
    mistakes: ['Arching the back to lift the leg'],
  }),
  ex({
    id: 'hangingKneeRaise', name: 'Hanging knee raise', pattern: 'coreFlex', category: 'core',
    primary: ['abs', 'hipFlexors'], secondary: ['forearms'], equipment: ['pullupBar'], level: 2, anim: 'hangingKneeRaise',
    steps: ['Hang from a bar with straight arms.', 'Lift your knees toward your chest, curling the hips up.', 'Lower slowly without swinging.'],
    cues: ['Tilt the pelvis up at the top'],
    mistakes: ['Swinging'],
  }),
  ex({
    id: 'cableCrunch', name: 'Cable crunch', pattern: 'coreFlex', category: 'core',
    primary: ['abs'], secondary: [], equipment: ['cable'], level: 1, anim: 'cableCrunch',
    steps: ['Kneel facing a high pulley holding a rope at your forehead.', 'Curl your ribs toward your hips.', 'Return slowly.'],
    cues: ['Hips stay still, spine curls'],
    mistakes: ['Pulling with the arms'],
  }),
  ex({
    id: 'crunch', name: 'Curl-up', pattern: 'coreFlex', category: 'core',
    primary: ['abs'], secondary: [], equipment: ['bodyweight'], level: 1, anim: 'crunch',
    steps: ['Lie on your back with one knee bent and the other leg straight, hands under the small of your back to keep its natural arch.', 'Lift only your head and shoulders a few centimetres, as if a weight sat on your chest. The lower back does not move.', 'Hold a few seconds, lower, and switch the bent leg halfway through the set.'],
    cues: ['Small lift, long hold', 'Neck stays neutral'],
    mistakes: ['Curling the whole spine off the floor', 'Pulling on the neck', 'Stop if your back complains'],
  }),
  ex({
    id: 'palloffPress', name: 'Pallof press', pattern: 'coreAnti', category: 'core', unilateral: true,
    primary: ['obliques', 'abs'], secondary: [], equipment: ['cable', 'band'], level: 1, anim: 'palloffPress',
    steps: ['Stand side-on to a cable at chest height, holding the handle at your chest.', 'Press it straight out in front and resist the pull to twist.', 'Bring it back. Do all reps, then face the other way.'],
    cues: ['Hips and shoulders square'],
    mistakes: ['Letting the cable turn you'],
  }),
  ex({
    id: 'hollowHold', name: 'Hollow hold', pattern: 'coreAnti', category: 'core', timed: true,
    primary: ['abs'], secondary: ['hipFlexors'], equipment: ['bodyweight'], level: 2, anim: 'hollowHold',
    steps: ['Lie on your back, press the lower back into the floor.', 'Lift shoulders and legs a little off the floor, arms overhead.', 'Hold the banana shape.'],
    cues: ['Lower back flat on the floor'],
    mistakes: ['Back arching off the floor'],
  }),
  ex({
    id: 'lyingLegRaise', name: 'Lying leg raise', pattern: 'coreFlex', category: 'core',
    primary: ['abs', 'hipFlexors'], secondary: [], equipment: ['bodyweight'], level: 1, anim: 'lyingLegRaise',
    steps: ['Lie on your back, hands under your hips, legs straight.', 'Lift the legs to vertical.', 'Lower slowly, stopping before the back arches.'],
    cues: ['Lower back pressed down'],
    mistakes: ['Dropping the legs fast'],
  }),

  ex({
    id: 'wallSit', name: 'Wall squat hold', pattern: 'coreAnti', category: 'core', timed: true,
    primary: ['quads'], secondary: ['glutes', 'abs'], equipment: ['bodyweight'], level: 1, anim: 'wallSit',
    steps: ['Back flat against a wall, feet about half a metre out, shoulder-width.', 'Slide down until your thighs are roughly level with the floor, knees over ankles.', 'Hold for 2 minutes breathing normally, rest 2 minutes, repeat 4 times. Three days a week is the studied dose.'],
    cues: ['Breathe; never hold your breath', 'If 2 minutes is too much, sit a little higher and build up'],
    mistakes: ['Holding the breath (raises blood pressure during the hold)', 'Knees drifting past the toes'],
  }),

  /* ================= CARDIO ================= */
  ex({
    id: 'inclineWalk', name: 'Incline treadmill walk', pattern: 'cardio', category: 'cardio', timed: true, intensity: 'moderate',
    primary: ['calves', 'glutes'], secondary: ['quads', 'hamstrings'], equipment: ['cardioMachine'], level: 1, anim: 'inclineWalk',
    steps: ['Set the treadmill to a brisk walk with a 5 to 10 percent incline.', 'Walk without holding the rails.', 'You should be able to talk, but not sing.'],
    cues: ['Tall posture, arms swinging'],
    mistakes: ['Leaning back on the rails (cuts the work by about a third)'],
  }),
  ex({
    id: 'briskWalk', name: 'Brisk walk or march on the spot', pattern: 'cardio', category: 'cardio', timed: true, intensity: 'moderate',
    primary: ['calves', 'glutes'], secondary: ['quads', 'hamstrings'], equipment: ['bodyweight'], level: 1, anim: 'inclineWalk',
    steps: ['Walk fast enough that talking is possible but singing is not, or march on the spot lifting the knees.', 'Swing the arms and keep the posture tall.'],
    cues: ['Quick steps, tall posture'],
    mistakes: ['Strolling: it has to feel like work'],
  }),
  ex({
    id: 'run', name: 'Easy run', pattern: 'cardio', category: 'cardio', timed: true, intensity: 'vigorous', highImpact: true,
    primary: ['quads', 'calves'], secondary: ['glutes', 'hamstrings'], equipment: ['cardioMachine', 'bodyweight'], level: 2, anim: 'run',
    steps: ['Run at a pace where you can still speak short sentences.', 'Land with your foot under your body, short quick steps.'],
    cues: ['Relaxed shoulders', 'Quick light steps'],
    mistakes: ['Starting too fast', 'Overstriding'],
  }),
  ex({
    id: 'bike', name: 'Stationary bike', pattern: 'cardio', category: 'cardio', timed: true, intensity: 'moderate',
    primary: ['quads'], secondary: ['glutes', 'hamstrings', 'calves'], equipment: ['cardioMachine'], level: 1, anim: 'bike',
    steps: ['Set the saddle so your knee is slightly bent at the bottom of the pedal stroke.', 'Pedal at a steady pace with light resistance. Raise resistance for intervals.'],
    cues: ['Around 80 to 90 pedal turns per minute'],
    mistakes: ['Saddle too low (knees hurt)'],
  }),
  ex({
    id: 'rower', name: 'Rowing machine', pattern: 'cardio', category: 'cardio', timed: true, intensity: 'vigorous',
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'upperBack', 'lats', 'biceps', 'abs', 'lowerBack', 'calves'], equipment: ['cardioMachine'], level: 1, anim: 'rower',
    steps: ['Push with the legs first, then lean back slightly, then pull the handle to the lower ribs.', 'Return in reverse: arms, then lean forward, then bend the knees.'],
    cues: ['Push with the legs, then swing the body, then pull with the arms; reverse it on the way back'],
    mistakes: ['Pulling with the arms before the legs finish', 'Rounding the back'],
  }),
  ex({
    id: 'elliptical', name: 'Elliptical', pattern: 'cardio', category: 'cardio', timed: true, intensity: 'moderate',
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves'], equipment: ['cardioMachine'], level: 1, anim: 'elliptical',
    steps: ['Stand tall, hands lightly on the moving handles.', 'Keep a steady rhythm at a pace where talking is possible.'],
    cues: ['Heels stay down'],
    mistakes: ['Leaning heavily on the handles'],
  }),
  ex({
    id: 'jumpRope', name: 'Jump rope', pattern: 'cardio', category: 'cardio', timed: true, intensity: 'vigorous', highImpact: true,
    primary: ['calves'], secondary: ['quads', 'forearms', 'sideDelts'], equipment: ['jumpRope'], level: 2, anim: 'jumpRope',
    steps: ['Jump on wood, rubber flooring or a mat, not concrete, and keep the first sessions short.', 'Elbows close to your sides, turn the rope with your wrists.', 'Bounce just high enough to clear the rope, landing softly on the balls of your feet.'],
    cues: ['Small jumps, soft knees', 'Soft surface'],
    mistakes: ['Jumping too high', 'Swinging with the whole arm'],
  }),
  ex({
    id: 'burpee', name: 'Burpee', pattern: 'cardio', category: 'cardio', intensity: 'vigorous', highImpact: true,
    primary: ['quads', 'chest'], secondary: ['glutes', 'triceps', 'abs', 'frontDelts'], equipment: ['bodyweight'], level: 2, anim: 'burpee',
    steps: ['From standing, crouch and put your hands on the floor.', 'Jump the feet back to a plank, do a push-up.', 'Jump the feet back in and jump up with your arms overhead.'],
    cues: ['Land softly', 'Keep the plank straight'],
    mistakes: ['Hips sagging in the plank position'],
  }),
  ex({
    id: 'jumpingJacks', name: 'Jumping jacks', pattern: 'cardio', category: 'cardio', timed: true, intensity: 'moderate', highImpact: true,
    primary: ['calves'], secondary: ['sideDelts', 'quads', 'glutes'], equipment: ['bodyweight'], level: 1, anim: 'jumpingJacks',
    steps: ['Jump the feet apart while raising the arms overhead.', 'Jump back to feet together, arms down.'],
    cues: ['Soft landings'],
    mistakes: ['Locking the knees'],
  }),
  ex({
    id: 'mountainClimbers', name: 'Mountain climbers', pattern: 'cardio', category: 'cardio', timed: true, intensity: 'vigorous',
    primary: ['abs', 'hipFlexors'], secondary: ['frontDelts', 'quads'], equipment: ['bodyweight'], level: 1, anim: 'mountainClimbers',
    steps: ['Start in a push-up position.', 'Drive one knee toward your chest, then quickly switch legs.'],
    cues: ['Hips level with the shoulders'],
    mistakes: ['Hips bouncing up'],
  }),
  ex({
    id: 'stairClimber', name: 'Stair climber', pattern: 'cardio', category: 'cardio', timed: true, intensity: 'vigorous',
    primary: ['glutes', 'quads'], secondary: ['calves', 'hamstrings'], equipment: ['cardioMachine'], level: 1, anim: 'stairClimber',
    steps: ['Step at a pace you can hold for the whole time, whole foot on each step.', 'Hands rest lightly on the rails, do not lean on them.'],
    cues: ['Tall posture'],
    mistakes: ['Leaning on the rails'],
  }),
  ex({
    id: 'highKnees', name: 'High knees', pattern: 'cardio', category: 'cardio', timed: true, intensity: 'vigorous', highImpact: true,
    primary: ['hipFlexors', 'quads'], secondary: ['calves', 'abs'], equipment: ['bodyweight'], level: 1, anim: 'highKnees',
    steps: ['Run on the spot lifting each knee to hip height.', 'Pump the arms.'],
    cues: ['Stay on the balls of the feet'],
    mistakes: ['Leaning back'],
  }),

  /* ================= MOBILITY (THE FORGE) ================= */
  ex({
    id: 'armCircles', name: 'Arm circles', pattern: 'mobility', category: 'mobility', timed: true,
    primary: ['sideDelts'], secondary: ['upperBack'], equipment: ['bodyweight'], level: 1, anim: 'armCircles',
    steps: ['Arms out to the sides. Make small circles, growing to large ones.', 'Reverse direction halfway.'],
    cues: ['Shoulders relaxed'],
  }),
  ex({
    id: 'legSwings', name: 'Leg swings', pattern: 'mobility', category: 'mobility', unilateral: true,
    primary: ['hipFlexors', 'hamstrings'], secondary: ['glutes'], equipment: ['bodyweight'], level: 1, anim: 'legSwings',
    steps: ['Hold a wall or rack with one hand.', 'Swing the outside leg forward and back, a little higher each time.', 'Switch legs.'],
    cues: ['Torso tall, swing from the hip'],
  }),
  ex({
    id: 'hipCircles', name: 'Hip circles', pattern: 'mobility', category: 'mobility', timed: true,
    primary: ['glutes', 'hipFlexors'], secondary: ['obliques'], equipment: ['bodyweight'], level: 1, anim: 'hipCircles',
    steps: ['Hands on hips, feet shoulder-width.', 'Draw big slow circles with your hips, both directions.'],
  }),
  ex({
    id: 'catCow', name: 'Cat-cow', pattern: 'mobility', category: 'mobility',
    primary: ['lowerBack'], secondary: ['abs', 'upperBack'], equipment: ['bodyweight'], level: 1, anim: 'catCow',
    steps: ['On hands and knees.', 'Breathe in and drop the belly, lifting the chest and tailbone (cow).', 'Breathe out and round the whole spine toward the ceiling (cat).'],
    cues: ['Move slowly with the breath'],
  }),
  ex({
    id: 'worldsGreatest', name: 'Lunge with rotation', pattern: 'mobility', category: 'mobility', unilateral: true,
    primary: ['hipFlexors', 'glutes'], secondary: ['obliques', 'upperBack', 'hamstrings'], equipment: ['bodyweight'], level: 1, anim: 'worldsGreatest',
    steps: ['Step into a long lunge and place both hands inside the front foot.', 'Rotate the inside arm up toward the ceiling, following it with your eyes.', 'Return and switch sides.'],
    cues: ['Back leg straight, front knee over the ankle'],
  }),
  ex({
    id: 'inchworm', name: 'Inchworm', pattern: 'mobility', category: 'mobility',
    primary: ['hamstrings', 'abs'], secondary: ['frontDelts', 'chest'], equipment: ['bodyweight'], level: 1, anim: 'inchworm',
    steps: ['From standing, fold forward and walk your hands out to a plank.', 'Walk the feet back toward the hands with straight legs, then stand.'],
    cues: ['Legs as straight as your hamstrings allow'],
  }),
  ex({
    id: 'bandPullApart', name: 'Band pull-apart', pattern: 'mobility', category: 'mobility',
    primary: ['rearDelts', 'upperBack'], secondary: [], equipment: ['band'], level: 1, anim: 'bandPullApart',
    steps: ['Hold a light band in front of you at shoulder height, arms straight.', 'Pull the hands apart until the band touches your chest.', 'Return slowly.'],
    cues: ['Squeeze the shoulder blades'],
  }),
  ex({
    id: 'shoulderDislocates', name: 'Band shoulder pass-through', pattern: 'mobility', category: 'mobility',
    primary: ['frontDelts', 'chest'], secondary: ['upperBack'], equipment: ['band'], level: 1, anim: 'shoulderDislocates',
    steps: ['Hold a band wide in front of your hips with straight arms.', 'Lift it over your head and down behind you, then bring it back.', 'Go only as far as is comfortable; widen the grip if it pinches.'],
    cues: ['Arms straight the whole way'],
  }),
  ex({
    id: 'thoracicRotation', name: 'Thoracic rotation', pattern: 'mobility', category: 'mobility', unilateral: true,
    primary: ['obliques', 'upperBack'], secondary: [], equipment: ['bodyweight'], level: 1, anim: 'thoracicRotation',
    steps: ['On hands and knees, one hand behind your head.', 'Rotate that elbow toward the ceiling, then down toward the opposite wrist.', 'Switch sides.'],
    cues: ['Hips stay still'],
  }),
  ex({
    id: 'ankleRocks', name: 'Ankle rocks', pattern: 'mobility', category: 'mobility', unilateral: true,
    primary: ['calves'], secondary: [], equipment: ['bodyweight'], level: 1, anim: 'ankleRocks',
    steps: ['Half-kneel with the front foot flat.', 'Rock the knee forward over the toes, keeping the heel down. Rock back and repeat.'],
    cues: ['Heel stays on the floor'],
  }),

  /* ================= BALANCE (65+) ================= */
  ex({
    id: 'singleLegStand', name: 'Single-leg stand', pattern: 'balance', category: 'balance', timed: true, unilateral: true,
    primary: ['glutes', 'calves'], secondary: ['abs'], equipment: ['bodyweight'], level: 1, anim: 'singleLegStand',
    steps: ['Stand near a wall or chair for safety.', 'Lift one foot and balance on the other. Hold, then switch.'],
    cues: ['Eyes on a fixed point'],
  }),
  ex({
    id: 'heelToeWalk', name: 'Heel-to-toe walk', pattern: 'balance', category: 'balance', timed: true,
    primary: ['calves', 'glutes'], secondary: ['abs'], equipment: ['bodyweight'], level: 1, anim: 'heelToeWalk',
    steps: ['Walk in a straight line placing the heel of one foot directly in front of the toes of the other.'],
    cues: ['Look ahead, not down'],
  }),
  ex({
    id: 'sitToStand', name: 'Sit-to-stand', pattern: 'balance', category: 'balance',
    primary: ['quads', 'glutes'], secondary: ['abs'], equipment: ['bodyweight', 'bench'], level: 1, anim: 'sitToStand',
    steps: ['Sit on a chair with feet flat.', 'Stand up without using your hands, then sit back down slowly.'],
    cues: ['Lean forward slightly to stand'],
  }),
]

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))
export const getExercise = (id: string): Exercise => {
  const e = EXERCISE_BY_ID[id]
  if (!e) throw new Error(`Unknown exercise ${id}`)
  return e
}
