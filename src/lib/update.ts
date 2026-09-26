/**
 * App updates on an installed PWA.
 *
 * The generated service worker precaches the whole app. vite-plugin-pwa's "autoUpdate" makes a new
 * worker take over as soon as it is installed, but the page that is already open keeps running the
 * old code until it reloads. On an iPhone home-screen app that meant two full relaunches per update.
 * `watchForUpdates` reloads once the new worker takes control; `updateApp` lets Settings force a check.
 */

export function watchForUpdates(): void {
  if (!('serviceWorker' in navigator)) return
  // Only reload when a previous worker was in charge: the very first install also fires controllerchange.
  let hadController = !!navigator.serviceWorker.controller
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return } // first install: this page is already current
    if (reloading) return
    reloading = true
    window.location.reload()
  })
}

export type UpdateResult = 'updated' | 'current' | 'unsupported'

/** Ask the browser to fetch the worker again; resolves 'updated' (page is reloading) or 'current'. */
export async function updateApp(): Promise<UpdateResult> {
  if (!('serviceWorker' in navigator)) return 'unsupported'
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return 'unsupported'
  const changed = new Promise<boolean>((resolve) => {
    const t = setTimeout(() => resolve(false), 10000)
    navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(t); resolve(true) }, { once: true })
  })
  try { await reg.update() } catch { return 'current' }
  if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
  if (!reg.installing && !reg.waiting) return 'current'
  const ok = await changed
  if (!ok) return 'current'
  window.location.reload()
  return 'updated'
}
