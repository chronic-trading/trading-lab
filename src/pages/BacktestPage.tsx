import { useState, useEffect, useRef } from 'react'
import {
  Play, Pause, SkipBack, ChevronRight, ChevronLeft,
  TrendingUp, TrendingDown, Crosshair,
  ChevronDown, ChevronUp, Trash2, Search, X,
} from 'lucide-react'
import { ReplayChart } from '../components/ReplayChart'
import { useReplayData, type OHLCVBar } from '../hooks/useReplayData'
import { calcRPlanned, calcRActual, calcPnl, sessionStats, type BacktestTrade } from '../hooks/useBacktest'
import { concepts, getConceptById } from '../data/concepts'
import { REPLAY_INSTRUMENTS as INSTRUMENTS } from '../data/instruments'
import type { Instrument } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────
// Must match what scripts/fetch-market-data.mjs writes into public/data —
// offering a timeframe with no dataset behind it just 404s.
const TIMEFRAMES = ['1m','5m','15m','1H','4H','D'] as const

/**
 * How far back to start the replay, per timeframe. A single fixed lookback does
 * not work across this range: one month of Daily bars is 23 candles (barely a
 * replay at all), while one month of 1m is more than the dataset even holds.
 * These are tuned to give a few hundred bars to work through in every case.
 */
const LOOKBACK_DAYS: Record<string, number> = {
  '1m': 5, '5m': 14, '15m': 30, '1H': 120, '4H': 365, 'D': 1825,
}

function defaultStart(tf: string): string {
  const d = new Date()
  d.setDate(d.getDate() - (LOOKBACK_DAYS[tf] ?? 30))
  return d.toISOString().slice(0, 10)
}
const INITIAL_CONTEXT = 80  // bars shown on load before replay starts
const TRADES_KEY = 'tl:replay-trades'
const SPEEDS = [0.5, 1, 2, 4] as const
type Speed = typeof SPEEDS[number]

type TF = typeof TIMEFRAMES[number]

interface ActiveTrade {
  dir: 'long' | 'short'
  entry: number
  stop: number
  target: number
  conceptIds: string[]
  notes: string
  barIndex: number
}

function fmtBar(bar: OHLCVBar | undefined) {
  if (!bar) return null
  const d = new Date(bar.time * 1000)
  const date = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12: false, timeZone:'America/New_York' })
  return { date, time: `${time} ET` }
}

function priceFmt(p: number, inst: string) {
  const dp = inst.includes('JPY') ? 3 : 5
  return p.toFixed(dp)
}

function today() { return new Date().toISOString().slice(0,10) }

