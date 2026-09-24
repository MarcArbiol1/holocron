# Holocron handoff

Pick-up notes for whoever opens this repo next (usually Marc + Claude).

## State as of 24 Sep 2026, late (new logo, login, logo loader)

- **Logo:** Marc's hand-drawn cube-with-star PNG (Downloads/063EC7F0...PNG) is now the icon, recoloured only: ink darkness became opacity, ice body on the night background. `public/icon-*.png`, `apple-touch-icon.png`, `favicon.png` (the SVG is gone), `logo.png` (transparent), and `public/logo/{top,star,left,right}.png`: the four drawn pieces, split along the drawing's own gaps (the top face is open on its lower right; the left panel is a U hanging off the shared edge; the star's right arm was cut from the right edge along that edge's line). The split script is not in the repo; regenerate from the source PNG with scipy connected components at alpha > 0.95 if the logo ever changes.
- **Logo loader** (`src/components/LogoLoader.tsx`, CSS in `index.css`): two cartoon jumps with squash and stretch, pieces drift apart and spin, snap back with overshoot; 4.4 s loop, transforms only. Shown for one loop after onboarding saves (`Onboarding.tsx`), and on the Login page while an account's archive is fetched. `LogoMark` is the small logo in the Home header and on Login.
- **Accounts:** Supabase, optional, off until the build has `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (GitHub Actions secrets are wired in `pages.yml`). `docs/ACCOUNTS.md` has Marc's 15-minute setup (project, table + RLS SQL, redirect URLs, GitHub OAuth app, secrets). Code: `src/lib/cloud.ts`, `src/lib/sync.ts`, `src/pages/Login.tsx`, store fields `account`, `cloud`, `loginSkipped`.
- **Headless QA gotcha:** the preview page registers the service worker; after a rebuild, unregister it in the browser (`navigator.serviceWorker.getRegistrations()`) or the old bundle is served.

## Earlier on 24 Sep 2026, night (code review pass: bugs + smoothness)

- Marc asked for a bug and UX review. Fixed and browser-verified (headless Chromium at 390x844, onboarding -> plan -> Forge -> session -> exercise page -> finish; zero console errors):
  - **Animations:** `Figure` no longer re-renders through React per frame. One shared rAF loop (`src/anim/ticker.ts`) patches SVG attributes in place; figures pause off-screen (IntersectionObserver), in hidden tabs, and under reduced motion. `Figure` is memoised. Before: eight figures on the session page = 240 React renders a second.
  - **Decimals:** `<input type=number>` ate the trailing dot, so 12.5 kg could not be typed. New `NumField` (text + inputMode) accepts "12,5" and "12.5", selects the old value on focus (with the mouse-up guard so the tap does not undo it). Used in the session table and onboarding.
  - **Rest timer** now lives in the store (`rest`) and renders from `App.tsx`, so it keeps counting when you open an exercise page mid-rest; it shows the exercise name and a progress bar. Wake lock and the live card are managed at app level for the whole workout.
  - **Confirm sheets** (`src/components/Confirm.tsx`) replace `window.confirm` (which showed the site address) for delete/erase, and "Remove exercise" now asks first.
  - Scroll to top on new pages; the back button falls back to Home when there is no history; guards against a stale plan referencing a removed exercise; library search is a real search field; onboarding hints match the new splits.
- **Verify animations locally:** `npx vite preview --port 4173`, then in the browse tool read an SVG attribute twice a second apart.

## Earlier on 24 Sep 2026, evening (second round: the Arnold split)

- Marc's reply to the first round: still no arms day, no leg extension on Mordor, the Fellowship repeats the other days. Rebuilt the split for intermediate/advanced lifters with weights and 60-min sessions: **chest and back (The Citadel) / legs (Mordor) / shoulders and arms (The Armoury) / cardio**; 5 days adds The Watchtower. New `forearm` pattern (wrist curl, reverse curl, farmer's carry) with animations; leg extension on the leg day; `PROGRAM_VERSION` 7; equipment fix (a bench no longer unlocks barbell lifts). Frequency rule rewritten on Schoenfeld 2019 (volume-matched frequency is a wash). Details: `docs/AUDIT.md` second round, `docs/EVIDENCE.md` part 3.
- **If Marc says he still sees the old plan:** the PWA is `autoUpdate`, but the first open after a deploy can still show the cached build; close the app fully and reopen. Settings -> Edit profile -> Save also rebuilds.
- **Marc's likely profile:** intermediate, 4 days, gym, cardio day on (he named The Citadel and Mordor). If his sessions are 45 min he will NOT get the Arnold split; the plan note explains and the fix is 60 min in the profile.

## Earlier on 24 Sep 2026 (balance review)

- **Marc's first real feedback after using it:** "almost all of the workouts are leg located, very little chest, biceps, triceps". Confirmed by simulation and fixed; write-up in `docs/AUDIT.md` part 3, papers in `docs/EVIDENCE.md` part 3, three new Codex rules (`arms`, `balance`, `firstlift`).
- **Root causes:** the full-body templates had no arm slot at all, both full-body days used the same chest exercise, every day opened with a leg lift, and the audit only tracked six big muscles.
- **Fixes:** full-body templates rebuilt (2 legs, 2 pushes, 2 pulls, arms, delts); per-pattern variants across the rotation (`variantPlan` in `program.ts`); 14 new exercises with animations (incline barbell press, dumbbell fly, pec deck, machine shoulder press, pike push-up, decline push-up, close-grip pulldown, incline curl, band curl, close-grip bench, diamond push-up, kickback, band pushdown, band lateral raise); new `chestIso` pattern; `PROGRAM_VERSION` 6 so phones rebuild their plan on next load.
- **Audit now enforces balance** (arm work on every non-leg day, legs <= upper per full-body day, rotating opener, two chest angles, small-muscle floors); tolerances documented. 32 tests, 0 violations, build green, `npm run check-anims` 0 missing.
- **Not done:** not committed or pushed (Marc's call); not yet tested on the phone.

## Earlier: 16 Sep 2026 (late night: health + physique research encoded)

- **Second research pass** (26 rules, `docs/EVIDENCE.md` part 2) encoded: dedicated cardio day (Mount Doom) in every plan of 3+ days with two alternating sessions (The Long Road steady / The Eruption 4x4 intervals, 65+ steady only), wall squat holds on the cardio day for the health goal (blood pressure), fat-loss protein 2 g/kg + 0.5-0.7%/week rate in profile facts, steps target, muscle-memory ramp-back in `progression.ts`, stretched-position cues, overhead triceps first, second-visit day variants, strength marker tile in the recap, and **The Codex** page (`/codex`, `src/data/codex.ts`, 42 rules) linked from Plan and Settings.
- **Gotcha that cost an hour:** a stale `vite` process on the wildcard address kept serving an old module graph on :5173 ("Invalid hook call", blank root). `pkill -f vite` before starting a dev server.

## Earlier: 16 Sep 2026 (night: Aether skin)

- **Restyled to the Lovable "Aether" design** (repo MarcArbiol1/liquid-hero-gym, private). Design system in
  `src/index.css` + `tailwind.config.js` (tokens night/panel/ice/dim/glow/soft/sand, Space Grotesk/Space Mono bundled
  via @fontsource, glass utilities, Apple spring curves generated from the WWDC23 formula). Shell in
  `src/components/ui.tsx` (`Page`, `LiquidDock`). Every feature kept; `docs/AUDIT.md` unchanged.
- **Dock physics** follow Apple's documented iOS 26 tab bar: lens slides with the "snappy" spring and stretches while
  moving, bar minimises to a 58 px circle with only the active icon on scroll-down, expands on scroll-up / top / tap.
  Real refraction is impossible on iOS Safari (no SVG backdrop filters, WebKit bug 245510), so it is blur + saturate +
  specular hairlines.
- **Haptics**: `src/lib/haptics.ts`. iOS: `<HapticSwitch/>` (a real invisible `<input type=checkbox switch>` under the
  finger; scripted toggles died in iOS 26.5). Android: `navigator.vibrate`. Placed on dock tabs, home CTA, set-done,
  Finish, Forge buttons.
- **Live timer**: `src/lib/live.ts`. Media Session "Now Playing" card + silent loop for the rest countdown (opt-in
  `settings.liveTimer`), background-capable beep, Screen Wake Lock on the session page. Live Activities are native-only;
  the native route would be Capacitor + a Live Activities plugin + Apple Developer Program (99 USD/yr).

## Earlier: 16 Sep 2026 (evening: audited)

- **Built and verified locally**: onboarding -> plan -> THE FORGE -> session logger (rest timer, suggestions, swap, cardio) -> XP screen -> recap. Driven end to end in a headless phone-sized browser with zero console errors. 29 engine tests pass (`npm test -- --run`). Production build passes (`npm run build`, ~124 kB gzipped JS).
- **79 exercises, 78 stick-figure animations**, every one rendered to a contact sheet and checked for correct form (`npm run anims -- <ids>` writes `scratch/anim-preview/sheet.svg.png`; `OUT=dir` changes the folder; `PER_ROW=2` is the default layout).
- **Audited 16 Sep**: `docs/AUDIT.md`. The program builder is now time-boxed and versioned (`PROGRAM_VERSION`), muscle maps were rebalanced, 65+ get a balance block, novices never get 5-6 lifting days, bodyweight users get a single-leg RDL, and 16 technique-text fixes landed. `scripts/audit-programs.test.ts` is a regression test over 81 profiles and must stay at zero violations.
- **FastAPI backend added 16 Sep** at `backend/app.py` (venv in `backend/.venv`, `npm run api`). It only serves `dist/` and `/api/health` so far; Marc asked for it before describing how he wants the app. The static PWA path still works without it.
- **Not yet done**: pushed to GitHub, installed on Marc's iPhone, used in a real gym session, UI restyle (Marc will send designs; keep every feature).

## Decisions and why

- **Names live in `src/theme/names.ts` only.** The app name (Holocron), Padawan, Mordor and Palantir are borrowed words. Fine on GitHub; rename the app before any App Store submission. Research in `docs/IP-NOTES.md`.
- **Animations are drawn by code, not copied.** Every free GIF/video library turned out to be scraped or non-redistributable (`docs/MEDIA-LICENCES.md`). The rig in `src/anim/rig.ts` is world-direction angles + a two-bone IK solver; each exercise is two to four key poses.
- **No server.** Everything lives in the phone's localStorage under `holocron-v1` (zustand persist). Backup is copy/paste JSON in Settings.
- **Sex does not change the plan**, on purpose (Roberts 2020; Colenso-Semple 2023). Height and weight only steer cardio choices (low-impact when BMI >= 30) and the protein line.
- **Low attendance rule**: two or fewer sessions in the last 14 days (counted from the first real session) switches the recommendation to a full-body "health" day + cardio. Every other rule is in `docs/EVIDENCE.md` with the paper.

## Known limits / next steps

1. Push to GitHub and enable Pages (Settings -> Pages -> Source: GitHub Actions). The workflow in `.github/workflows/pages.yml` runs tests, builds, deploys to `https://marcarbiol1.github.io/holocron/`.
2. Install on iPhone: open the Pages URL in Safari -> Share -> Add to Home Screen. Or on the LAN: `npm run dev -- --host`.
3. The stick-figure rig is 2D. Rear-delt flies and anything that moves toward the viewer are approximated (see the strength batch notes in the git history). Prop wishes: an angled `box`, a rigid `lever`, per-key prop positions.
4. Program is stored with the profile; if the builder changes, users must re-save their profile (Settings -> Edit) to rebuild. Consider a version stamp.
5. Nice-to-haves: per-exercise history charts, a custom-routine editor, kg/lb toggle, export as CSV.

## Working conventions

- Node runs the `.ts` scripts directly (Node 25 strips types); anim modules import with `.ts` extensions for that reason.
- `tsconfig` has `noUnusedLocals`: an unused import is a build error.
- Never commit `scratch/`.
- Changing any rule in `src/engine/program.ts`: bump `PROGRAM_VERSION`, run `npx vitest run`, read `scratch/audit-report.txt` if the audit fails.
