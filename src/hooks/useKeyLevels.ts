import { useState } from 'react'
import { syncUserDataField } from '../lib/sync'
import { getCurrentUserId } from '../lib/currentUser'
import type { Instrument } from '../types'

export interface KeyLevel {
  id: string
  label: string
  price: string
  type: 'resistance' | 'support' | 'neutral'
}

type LevelMap = Record<Instrument, KeyLevel[]>

const KEY = 'tl:keylevels'
const EMPTY: LevelMap = { NQ: [], ES: [], GC: [], SI: [], EURUSD: [], GBPUSD: [], USDJPY: [], GBPJPY: [], AUDUSD: [], NZDUSD: [], USDCAD: [], USDCHF: [] }

function load(): LevelMap {
  try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } }
  catch { return { ...EMPTY } }
}

type Listener = () => void
let _data: LevelMap = load()
const _listeners = new Set<Listener>()

function persist() {
  localStorage.setItem(KEY, JSON.stringify(_data))
  syncUserDataField('key_levels', _data, getCurrentUserId())
  _listeners.forEach(fn => fn())
}

export function useKeyLevels() {
  const [, rerender] = useState(0)

  useState(() => {
    const fn = () => rerender(n => n + 1)
    _listeners.add(fn)
    return () => { _listeners.delete(fn) }
  })

  const add = (inst: Instrument, level: Omit<KeyLevel, 'id'>) => {
    _data = { ..._data, [inst]: [..._data[inst], { ...level, id: crypto.randomUUID() }] }
    persist()
  }

  const remove = (inst: Instrument, id: string) => {
    _data = { ..._data, [inst]: _data[inst].filter(l => l.id !== id) }
    persist()
  }

  const clear = (inst: Instrument) => {
    _data = { ..._data, [inst]: [] }
    persist()
  }

  return { levels: _data, add, remove, clear }
}
