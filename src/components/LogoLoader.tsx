/**
 * The logo, animated in place of a spinner: two cartoon jumps with squash and stretch, then the four
 * drawn pieces (open top face, star, left panel, right panel) drift apart, spin softly and snap back
 * together with a small overshoot. The pieces are the logo's own pixels, cut along the drawing's gaps,
 * so the reassembled state is the logo exactly. Everything is transform-only, so it stays smooth.
 */
const base = import.meta.env.BASE_URL

export function LogoMark({ size = 44, className = '' }: { size?: number; className?: string }) {
  return <img src={`${base}logo.png`} width={size} height={size} alt="" className={className} draggable={false} />
}

export function LogoLoader({ label, size = 168 }: { label?: string; size?: number }) {
  return (
    <div className="logo-loader fixed inset-0 z-[60] grid place-items-center bg-night" role="status" aria-live="polite" aria-label={label ?? 'Loading'}>
      <div className="flex flex-col items-center">
        <div className="logo-stage" style={{ width: size, height: size }}>
          <img className="logo-piece piece-top" src={`${base}logo/top.png`} alt="" draggable={false} />
          <img className="logo-piece piece-left" src={`${base}logo/left.png`} alt="" draggable={false} />
          <img className="logo-piece piece-right" src={`${base}logo/right.png`} alt="" draggable={false} />
          <img className="logo-piece piece-star" src={`${base}logo/star.png`} alt="" draggable={false} />
        </div>
        {label && <p className="logo-loader-label mt-8 text-center text-sm text-dim">{label}</p>}
      </div>
    </div>
  )
}
