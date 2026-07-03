/**
 * dataSync.ts
 * Called once after login. Pulls the user's data from Supabase and writes
 * it into localStorage so all existing hooks pick it up on next render.
 * If the user has no Supabase data yet (first login), we upload whatever
 * is already in localStorage — seamless migration.
 */

import { supabase } from './supabase'

const LS = {
  builds:       'trading-lab-builds',
  journal:      'trading-lab-journal',
  plans:        'trading-lab-plans',
  mastery:      'trading-lab-mastery',
  review:       'trading-lab-review',
  notes:        'trading-lab-concept-notes',
  rules:        'trading-lab-rules',
  settings:     'tl:settings',
  bookmarks:    'tl:bookmarks',
  keyLevels:    'tl:keylevels',
  sessionNotes: 'trading-lab-session-notes',
}

function ls(key: string) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null }
}

export async function syncOnLogin(userId: string): Promise<void> {
  const [{ data: ud }, { data: builds }, { data: journal }, { data: plans }] =
    await Promise.all([
      supabase.from('user_data').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('builds').select('*').eq('user_id', userId),
      supabase.from('journal_entries').select('*').eq('user_id', userId),
      supabase.from('plans').select('*').eq('user_id', userId),
    ])

  const hasRemoteData = !!(ud || (builds && builds.length > 0) || (journal && journal.length > 0))

  if (hasRemoteData) {
    // ── Remote wins: write Supabase data into localStorage ────────────────────
    if (ud) {
      if (ud.mastery)       localStorage.setItem(LS.mastery,      JSON.stringify(ud.mastery))
      if (ud.review)        localStorage.setItem(LS.review,       JSON.stringify(ud.review))
      if (ud.concept_notes) localStorage.setItem(LS.notes,        JSON.stringify(ud.concept_notes))
      if (ud.rules)         localStorage.setItem(LS.rules,        JSON.stringify(ud.rules))
      if (ud.settings)      localStorage.setItem(LS.settings,     JSON.stringify(ud.settings))
      if (ud.bookmarks)     localStorage.setItem(LS.bookmarks,    JSON.stringify(ud.bookmarks))
      if (ud.key_levels)    localStorage.setItem(LS.keyLevels,    JSON.stringify(ud.key_levels))
      if (ud.session_notes) localStorage.setItem(LS.sessionNotes, ud.session_notes)
    }
    if (builds?.length)  localStorage.setItem(LS.builds,  JSON.stringify(builds.map(stripUserId)))
    if (journal?.length) localStorage.setItem(LS.journal, JSON.stringify(journal.map(stripUserId)))
    if (plans?.length)   localStorage.setItem(LS.plans,   JSON.stringify(plans.map(p => p.data)))
  } else {
    // ── First login: upload localStorage data to Supabase ─────────────────────
    const userData = {
      user_id:       userId,
      mastery:       ls(LS.mastery)      ?? {},
      review:        ls(LS.review)       ?? {},
      concept_notes: ls(LS.notes)        ?? {},
      rules:         ls(LS.rules)        ?? [],
      settings:      ls(LS.settings)     ?? {},
      bookmarks:     ls(LS.bookmarks)    ?? [],
      key_levels:    ls(LS.keyLevels)    ?? {},
      session_notes: localStorage.getItem(LS.sessionNotes) ?? '',
    }
    await supabase.from('user_data').upsert(userData, { onConflict: 'user_id' })

    const localBuilds  = (ls(LS.builds)  ?? []) as Record<string, unknown>[]
    const localJournal = (ls(LS.journal) ?? []) as Record<string, unknown>[]
    const localPlans   = (ls(LS.plans)   ?? []) as unknown[]

    if (localBuilds.length)
      await supabase.from('builds').upsert(
        localBuilds.map(b => ({ ...b, user_id: userId })), { onConflict: 'id' }
      )
    if (localJournal.length)
      await supabase.from('journal_entries').upsert(
        localJournal.map(e => ({ ...e, user_id: userId })), { onConflict: 'id' }
      )
    if (localPlans.length)
      await supabase.from('plans').upsert(
        localPlans.map((p: unknown) => ({ id: (p as any).id ?? crypto.randomUUID(), user_id: userId, data: p })),
        { onConflict: 'id' }
      )
  }
}

function stripUserId<T extends { user_id?: unknown }>(obj: T): Omit<T, 'user_id'> {
  const { user_id: _, ...rest } = obj
  return rest as Omit<T, 'user_id'>
}
