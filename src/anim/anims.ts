/**
 * Every exercise animation, merged from the two batch files.
 * Each is 2+ key poses that the rig interpolates. The form shown is what the
 * app tells the user to copy, so poses are checked visually before shipping.
 */
import type { Anim } from './rig.ts'
import { STRENGTH } from './anims-strength.ts'
import { CONDITIONING } from './anims-conditioning.ts'

export const ANIMS: Record<string, Anim> = { ...STRENGTH, ...CONDITIONING }
export const animIds = Object.keys(ANIMS)
export function getAnim(id: string): Anim | undefined {
  return ANIMS[id]
}
