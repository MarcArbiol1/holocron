/**
 * Front and back body map. Each muscle region is coloured by how much of its
 * weekly target it has received (0 = grey, 1+ = full colour).
 */
import { GROUP_COLOR, MUSCLES, type Muscle } from '../data/muscles'

type Region = { m: Muscle; el: 'ellipse' | 'rect' | 'path'; a: number[] | string }

const FRONT: Region[] = [
  { m: 'frontDelts', el: 'ellipse', a: [34, 50, 8, 7] }, { m: 'frontDelts', el: 'ellipse', a: [86, 50, 8, 7] },
  { m: 'sideDelts', el: 'ellipse', a: [26, 54, 4, 8] }, { m: 'sideDelts', el: 'ellipse', a: [94, 54, 4, 8] },
  { m: 'chest', el: 'ellipse', a: [48, 60, 12, 9] }, { m: 'chest', el: 'ellipse', a: [72, 60, 12, 9] },
  { m: 'biceps', el: 'ellipse', a: [29, 78, 6, 13] }, { m: 'biceps', el: 'ellipse', a: [91, 78, 6, 13] },
  { m: 'forearms', el: 'ellipse', a: [25, 106, 5, 14] }, { m: 'forearms', el: 'ellipse', a: [95, 106, 5, 14] },
  { m: 'abs', el: 'rect', a: [50, 70, 20, 36, 5] },
  { m: 'obliques', el: 'rect', a: [42, 78, 6, 26, 3] }, { m: 'obliques', el: 'rect', a: [72, 78, 6, 26, 3] },
  { m: 'hipFlexors', el: 'ellipse', a: [50, 112, 6, 5] }, { m: 'hipFlexors', el: 'ellipse', a: [70, 112, 6, 5] },
  { m: 'quads', el: 'ellipse', a: [48, 146, 9, 27] }, { m: 'quads', el: 'ellipse', a: [72, 146, 9, 27] },
  { m: 'calves', el: 'ellipse', a: [47, 196, 5, 14] }, { m: 'calves', el: 'ellipse', a: [73, 196, 5, 14] },
]
const BACK: Region[] = [
  { m: 'upperBack', el: 'path', a: 'M60 42 L78 50 L72 72 L48 72 L42 50 Z' },
  { m: 'rearDelts', el: 'ellipse', a: [34, 50, 8, 7] }, { m: 'rearDelts', el: 'ellipse', a: [86, 50, 8, 7] },
  { m: 'lats', el: 'path', a: 'M46 66 L58 74 L58 96 L44 88 Z' }, { m: 'lats', el: 'path', a: 'M74 66 L62 74 L62 96 L76 88 Z' },
  { m: 'triceps', el: 'ellipse', a: [29, 78, 6, 13] }, { m: 'triceps', el: 'ellipse', a: [91, 78, 6, 13] },
  { m: 'forearms', el: 'ellipse', a: [25, 106, 5, 14] }, { m: 'forearms', el: 'ellipse', a: [95, 106, 5, 14] },
  { m: 'lowerBack', el: 'rect', a: [51, 92, 18, 16, 4] },
  { m: 'glutes', el: 'ellipse', a: [50, 118, 10, 9] }, { m: 'glutes', el: 'ellipse', a: [70, 118, 10, 9] },
  { m: 'hamstrings', el: 'ellipse', a: [48, 152, 8, 24] }, { m: 'hamstrings', el: 'ellipse', a: [72, 152, 8, 24] },
  { m: 'calves', el: 'ellipse', a: [47, 196, 6, 15] }, { m: 'calves', el: 'ellipse', a: [73, 196, 6, 15] },
]

function Body({ regions, level, onPick }: { regions: Region[]; level: (m: Muscle) => number; onPick?: (m: Muscle) => void }) {
  return (
    <svg viewBox="0 0 120 220" className="w-full h-auto">
      {/* silhouette */}
      <g fill="#232735">
        <circle cx={60} cy={18} r={12} />
        <rect x={54} y={28} width={12} height={10} />
        <path d="M30 42 Q60 34 90 42 L96 120 L84 122 L80 78 L76 110 L76 220 L64 220 L62 130 L58 130 L56 220 L44 220 L44 110 L40 78 L36 122 L24 120 Z" />
      </g>
      {regions.map((r, i) => {
        const v = Math.min(1, level(r.m))
        const color = GROUP_COLOR[MUSCLES[r.m].group]
        const fill = v <= 0 ? '#2f3446' : color
        const opacity = v <= 0 ? 1 : 0.35 + 0.65 * v
        const common = { fill, opacity, stroke: '#0b0c10', strokeWidth: 0.6, onClick: () => onPick?.(r.m), style: { cursor: onPick ? 'pointer' : 'default' } }
        if (r.el === 'ellipse') { const [cx, cy, rx, ry] = r.a as number[]; return <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} {...common} /> }
        if (r.el === 'rect') { const [x, y, w, h, rx] = r.a as number[]; return <rect key={i} x={x} y={y} width={w} height={h} rx={rx} {...common} /> }
        return <path key={i} d={r.a as string} {...common} />
      })}
    </svg>
  )
}

export function MuscleMap({ levels, onPick }: { levels: Partial<Record<Muscle, number>>; onPick?: (m: Muscle) => void }) {
  const level = (m: Muscle) => levels[m] ?? 0
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Body regions={FRONT} level={level} onPick={onPick} />
        <p className="text-center text-[11px] text-slate-500 mt-1">front</p>
      </div>
      <div>
        <Body regions={BACK} level={level} onPick={onPick} />
        <p className="text-center text-[11px] text-slate-500 mt-1">back</p>
      </div>
    </div>
  )
}
