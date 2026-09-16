import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { profileFacts } from '../engine/profile'
import { useStore } from '../store/store'
import { NAMES } from '../theme/names'
import { Page, Section } from '../components/ui'

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

  const copy = async () => {
    const json = exportData()
    try { await navigator.clipboard.writeText(json); setMsg('Backup copied to the clipboard. Paste it somewhere safe (Notes, a file).') } catch { setMsg('Could not access the clipboard. Select the text below and copy it.'); setImp(json) }
  }
  return (
    <Page title={NAMES.pages.settings} back>
      {profile && (
        <Section title="Profile">
          <div className="card p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">{profile.name || 'No name'} · {profile.age} · {profile.heightCm} cm · {profile.weightKg} kg</span><Link to="/onboarding" className="text-gold-300 font-semibold">Edit</Link></div>
            <ul className="text-slate-300 space-y-1">{profileFacts(profile).map((f) => <li key={f} className="leading-relaxed">• {f}</li>)}</ul>
          </div>
        </Section>
      )}
      <Section title="Session">
        <div className="card p-4 space-y-3 text-sm">
          <label className="flex items-center justify-between"><span>Rest timer after each set</span><input type="checkbox" checked={settings.restTimer} onChange={(e) => setSettings({ restTimer: e.target.checked })} className="h-5 w-5 accent-gold-400" /></label>
          <label className="flex items-center justify-between"><span>Beep when rest ends</span><input type="checkbox" checked={settings.sound} onChange={(e) => setSettings({ sound: e.target.checked })} className="h-5 w-5 accent-gold-400" /></label>
        </div>
      </Section>
      <Section title="Backup">
        <div className="card p-4 space-y-3 text-sm">
          <p className="text-slate-400">Everything lives on this phone. Copy a backup now and then; paste it back here to restore.</p>
          <button className="btn-ghost w-full" onClick={copy}>Copy backup to clipboard</button>
          <textarea className="input font-mono text-xs h-28" placeholder="Paste a backup here to restore" value={imp} onChange={(e) => setImp(e.target.value)} />
          <button className="btn-ghost w-full" disabled={!imp.trim()} onClick={() => { try { importData(imp); setMsg('Restored.'); setImp(''); nav('/') } catch (e) { setMsg(`Could not restore: ${(e as Error).message}`) } }}>Restore from pasted backup</button>
          {msg && <p className="text-xs text-gold-300">{msg}</p>}
        </div>
      </Section>
      <Section title="Danger">
        <button className="btn-danger w-full" onClick={() => { if (confirm('Erase profile and every session on this phone?')) { reset(); nav('/onboarding', { replace: true }) } }}>Erase everything</button>
      </Section>
      <p className="text-[11px] text-slate-500 leading-relaxed px-1">
        {NAMES.app} is a hobby project and not medical advice. Names of pages and levels are nods to films and books; no affiliation. All exercise animations are drawn by the app itself. The science behind every rule is listed in the repo (docs/EVIDENCE.md).
      </p>
    </Page>
  )
}
