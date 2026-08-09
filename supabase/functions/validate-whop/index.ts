import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// Set in the Supabase dashboard under Edge Functions -> Secrets.
// Never inline this value: the repo is public.
const WHOP_API_KEY = Deno.env.get('WHOP_API_KEY')

// Lets us open the live site without a real purchase.
//
// No fallback, deliberately. This repo is public, so a hardcoded default is a
// published skeleton key to a paid product — anyone reading this file could
// unlock it, forever, and the value would still work after the code changed
// because the deployed function keeps whatever it was last given. With no
// default, the bypass exists only while TEST_LICENSE_KEY is explicitly set in
// the dashboard, and clearing that secret revokes it instantly.
const TEST_LICENSE_KEY = Deno.env.get('TEST_LICENSE_KEY')

// Statuses meaning the customer has paid and should have access. Whop's
// lifecycle is: active, trialing, past_due, canceled, expired, completed.
// A one-time purchase lands on `completed`; subscriptions on `active`.
const ENTITLED = new Set(['active', 'trialing', 'completed'])

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: CORS })

const norm = (value: unknown) => String(value ?? '').trim().toLowerCase()

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }

  if (req.method !== 'POST') {
    return json({ valid: false, error: 'Method not allowed' }, 405)
  }

  let key: string
  try {
    const body = await req.json()
    key = String(body.key ?? '').trim()
  } catch {
    return json({ valid: false, error: 'Invalid request body' }, 400)
  }

  if (!key) {
    return json({ valid: false, error: 'No license key provided' }, 400)
  }

  // Guard on the secret itself, not just the comparison: if TEST_LICENSE_KEY is
  // ever unset this must be unreachable rather than depend on `key` never being
  // undefined. A bypass that fails open is worse than no bypass.
  if (TEST_LICENSE_KEY && key === TEST_LICENSE_KEY) {
    return json({ valid: true, status: 'active' })
  }

  // Without a key we cannot check anything, so refuse rather than guess.
  if (!WHOP_API_KEY) {
    console.error('WHOP_API_KEY is not set — refusing to validate license keys.')
    return json({ valid: false, error: 'Licensing is temporarily unavailable' }, 503)
  }

  try {
    // GET /memberships/{id} accepts a membership id *or* a license key, and
    // the value travels in the path, so an unknown key 404s. The previous
    // version passed it as a `license_key` query filter to the retired v2
    // API, which does not support that filter: it dropped the parameter and
    // returned the account's first membership, so every non-empty string
    // validated as a paid user. Requires the `member:basic:read` permission.
    const res = await fetch(
      `https://api.whop.com/api/v1/memberships/${encodeURIComponent(key)}`,
      { headers: { Authorization: `Bearer ${WHOP_API_KEY}`, Accept: 'application/json' } },
    )

    if (res.status === 404) {
      return json({ valid: false, error: 'License key not found or invalid' })
    }

    // 401/403 means our API key is wrong or under-scoped, not that the
    // customer did anything wrong — retrying will never help them, so say
    // so honestly and make the real cause loud in the logs.
    if (res.status === 401 || res.status === 403) {
      console.error(
        `Whop rejected our API key (${res.status}). Check WHOP_API_KEY is set ` +
        `and the key has the member:basic:read permission.`,
      )
      return json({ valid: false, error: 'Licensing is temporarily unavailable' }, 503)
    }

    if (!res.ok) {
      console.error(`Whop membership lookup returned ${res.status}`)
      return json({ valid: false, error: 'Could not reach Whop — try again' }, 502)
    }

    const payload = await res.json().catch(() => null)
    const membership = payload?.data ?? payload
    const returned = norm(membership?.license_key)

    // Filters and positions prove nothing; the key itself must come back.
    if (returned !== '' && returned !== norm(key)) {
      console.error('Whop returned a membership for a different license key')
      return json({ valid: false, error: 'License key not found or invalid' })
    }

    const status = norm(membership?.status)
    if (ENTITLED.has(status)) {
      return json({ valid: true, status })
    }

    return json({ valid: false, error: `License is ${status || 'inactive'}` })
  } catch (err) {
    console.error('Whop validation threw:', err)
    return json({ valid: false, error: 'Could not reach Whop — try again' }, 502)
  }
})
