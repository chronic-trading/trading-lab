import { useState, useEffect } from 'react'
import { FlaskConical, Check, ArrowRight, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'

const WHOP_BUY_URL = import.meta.env.VITE_WHOP_BUY_URL as string | undefined

// Each Whop license key maps to one Supabase account.
// We synthesise an email so Supabase can manage the session.
// License keys are case/format-insensitive: canonicalise once so the same key
// typed in any case (or with/without dashes) maps to the same account AND the
// same password. (Previously the email was canonical but the password kept the
// raw case, so a differently-cased key hit the same email with a wrong password
// → sign-in failed → sign-up failed "user already registered".)
function canonicalKey(key: string) {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}
function keyToEmail(key: string) {
  return `${canonicalKey(key)}@license.tradinglab.app`
}

async function validateWhopKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://hgvktmjqegywjrwbkipv.supabase.co/functions/v1/validate-whop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    const data = await res.json()
    return { valid: data.valid, error: data.error }
  } catch {
    return { valid: false, error: 'Could not reach the server — check your connection' }
  }
}

async function signInWithKey(key: string): Promise<string | null> {
  const email    = keyToEmail(key)
  const password = canonicalKey(key)

  // Try sign-in first (returning user)
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
  if (!signInErr) return null

  // Account doesn't exist yet — create it
  const { error: signUpErr } = await supabase.auth.signUp({ email, password })
  if (signUpErr) return signUpErr.message

  // Sign in after creating
  const { error: finalErr } = await supabase.auth.signInWithPassword({ email, password })
  return finalErr?.message ?? null
}

export function LoginScreen({ onBack }: { onBack?: () => void }) {
  // Auto-fill key from URL param — Whop can pass ?key=C-XXXXX in the redirect URL
  const urlKey = new URLSearchParams(window.location.search).get('key') ?? ''
  const [key,     setKey]     = useState(urlKey)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  // Login screen is designed dark — lock it, restore the app theme on exit.
  useEffect(() => {
    const html = document.documentElement
    const prev = html.getAttribute('data-theme') ?? 'light'
    html.setAttribute('data-theme', 'dark')
    return () => html.setAttribute('data-theme', prev)
  }, [])

  const activate = async () => {
    const trimmed = key.trim()
    if (!trimmed) { setError('Paste your Whop license key'); return }

    setLoading(true); setError('')

    // 1. Validate with Whop
    const { valid, error: whopErr } = await validateWhopKey(trimmed)
    if (!valid) {
      setLoading(false)
      setError(whopErr ?? 'That key is not active. Check it and try again.')
      return
    }

    // 2. Sign into Supabase
    const authErr = await signInWithKey(trimmed)
    if (authErr) {
      setLoading(false)
      setError(`Auth error: ${authErr}`)
      return
    }

    setDone(true)
    // App.tsx will detect the new Supabase session and re-render automatically
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#05050a] px-5 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.05)_0%,_transparent_65%)]" />

      {onBack && (
        <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-1.5 text-[12px] text-slate-600 hover:text-slate-300 transition-colors">
          ← Back
        </button>
      )}

      <div className="relative w-full max-w-[360px] flex flex-col gap-7 text-center">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/8 border border-amber-500/30 flex items-center justify-center shadow-2xl shadow-amber-500/15">
            <FlaskConical size={30} className="text-amber-400" />
          </div>
          <div className="space-y-1">
            <p className="text-[22px] font-black tracking-widest text-slate-100 leading-none">TRADING LAB</p>
            <p className="text-[11px] font-semibold text-slate-600 tracking-[0.22em]">ICT · SMC · FUTURES</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0c0c15] border border-slate-800/60 rounded-2xl p-6 shadow-2xl text-left">
          {!done ? (
            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-[18px] font-bold text-white">Activate your copy</p>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Find your key on Whop: <span className="text-slate-400">My Purchases → ICT/SMC Trading Lab → License Key</span>. It starts with <span className="text-amber-400 font-mono">C-</span>
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={key}
                  onChange={e => { setKey(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && activate()}
                  placeholder="C-XXXXXX-XXXXXXXX-XXXXXXXX"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  data-form-type="other"
                  className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-3.5 text-[16px] text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors tracking-wide"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />

                {error && (
                  <p className="text-[12px] text-red-400 leading-relaxed pl-1">{error}</p>
                )}

                <button
                  onClick={activate}
                  disabled={loading || !key.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[13px] font-semibold hover:bg-amber-500/22 hover:border-amber-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                    : <><ArrowRight size={14} /> Activate</>
                  }
                </button>
              </div>

              {/* Buy link */}
              {WHOP_BUY_URL && (
                <div className="text-center border-t border-slate-800/50 pt-4 mt-1">
                  <p className="text-[12px] text-slate-600 mb-2">Don't have a license?</p>
                  <a
                    href={WHOP_BUY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Get access on Whop <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto">
                <Check size={22} className="text-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <p className="text-[16px] font-bold text-white">You're in</p>
                <p className="text-[13px] text-slate-500">Loading your data…</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-700 leading-relaxed px-2">
          Your builds, journal, and mastery progress sync across devices automatically.
        </p>
      </div>
    </div>
  )
}
