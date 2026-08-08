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

function sessionStorageKey(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (!url) return null
  try {
    const ref = new URL(url).hostname.split('.')[0]
    return ref ? `sb-${ref}-auth-token` : null
  } catch {
    return null
  }
}

function hasStoredSession(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (!url) return false                       // local-only mode: no auth at all
  const key = sessionStorageKey()
  if (!key) return true
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return true
  }
}

/**
 * The user supabase-js persisted, read straight out of storage.
 *
 * Offline this is the only way to know who someone is: the auth server cannot
 * be reached, so the normal path spends AUTH_TIMEOUT_MS failing and then
 * reports signed-out — which drops a paying user onto the landing page while
 * every build, trade and plan they own sits in localStorage on that same
 * device. Reading the stored user lets the app open with their own data.
 *
 * Access-token expiry is deliberately NOT enforced here. Supabase access
 * tokens last an hour and can only be refreshed against the server, so almost
 * any offline session looks expired; refusing on that basis would lock the app
 * whenever it is offline for more than an hour. The moment the device is back
 * online the normal flow runs and an invalid session signs them out then. This
 * only governs whether local data is reachable while offline — it grants no
 * server access, because there is no server to reach.
 */
function readStoredUser(): User | null {
  const key = sessionStorageKey()
  if (!key) return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // supabase-js has stored this both bare and wrapped in `currentSession`.
    const user = parsed?.user ?? parsed?.currentSession?.user ?? null
    return user && typeof user.id === 'string' ? (user as User) : null
  } catch {
    return null
  }
}

// The Supabase client (auth + realtime, ~196KB raw / ~49KB gzip) is loaded
// dynamically AND conditionally. useAuth runs on App's first render, so a static
// import put the whole client on the landing page's critical path — every
// visitor downloaded an auth client to check a session that, for a first-time
// visitor, cannot exist. Now a signed-out visitor pays nothing: the landing is
// a pure marketing page. Returning visitors with a stored token load it as
// before, and LoginScreen imports it directly when someone signs in.
/** The stored user, but only when there is no connection to verify it against. */
function offlineUser(): User | null {
  return navigator.onLine === false ? readStoredUser() : null
}

export function useAuth() {
  // Restored during initialisation rather than in an effect: opening the app
  // offline is a first-render fact, and deriving it here means no extra render
  // and no window where a signed-in user is briefly treated as signed out.
  const [user,    setUser]    = useState<User | null>(offlineUser)
  // Signed-out visitors have nothing to restore, so the app is ready immediately
  // — no spinner while a 49KB client downloads just to report "not logged in".
  const [loading, setLoading] = useState(() => (offlineUser() ? false : hasStoredSession()))
  // Flipped by attach() when the app knows auth is about to matter (the user
  // opened the login screen). Without it, a visitor who arrives signed-out has
  // no onAuthStateChange listener, so a successful sign-in would never
  // propagate and the app would sit on the login screen after a valid key.
  const [attached, setAttached] = useState(false)
  // Drives the offline short-circuit below, and re-runs the real auth flow the
  // moment connectivity returns so a session restored from storage gets
  // properly validated rather than being trusted indefinitely.
  const [online, setOnline] = useState(() => navigator.onLine !== false)

  // Keep the module-level current user id in step with whoever is signed in,
  // including the offline restore above, which sets `user` without going
  // through the auth callbacks that normally do this.
  useEffect(() => { setCurrentUserId(user?.id ?? null) }, [user])

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    if (!attached && !hasStoredSession()) return

    // Offline there is no auth server to validate against, so skip the round
    // trip entirely rather than spending AUTH_TIMEOUT_MS failing and then
    // reporting signed-out — which would drop a paying user onto the landing
    // page while all their data sits in localStorage on that same device. The
    // stored user was already restored during initialisation above. This effect
    // re-runs when `online` flips true, and the session is validated then.
    if (!online) return

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
  }, [attached, online])

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
