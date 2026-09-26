/**
 * Keeps the store and the cloud row in step once someone is signed in.
 *  - on sign-in, on coming back to the app, and before every push: pull the row, merge it with what
 *    the phone has, push the merged result. A blind push would overwrite sessions another phone added.
 *  - every change to profile, sessions or settings schedules that sync, debounced.
 *  - a different account signing in on this phone does not absorb the previous account's data.
 */
import { useStore } from '../store/store'
import { cloudEnabled, merge, pullState, pushState, supabase, type CloudState } from './cloud'

let started = false
let timer: ReturnType<typeof setTimeout> | undefined
let lastPushed = ''
let running: Promise<void> | null = null
let lastSyncAt = 0

const snapshot = (): CloudState => {
  const s = useStore.getState()
  return { profile: s.profile, sessions: s.sessions, settings: s.settings, deletedIds: s.deleted }
}

async function syncNow(userId: string, opts: { replaceLocal?: boolean } = {}): Promise<void> {
  // One sync at a time; a second request waits for the first and then runs with fresh data.
  while (running) await running
  const job = (async () => {
    const st = useStore.getState()
    st.setCloud({ status: 'syncing', error: undefined })
    try {
      const remote = await pullState(userId)
      // Signed out between the pull and now: do not write this user's data into the next session.
      if (useStore.getState().account?.id !== userId) return
      const local = snapshot()
      const merged = opts.replaceLocal
        ? (remote?.data ?? { profile: undefined, sessions: [], settings: local.settings, deletedIds: [] })
        : remote ? merge(local, remote.data) : local
      useStore.getState().adoptCloud(merged, opts.replaceLocal)
      const at = await pushState(userId, merged)
      lastPushed = JSON.stringify(snapshot())
      lastSyncAt = Date.now()
      useStore.getState().setLastUserId(userId)
      useStore.getState().setCloud({ status: 'idle', lastSyncAt: at, error: undefined })
    } catch (e) {
      useStore.getState().setCloud({ status: 'error', error: (e as Error).message })
    }
  })()
  running = job
  try { await job } finally { running = null }
}

function schedulePush(): void {
  if (!useStore.getState().account) return
  clearTimeout(timer)
  timer = setTimeout(() => {
    // Read the account when the timer fires, not when it was set: a sign-out in between cancels the push.
    const account = useStore.getState().account
    if (!account) return
    if (JSON.stringify(snapshot()) === lastPushed) return // our own adoptCloud, nothing new
    void syncNow(account.id)
  }, 1500)
}

/** Call once at app start. Safe to call when accounts are off. */
export function startSync(): void {
  if (started || !cloudEnabled || !supabase) return
  started = true
  supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user
    if (user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      const st = useStore.getState()
      const provider = user.app_metadata?.provider as string | undefined
      // Local data that was last synced with another account belongs to that account: start from this
      // account's copy instead of merging the two.
      const otherOwner = !!st.lastUserId && st.lastUserId !== user.id
      st.setAccount({ id: user.id, email: user.email ?? undefined, provider })
      // Drop the ?code=... the OAuth redirect left in the address bar.
      if (window.location.search.includes('code=')) window.history.replaceState(null, '', window.location.pathname + (window.location.hash || '#/'))
      // Supabase can fire INITIAL_SESSION and SIGNED_IN back to back; the second one is a no-op pull.
      void syncNow(user.id, { replaceLocal: otherOwner })
    } else if (event === 'SIGNED_OUT') {
      clearTimeout(timer)
      useStore.getState().setAccount(undefined)
      useStore.getState().setCloud({ status: 'idle', lastSyncAt: undefined, error: undefined })
      lastPushed = ''
    }
  })
  useStore.subscribe((s, prev) => {
    if (s.profile !== prev.profile || s.sessions !== prev.sessions || s.settings !== prev.settings) schedulePush()
  })
  // An app left in the background for a day has missed whatever the other phone did: pull on return.
  document.addEventListener('visibilitychange', () => {
    const account = useStore.getState().account
    if (document.visibilityState === 'visible' && account && Date.now() - lastSyncAt > 60_000) void syncNow(account.id)
  })
}

/** Manual "Sync now" from Settings. */
export async function syncAgain(): Promise<void> {
  const { account } = useStore.getState()
  if (account) await syncNow(account.id)
}

/** Sign-out that first cancels any pending push, so nothing of this phone is written after it. */
export function cancelPendingPush(): void {
  clearTimeout(timer)
}
