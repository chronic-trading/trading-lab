import { useState, useEffect } from 'react'

export interface KillZone {
  name: string
  shortName: string
  color: string
  textColor: string       // tuned for dark surfaces
  textColorLight: string  // darker twin for the light theme (inline styles skip
                          // index.css's class-based remap, so these must be explicit)
  bgColor: string
  start: number  // minutes from midnight NY time
  end: number
}

export const KILL_ZONES: KillZone[] = [
  { name: 'Asian Session', shortName: 'Asian',  color: '#4f46e5', textColor: '#a5b4fc', textColorLight: '#4338ca', bgColor: 'rgba(79,70,229,0.12)', start: 19 * 60,      end: 21 * 60 },
  { name: 'London Open',   shortName: 'London', color: '#2563eb', textColor: '#60a5fa', textColorLight: '#1d4ed8', bgColor: 'rgba(37,99,235,0.12)',  start:  2 * 60,      end:  5 * 60 },
  { name: 'NY AM',         shortName: 'NY AM',  color: '#059669', textColor: '#34d399', textColorLight: '#047857', bgColor: 'rgba(5,150,105,0.12)',  start:  8 * 60 + 30, end: 11 * 60 },
  { name: 'NY PM',         shortName: 'NY PM',  color: '#d97706', textColor: '#fbbf24', textColorLight: '#b45309', bgColor: 'rgba(217,119,6,0.12)',  start: 13 * 60 + 30, end: 16 * 60 },
]

// ICT Macro windows (start times in NY minutes-from-midnight)
export const MACROS = [
  { name: '2:33 AM',  start:  2 * 60 + 33 },
  { name: '4:03 AM',  start:  4 * 60 +  3 },
  { name: '8:50 AM',  start:  8 * 60 + 50 },
  { name: '9:50 AM',  start:  9 * 60 + 50 },
  { name: '10:50 AM', start: 10 * 60 + 50 },
  { name: '11:50 AM', start: 11 * 60 + 50 },
  { name: '1:10 PM',  start: 13 * 60 + 10 },
  { name: '3:15 PM',  start: 15 * 60 + 15 },
]

function getNYTime() {
  const now   = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone:  'America/New_York',
    hour:      '2-digit',
    minute:    '2-digit',
    second:    '2-digit',
    hour12:    false,
  }).formatToParts(now)

  const h   = parseInt(parts.find(p => p.type === 'hour')!.value,   10)
  const m   = parseInt(parts.find(p => p.type === 'minute')!.value, 10)
  const s   = parseInt(parts.find(p => p.type === 'second')!.value, 10)
  const total = h * 60 + m

  const display = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour:     '2-digit',
    minute:   '2-digit',
    second:   '2-digit',
    hour12:   false,
  }).format(now)

  return { h, m, s, total, display }
}

function getActiveZone(total: number) {
  return KILL_ZONES.find(z => {
    if (z.start > z.end) return total >= z.start || total < z.end
    return total >= z.start && total < z.end
  }) ?? null
}

function getNextZone(total: number) {
  let best: { zone: KillZone; minsUntil: number } | null = null
  for (const z of KILL_ZONES) {
    let diff = z.start - total
    if (diff <= 0) diff += 24 * 60
    if (!best || diff < best.minsUntil) best = { zone: z, minsUntil: diff }
  }
  return best!
}

function getNextMacro(total: number) {
  let best: { name: string; minsUntil: number } | null = null
  for (const m of MACROS) {
    let diff = m.start - total
    if (diff <= 0) diff += 24 * 60
    if (!best || diff < best.minsUntil) best = { name: m.name, minsUntil: diff }
  }
  return best!
}

function fmtMins(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function useKillZone() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const time        = getNYTime()
  const active      = getActiveZone(time.total)
  const next        = getNextZone(time.total)
  const nextMacro   = getNextMacro(time.total)
  const timeLeft    = active ? fmtMins(active.end - time.total) : null
  const timeToNext  = fmtMins(next.minsUntil)
  const timeToMacro = fmtMins(nextMacro.minsUntil)

  return { time, active, next, nextMacro, timeLeft, timeToNext, timeToMacro }
}
