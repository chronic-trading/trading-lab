import { useState, useEffect } from 'react'
import type { Instrument } from '../types'
// Imported at the point of each write rather than statically: this hook is
// reachable from App's first render, and a static import would put the Supabase
// client in the entry chunk (see lib/sync.ts). Every call below is already
// gated on a signed-in user.
import { getCurrentUserId } from '../lib/currentUser'

export type JournalMode = 'live' | 'backtest'

export const KILLZONES = ['Asian', 'London', 'NY AM', 'NY PM', 'Other'] as const
export type Killzone = typeof KILLZONES[number]

export interface JournalEntry {
  id: string
  date: string
  instrument: Instrument
  direction: 'long' | 'short'
  result: 'win' | 'loss' | 'breakeven'
  mode: JournalMode
  killzone?: Killzone | null
  conceptIds: string[]
  points: number | null
  notes: string
  createdAt: string
}

const KEY = 'trading-lab-journal'

function calcStats(entries: JournalEntry[]) {
  const wins        = entries.filter(e => e.result === 'win').length
  const losses      = entries.filter(e => e.result === 'loss').length
  const bes         = entries.filter(e => e.result === 'breakeven').length
  const total       = entries.length
  const winRate     = total > 0 ? Math.round((wins / total) * 100) : 0
  const totalPoints = entries.reduce((s, e) => s + (e.points ?? 0), 0)

  const conceptWins: Record<string, { wins: number; total: number }> = {}
  for (const e of entries) {
    for (const cid of e.conceptIds) {
      if (!conceptWins[cid]) conceptWins[cid] = { wins: 0, total: 0 }
      conceptWins[cid].total++
      if (e.result === 'win') conceptWins[cid].wins++
    }
  }

  return { wins, losses, bes, total, winRate, totalPoints, conceptWins }
}

// Map between camelCase (app) and snake_case (Supabase)
function toRow(e: JournalEntry, userId: string) {
  return {
    id:          e.id,
    user_id:     userId,
    date:        e.date,
    instrument:  e.instrument,
    direction:   e.direction,
    result:      e.result,
    mode:        e.mode,
    killzone:    e.killzone ?? null,
    concept_ids: e.conceptIds,
    points:      e.points,
    notes:       e.notes,
    created_at:  e.createdAt,
  }
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as JournalEntry[]
      return raw.map(e => ({ ...e, mode: e.mode ?? ('live' as JournalMode) }))
    } catch { return [] }
  })

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(entries)) }, [entries])

  const addEntry = (e: JournalEntry) => {
    setEntries(p => [e, ...p])
    const uid = getCurrentUserId()
    if (uid) {
      import('../lib/supabase').then(({ supabase }) =>
        supabase.from('journal_entries').insert(toRow(e, uid)).then()
      )
    }
  }

  const delEntry = (id: string) => {
    setEntries(p => p.filter(e => e.id !== id))
    const uid = getCurrentUserId()
    if (uid) {
      import('../lib/supabase').then(({ supabase }) =>
        supabase.from('journal_entries').delete().eq('id', id).eq('user_id', uid).then()
      )
    }
  }

  const editEntry = (e: JournalEntry) => {
    setEntries(p => p.map(x => x.id === e.id ? e : x))
    const uid = getCurrentUserId()
    if (uid) {
      import('../lib/supabase').then(({ supabase }) =>
        supabase.from('journal_entries').upsert(toRow(e, uid), { onConflict: 'id' }).then()
      )
    }
  }

  const stats = calcStats(entries)

  return { entries, addEntry, delEntry, editEntry, ...stats }
}
