# Accounts and sync (optional)

Holocron works with no server: everything lives in the phone's storage. Accounts are an optional layer on top,
through [Supabase](https://supabase.com) (free tier is plenty): sign in with GitHub or email, and the profile,
sessions and settings are mirrored to one row per user. The build only offers accounts when it carries the
project's URL and anon key; without them the Login page says so and lets you continue on the phone.

## What Marc has to do once (about 15 minutes)

1. **Create a Supabase project** at supabase.com (any name, region close to Spain). Note two values from
   Project Settings -> API: the **Project URL** and the **anon public key**.
2. **Create the table**, in the SQL editor:

   ```sql
   create table public.holocron_state (
     user_id uuid primary key references auth.users (id) on delete cascade,
     data jsonb not null,
     updated_at timestamptz not null default now()
   );
   alter table public.holocron_state enable row level security;
   create policy "own row" on public.holocron_state
     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
   ```

   Row-level security means a signed-in user can only ever read or write their own row, even with the
   public anon key in the app.
3. **Allow the app's address** in Authentication -> URL Configuration:
   Site URL `https://marcarbiol1.github.io/holocron/` and add the same to Redirect URLs
   (plus `http://localhost:5173/holocron/` for local testing).
4. **Email sign-in** is on by default (Authentication -> Providers -> Email). "Confirm email" can stay on; the
   app tells the user to open the confirmation mail. The "Email me a sign-in link" button needs nothing extra.
5. **GitHub sign-in:** on GitHub, Settings -> Developer settings -> OAuth Apps -> New OAuth App.
   Homepage `https://marcarbiol1.github.io/holocron/`, callback URL = the one Supabase shows under
   Authentication -> Providers -> GitHub (it looks like `https://<project>.supabase.co/auth/v1/callback`).
   Paste the GitHub client ID and secret into that Supabase provider page and enable it.
6. **Give the build the keys:** on the GitHub repo, Settings -> Secrets and variables -> Actions -> New
   repository secret, twice: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The Pages workflow already
   passes them to `npm run build`. Push anything (or re-run the workflow) and the Login page comes alive.
   For local runs put the same two lines in a `.env.local` file (it is git-ignored).

## How the sync behaves

- First launch with accounts on: the Login page comes before onboarding, with "Not now, keep everything on
  this phone" underneath. Settings -> Account can sign in later.
- On sign-in the app pulls the account's row, merges it with the phone (sessions are combined by id; the
  phone's profile and settings win when it has them), and pushes the result. After that every change is
  pushed about 1.5 s later. Settings shows the last sync time and a "Sync now" button.
- Signing out leaves the phone's copy in place; it just stops mirroring.
- The auth flow is PKCE, so the OAuth redirect returns with `?code=` in the query string, which survives the
  app's hash routing. On an installed iPhone app, GitHub sign-in opens a browser sheet and returns; the
  email link must be opened on the same phone in Safari, so email + password is the smoother path there.

## Files

- `src/lib/cloud.ts`: the Supabase client, sign-in helpers, pull/push/merge.
- `src/lib/sync.ts`: the auth listener and the debounced push.
- `src/pages/Login.tsx`, the Account section in `src/pages/Settings.tsx`, the first-launch routing in `src/App.tsx`.
