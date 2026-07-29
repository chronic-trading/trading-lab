import { useState } from 'react'
import { syncUserDataField } from '../lib/sync'
import { getCurrentUserId } from '../lib/currentUser'
import type { Instrument } from '../types'

export interface Settings {
  accountSize: number
  defaultInstrument: Instrument
  riskPercent: number
}

export const POINT_VALUES: Record<Instrument, number> = {
  // Futures (tick/point value per contract)
  NQ: 20, ES: 50, GC: 100, SI: 50,
  // Forex (~$10 per pip per standard lot — adjust to your lot size)
  EURUSD: 10, GBPUSD: 10, USDJPY: 9, GBPJPY: 9,
  AUDUSD: 10, NZDUSD: 10, USDCAD: 10, USDCHF: 10,
}

const DEFAULT: Settings = {
  accountSize: 50000,
  defaultInstrument: 'EURUSD',
  riskPercent: 1,
}

const KEY = 'tl:settings'

function load(): Settings {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } }
  catch { return DEFAULT }
}

type Listener = () => void
let _data = load()
const _listeners = new Set<Listener>()

function persist() {
  localStorage.setItem(KEY, JSON.stringify(_data))
  syncUserDataField('settings', _data, getCurrentUserId())
  _listeners.forEach(fn => fn())
}

export function useSettings() {
  const [, rerender] = useState(0)

  useState(() => {
    const fn = () => rerender(n => n + 1)
    _listeners.add(fn)
    return () => { _listeners.delete(fn) }
  })

  const update = (patch: Partial<Settings>) => {
    _data = { ..._data, ...patch }
    persist()
  }

  return { settings: _data, update }
}
