import { useState, useCallback } from 'react'
import { syncUserDataField } from '../lib/sync'
import { getCurrentUserId } from '../lib/currentUser'

export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  0: 'Not started', 1: 'Aware', 2: 'Learning',
  3: 'Familiar', 4: 'Proficient', 5: 'Mastered',
}

export const MASTERY_COLORS: Record<MasteryLevel, string> = {
  0: 'bg-slate-700', 1: 'bg-red-500', 2: 'bg-orange-500',
  3: 'bg-yellow-500', 4: 'bg-emerald-500', 5: 'bg-amber-400',
}

export const MASTERY_TEXT: Record<MasteryLevel, string> = {
  0: 'text-slate-600', 1: 'text-red-400', 2: 'text-orange-400',
  3: 'text-yellow-400', 4: 'text-emerald-400', 5: 'text-amber-300',
}

const KEY = 'trading-lab-mastery'

function load(): Record<string, MasteryLevel> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
}

function save(data: Record<string, MasteryLevel>) {
  localStorage.setItem(KEY, JSON.stringify(data))
  syncUserDataField('mastery', data, getCurrentUserId())
}

let _data = load()
const _listeners = new Set<() => void>()

function setLevel(id: string, level: MasteryLevel) {
  _data = { ..._data, [id]: level }
  save(_data)
  _listeners.forEach(fn => fn())
}

export function useMastery(conceptId: string) {
  const [, rerender] = useState(0)
  const update = useCallback(() => rerender(n => n + 1), [])

  useState(() => {
    _listeners.add(update)
    return () => { _listeners.delete(update) }
  })

  const level = (_data[conceptId] ?? 0) as MasteryLevel
  const set = (l: MasteryLevel) => setLevel(conceptId, l)

  return { level, set }
}

export function useAllMastery() {
  const [, rerender] = useState(0)
  const update = useCallback(() => rerender(n => n + 1), [])

  useState(() => {
    _listeners.add(update)
    return () => { _listeners.delete(update) }
  })

  return _data
}
