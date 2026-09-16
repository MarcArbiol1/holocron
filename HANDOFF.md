# Holocron handoff

Pick-up notes for whoever opens this repo next (usually Marc + Claude).

## State as of 16 Sep 2026 (night: Aether skin)

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