// ── Concept picker (condensed) ────────────────────────────────────────────────
function ConceptPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const [search, setSearch] = useState('')
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  const filtered = concepts.filter(c =>
    !search || c.shortName.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map(id => {
            const c = getConceptById(id)
            return c ? (
              <button key={id} onClick={() => toggle(id)}
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300 transition-all">
                {c.shortName} <X size={8} />
              </button>
            ) : null
          })}
        </div>
      )}
      <div className="relative">
        <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search concepts…"
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)] transition-all" />
      </div>
      <div className="max-h-[100px] overflow-y-auto grid grid-cols-2 gap-1 pr-1">
        {filtered.map(c => (
          <button key={c.id} onClick={() => toggle(c.id)}
            className={`flex items-center gap-1.5 text-left px-2 py-1 rounded-lg border text-[10px] font-medium transition-all ${
              selected.includes(c.id)
                ? 'bg-amber-500/12 border-amber-500/35 text-amber-300'
                : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border)] hover:text-[var(--text-dim)] bg-[var(--surface)]'
            }`}>
            <span className="truncate">{c.shortName}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Trade history card ────────────────────────────────────────────────────────
function TradeCard({ trade, onDelete }: { trade: BacktestTrade; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const badge = {
    win:       'bg-emerald-500/12 border-emerald-500/30 text-emerald-400',
    loss:      'bg-red-500/12 border-red-500/30 text-red-400',
    breakeven: 'bg-[var(--surface-hover)] border-[var(--border-strong)] text-[var(--text-dim)]',
  }
  return (
    <div className={`rounded-xl border overflow-hidden ${
      trade.result === 'win'  ? 'bg-[var(--surface)] border-emerald-500/15' :
      trade.result === 'loss' ? 'bg-[var(--surface)] border-red-500/15' : 'bg-[var(--surface)] border-[var(--border)]'
    }`}>
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
          trade.direction === 'long' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
          {trade.direction === 'long'
            ? <TrendingUp size={11} className="text-emerald-400" />
            : <TrendingDown size={11} className="text-red-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-amber-300/80" style={{ fontFamily:"'JetBrains Mono',monospace" }}>
              {trade.instrument}
            </span>
            <span className="text-[10px] text-[var(--text-faint)]">{trade.chartDate}</span>
            {trade.result && (
              <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${badge[trade.result]}`}>
                {trade.result === 'win' ? `+${trade.rAchieved}R` : trade.result === 'loss' ? `${trade.rAchieved}R` : 'BE'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-[10px]" style={{ fontFamily:"'JetBrains Mono',monospace" }}>
            <span className="text-[var(--text-dim)]">{trade.entryPrice}</span>
            <span className="text-[var(--text-faint)]">·</span>
            <span className="text-red-400/70">SL {trade.stopPrice}</span>
            <span className="text-[var(--text-faint)]">·</span>
            <span className="text-emerald-400/70">TP {trade.targetPrice}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setOpen(o => !o)} className="w-5 h-5 flex items-center justify-center text-[var(--text-faint)] hover:text-[var(--text-dim)] transition-colors">
            {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          <button onClick={() => onDelete(trade.id)} className="w-5 h-5 flex items-center justify-center text-[var(--text-faint)] hover:text-red-400 transition-colors">
            <Trash2 size={9} />
          </button>
        </div>
      </div>
      {open && trade.conceptIds.length > 0 && (
        <div className="px-3 pb-2.5 border-t border-[var(--border)] pt-2 flex flex-wrap gap-1">
          {trade.conceptIds.map(id => {
            const c = getConceptById(id)
            return c ? <span key={id} className="text-[10px] text-[var(--text-dim)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded-lg">{c.shortName}</span> : null
          })}
          {trade.notes && <p className="w-full text-[10px] text-[var(--text-faint)] mt-1">{trade.notes}</p>}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function BacktestPage() {
  const { bars, loading, error, load } = useReplayData()

  const [instrument, setInstrument] = useState<Instrument>('NQ')
  const [tf,         setTf]         = useState<TF>('15m')
  const [startDate,  setStartDate]  = useState(() => defaultStart('15m'))

  const [cursor,     setCursor]     = useState(INITIAL_CONTEXT)
  const [playing,    setPlaying]    = useState(false)
  const [speed,      setSpeed]      = useState<Speed>(1)

  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null)

  // Trade form state
  const [dir,        setDir]        = useState<'long'|'short'>('long')
  const [entryInput, setEntryInput] = useState('')
  const [stopInput,  setStopInput]  = useState('')
  const [tpInput,    setTpInput]    = useState('')
  const [tradeConcepts, setTradeConcepts] = useState<string[]>([])
  const [tradeNotes, setTradeNotes] = useState('')

  const [trades, setTrades] = useState<BacktestTrade[]>(() => {
    try { return JSON.parse(localStorage.getItem(TRADES_KEY) ?? '[]') }
    catch { return [] }
  })

  useEffect(() => { localStorage.setItem(TRADES_KEY, JSON.stringify(trades)) }, [trades])

  // ── Auto-play ───────────────────────────────────────────────────────────────
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (!playing) { if (playRef.current) clearInterval(playRef.current); return }
    playRef.current = setInterval(() => {
      setCursor(c => {
        if (c >= bars.length) { setPlaying(false); return c }
        return c + 1
      })
    }, Math.round(400 / speed))
    return () => { if (playRef.current) clearInterval(playRef.current) }
  }, [playing, bars.length, speed])

  // ── Auto-detect stop/target hit ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeTrade || !bars.length || cursor === 0) return
    const bar = bars[cursor - 1]
    if (!bar) return
    const { dir: d, stop, target } = activeTrade
    let result: 'win'|'loss'|null = null
    let exitPrice = 0
    if (d === 'long') {
      if (bar.low <= stop)    { result = 'loss'; exitPrice = stop }
      else if (bar.high >= target) { result = 'win';  exitPrice = target }
    } else {
      if (bar.high >= stop)   { result = 'loss'; exitPrice = stop }
      else if (bar.low <= target)  { result = 'win';  exitPrice = target }
    }
    if (result) closeTrade(result, exitPrice)
  }, [cursor]) // eslint-disable-line

  // The dataset ships with the app, so there is nothing to configure first —
  // load straight away and let the user land on a chart rather than a setup step.
  useEffect(() => {
    load(instrument, tf, startDate)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset cursor when new data loads ────────────────────────────────────────
  useEffect(() => {
    if (bars.length > 0) setCursor(Math.min(INITIAL_CONTEXT, Math.floor(bars.length / 2)))
  }, [bars])

  // ── Actions ─────────────────────────────────────────────────────────────────
  const step = (n: number) => {
    setPlaying(false)
    setCursor(c => Math.max(1, Math.min(c + n, bars.length)))
  }

  const handleLoad = () => {
    setPlaying(false)
    setActiveTrade(null)
    load(instrument, tf, startDate)
  }

  const openTrade = () => {
    const e = parseFloat(entryInput), s = parseFloat(stopInput), t = parseFloat(tpInput)
    if (isNaN(e) || isNaN(s) || isNaN(t) || s === e) return
    setActiveTrade({ dir, entry: e, stop: s, target: t, conceptIds: tradeConcepts, notes: tradeNotes, barIndex: cursor })
    setEntryInput(''); setStopInput(''); setTpInput('')
    setTradeConcepts([]); setTradeNotes('')
  }

  const closeTrade = (result: 'win'|'loss'|'breakeven', exitPrice: number) => {
    if (!activeTrade) return
    const { dir: d, entry, stop, target, conceptIds, notes } = activeTrade
    const rPlanned  = calcRPlanned(d, entry, stop, target)
    const rAchieved = calcRActual(d, entry, stop, exitPrice)
    const pnlDollar = calcPnl(d, instrument, entry, exitPrice)
    const trade: BacktestTrade = {
      id: crypto.randomUUID(),
      direction: d, instrument,
      entryPrice: entry, stopPrice: stop, targetPrice: target,
      actualExitPrice: exitPrice, result, rPlanned, rAchieved, pnlDollar,
      conceptIds, notes,
      chartDate: bars[activeTrade.barIndex]
        ? new Date(bars[activeTrade.barIndex].time * 1000).toISOString().slice(0,10)
        : today(),
      createdAt: new Date().toISOString(),
    }
    setTrades(prev => [trade, ...prev])
    setActiveTrade(null)
  }

  const deleteTrade = (id: string) => setTrades(prev => prev.filter(t => t.id !== id))

  // ── Derived display values ───────────────────────────────────────────────────
  const currentBar  = bars[cursor - 1]
  const barInfo     = fmtBar(currentBar)
  const hasData     = bars.length > 0
  const entryN = parseFloat(entryInput), stopN = parseFloat(stopInput), tpN = parseFloat(tpInput)
  const formValid = !isNaN(entryN) && !isNaN(stopN) && !isNaN(tpN) && stopN !== entryN
  const riskPts   = formValid ? Math.abs(entryN - stopN) : null
  const rPlanned  = formValid ? calcRPlanned(dir, entryN, stopN, tpN) : null

  const currentClose = currentBar?.close ?? 0
  const unrealizedPts = activeTrade
    ? (activeTrade.dir === 'long' ? currentClose - activeTrade.entry : activeTrade.entry - currentClose)
    : 0
  const riskPtsActive = activeTrade ? Math.abs(activeTrade.entry - activeTrade.stop) : 1
  const unrealizedR   = riskPtsActive > 0 ? unrealizedPts / riskPtsActive : 0
  const unrealizedPnl = activeTrade ? calcPnl(activeTrade.dir, instrument, activeTrade.entry, currentClose) : 0

  const stats = sessionStats(trades)
  const monoStyle = { fontFamily:"'JetBrains Mono',monospace" }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg)]">

      {/* ── Top toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-elev)] flex-shrink-0 flex-wrap">
        {/* Instrument — wraps internally: six mono chips are ~400px side by side,
            wider than a phone, and the toolbar's own flex-wrap can't split a
            single child group. */}
        <div className="flex gap-1 flex-wrap">
          {INSTRUMENTS.map(i => (
            <button key={i} onClick={() => setInstrument(i)}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                instrument === i
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border)] hover:text-[var(--text-dim)]'
              }`} style={monoStyle}>{i}</button>
          ))}
        </div>

        <div className="w-px h-4 bg-[var(--surface-2)]" />

        {/* Timeframe */}
        <div className="flex gap-1">
          {TIMEFRAMES.map(t => (
            // Move the start date with the timeframe: the lookback that suits
            // 15m leaves Daily with 23 bars and asks 1m for more history than
            // the dataset holds.
            <button key={t} onClick={() => { setTf(t); setStartDate(defaultStart(t)) }}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                tf === t
                  ? 'bg-[var(--surface-hover)] border-[var(--border-strong)] text-[var(--text)]'
                  : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border)] hover:text-[var(--text-dim)]'
              }`}>{t}</button>
          ))}
        </div>

        <div className="w-px h-4 bg-[var(--surface-2)]" />

        {/* Date */}
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          max={today()}
          style={{ colorScheme: 'dark' }}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--text-dim)] focus:outline-none focus:border-[var(--border-strong)] transition-all" />

        {/* Load button */}
        <button onClick={handleLoad} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-amber-500/35 bg-amber-500/12 text-amber-300 text-[11px] font-bold hover:bg-amber-500/22 transition-all disabled:opacity-50">
          {loading
            ? <span className="w-3 h-3 border border-amber-400/40 border-t-amber-300 rounded-full animate-spin flex-shrink-0" />
            : <Crosshair size={11} />}
          {loading ? 'Loading…' : 'Load'}
        </button>

      </div>

      {/* ── Main area ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Chart + controls ─────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Chart */}
          <div className="flex-1 overflow-hidden relative">
            {!hasData && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                {error ? (
                  <>
                    <p className="text-[13px] font-bold text-red-400">Failed to load</p>
                    <p className="text-[11px] text-[var(--text-faint)] max-w-xs text-center">{error}</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                      <Crosshair size={22} className="text-[var(--text-faint)]" />
                    </div>
                    <div className="text-center max-w-xs">
                      <p className="text-[15px] font-bold text-[var(--text-dim)] mb-2">Chart Replay</p>
                      <p className="text-[12px] text-[var(--text-faint)] leading-relaxed">
                        Pick an instrument and timeframe, choose a start date, then hit{' '}
                        <span className="text-amber-400/70 font-semibold">Load</span>.
                      </p>
                      <p className="text-[11px] text-[var(--text-faint)] mt-3 tracking-wide">Step through bars · Mark entries · Track R</p>
                    </div>
                  </>
                )}
              </div>
            )}
            <ReplayChart bars={bars} cursor={cursor} activeTrade={activeTrade} />
          </div>

          {/* Replay controls bar */}
          {hasData && (
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[var(--border)] bg-[var(--bg-elev)] flex-shrink-0">
              {/* Reset */}
              <button onClick={() => { setPlaying(false); setCursor(Math.min(INITIAL_CONTEXT, Math.floor(bars.length/2))) }}
                title="Reset to start"
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border)] hover:text-[var(--text-dim)] transition-all">
                <SkipBack size={12} />
              </button>

              {/* Step back */}
              <button onClick={() => step(-1)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border)] hover:text-[var(--text-dim)] text-[11px] font-bold transition-all">
                <ChevronLeft size={11} /> 1
              </button>

              {/* Play/Pause */}
              <button onClick={() => setPlaying(p => !p)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                  playing
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'border-[var(--border)] text-[var(--text-dim)] hover:border-amber-500/40 hover:text-amber-300'
                }`}>
                {playing ? <Pause size={11} /> : <Play size={11} />}
                {playing ? 'Pause' : 'Play'}
              </button>

              {/* Step forward */}
              {([1,5,15] as const).map(n => (
                <button key={n} onClick={() => step(n)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border)] hover:text-[var(--text-dim)] text-[11px] font-bold transition-all">
                  +{n} <ChevronRight size={11} />
                </button>
              ))}

              <div className="w-px h-4 bg-[var(--surface-2)] mx-0.5" />

              {/* Speed selector */}
              <div className="flex items-center gap-0.5">
                {SPEEDS.map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      speed === s
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                        : 'text-[var(--text-faint)] hover:text-[var(--text-dim)]'
                    }`}>
                    {s}x
                  </button>
                ))}
              </div>

              {/* Bar info */}
              {barInfo && (
                <div className="ml-auto flex items-center gap-2 text-[11px]" style={monoStyle}>
                  <span className="text-[var(--text-dim)]">{barInfo.date}</span>
                  <span className="text-[var(--text-faint)]">{barInfo.time}</span>
                  <span className="text-[var(--text-faint)]">·</span>
                  <span className="text-[var(--text-faint)]">{cursor}/{bars.length}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel ──────────────────────────────────────────────────── */}
        {/* hidden below md: at 320px fixed this panel left a 55px chart on phones.
            Same pattern as Plan's summary sidebar. */}
        <div className="hidden md:flex w-[320px] flex-shrink-0 border-l border-[var(--border)] flex-col overflow-hidden bg-[var(--bg-elev)]">

          {!hasData ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                <Crosshair size={18} className="text-[var(--text-faint)]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[var(--text-faint)] mb-1">No session loaded</p>
                <p className="text-[11px] text-[var(--text-faint)] leading-relaxed">Load a session to replay bars and mark trades</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">

              {/* Current bar OHLC */}
              {currentBar && (
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-3 bg-amber-500/50 rounded-full" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">Current Bar</span>
                    </div>
                    {barInfo && <span className="text-[10px] text-[var(--text-faint)]" style={monoStyle}>{barInfo.date} · {barInfo.time}</span>}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['open','high','low','close'] as const).map(k => (
                      <div key={k} className="bg-[var(--surface)] rounded-lg px-2 py-1.5 text-center">
                        <p className="text-[10px] text-[var(--text-faint)] uppercase">{k[0]}</p>
                        <p className={`text-[11px] font-bold mt-0.5 ${
                          k === 'high'  ? 'text-emerald-400' :
                          k === 'low'   ? 'text-red-400' :
                          k === 'close' ? (currentBar.close >= currentBar.open ? 'text-emerald-300' : 'text-red-300') :
                          'text-[var(--text-dim)]'
                        }`} style={monoStyle}>
                          {priceFmt(currentBar[k], instrument)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active trade panel */}
              {activeTrade ? (
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeTrade.dir==='long'?'bg-emerald-400':'bg-red-400'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${activeTrade.dir==='long'?'text-emerald-300':'text-red-300'}`}>
                        {activeTrade.dir === 'long' ? '↑ Long' : '↓ Short'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-dim)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full border border-[var(--border)]">Live</span>
                  </div>

                  {/* Entry / SL / TP */}
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {[
                      { label:'Entry', val: activeTrade.entry, cls:'text-[var(--text-dim)]' },
                      { label:'SL',    val: activeTrade.stop,  cls:'text-red-400' },
                      { label:'TP',    val: activeTrade.target, cls:'text-emerald-400' },
                    ].map(row => (
                      <div key={row.label} className="bg-[var(--surface)] rounded-lg px-2 py-1.5 text-center">
                        <p className="text-[10px] text-[var(--text-faint)]">{row.label}</p>
                        <p className={`text-[11px] font-bold mt-0.5 ${row.cls}`} style={monoStyle}>
                          {priceFmt(row.val, instrument)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Live P&L */}
                  <div className={`rounded-xl px-3 py-2.5 mb-3 text-center ${
                    unrealizedPts >= 0 ? 'bg-emerald-500/8 border border-emerald-500/20' : 'bg-red-500/8 border border-red-500/20'
                  }`}>
                    <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider mb-1">Unrealized</p>
                    <p className={`text-[16px] font-black ${unrealizedPts >= 0 ? 'text-emerald-400' : 'text-red-400'}`} style={monoStyle}>
                      {unrealizedR >= 0 ? '+' : ''}{unrealizedR.toFixed(2)}R
                    </p>
                    <p className={`text-[11px] font-semibold mt-0.5 ${unrealizedPts >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`} style={monoStyle}>
                      {unrealizedPnl >= 0 ? '+' : ''}${Math.abs(unrealizedPnl).toFixed(0)}
                    </p>
                  </div>

                  {/* Close buttons */}
                  <div className="space-y-1.5">
                    <button onClick={() => closeTrade(
                      unrealizedPts >= 0 ? 'win' : 'loss',
                      parseFloat(priceFmt(currentClose, instrument))
                    )}
                      className="w-full py-2 rounded-xl border border-[var(--border)] text-[11px] font-bold text-[var(--text-dim)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] transition-all">
                      Close at Current · {priceFmt(currentClose, instrument)}
                    </button>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button onClick={() => closeTrade('loss', activeTrade.stop)}
                        className="py-2 rounded-xl border border-red-500/25 bg-red-500/8 text-red-300 text-[11px] font-bold hover:bg-red-500/15 transition-all">
                        Close SL
                      </button>
                      <button onClick={() => closeTrade('win', activeTrade.target)}
                        className="py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 text-emerald-300 text-[11px] font-bold hover:bg-emerald-500/15 transition-all">
                        Close TP
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mark trade form */
                <div className="px-4 py-3 border-b border-[var(--border)] space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-0.5 h-3 bg-amber-500/50 rounded-full" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">Mark Trade</p>
                  </div>

                  {/* Direction */}
                  <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
                    {(['long','short'] as const).map(d => (
                      <button key={d} onClick={() => setDir(d)}
                        className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wide transition-all ${
                          dir === d
                            ? d==='long' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                            : 'text-[var(--text-faint)] hover:text-[var(--text-dim)]'
                        }`}>
                        {d === 'long' ? '↑ Long' : '↓ Short'}
                      </button>
                    ))}
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label:'Entry', val:entryInput, set:setEntryInput, cls:'text-[var(--text-faint)]' },
                      { label:'Stop',  val:stopInput,  set:setStopInput,  cls:'text-red-500/70' },
                      { label:'TP',    val:tpInput,    set:setTpInput,    cls:'text-emerald-500/70' },
                    ].map(f => (
                      <div key={f.label}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${f.cls}`}>{f.label}</p>
                        <input value={f.val} onChange={e => f.set(e.target.value)}
                          placeholder={instrument.includes('JPY') ? '150.000' : '1.08500'}
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[11px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)] transition-all"
                          style={monoStyle} />
                      </div>
                    ))}
                  </div>

                  {/* R preview */}
                  {formValid && (
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[11px]" style={monoStyle}>
                      <span className="text-[var(--text-faint)]">Risk</span>
                      <span className="text-red-400">{priceFmt(riskPts!, instrument)}</span>
                      <span className="text-[var(--text-faint)] mx-1">·</span>
                      <span className="text-[var(--text-faint)]">Planned</span>
                      <span className={`font-bold ${rPlanned! >= 2 ? 'text-emerald-400' : rPlanned! >= 1 ? 'text-amber-400' : 'text-red-400'}`}>
                        {rPlanned}R
                      </span>
                    </div>
                  )}

                  {/* Concepts (collapsed by default) */}
                  <ConceptPicker selected={tradeConcepts} onChange={setTradeConcepts} />

                  <textarea value={tradeNotes} onChange={e => setTradeNotes(e.target.value)}
                    placeholder="Why did you take this?" rows={2}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[11px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)] transition-all resize-none" />

                  <button onClick={openTrade} disabled={!formValid}
                    className="w-full py-2.5 rounded-xl border border-amber-500/35 bg-amber-500/12 text-amber-300 text-[12px] font-bold hover:bg-amber-500/22 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    Open Trade →
                  </button>
                </div>
              )}

              {/* Session stats */}
              {trades.length > 0 && (
                <div className="px-4 pt-3 pb-2 border-b border-[var(--border)] bg-[var(--surface)]">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-0.5 h-3 bg-amber-500/50 rounded-full" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">Session Stats</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                  {[
                    { label:'W%',    val:`${stats.winRate}%`,   color: stats.winRate>=60?'text-emerald-400':stats.winRate>=40?'text-amber-400':'text-red-400' },
                    { label:'Avg R', val: stats.total>0?(stats.avgR>=0?`+${stats.avgR}`:String(stats.avgR)):'—', color: stats.avgR>=0?'text-emerald-400':'text-red-400' },
                    { label:'Total', val: stats.total>0?(stats.totalR>=0?`+${stats.totalR}`:String(stats.totalR)):'—', color: stats.totalR>=0?'text-emerald-400':'text-red-400' },
                    { label:'W/L',   val:`${stats.wins}/${stats.losses}`, color:'text-[var(--text-dim)]' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider">{s.label}</p>
                      <p className={`text-[12px] font-black mt-0.5 ${s.color}`} style={monoStyle}>{s.val}</p>
                    </div>
                  ))}
                  </div>
                </div>
              )}

              {/* Trade history */}
              <div className="px-4 py-3 space-y-2">
                {trades.length === 0 ? (
                  <p className="text-[11px] text-[var(--text-faint)] text-center py-6">No trades yet — step through the chart and mark setups</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 pb-1">
                      <div className="w-0.5 h-3 bg-amber-500/50 rounded-full" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-dim)]">
                        {trades.length} Trade{trades.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {trades.map(t => <TradeCard key={t.id} trade={t} onDelete={deleteTrade} />)}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
