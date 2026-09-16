import { useMemo } from 'react'
import { useStore } from './store'
import { recommend } from '../engine/recommend'

/** Today's recommendation, recomputed when sessions change. */
export function useRecommendation() {
  const profile = useStore((s) => s.profile)
  const program = useStore((s) => s.program)
  const sessions = useStore((s) => s.sessions)
  return useMemo(() => (profile && program ? recommend(profile, program, sessions) : undefined), [profile, program, sessions])
}
