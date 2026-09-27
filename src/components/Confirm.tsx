import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { haptic } from '../lib/haptics'
import { useLeave } from '../lib/motion'

/** The app's own confirmation sheet: no browser dialogs (they show the site's address and block the page). */
export function Confirm({ title, body, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: {
  title: string
  body: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  // Back slides the sheet away before the parent unmounts it; the confirm action runs at once
  // (it usually changes the page, and a delay there would feel like lag).
  const { leaving, leave } = useLeave()
  const cancel = () => leave(onCancel)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  // An iOS action sheet (HIG Action Sheets): the question and the action in one group, Cancel on its own
  // below. A destructive action is red and never styled as the preferred button.
  // Portalled to <body>: inside the page's transition wrapper it would sit under the tab bar and timer.
  return createPortal(
    <div className="confirm-backdrop fixed inset-0 z-50 flex items-end justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" data-leaving={leaving} onClick={cancel}>
      <div className="confirm-sheet w-full max-w-[414px] space-y-2" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body" onClick={(e) => e.stopPropagation()}>
        <div className="action-group">
          <div className="px-4 py-3.5 text-center">
            <h3 id="confirm-title" className="text-footnote font-semibold text-dim">{title}</h3>
            <p id="confirm-body" className="mt-1 text-footnote text-dim">{body}</p>
          </div>
          <button className="action-btn" style={{ color: danger ? 'var(--red)' : 'var(--glow)' }} onClick={() => { if (leaving) return; haptic(danger ? 'warning' : 'success'); onConfirm() }}>{confirmLabel}</button>
        </div>
        <div className="action-group">
          <button className="action-btn font-semibold text-glow" onClick={() => { haptic(); cancel() }}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
