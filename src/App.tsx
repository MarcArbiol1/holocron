import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './store/store'
import { BottomNav } from './components/ui'
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

function Shell() {
  const profile = useStore((s) => s.profile)
  const loc = useLocation()
  const hideNav = ['/onboarding', '/forge', '/done'].includes(loc.pathname)
  if (!profile && loc.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  return (
    <>
      <Routes>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <BottomNav />}
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
