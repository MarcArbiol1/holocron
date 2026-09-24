import { useEffect, useRef, useState } from 'react'

/**
 * A number field that lets you type "12.5" (or "12,5" on a Spanish keyboard).
 * A controlled <input type="number"> eats the trailing dot the moment it is typed, so
 * half-kilo plates were impossible to log. This keeps the raw text while you type and
 * hands the parent a number only once it is a number.
 */
export function NumField({ value, onChange, mode = 'decimal', placeholder, className = '', ariaLabel }: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  mode?: 'decimal' | 'numeric'
  placeholder?: string
  className?: string
  ariaLabel?: string
}) {
  const show = value === undefined ? '' : String(value)
  const [text, setText] = useState(show)
  const focused = useRef(false)
  // Select the old value on focus so typing replaces it. The tap that focused the field also places
  // a caret right after focus, which would undo the selection, so that first mouse-up is swallowed.
  const swallowMouseUp = useRef(false)
  useEffect(() => { if (!focused.current) setText(show) }, [show])
  return (
    <input
      type="text"
      inputMode={mode}
      enterKeyHint="done"
      autoComplete="off"
      aria-label={ariaLabel}
      className={className}
      placeholder={placeholder}
      value={text}
      onFocus={(e) => { focused.current = true; swallowMouseUp.current = true; e.target.select() }}
      onMouseUp={(e) => { if (swallowMouseUp.current) { e.preventDefault(); swallowMouseUp.current = false } }}
      onBlur={() => { focused.current = false; swallowMouseUp.current = false; setText(show) }}
      onChange={(e) => {
        const raw = e.target.value.replace(',', '.')
        if (!(mode === 'decimal' ? /^\d*\.?\d*$/ : /^\d*$/).test(raw)) return
        setText(raw)
        if (raw === '' || raw === '.') onChange(undefined)
        else if (!raw.endsWith('.')) onChange(Number(raw))
      }}
    />
  )
}
