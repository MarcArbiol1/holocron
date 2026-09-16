/**
 * Preview script: renders every animation (or the ids given as args) as a
 * contact sheet of 4 frames each, then rasterises it with macOS qlmanage.
 *
 *   node scripts/render-anims.ts            -> all
 *   node scripts/render-anims.ts backSquat deadlift
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { ANIMS } from '../src/anim/anims.ts'
import { animLength, poseAt, renderShapes, shapesToSvg, VIEW } from '../src/anim/rig.ts'

const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ANIMS)
const FRAMES = 4
const cell = VIEW
// PER_ROW animations side by side (each 4 frames wide) keeps the sheet squarer, which QuickLook renders larger.
const PER_ROW = Number(process.env.PER_ROW ?? 2)
const cols = FRAMES * PER_ROW
const rows = Math.ceil(ids.length / PER_ROW)
const outDir = process.env.OUT ?? 'scratch/anim-preview'
mkdirSync(outDir, { recursive: true })

let inner = ''
ids.forEach((id, n) => {
  const anim = ANIMS[id]
  if (!anim) { console.error('unknown anim', id); return }
  const r = Math.floor(n / PER_ROW)
  const c0 = (n % PER_ROW) * FRAMES
  const L = animLength(anim)
  const half = anim.loop === 'pingpong' ? L / 2 : L
  for (let c = 0; c < FRAMES; c++) {
    const t = (half * c) / (FRAMES - 1)
    const shapes = renderShapes(anim, poseAt(anim, Math.min(t, half - 1)))
    const svg = shapesToSvg(shapes).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')
    inner += `<g transform="translate(${(c0 + c) * cell},${r * cell})">${svg}<text x="4" y="12" fill="#f5b84a" font-size="9" font-family="sans-serif">${id} ${c}</text></g>`
  }
})
// QuickLook rasterises into a square, so pad the sheet to a square to avoid cropping.
const side = Math.max(cols * cell, rows * cell)
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 ${side} ${side}"><rect width="${side}" height="${side}" fill="#07080b"/>${inner}</svg>`
const svgPath = `${outDir}/sheet.svg`
writeFileSync(svgPath, sheet)
execSync(`qlmanage -t -s 2400 -o ${outDir} ${svgPath}`, { stdio: 'ignore' })
console.log(`${outDir}/sheet.svg.png  (${rows} anims)`)
