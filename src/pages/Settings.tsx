import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { profileFacts } from '../engine/profile'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Page } from '../components/ui'
import { Confirm } from '../components/Confirm'
import { cloudEnabled, signOut } from '../lib/cloud'
import { cancelPendingPush, syncAgain } from '../lib/sync'
import { haptic } from '../lib/haptics'
import { updateApp } from '../lib/update'
import { PROGRAM_VERSION } from '../engine/program'

/** A list row with an iOS switch (HIG Toggles: switches live in list rows). */
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => { haptic(); onChange(!checked) }} className="ios-row justify-between">
      <span className="text-base">{label}</span>
      <span className="ios-switch" data-on={checked}><span /></span>
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
  const account = useStore((s) => s.account)
  const cloud = useStore((s) => s.cloud)

  const update = async () => {
    haptic()
    setUpdating(true)
    setMsg('Checking for a new build...')
    const r = await updateApp()
    setUpdating(false)
    setMsg(r === 'updated' ? 'New build found, reloading.' : r === 'current' ? `Already on the latest build (${__BUILD__}).` : 'Updates are handled by the browser here; reload the page.')
  }

  // Signed in, an erase must not reach the cloud: sign out first (which cancels any pending push),
  // then clear the phone. Otherwise the empty phone would be synced over the account's archive.
  const erase = async () => {
    if (account) { cancelPendingPush(); await signOut(); useStore.getState().setAccount(undefined) }
    reset()
    nav('/onboarding', { replace: true })
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
          <h2 id="profile-title" className="list-header">Profile</h2>
          <div className="ios-list">
            <Link to="/onboarding" onClick={() => haptic()} className="workout-row ios-row">
              <span className="min-w-0 flex-1">
                <span className="block text-base">{profile.name || 'No name'}</span>
                <span className="block text-sm text-dim">{profile.age} · {profile.heightCm} cm · {profile.weightKg} kg</span>
              </span>
              <span className="text-base text-dim">Edit</span>
              <ChevronRight className="size-4 shrink-0 text-[color:var(--faint)]" strokeWidth={2.6} />
            </Link>
            {profileFacts(profile).map((f) => <p key={f} className="px-4 py-2.5 text-sm text-ice/90">{f}</p>)}
          </div>
        </section>
      )}

      <section className="aether-rise rise-2" aria-labelledby="session-title">
        <h2 id="session-title" className="list-header">Session</h2>
        <div className="ios-list">
          <Toggle label="Rest timer after each set" checked={settings.restTimer} onChange={(v) => setSettings({ restTimer: v })} />
          <Toggle label="Beep when rest ends" checked={settings.sound} onChange={(v) => setSettings({ sound: v })} />
          <Toggle label="Lock Screen timer (beta)" checked={settings.liveTimer} onChange={(v) => setSettings({ liveTimer: v })} />
        </div>
        <p className="list-footer">Shows the rest countdown as a Now Playing card on the lock screen and in the Dynamic Island, and lets the end-of-rest beep sound with the screen off. It plays silent audio during rests, so your music will pause. Web apps cannot make real Live Activities; iOS 26 sometimes mutes web-app audio after switching apps, hence beta.</p>
      </section>

      <section className="aether-rise rise-3" aria-labelledby="account-title">
        <h2 id="account-title" className="list-header">Account</h2>
        <div className="metric-panel space-y-3 p-4 text-sm">
          {account ? (
            <>
              <p className="text-dim">Signed in as <span className="font-semibold text-ice">{account.email ?? account.provider}</span>. Your plan, sessions and records are mirrored to the account.</p>
              <p className="text-xs text-dim">{cloud.status === 'syncing' ? 'Syncing...' : cloud.status === 'error' ? `Sync problem: ${cloud.error}` : cloud.lastSyncAt ? `Last synced ${new Date(cloud.lastSyncAt).toLocaleString()}` : 'Not synced yet'}</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-ghost" disabled={cloud.status === 'syncing'} onClick={() => { haptic(); void syncAgain() }}>Sync Now</button>
                <button className="btn-ghost" onClick={async () => { haptic(); await signOut() }}>Sign Out</button>
              </div>
            </>
          ) : cloudEnabled ? (
            <>
              <p className="text-dim">Everything is on this phone only. Sign in with GitHub or email and it follows you onto any phone.</p>
              <button className="btn-ghost w-full" onClick={() => { haptic(); nav('/login') }}>Sign In</button>
            </>
          ) : (
            <p className="text-dim">Accounts are not switched on in this build; everything stays on this phone. Use the backup below to move it.</p>
          )}
        </div>
      </section>

      <section className="aether-rise rise-3" aria-labelledby="backup-title">
        <h2 id="backup-title" className="list-header">Backup</h2>
        <div className="metric-panel space-y-3 p-4 text-sm">
          <p className="text-dim">Everything lives on this phone. Copy a backup now and then; paste it back here to restore.</p>
          <button className="btn-ghost w-full" onClick={copy}>Copy Backup</button>
          <textarea className="input h-28 font-mono text-xs" placeholder="Paste a backup here to restore" value={imp} onChange={(e) => setImp(e.target.value)} />
          <button className="btn-ghost w-full" disabled={!imp.trim()} onClick={() => { haptic(); try { importData(imp); setMsg('Restored.'); setImp(''); nav('/') } catch (e) { setMsg(`Could not restore: ${(e as Error).message}`) } }}>Restore Backup</button>
          {msg && <p key={msg} className="swap-in text-xs text-glow">{msg}</p>}
        </div>
      </section>

      <section className="aether-rise rise-4" aria-labelledby="app-title">
        <h2 id="app-title" className="list-header">App</h2>
        <div className="metric-panel space-y-3 p-4 text-sm">
          <p className="text-dim">Build {__BUILD__} · plan rules v{PROGRAM_VERSION}</p>
          <button className="btn-ghost w-full" disabled={updating} onClick={update}>Update Now</button>
        </div>
      </section>

      <section className="aether-rise rise-4" aria-labelledby="danger-title">
        <h2 id="danger-title" className="list-header">Danger</h2>
        <button className="btn-danger w-full" onClick={() => { haptic('warning'); setAskErase(true) }}>Erase Everything</button>
      </section>
      {askErase && <Confirm title="Erase everything?" body={account ? 'Profile, plan and every session on this phone are deleted, and you are signed out. Your account keeps its copy: sign in again to get it back.' : 'Profile, plan and every session on this phone are deleted. Copy a backup first if you want them back.'} confirmLabel="Erase Everything" danger onConfirm={erase} onCancel={() => setAskErase(false)} />}

      <p className="aether-rise rise-5 px-1 text-caption2 leading-relaxed text-dim">
        {NAMES.app} is a hobby project and not medical advice. Names of pages and levels are nods to films and books; no affiliation. All exercise animations are drawn by the app itself. The science behind every rule is listed in the repo (docs/EVIDENCE.md), and in the app under <Link to="/codex" className="text-glow">The Codex</Link>.
      </p>
    </Page>
  )
}
