# Holocron

A gym assistant that builds your routine from the published evidence, tells you what to train today, warms you up, logs every set, and ranks you from Recruit to Ascended.

It is a phone-first web app with no server: install it from the browser, and everything lives on your phone and works offline in the gym.

## Look and feel

The interface follows the "Aether" liquid-glass design (dark night background, glass panels, a teal glow accent, a
floating glass dock whose lens slides with Apple's own spring curves and which shrinks to a single icon while you
scroll). Fonts are bundled so it looks identical offline. Motion respects "reduce motion".

**iOS extras, honestly labelled**

- **Haptics.** iOS Safari has no vibration API, so important buttons carry an invisible native switch under your
  finger; the system plays its tick when you tap. Android uses the Vibration API. Nothing else is possible from a web app.
- **Lock screen / Dynamic Island timer (beta, Settings).** A web app cannot create a Live Activity. When enabled, a
  rest timer plays a silent audio loop and publishes the countdown as a "Now Playing" card, which iOS shows on the
  lock screen and as the media pill in the Dynamic Island, and the end-of-rest beep sounds with the screen off.
  iOS 26 has an open WebKit bug that sometimes mutes web-app audio after backgrounding, hence the beta label.
- **Screen stays on** during a session (Wake Lock, iOS 18.4+ when installed to the home screen).

## What it does

- **Builds a plan from six answers**: age, sex, height, weight, experience, and the days per week you will *actually* show up. One to two days gives full-body sessions, four gives upper/lower, six gives push/pull/legs. Every rule is traced to a paper in [docs/EVIDENCE.md](docs/EVIDENCE.md).
- **Recommends today's session**: the next day in your rotation, skipping any muscle trained less than 48 hours ago. If you only made it twice in the last two weeks, it switches to a full-body "health first" session with cardio, because that gives the biggest return per visit.
- **THE FORGE**: a warm-up that pops up before every session. Easy cardio, dynamic moves for the joints about to work, then two ramp-up sets computed from your last working weight. No long static stretches (they weaken the next lift).
- **Logs the session** with a rest timer, next-weight suggestions (double progression), swaps, and a cardio finisher.
- **The Palantir**: week and month recap, a muscle heat-map of sets versus target, under-trained muscles, new records, and the full archive.
- **The Archive**: 96 exercises, each with an animated stick figure drawn by the app itself, written steps, cues, and common mistakes.
- **The Order**: twelve levels earned by showing up and doing hard sets. Consistency out-earns heroics on purpose.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173/holocron/
npm test -- --run  # engine tests
npm run build      # production build in dist/
```

To use it on your phone on the same Wi-Fi: `npm run dev -- --host`, open the LAN address it prints, then "Add to Home Screen".

Optional Python server (FastAPI) that serves the built app and hosts an API for future server-side features:

```bash
python3 -m venv backend/.venv && backend/.venv/bin/pip install -r backend/requirements.txt
npm run build && npm run api     # http://localhost:8000/holocron/
```

To publish: push to `main` on GitHub with Pages set to "GitHub Actions" (see `.github/workflows/pages.yml`). The app is served at `https://<user>.github.io/holocron/`.

## How the code is organised

```
src/theme/names.ts        every themed name (page names, routine names, levels) in ONE file
src/data/exercises.ts     the exercise library: muscles, equipment, steps, cues, animation id
src/data/muscles.ts       the 17-muscle model used for counting and the heat-map
src/engine/program.ts     profile -> split -> patterns -> exercises -> sets x reps
src/engine/recommend.ts   what to do today (rotation, 48 h recovery, low-attendance mode)
src/engine/warmup.ts      THE FORGE content
src/engine/progression.ts next-weight suggestions
src/engine/levels.ts      XP and the ladder
src/engine/recap.ts       sets per muscle, cardio minutes, streaks, records
src/anim/rig.ts           the stick-figure skeleton: pose maths + drawing primitives
src/anim/anims-*.ts       one entry per exercise: 2+ key poses the rig interpolates
src/store/store.ts        all state, saved to the phone's browser storage
src/pages/*.tsx           the screens
scripts/render-anims.ts   renders animations to a PNG contact sheet for checking form
```

The animations are not videos or GIFs. Each exercise is a handful of joint angles per key pose; the rig interpolates between them at runtime. That keeps the whole library at a few kilobytes and, more importantly, keeps it legally clean: nothing is copied from anyone.

## Evidence, names, and licences

- [docs/EVIDENCE.md](docs/EVIDENCE.md): the papers and the numbers behind every rule the app encodes.
- [docs/IP-NOTES.md](docs/IP-NOTES.md): why the page names are fine on GitHub and what to rename if the app ever goes on an app store.
- [docs/MEDIA-LICENCES.md](docs/MEDIA-LICENCES.md): the audit of free exercise-media sources, and why the app draws its own.

Holocron is a hobby project and not medical advice. Names of pages and levels are nods to films and books; no affiliation with any of them. Code is MIT licensed.
