import { useCallback, useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { PROGRAM_VERSION } from './engine/program'
import { useStore } from './store/store'
import { LiquidDock } from './components/ui'
import { RestTimer } from './components/RestTimer'
import { keepAwake, stopLive } from './lib/live'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import Forge from './pages/Forge'
import Session from './pages/Session'
import Done from './pages/Done'
import Routines from './pages/Routines'
import Palantir from './pages/Palantir'
import HistoryDetail from './pages/HistoryDetail'
import Library from './pages/Library'
import ExerciseDetail from './pages/ExerciseDetail'
import Order from './pages/Order'
import Settings from './pages/Settings'
import Codex from './pages/Codex'
import Login from './pages/Login'
import { cloudEnabled } from './lib/cloud'
import { startSync } from './lib/sync'

startSync()

/** New pages open at the top; going back keeps the browser's own position. */
function ScrollToTop() {
  const { pathname } = useLocation()
  const type = useNavigationType()
  useEffect(() => { if (type !== 'POP') window.scrollTo({ top: 0 }) }, [pathname, type])
  return null
}

const TABS = ['/', '/routines', '/palantir', '/library', '/order']

/**
 * Which way the new page enters: pages opened from a list slide in from the right, going back slides
 * in from the left, switching tabs cross-fades. Transform/opacity only, 280-340 ms, ease-out.
 */
function useRouteMotion(pathname: string): string {
  const type = useNavigationType()
  // Decided once per pathname change (React's "adjust state while rendering" pattern), so later renders
  // of the same page (store updates, StrictMode) keep the same class.
  const [st, setSt] = useState({ path: pathname, cls: 'route-first' })
  if (st.path !== pathname) {
    // Going home from a page outside the tabs (Done, Settings) reads as a return, not a new page.
    const cls = type === 'POP' || (pathname === '/' && !TABS.includes(st.path)) ? 'route-back'
      : (TABS.includes(pathname) && TABS.includes(st.path)) || type === 'REPLACE' ? 'route-tab'
      : 'route-push'
    setSt({ path: pathname, cls })
    return cls
  }
  return st.cls
}

function Shell() {
  const profile = useStore((s) => s.profile)
  const program = useStore((s) => s.program)
  const setProfile = useStore((s) => s.setProfile)
  const active = useStore((s) => s.active)
  const rest = useStore((s) => s.rest)
  const setRest = useStore((s) => s.setRest)
  const sound = useStore((s) => s.settings.sound)
  const account = useStore((s) => s.account)
  const loginSkipped = useStore((s) => s.loginSkipped)
  const cloudStatus = useStore((s) => s.cloud.status)
  const loc = useLocation()
  const clearRest = useCallback(() => setRest(undefined), [setRest])
  const motion = useRouteMotion(loc.pathname)

  // The staggered entrance plays on the first screen after launch only; afterwards the route
  // transition carries the change and pages appear at once (a replayed stagger on every tab feels slow).
  useEffect(() => {
    const t = setTimeout(() => document.documentElement.classList.add('warm'), 900)
    return () => clearTimeout(t)
  }, [])

  // Rebuild the stored plan whenever the builder's rules have changed since it was saved.
  useEffect(() => {
    if (profile && program?.version !== PROGRAM_VERSION) setProfile(profile)
  }, [profile, program?.version, setProfile])

  // Keep the screen on for the whole workout, whichever page is open; re-request when the app comes back.
  const activeId = active?.id
  useEffect(() => {
    if (!activeId) { keepAwake(false); stopLive(); return }
    keepAwake(true)
    const onVis = () => { if (document.visibilityState === 'visible') keepAwake(true) }
    document.addEventListener('visibilitychange', onVis)
    return () => { document.removeEventListener('visibilitychange', onVis); keepAwake(false) }
  }, [activeId])

  const hideNav = ['/onboarding', '/forge', '/done', '/login'].includes(loc.pathname)
  if (!profile && loc.pathname !== '/onboarding' && loc.pathname !== '/login') {
    // First launch: offer an account (when the build has one) before building a plan; a sign-in
    // that is still fetching the archive stays on the login page until it lands.
    const wantLogin = cloudEnabled && !account && !loginSkipped
    if (wantLogin || cloudStatus === 'syncing') return <Navigate to="/login" replace />
    return <Navigate to="/onboarding" replace />
  }
  return (
    <>
      <ScrollToTop />
      <div key={loc.pathname} className={`route ${motion}`}>
      <Routes location={loc}>
        <Route path="/" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/forge" element={<Forge />} />
        <Route path="/session" element={<Session />} />
        <Route path="/done" element={<Done />} />
        <Route path="/routines" element={<Routines />} />
        <Route path="/palantir" element={<Palantir />} />
        <Route path="/history/:id" element={<HistoryDetail />} />
        <Route path="/library" element={<Library />} />
        <Route path="/exercise/:id" element={<ExerciseDetail />} />
        <Route path="/order" element={<Order />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/codex" element={<Codex />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
      {!hideNav && <LiquidDock />}
      {active && rest && <RestTimer key={rest.endsAt} endsAt={rest.endsAt} startedAt={rest.startedAt} label={rest.label} sound={sound} onDone={clearRest} onSkip={clearRest} />}
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}
