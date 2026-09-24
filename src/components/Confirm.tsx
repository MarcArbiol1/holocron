import { useEffect } from 'react'
import { haptic } from '../lib/haptics'

/** The app's own confirmation sheet: no browser dialogs (they show the site's address and block the page). */
export function Confirm({ title, body, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: {
  title: string
  body: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])
  return (
    <div className="confirm-backdrop fixed inset-0 z-50 flex items-end justify-center p-5 sm:items-center" onClick={onCancel}>
      <div className="confirm-sheet glass w-full max-w-sm space-y-3 rounded-[1.5rem] p-5" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-title" className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-dim">{body}</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={() => { haptic(); onCancel() }}>Back</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={() => { haptic(danger ? 'warning' : 'success'); onConfirm() }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
