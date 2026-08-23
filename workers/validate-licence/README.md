# validate-licence

The licence check for Trading Lab. Ported from `supabase/functions/validate-whop`.

## Why it moved

The check is the one call between a stranger and a paid product. It was running
on a free-tier Supabase project that paused twice in a month and was then deleted
outright, DNS included. Each time, activation broke for every customer.

A licence check does not need a database, an auth service or a schema — it needs
one function that can reach Whop. Cloudflare's free tier does not pause and has
nothing to restore.

## Deploy

Dashboard is simplest: **Workers & Pages → Create → paste `index.js` → Deploy.**

Then set the secrets under **Settings → Variables and Secrets**:

| Secret | Required | Notes |
|---|---|---|
| `WHOP_API_KEY` | yes | Needs Whop's `member:basic:read` permission |
| `TEST_LICENSE_KEY` | no | Unset means no bypass exists at all |

Or with the CLI, from this directory: `npx wrangler deploy`.

## Point the app at it

Set `VITE_LICENCE_URL` to the Worker's URL as a repository secret, and the app
uses it in place of the Supabase function.

## Verify it after deploying

A junk key must be rejected. If this returns `"valid":true`, the paywall is open:

```
curl -sS -X POST "https://<worker-url>" \
  -H "Content-Type: application/json" \
  -d '{"key":"junk-not-a-real-key"}'
```

Expected: `{"valid":false,"error":"License key not found or invalid"}`

With `WHOP_API_KEY` unset it returns 503 rather than validating anything — it
refuses instead of failing open. That is deliberate and worth preserving in any
future edit.
