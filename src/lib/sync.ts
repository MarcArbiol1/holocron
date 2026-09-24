/**
 * Keeps the store and the cloud row in step once someone is signed in.
 *  - on sign-in: pull the row, merge with what the phone has, push the merged result
 *  - afterwards: every change to profile, sessions or settings is pushed, debounced
 */
import { useStore } from '../store/store'
import { cloudEnabled, merge, pullState, pushState, supabase, type CloudState } from './cloud'

let started = false
let timer: ReturnType<typeof setTimeout> | undefined
let lastPushed = ''

const snapshot = (): CloudState => {
  const s = useStore.getState()
  return { profile: s.profile, sessions: s.sessions, settings: s.settings }
}

async function syncNow(userId: string): Promise<void> {
  const st = useStore.getState()
  st.setCloud({ status: 'syncing', error: undefined })
  try {
    const remote = await pullState(userId)
    const local = snapshot()
    const merged = remote ? merge(local, remote.data) : local
    st.adoptCloud(merged)
    const at = await pushState(userId, merged)
    lastPushed = JSON.stringify(merged)
    useStore.getState().setCloud({ status: 'idle', lastSyncAt: at, error: undefined })
  } catch (e) {
    useStore.getState().setCloud({ status: 'error', error: (e as Error).message })
  }
}

function schedulePush(): void {
  const { account } = useStore.getState()
  if (!account) return
  clearTimeout(timer)
  timer = setTimeout(async () => {
    const data = snapshot()
    const json = JSON.stringify(data)
    if (json === lastPushed) return
    try {
      const at = await pushState(account.id, data)
      lastPushed = json
      useStore.getState().setCloud({ status: 'idle', lastSyncAt: at, error: undefined })
    } catch (e) {
      useStore.getState().setCloud({ status: 'error', error: (e as Error).message })
    }
  }, 1500)
}

/** Call once at app start. Safe to call when accounts are off. */
export function startSync(): void {
  if (started || !cloudEnabled || !supabase) return
  started = true
  supabase.auth.onAuthStateChange((event, session) => {
    const user = session?.user
    if (user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      const provider = user.app_metadata?.provider as string | undefined
      useStore.getState().setAccount({ id: user.id, email: user.email ?? undefined, provider })
      // Drop the ?code=... the OAuth redirect left in the address bar.
      if (window.location.search.includes('code=')) window.history.replaceState(null, '', window.location.pathname + (window.location.hash || '#/'))
      void syncNow(user.id)
    } else if (event === 'SIGNED_OUT') {
      useStore.getState().setAccount(undefined)
      useStore.getState().setCloud({ status: 'idle', lastSyncAt: undefined, error: undefined })
      lastPushed = ''
    }
  })
  useStore.subscribe((s, prev) => {
    if (s.profile !== prev.profile || s.sessions !== prev.sessions || s.settings !== prev.settings) schedulePush()
  })
}

/** Manual "Sync now" from Settings. */
export async function syncAgain(): Promise<void> {
  const { account } = useStore.getState()
  if (account) await syncNow(account.id)
}
