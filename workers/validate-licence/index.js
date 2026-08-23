/**
 * Licence validation — Cloudflare Worker.
 *
 * A faithful port of supabase/functions/validate-whop/index.ts. Same checks,
 * same responses, same refusals. Only the runtime differs: Deno.serve becomes
 * a fetch handler and Deno.env.get becomes `env`. Everything else here is
 * standard Web API and behaves identically on both platforms.
 *
 * WHY THE MOVE. This endpoint is the one call standing between a stranger and a
 * paid product, and it was living on a free-tier Supabase project that paused
 * twice in a month and was then deleted outright — DNS and all. Licence checks
 * do not need a database, an auth service, or a schema; they need one function
 * that can reach Whop. Cloudflare's free tier does not pause and has nothing to
 * restore, so the failure mode that broke activation three times cannot happen.
 *
 * DELIBERATELY NOT CHANGED IN THIS PORT:
 *   - CORS stays '*' rather than an origin allowlist. Tightening it is worth
 *     doing, but changing the platform and the access rules together means a
 *     failure could be either, and this is the path customers activate through.
 *   - The Whop lookup still uses GET /memberships/{key}. That detail matters:
 *     an earlier version passed the key as a `license_key` query filter to the
 *     retired v2 API, which silently ignored the filter and returned the
 *     account's FIRST membership — so every non-empty string validated. The
 *     returned-key comparison below exists because of that bug.
 *
 * SECRETS (set in the Cloudflare dashboard, never in this file — the repo is public):
 *   WHOP_API_KEY      required. Needs the member:basic:read permission.
 *   TEST_LICENSE_KEY  optional. Unset means no bypass exists at all.
 */

// Whop's lifecycle is: active, trialing, past_due, canceled, expired, completed.
// A one-time purchase lands on `completed`; subscriptions on `active`.
const ENTITLED = new Set(['active', 'trialing', 'completed'])

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: CORS })

const norm = (value) => String(value ?? '').trim().toLowerCase()

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }

    if (request.method !== 'POST') {
      return json({ valid: false, error: 'Method not allowed' }, 405)
    }

    let key
    try {
      const body = await request.json()
      key = String(body.key ?? '').trim()
    } catch {
      return json({ valid: false, error: 'Invalid request body' }, 400)
    }

    if (!key) {
      return json({ valid: false, error: 'No license key provided' }, 400)
    }

    // Guard on the secret itself, not just the comparison: if TEST_LICENSE_KEY
    // is unset this must be unreachable rather than depend on `key` never being
    // undefined. A bypass that fails open is worse than no bypass.
    if (env.TEST_LICENSE_KEY && key === env.TEST_LICENSE_KEY) {
      return json({ valid: true, status: 'active' })
    }

    // Without a key we cannot check anything, so refuse rather than guess.
    if (!env.WHOP_API_KEY) {
      console.error('WHOP_API_KEY is not set — refusing to validate license keys.')
      return json({ valid: false, error: 'Licensing is temporarily unavailable' }, 503)
    }

    try {
      const res = await fetch(
        `https://api.whop.com/api/v1/memberships/${encodeURIComponent(key)}`,
        { headers: { Authorization: `Bearer ${env.WHOP_API_KEY}`, Accept: 'application/json' } },
      )

      if (res.status === 404) {
        return json({ valid: false, error: 'License key not found or invalid' })
      }

      // 401/403 means OUR key is wrong or under-scoped, not that the customer
      // did anything wrong. Retrying will never help them, so say so honestly
      // and make the real cause loud in the logs.
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
      // This comparison is what closed the original fail-open.
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
  },
}
