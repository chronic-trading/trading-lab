/**
 * Supabase-free entry point for the persistence hooks.
 *
 * The hooks that persist user data (useSettings, useRules, useJournal,
 * useMastery, useNotes, …) are reached from App's very first render, via the
 * modals the shell mounts eagerly. When they imported `./supabase` directly,
 * the ~196KB auth/realtime client landed in the entry chunk and every
 * landing-page visitor downloaded it — including visitors who are not signed
 * in and will never write a row.
 *
 * This module has no static Supabase dependency, so importing it costs nothing.
 * The client is fetched at the moment of an actual write, which by definition
 * only happens for a signed-in user.
 */

/** Upsert a single field on the user_data row. No-ops when signed out. */
export async function syncUserDataField(field: string, value: unknown, userId: string | null) {
  if (!userId) return
  const { syncUserDataField: sync } = await import('./supabase')
  return sync(field, value, userId)
}
