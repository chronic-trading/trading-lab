import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { setCurrentUserId } from '../lib/currentUser'

/**
 * Is there a persisted Supabase session in this browser?
 *
 * supabase-js stores its session under `sb-<project-ref>-auth-token`, derived
 * from the project URL. Reading that key directly lets a signed-out visitor
 * skip the client entirely — see the note in useAuth.
 *
 * Deliberately conservative: any doubt (no configured URL, unparseable URL,
 * storage unavailable in private mode) returns true, so we load the client and
 * let it decide. A false negative would strand a logged-in user on the landing
 * page; a false positive only costs the download we were making anyway.
 */
/** How long to wait for the auth server before falling through to signed-out. */
const AUTH_TIMEOUT_MS = 8000

function hasStoredSession(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (!url) return false                       // local-only mode: no auth at all
  try {
    const ref = new URL(url).hostname.split('.')[0]
    if (!ref) return true
    return localStorage.getItem(`sb-${ref}-auth-token`) !== null
  } catch {
    return true
  }
}

// The Supabase client (auth + realtime, ~196KB raw / ~49KB gzip) is loaded
// dynamically AND conditionally. useAuth runs on App's first render, so a static
// import put the whole client on the landing page's critical path — every
// visitor downloaded an auth client to check a session that, for a first-time
// visitor, cannot exist. Now a signed-out visitor pays nothing: the landing is
// a pure marketing page. Returning visitors with a stored token load it as
// before, and LoginScreen imports it directly when someone signs in.
export function useAuth() {
  const [user,    setUser]    = useState<User | null>(null)
  // Signed-out visitors have nothing to restore, so the app is ready immediately
  // — no spinner while a 49KB client downloads just to report "not logged in".
  const [loading, setLoading] = useState(() => hasStoredSession())
  // Flipped by attach() when the app knows auth is about to matter (the user
  // opened the login screen). Without it, a visitor who arrives signed-out has
  // no onAuthStateChange listener, so a successful sign-in would never
  // propagate and the app would sit on the login screen after a valid key.
  const [attached, setAttached] = useState(false)

  useEffect(() => {
    if (!attached && !hasStoredSession()) return

    let cancelled = false
    let unsubscribe: (() => void) | undefined

    import('../lib/supabase').then(({ supabase }) => {
      // The effect can be torn down (StrictMode double-mount, fast navigation)
      // while this import is still in flight — don't set state or subscribe then.
      if (cancelled) return

      // getSession() can reject or hang: restoring a stored session makes gotrue
      // refresh the token against the auth server, and if that server is
      // unreachable — a paused free-tier project, an offline user — it retries
      // and fails. Without the catch/finally below, setLoading(false) never ran
      // and the app sat on its spinner forever, which meant a licensed user
      // could not even reach the login screen to re-enter their key. The race
      // covers the hang case, where the promise simply never settles.
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('auth timeout')), AUTH_TIMEOUT_MS))

      Promise.race([supabase.auth.getSession(), timeout])
        .then(({ data }) => {
          if (cancelled) return
          const u = data.session?.user ?? null
          setUser(u)
          setCurrentUserId(u?.id ?? null)
        })
        .catch(() => {
          // Treat an unreachable auth server as signed out rather than fatal.
          // The stored session is left alone: it may well be valid, and a later
          // onAuthStateChange can still restore it once the server responds.
          if (!cancelled) setCurrentUserId(null)
        })
        .finally(() => { if (!cancelled) setLoading(false) })

      const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
        const u = session?.user ?? null
        setUser(u)
        setCurrentUserId(u?.id ?? null)
      })
      unsubscribe = () => listener.subscription.unsubscribe()
    }).catch(() => {
      // Never leave the app stuck on the loading spinner if the chunk fails.
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true; unsubscribe?.() }
  }, [attached])

  const signOut = async () => {
    const { supabase } = await import('../lib/supabase')
    await supabase.auth.signOut()
    setCurrentUserId(null)
  }

  /**
   * Start listening for auth changes, loading the Supabase client if it was
   * skipped. Call this the moment sign-in becomes possible (opening the login
   * screen) so the session listener is live before any credentials are
   * submitted. Idempotent — the effect only re-runs on the false→true edge.
   */
  const attach = () => setAttached(true)

  return { user, loading, signOut, attach }
}
