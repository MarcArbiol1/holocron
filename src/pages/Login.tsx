import { useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { NAMES } from '../theme/names'
import { useStore } from '../store/store'
import { cloudEnabled, sendMagicLink, signInWithEmail, signInWithGitHub, signOut, signUpWithEmail } from '../lib/cloud'
import { LogoLoader, LogoMark } from '../components/LogoLoader'
import { HapticSwitch, haptic } from '../lib/haptics'
import { Segment } from '../components/ui'

/** The GitHub mark (used only to label the GitHub sign-in, as GitHub's brand guidelines allow). */
const GitHubMark = () => (
  <svg viewBox="0 0 16 16" className="size-5" fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

/** Sign in with GitHub or email so progress follows the account; or keep everything on this phone. */
export default function Login() {
  const nav = useNavigate()
  const account = useStore((s) => s.account)
  const cloud = useStore((s) => s.cloud)
  const profile = useStore((s) => s.profile)
  const setLoginSkipped = useStore((s) => s.setLoginSkipped)
  const [mode, setMode] = useState<'in' | 'up'>('in')
  // The fields are uncontrolled on purpose. iOS Password AutoFill (the key bar above the keyboard) writes
  // the values straight into the inputs; a React-controlled input does not see that write and resets the
  // field to its own empty state on the next render, so the fill vanished. The DOM holds the values and
  // they are read from it when needed; the state copies only drive the button's enabled look.
  const emailRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const readFields = () => {
    const e = emailRef.current?.value.trim() ?? ''
    const p = passRef.current?.value ?? ''
    setEmail(e); setPassword(p)
    return { e, p }
  }
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const after = () => nav(profile ? '/' : '/onboarding', { replace: true })
  const skip = () => { haptic(); setLoginSkipped(true); after() }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { e: mail, p: pass } = readFields()
    if (!mail) { setMsg('Type your email first.'); return }
    if (mode === 'in' && !pass) { setMsg('Type your password, or use the sign-in link below.'); return }
    if (mode === 'up' && pass.length < 8) { setMsg('Choose a password of 8 characters or more.'); return }
    haptic()
    setBusy(true); setMsg('')
    const err = mode === 'in' ? await signInWithEmail(mail, pass) : await signUpWithEmail(mail, pass)
    setBusy(false)
    if (err === 'CHECK_EMAIL') setMsg('Account created. Open the confirmation mail we just sent, then come back and sign in.')
    else if (err) setMsg(err)
    else after()
  }
  const magic = async () => {
    const { e: mail } = readFields()
    if (!mail) { setMsg('Type your email first.'); return }
    haptic(); setBusy(true); setMsg('')
    const err = await sendMagicLink(mail)
    setBusy(false)
    setMsg(err ?? 'Link sent. Open it on this phone, in the same browser, and you are in.')
  }

  if (cloud.status === 'syncing') return <LogoLoader label="Fetching your archive" />
  if (account && profile) return <Navigate to="/" replace />

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-night text-ice">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-6 pb-12 pt-[max(3rem,env(safe-area-inset-top))]">
        <div className="aether-rise flex flex-col items-center text-center">
          <LogoMark size={128} className="logo-float" />
          <h1 className="mt-6 text-[32px] font-bold leading-none">{NAMES.app}</h1>
          <p className="mt-2 text-sm text-dim">{NAMES.tagline}</p>
        </div>

        {account ? (
          <div className="aether-rise rise-2 metric-panel mt-10 space-y-3 p-4 text-sm">
            <p>Signed in as <span className="font-semibold text-ice">{account.email ?? account.provider ?? 'your account'}</span>.</p>
            <button className="btn-primary w-full" onClick={after}>Continue</button>
            <button className="btn-ghost w-full" onClick={async () => { haptic(); await signOut() }}>Sign out</button>
          </div>
        ) : cloudEnabled ? (
          <>
            <div className="aether-rise rise-2 mt-10 space-y-3">
              <p className="text-center text-sm text-dim">Sign in and your plan, sessions and records follow your account onto any phone.</p>
              <button className="btn-ghost relative w-full" disabled={busy} onClick={async () => { haptic(); setMsg(''); const err = await signInWithGitHub(); if (err) setMsg(err) }}>
                <GitHubMark /> Continue with GitHub<HapticSwitch />
              </button>
            </div>
            <form className="aether-rise rise-3 metric-panel mt-4 space-y-3 p-4" onSubmit={submit}>
              <Segment value={mode} options={[{ v: 'in', label: 'Sign in' }, { v: 'up', label: 'Create account' }]} onChange={(m) => { setMode(m); setMsg('') }} />
              {/* autoComplete="username" (not "email") is what pairs this field with the saved password in iCloud Keychain. */}
              <input ref={emailRef} className="input" type="email" name="email" id="login-email" inputMode="email" autoComplete="username" autoCapitalize="off" autoCorrect="off" spellCheck={false} placeholder="Email" defaultValue="" onInput={readFields} onChange={readFields} onBlur={readFields} />
              <input ref={passRef} key={mode} className="input" type="password" name="password" id="login-password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} placeholder={mode === 'in' ? 'Password' : 'Choose a password (8+ characters)'} defaultValue="" onInput={readFields} onChange={readFields} onBlur={readFields} />
              {/* Not disabled on empty fields: an AutoFill that React has not seen yet must still be able to submit. */}
              <button className={`btn-primary w-full ${!busy && (!email || password.length < (mode === 'in' ? 1 : 8)) ? 'opacity-60' : ''}`} type="submit" disabled={busy}>
                <Mail className="size-4" /> {mode === 'in' ? 'Sign in with email' : 'Create account'}
              </button>
              {mode === 'in' && <button type="button" className="w-full text-center text-xs text-glow" disabled={busy} onClick={magic}>Email me a sign-in link instead</button>}
              {msg && <p key={msg} className="swap-in text-xs leading-snug text-sand">{msg}</p>}
            </form>
            <button className="aether-rise rise-4 mt-6 text-center text-sm text-dim" onClick={skip}>Not now, keep everything on this phone</button>
          </>
        ) : (
          <div className="aether-rise rise-2 mt-10 space-y-4">
            <div className="metric-panel p-4 text-sm text-dim">
              Accounts are not switched on in this build, so everything stays on this phone. Settings has a copy-and-paste backup. Turning accounts on is described in docs/ACCOUNTS.md in the repo.
            </div>
            <button className="btn-primary w-full" onClick={skip}>Continue on this phone</button>
          </div>
        )}
      </div>
    </main>
  )
}
