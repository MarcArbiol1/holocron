import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { profileFacts } from '../engine/profile'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Page } from '../components/ui'
import { Confirm } from '../components/Confirm'
import { haptic } from '../lib/haptics'
import { updateApp } from '../lib/update'
import { PROGRAM_VERSION } from '../engine/program'

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => { haptic(); onChange(!checked) }}
      className="flex w-full items-center justify-between py-1 text-left"
    >
      <span className="text-sm text-ice/90">{label}</span>
      <span
        className="relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300"
        style={{ background: checked ? 'var(--glow)' : 'color-mix(in oklab, var(--ice) 12%, transparent)' }}
      >
        <span className="absolute top-0.5 size-6 rounded-full bg-ice shadow transition-transform duration-300 ease-spring" style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }} />
      </span>
    </button>
  )
}

export default function Settings() {
  const nav = useNavigate()
  const profile = useStore((s) => s.profile)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const reset = useStore((s) => s.reset)
  const [imp, setImp] = useState('')
  const [msg, setMsg] = useState('')
  const [updating, setUpdating] = useState(false)
  const [askErase, setAskErase] = useState(false)

  const update = async () => {
    haptic()
    setUpdating(true)
    setMsg('Checking for a new build...')
    const r = await updateApp()
    setUpdating(false)
    setMsg(r === 'updated' ? 'New build found, reloading.' : r === 'current' ? `Already on the latest build (${__BUILD__}).` : 'Updates are handled by the browser here; reload the page.')
  }

  const copy = async () => {
    haptic()
    const json = exportData()
    try { await navigator.clipboard.writeText(json); setMsg('Backup copied to the clipboard. Paste it somewhere safe (Notes, a file).') } catch { setMsg('Could not access the clipboard. Select the text below and copy it.'); setImp(json) }
  }
  return (
    <Page title={NAMES.pages.settings} kicker="Profile, session, backup" back>
      {profile && (
        <section className="aether-rise rise-1" aria-labelledby="profile-title">
          <div className="flex items-center justify-between">
            <h2 id="profile-title" className="text-lg font-semibold">Profile</h2>
            <Link to="/onboarding" onClick={() => haptic()} className="text-sm font-semibold text-glow">Edit</Link>
          </div>
          <div className="metric-panel mt-3 space-y-2 p-4 text-sm">
            <p className="text-dim">{profile.name || 'No name'} · {profile.age} · {profile.heightCm} cm · {profile.weightKg} kg</p>
            <ul className="space-y-1.5 text-ice/90">
              {profileFacts(profile).map((f) => <li key={f} className="flex gap-2 leading-relaxed"><span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-glow/80" /><span>{f}</span></li>)}
            </ul>
          </div>
        </section>
      )}

      <section className="aether-rise rise-2" aria-labelledby="session-title">
        <h2 id="session-title" className="text-lg font-semibold">Session</h2>
        <div className="metric-panel mt-3 space-y-2 p-4">
          <Toggle label="Rest timer after each set" checked={settings.restTimer} onChange={(v) => setSettings({ restTimer: v })} />
          <Toggle label="Beep when rest ends" checked={settings.sound} onChange={(v) => setSettings({ sound: v })} />
          <Toggle label="Lock screen / Dynamic Island timer (beta)" checked={settings.liveTimer} onChange={(v) => setSettings({ liveTimer: v })} />
          <p className="text-[11px] leading-relaxed text-dim">Shows the rest countdown as a Now Playing card on the lock screen and in the Dynamic Island, and lets the end-of-rest beep sound with the screen off. It plays silent audio during rests, so your music will pause. Web apps cannot make real Live Activities; iOS 26 sometimes mutes web-app audio after switching apps, hence beta.</p>
        </div>
      </section>

      <section className="aether-rise rise-3" aria-labelledby="backup-title">
        <h2 id="backup-title" className="text-lg font-semibold">Backup</h2>
        <div className="metric-panel mt-3 space-y-3 p-4 text-sm">
          <p className="text-dim">Everything lives on this phone. Copy a backup now and then; paste it back here to restore.</p>
          <button className="btn-ghost w-full" onClick={copy}>Copy backup to clipboard</button>
          <textarea className="input h-28 font-mono text-xs" placeholder="Paste a backup here to restore" value={imp} onChange={(e) => setImp(e.target.value)} />
          <button className="btn-ghost w-full" disabled={!imp.trim()} onClick={() => { haptic(); try { importData(imp); setMsg('Restored.'); setImp(''); nav('/') } catch (e) { setMsg(`Could not restore: ${(e as Error).message}`) } }}>Restore from pasted backup</button>
          {msg && <p className="text-xs text-glow">{msg}</p>}
        </div>
      </section>

      <section className="aether-rise rise-4" aria-labelledby="app-title">
        <h2 id="app-title" className="text-lg font-semibold">App</h2>
        <div className="metric-panel mt-3 space-y-3 p-4 text-sm">
          <p className="text-dim">Build {__BUILD__} · plan rules v{PROGRAM_VERSION}</p>
          <button className="btn-ghost w-full" disabled={updating} onClick={update}>Update now</button>
        </div>
      </section>

      <section className="aether-rise rise-4" aria-labelledby="danger-title">
        <h2 id="danger-title" className="text-lg font-semibold">Danger</h2>
        <button className="btn-danger mt-3 w-full" onClick={() => { haptic('warning'); setAskErase(true) }}>Erase everything</button>
      </section>
      {askErase && <Confirm title="Erase everything?" body="Profile, plan and every session on this phone are deleted. Copy a backup first if you want them back." confirmLabel="Erase" danger onConfirm={() => { reset(); nav('/onboarding', { replace: true }) }} onCancel={() => setAskErase(false)} />}

      <p className="aether-rise rise-5 px-1 text-[11px] leading-relaxed text-dim">
        {NAMES.app} is a hobby project and not medical advice. Names of pages and levels are nods to films and books; no affiliation. All exercise animations are drawn by the app itself. The science behind every rule is listed in the repo (docs/EVIDENCE.md), and in the app under <Link to="/codex" className="text-glow">The Codex</Link>.
      </p>
    </Page>
  )
}
