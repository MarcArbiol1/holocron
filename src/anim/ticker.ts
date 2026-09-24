/**
 * One requestAnimationFrame loop for every animated figure on the page.
 * Each Figure used to run its own loop and re-render through React thirty times a second;
 * with eight figures on the session page that was 240 React renders a second. Now there is
 * one loop, it stops when the tab is hidden or when nothing is subscribed, and figures patch
 * their SVG attributes directly.
 */
type Tick = (now: number) => void
const subs = new Set<Tick>()
let raf = 0

function loop(now: number) {
  raf = 0
  if (typeof document !== 'undefined' && document.hidden) return
  for (const cb of subs) cb(now)
  if (subs.size) raf = requestAnimationFrame(loop)
}
function kick() {
  if (raf || !subs.size) return
  if (typeof document !== 'undefined' && document.hidden) return
  raf = requestAnimationFrame(loop)
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', kick)

export function subscribe(cb: Tick): () => void {
  subs.add(cb)
  kick()
  return () => {
    subs.delete(cb)
    if (!subs.size && raf) { cancelAnimationFrame(raf); raf = 0 }
  }
}
