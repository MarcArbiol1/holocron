import { useEffect } from 'react'
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
  return (
    <div className="confirm-backdrop fixed inset-0 z-50 flex items-end justify-center p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:items-center" data-leaving={leaving} onClick={cancel}>
      <div className="confirm-sheet glass w-full max-w-sm space-y-3 rounded-[1.5rem] p-5" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-title" className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-dim">{body}</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={() => { haptic(); cancel() }}>Back</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => { if (leaving) return; haptic(danger ? 'warning' : 'success'); onConfirm() }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
