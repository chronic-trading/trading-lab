import { useState, useEffect } from 'react'
import { syncUserDataField } from '../lib/sync'
import { getCurrentUserId } from '../lib/currentUser'

export type RuleCategory = 'entry' | 'risk' | 'mindset' | 'session'

export interface TradingRule {
  id: string
  text: string
  category: RuleCategory
  active: boolean
}

const KEY = 'trading-lab-rules'

const DEFAULTS: TradingRule[] = [
  { id: 'r1', text: 'Never trade outside of a kill zone',                           category: 'session', active: true },
  { id: 'r2', text: 'Always define my DOL before entering any trade',               category: 'entry',   active: true },
  { id: 'r3', text: 'Never risk more than 1-2% per trade',                          category: 'risk',    active: true },
  { id: 'r4', text: 'Wait for a CHoCH before looking for an entry',                 category: 'entry',   active: true },
  { id: 'r5', text: 'No revenge trades — one loss does not justify a second trade', category: 'mindset', active: true },
]

export function useRules() {
  const [rules, setRules] = useState<TradingRule[]>(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored ? JSON.parse(stored) : DEFAULTS
    } catch { return DEFAULTS }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(rules))
    syncUserDataField('rules', rules, getCurrentUserId())
  }, [rules])

  const addRule    = (text: string, category: RuleCategory) =>
    setRules(p => [...p, { id: crypto.randomUUID(), text, category, active: true }])
  const deleteRule = (id: string) => setRules(p => p.filter(r => r.id !== id))
  const toggleActive = (id: string) => setRules(p => p.map(r => r.id === id ? { ...r, active: !r.active } : r))
  const updateText   = (id: string, text: string) => setRules(p => p.map(r => r.id === id ? { ...r, text } : r))

  return { rules, activeRules: rules.filter(r => r.active), addRule, deleteRule, toggleActive, updateText }
}
