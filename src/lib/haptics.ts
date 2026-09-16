/**
 * Haptics on the web, honestly:
 *  - Android Chrome: navigator.vibrate() from a tap handler.
 *  - iOS Safari has no Vibration API and (since iOS 26.5) ignores scripted
 *    toggles. What still works is a REAL `<input type="checkbox" switch>` that
 *    the finger actually touches: the system plays its switch tick. So we lay
 *    an invisible switch over important buttons (see <HapticSwitch/>); the
 *    click bubbles to the button's handler as usual.
 */
import { createElement } from 'react'

export const isIOS = typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

export type HapticKind = 'tap' | 'success' | 'warning'

/** Programmatic feedback: works on Android; a no-op on iOS (use <HapticSwitch/> there). */
export function haptic(kind: HapticKind = 'tap'): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(kind === 'tap' ? 10 : kind === 'success' ? [15, 40, 15] : [30, 30, 30])
    }
  } catch { /* never let feedback break a tap */ }
}

/**
 * Invisible native switch that covers its (position: relative) parent button.
 * Renders nothing outside iOS. The parent's onClick still fires because the
 * click bubbles; do not call preventDefault in that handler or iOS drops the tick.
 */
export function HapticSwitch() {
  if (!isIOS) return null
  return createElement('input', {
    type: 'checkbox',
    switch: '',
    'aria-hidden': true,
    tabIndex: -1,
    className: 'haptic-switch',
    onChange: () => {},
  } as Record<string, unknown>)
}
