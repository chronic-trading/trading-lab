import { useState, useCallback } from 'react'
import { syncUserDataField } from '../lib/sync'
import { getCurrentUserId } from '../lib/currentUser'

const KEY = 'trading-lab-concept-notes'

function load(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
}

function save(notes: Record<string, string>) {
  localStorage.setItem(KEY, JSON.stringify(notes))
  syncUserDataField('concept_notes', notes, getCurrentUserId())
}

let _notes: Record<string, string> = load()
const _listeners = new Set<() => void>()

function setNote(id: string, text: string) {
  _notes = { ..._notes, [id]: text }
  save(_notes)
  _listeners.forEach(fn => fn())
}

export function useNotes(conceptId: string) {
  const [, rerender] = useState(0)
  const forceUpdate  = useCallback(() => rerender(n => n + 1), [])

  useState(() => { _listeners.add(forceUpdate); return () => { _listeners.delete(forceUpdate) } })

  const note    = _notes[conceptId] ?? ''
  const hasNote = note.trim().length > 0
  const update  = (text: string) => setNote(conceptId, text)

  return { note, hasNote, update }
}
