#!/usr/bin/env node
/**
 * Builds the bundled replay dataset.
 *
 * Why this exists: the Replay tab used to make every user sign up for Twelve
 * Data and paste their own API key. That is the opposite of an integrated
 * product, and it put a third party between the user and the tool they paid for.
 *
 * Why it runs here rather than in the browser: none of the futures data sources
 * send CORS headers, so a page on chronic-trading.github.io simply cannot fetch
 * them — verified against Yahoo (both query hosts) and Stooq. A scheduled job
 * runs server-side where CORS does not apply, so it fetches once, commits the
 * result as static JSON, and every user then loads a plain file from Pages. No
 * key, no runtime API, no rate limit, and nothing that can pause.
 *
 * Output: public/data/<INSTRUMENT>-<TF>.json, in a compact columnar shape
 * ({t:[],o:[],h:[],l:[],c:[]}) — roughly a third the size of an array of bar
 * objects, which matters because these files ship to every visitor.
 *
 *   node scripts/fetch-market-data.mjs            # all instruments/timeframes
 *   node scripts/fetch-market-data.mjs NQ 5m      # just one, for a quick check
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'data')

/** App ticker -> Yahoo continuous-front-month futures symbol. */
const SYMBOLS = {
  NQ: 'NQ=F',   // E-mini Nasdaq 100  (CME)
  ES: 'ES=F',   // E-mini S&P 500     (CME)
  GC: 'GC=F',   // Gold               (COMEX)
  SI: 'SI=F',   // Silver             (COMEX)
}

/**
 * Yahoo caps history by granularity — 5m/15m are limited to 60 days, hourly to
 * ~2 years. Asking for more silently returns less, so the ranges below are the
 * real ceilings rather than what we would ideally want.
 */
const TIMEFRAMES = [
  // 1m is capped at 7 days by Yahoo — thin, but ICT entries are often read on
  // it, so a week of it is worth shipping.
  { tf: '1m',  interval: '1m',  range: '7d'   },
  { tf: '5m',  interval: '5m',  range: '60d'  },
  { tf: '15m', interval: '15m', range: '60d'  },
  { tf: '1H',  interval: '1h',  range: '730d' },
  { tf: '4H',  interval: '1h',  range: '730d', aggregate: 4 },
  { tf: 'D',   interval: '1d',  range: '10y'  },
]

const UA = 'Mozilla/5.0 (compatible; TradingLab/1.0; +https://chronic-trading.github.io/trading-lab)'

async function fetchBars(yahooSymbol, interval, range) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}`
            + `?interval=${interval}&range=${range}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${yahooSymbol} ${interval}/${range}`)

  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) throw new Error(`no chart result for ${yahooSymbol} (${json?.chart?.error?.description ?? 'unknown'})`)

  const stamps = result.timestamp ?? []
  const q = result.indicators?.quote?.[0] ?? {}
  const bars = []
  for (let i = 0; i < stamps.length; i++) {
    const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i]
    // Yahoo pads gaps (holidays, halts) with nulls. Drop them rather than
    // forward-filling: a replay trainer teaching price action must never show a
    // bar that did not trade.
    if (o == null || h == null || l == null || c == null) continue
    bars.push([stamps[i], o, h, l, c])
  }
  return bars
}

/** Roll N consecutive bars into one — used to build 4H out of hourly, which
 *  Yahoo does not serve directly. */
function aggregate(bars, factor) {
  const out = []
  for (let i = 0; i < bars.length; i += factor) {
    const slice = bars.slice(i, i + factor)
    if (!slice.length) continue
    out.push([
      slice[0][0],                          // open time of the first bar
      slice[0][1],                          // open of the first
      Math.max(...slice.map(b => b[2])),    // highest high
      Math.min(...slice.map(b => b[3])),    // lowest low
      slice.at(-1)[4],                      // close of the last
    ])
  }
  return out
}

const round = (n) => Math.round(n * 1e4) / 1e4   // trims float noise; 4dp covers every instrument here

async function main() {
  const [onlyInst, onlyTf] = process.argv.slice(2)
  await mkdir(OUT_DIR, { recursive: true })

  const manifest = []
  let failures = 0

  for (const [ticker, yahooSymbol] of Object.entries(SYMBOLS)) {
    if (onlyInst && ticker !== onlyInst) continue
    for (const { tf, interval, range, aggregate: factor } of TIMEFRAMES) {
      if (onlyTf && tf !== onlyTf) continue
      try {
        let bars = await fetchBars(yahooSymbol, interval, range)
        if (factor) bars = aggregate(bars, factor)
        if (!bars.length) throw new Error('zero usable bars')

        // Columnar: five short arrays instead of N objects with repeated keys.
        const payload = {
          symbol: ticker,
          source: yahooSymbol,
          timeframe: tf,
          bars: bars.length,
          from: new Date(bars[0][0] * 1000).toISOString(),
          to:   new Date(bars.at(-1)[0] * 1000).toISOString(),
          t: bars.map(b => b[0]),
          o: bars.map(b => round(b[1])),
          h: bars.map(b => round(b[2])),
          l: bars.map(b => round(b[3])),
          c: bars.map(b => round(b[4])),
        }

        const file = `${ticker}-${tf}.json`
        const body = JSON.stringify(payload)
        await writeFile(join(OUT_DIR, file), body)
        manifest.push({ symbol: ticker, timeframe: tf, file, bars: bars.length,
                        from: payload.from, to: payload.to, kb: Math.round(body.length / 1024) })
        console.log(`  ok  ${ticker.padEnd(3)} ${tf.padEnd(4)} ${String(bars.length).padStart(6)} bars  ${String(Math.round(body.length/1024)).padStart(4)} KB  ${payload.from.slice(0,10)} -> ${payload.to.slice(0,10)}`)
      } catch (err) {
        failures++
        console.error(`  FAIL ${ticker} ${tf}: ${err.message}`)
      }
      // Be a polite client — this is an undocumented public endpoint.
      await new Promise(r => setTimeout(r, 400))
    }
  }

  if (manifest.length) {
    await writeFile(join(OUT_DIR, 'manifest.json'),
      JSON.stringify({ generatedAt: new Date().toISOString(), datasets: manifest }, null, 2))
    const totalKb = manifest.reduce((s, m) => s + m.kb, 0)
    console.log(`\n${manifest.length} datasets, ${totalKb} KB total (${failures} failed)`)
  }

  // Fail the job if nothing came back at all — a silently empty dataset would
  // ship a broken Replay tab.
  if (!manifest.length) { console.error('No datasets written.'); process.exit(1) }
}

main().catch(err => { console.error(err); process.exit(1) })
