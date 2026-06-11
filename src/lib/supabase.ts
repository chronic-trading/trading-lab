import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  console.warn('[Trading Lab] Supabase env vars not set — running in local-only mode')
}

// createClient throws on empty strings, which white-screens the app when env
// vars are absent — fall back to a placeholder so local-only mode can boot.
// All sync helpers already guard on `url`, so nothing ever calls this host.
export const supabase = createClient(url || 'https://local-only.invalid', key || 'local-only')

// ── Helpers used by hooks ─────────────────────────────────────────────────────

/** Upsert a single field on the user_data row */
export async function syncUserDataField(field: string, value: unknown, userId: string | null) {
  if (!userId || !url) return
  await supabase
    .from('user_data')
    .upsert({ user_id: userId, [field]: value }, { onConflict: 'user_id' })
}
