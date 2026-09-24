/**
 * Accounts and sync, through Supabase (auth + one row of JSON per user).
 *
 * Off by default: the app is a static page with everything in the phone's storage. When the build
 * carries VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, the Login page offers GitHub or email, and
 * the store's profile, sessions and settings are mirrored to the `holocron_state` table (one row per
 * user, protected by row-level security so a user can only read and write their own row). Setup
 * steps and the SQL are in docs/ACCOUNTS.md.
 *
 * The auth flow is PKCE: the OAuth redirect comes back with ?code=... in the query string, which
 * survives the app's hash-based routing.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Profile, Session } from '../data/types'
import type { Settings } from '../store/store'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const cloudEnabled = !!(url && anon)

export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(url!, anon!, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } })
  : null

export interface CloudState {
  profile?: Profile
  sessions: Session[]
  settings: Settings
}

export interface Account { id: string; email?: string; provider?: string }

const redirectTo = () => `${window.location.origin}${import.meta.env.BASE_URL}`

export async function signInWithGitHub(): Promise<string | null> {
  if (!supabase) return 'Accounts are not switched on in this build.'
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: redirectTo() } })
  return error ? error.message : null
}

export async function signInWithEmail(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Accounts are not switched on in this build.'
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return error ? error.message : null
}

export async function signUpWithEmail(email: string, password: string): Promise<string | null> {
  if (!supabase) return 'Accounts are not switched on in this build.'
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } })
  if (error) return error.message
  // With email confirmation on, there is no session yet: the user has to click the link in the mail.
  if (!data.session) return 'CHECK_EMAIL'
  return null
}

export async function sendMagicLink(email: string): Promise<string | null> {
  if (!supabase) return 'Accounts are not switched on in this build.'
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } })
  return error ? error.message : null
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}

/** The user's row, or null when they have none yet. */
export async function pullState(userId: string): Promise<{ data: CloudState; updatedAt: string } | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('holocron_state').select('data, updated_at').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return { data: data.data as CloudState, updatedAt: data.updated_at as string }
}

export async function pushState(userId: string, state: CloudState): Promise<string> {
  if (!supabase) throw new Error('Accounts are not switched on in this build.')
  const updated_at = new Date().toISOString()
  const { error } = await supabase.from('holocron_state').upsert({ user_id: userId, data: state, updated_at }, { onConflict: 'user_id' })
  if (error) throw new Error(error.message)
  return updated_at
}

/** Union of sessions by id, newest profile/settings kept from the phone when it has them. */
export function merge(local: CloudState, remote: CloudState): CloudState {
  const byId = new Map<string, Session>()
  for (const s of remote.sessions ?? []) byId.set(s.id, s)
  for (const s of local.sessions ?? []) byId.set(s.id, s)
  const sessions = [...byId.values()].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
  return { profile: local.profile ?? remote.profile, sessions, settings: local.settings ?? remote.settings }
}
