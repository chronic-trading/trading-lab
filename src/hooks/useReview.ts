import { useState, useCallback } from 'react'
import { syncUserDataField } from '../lib/sync'
import { getCurrentUserId } from '../lib/currentUser'
import { concepts } from '../data/concepts'

/** SM-2 grades: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy */
export type Grade = 0 | 1 | 2 | 3

export interface CardState {
  ease: number      // SM-2 ease factor (min 1.3)
  interval: number  // days until next review
  reps: number      // consecutive successful reviews
  lapses: number    // times graded Again
  due: string       // local date YYYY-MM-DD
  last: string      // local date last reviewed
}

export interface DayLog {
  done: number   // cards graded (excluding repeats of Again within the day)
  again: number  // Again grades
  fresh: number  // new cards introduced
}

export interface ReviewData {
  cards: Record<string, CardState>
  log: Record<string, DayLog>
}

export const NEW_PER_DAY = 8
const MAX_INTERVAL = 365
/** Interval at which a card counts as "learned" (matches Anki's mature threshold) */
export const LEARNED_INTERVAL = 21
const KEY = 'trading-lab-review'

// ── Date helpers (local time — a "day" is the trader's calendar day) ──────────

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function todayStr(): string {
  return fmt(new Date())
}

function dateAfter(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return fmt(d)
}

// ── Store (lazy-loaded so post-login dataSync writes are picked up) ───────────

let _data: ReviewData | null = null
const _listeners = new Set<() => void>()

function load(): ReviewData {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return { cards: parsed.cards ?? {}, log: parsed.log ?? {} }
  } catch {
    return { cards: {}, log: {} }
  }
}

function getData(): ReviewData {
  if (!_data) _data = load()
  return _data
}

function save() {
  if (!_data) return
  localStorage.setItem(KEY, JSON.stringify(_data))
  syncUserDataField('review', _data, getCurrentUserId())
  _listeners.forEach(fn => fn())
}

// ── SM-2 scheduling ───────────────────────────────────────────────────────────

function nextState(prev: CardState | undefined, grade: Grade): CardState {
  const s = prev ?? { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: todayStr(), last: '' }
  let { ease, interval, reps, lapses } = s

  if (grade === 0) {
    // Again — relearn today, ease penalty
    lapses += 1
    reps = 0
    interval = 0
    ease = Math.max(1.3, ease - 0.2)
  } else if (grade === 1) {
    // Hard — small step, ease penalty
    ease = Math.max(1.3, ease - 0.15)
    reps += 1
    interval = interval < 1 ? 1 : Math.max(interval + 1, Math.round(interval * 1.2))
  } else if (grade === 2) {
    // Good — classic SM-2 ladder: 1d, 3d, then interval × ease
    reps += 1
    interval = reps <= 1 ? 1 : reps === 2 ? 3 : Math.round(interval * ease)
  } else {
    // Easy — ease bonus and a bigger jump
    ease += 0.15
    reps += 1
    interval = interval < 1 ? 4 : Math.round(interval * ease * 1.3)
  }

  interval = Math.min(interval, MAX_INTERVAL)
  return { ease, interval, reps, lapses, due: dateAfter(interval), last: todayStr() }
}

/** Human label for what a grade would schedule, shown on the grade buttons */
export function previewInterval(prev: CardState | undefined, grade: Grade): string {
  const next = nextState(prev, grade)
  if (next.interval <= 0) return 'today'
  if (next.interval === 1) return '1 day'
  if (next.interval < 31) return `${next.interval} days`
  if (next.interval < 365) return `${Math.round(next.interval / 30.4)} mo`
  return '1 yr'
}

export function gradeCard(id: string, grade: Grade) {
  const data = getData()
  const isNew = !data.cards[id]
  const isRepeat = !isNew && data.cards[id].last === todayStr() && data.cards[id].interval === 0

  data.cards = { ...data.cards, [id]: nextState(data.cards[id], grade) }

  const today = todayStr()
  const log = data.log[today] ?? { done: 0, again: 0, fresh: 0 }
  data.log = {
    ...data.log,
    [today]: {
      done: log.done + (isRepeat ? 0 : 1),
      again: log.again + (grade === 0 ? 1 : 0),
      fresh: log.fresh + (isNew ? 1 : 0),
    },
  }
  save()
}

// ── Queue + stats ─────────────────────────────────────────────────────────────

/** Cards due today plus today's allotment of never-seen cards */
export function buildQueue(): { due: string[]; fresh: string[] } {
  const data = getData()
  const today = todayStr()

  const due = Object.entries(data.cards)
    .filter(([, s]) => s.due <= today)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id]) => id)

  const introduced = data.log[today]?.fresh ?? 0
  const slots = Math.max(0, NEW_PER_DAY - introduced)
  const fresh = concepts.filter(c => !data.cards[c.id]).slice(0, slots).map(c => c.id)

  return { due, fresh }
}

/** Consecutive days ending today (or yesterday, if today's queue isn't started) with ≥1 review */
export function currentStreak(data: ReviewData): number {
  let streak = 0
  const d = new Date()
  if (!data.log[fmt(d)]) d.setDate(d.getDate() - 1) // today not started yet — count from yesterday
  while (data.log[fmt(d)]?.done) {
    streak += 1
    d.setDate(d.getDate() - 1)
  }
  return streak
}

/** Count of cards due strictly after today but within the next 24h window (i.e. tomorrow) */
export function dueTomorrow(data: ReviewData): number {
  const tomorrow = dateAfter(1)
  return Object.values(data.cards).filter(s => s.due === tomorrow).length
}

export function useReviewData(): ReviewData {
  const [, rerender] = useState(0)
  const update = useCallback(() => rerender(n => n + 1), [])

  useState(() => {
    _listeners.add(update)
    return () => { _listeners.delete(update) }
  })

  return getData()
}
