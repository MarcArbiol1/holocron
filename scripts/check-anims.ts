import { ANIMS } from '../src/anim/anims.ts'
import { EXERCISES } from '../src/data/exercises.ts'
const missing = [...new Set(EXERCISES.map((e) => e.anim))].filter((id) => !ANIMS[id])
console.log(`built ${Object.keys(ANIMS).length}, missing ${missing.length}: ${missing.join(' ')}`)
