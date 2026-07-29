import { useState } from 'react'
import { syncUserDataField } from '../lib/sync'
import { getCurrentUserId } from '../lib/currentUser'
import type { Instrument } from '../types'

export interface TradeGrade {
  id: string
  createdAt: string
  instrument: Instrument
  direction: 'long' | 'short'
  session: string
  factorIds: string[]   // confluence factors that were checked
  rr: number            // planned reward:risk
  score: number         // 0–100
  letter: string        // A+, A, B, C, D, F
}

const KEY = 'tl:tradegrades'
const MAX = 50

function load(): TradeGrade[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? raw : []
  } catch { return [] }
}

type Listener = () => void
let _data: TradeGrade[] = load()
const _listeners = new Set<Listener>()

function persist() {
  localStorage.setItem(KEY, JSON.stringify(_data))
  syncUserDataField('trade_grades', _data, getCurrentUserId())
  _listeners.forEach(fn => fn())
}

export function useTradeGrades() {
  const [, rerender] = useState(0)

  useState(() => {
    const fn = () => rerender(n => n + 1)
    _listeners.add(fn)
    return () => { _listeners.delete(fn) }
  })

  const add = (grade: Omit<TradeGrade, 'id' | 'createdAt'>) => {
    const entry: TradeGrade = { ...grade, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    _data = [entry, ..._data].slice(0, MAX)
    persist()
    return entry
  }

  const remove = (id: string) => {
    _data = _data.filter(g => g.id !== id)
    persist()
  }

  const clear = () => {
    _data = []
    persist()
  }

  return { grades: _data, add, remove, clear }
}
