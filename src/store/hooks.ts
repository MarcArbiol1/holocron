import { useEffect, useMemo, useState } from 'react'
import { useStore } from './store'
import { recommend } from '../engine/recommend'

/** A value that changes on the hour and whenever the app comes back to the foreground. */
function useHourTick() {
  const [tick, setTick] = useState(() => Math.floor(Date.now() / 36e5))
  useEffect(() => {
    const bump = () => setTick(Math.floor(Date.now() / 36e5))
    const onVis = () => { if (document.visibilityState === 'visible') bump() }
    document.addEventListener('visibilitychange', onVis)
    const id = setInterval(bump, 60_000)
    return () => { document.removeEventListener('visibilitychange', onVis); clearInterval(id) }
  }, [])
  return tick
}

/** Today's recommendation, recomputed when sessions change and as time passes (48 h rules, new week). */
export function useRecommendation() {
  const profile = useStore((s) => s.profile)
  const program = useStore((s) => s.program)
  const sessions = useStore((s) => s.sessions)
  const hour = useHourTick()
  return useMemo(() => (profile && program ? recommend(profile, program, sessions) : undefined), [profile, program, sessions, hour]) // eslint-disable-line react-hooks/exhaustive-deps
}
