import { useState } from 'react'

export interface OHLCVBar {
  time: number // unix seconds
  open: number
  high: number
  low: number
  close: number
}

/**
 * Replay bars, served from the dataset bundled with the app.
 *
 * This used to call Twelve Data and required EVERY USER to register for an
 * account and paste their own API key before the Replay tab would do anything.
 * The data now ships with the app: scripts/fetch-market-data.mjs writes
 * public/data/<SYMBOL>-<TF>.json ahead of time, so the browser loads a plain
 * static file. No key, no signup, no third party between the user and the tool,
 * no rate limit, and it keeps working when everything else is down.
 *
 * It has to be prebuilt rather than fetched live because no futures data source
 * sends CORS headers — Yahoo and Stooq were both verified to block direct
 * browser calls. The fetch happens server-side in CI instead.
 */

/** Columnar payload written by scripts/fetch-market-data.mjs. */
interface Dataset {
  symbol: string
  timeframe: string
  bars: number
  from: string
  to: string
  t: number[]
  o: number[]
  h: number[]
  l: number[]
  c: number[]
}

// Vite rewrites BASE_URL for the GitHub Pages subpath, so this resolves both
// locally ("/") and in production ("/trading-lab/").
const DATA_BASE = `${import.meta.env.BASE_URL}data`

// Parsed datasets, kept for the session. These files are immutable between
// deploys, so re-parsing on every instrument switch is pure waste.
const memoryCache = new Map<string, OHLCVBar[]>()

export function useReplayData() {
  const [bars,    setBars]    = useState<OHLCVBar[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  /**
   * Load bars for an instrument/timeframe, starting at startDate.
   * `startDate` is an ISO date ('2026-07-01'); bars before it are trimmed so
   * the replay begins where the user asked.
   */
  const load = async (instrument: string, tf: string, startDate: string) => {
    const key = `${instrument}-${tf}`
    setLoading(true)
    setError(null)

    try {
      let all = memoryCache.get(key)

      if (!all) {
        const res = await fetch(`${DATA_BASE}/${key}.json`)
        if (res.status === 404) throw new Error(`No bundled data for ${instrument} ${tf}.`)
        if (!res.ok) throw new Error(`Could not load ${instrument} ${tf} (HTTP ${res.status}).`)

        const d: Dataset = await res.json()
        // Columnar -> the bar objects lightweight-charts expects.
        all = d.t.map((time, i) => ({
          time, open: d.o[i], high: d.h[i], low: d.l[i], close: d.c[i],
        }))
        memoryCache.set(key, all)
      }

      const from = Math.floor(new Date(`${startDate}T00:00:00Z`).getTime() / 1000)
      const sliced = all.filter(b => b.time >= from)

      if (!sliced.length) {
        // Distinguish "you picked a date outside the dataset" from "no data at
        // all" — the first is a fixable user choice and deserves the range.
        const earliest = all.length ? new Date(all[0].time * 1000).toISOString().slice(0, 10) : '?'
        const latest   = all.length ? new Date(all.at(-1)!.time * 1000).toISOString().slice(0, 10) : '?'
        throw new Error(`No bars after ${startDate}. ${instrument} ${tf} covers ${earliest} to ${latest}.`)
      }

      setBars(sliced)
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to load data')
      setBars([])
    } finally {
      setLoading(false)
    }
  }

  const clear = () => { setBars([]); setError(null) }

  return { bars, loading, error, load, clear }
}
