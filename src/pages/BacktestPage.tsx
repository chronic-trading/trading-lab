import { useState, useEffect, useRef } from 'react'
import {
  Play, Pause, SkipBack, ChevronRight, ChevronLeft,
  TrendingUp, TrendingDown, Crosshair, KeyRound,
  ChevronDown, ChevronUp, Trash2, Search, X,
} from 'lucide-react'
import { ReplayChart } from '../components/ReplayChart'
import { useReplayData, TD_KEY_STORAGE, type OHLCVBar } from '../hooks/useReplayData'
import { calcRPlanned, calcRActual, calcPnl, sessionStats, type BacktestTrade } from '../hooks/useBacktest'
import { concepts, getConceptById } from '../data/concepts'
import type { Instrument } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────
const INSTRUMENTS: Instrument[] = ['EURUSD','GBPUSD','USDJPY','GBPJPY','AUDUSD','NZDUSD']
const TIMEFRAMES = ['1m','5m','15m','1H','4H'] as const
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
        <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search concepts…"
          className="w-full bg-slate-900/70 border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-[10.5px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-all" />
      </div>
      <div className="max-h-[100px] overflow-y-auto grid grid-cols-2 gap-1 pr-1">
        {filtered.map(c => (
          <button key={c.id} onClick={() => toggle(c.id)}
            className={`flex items-center gap-1.5 text-left px-2 py-1 rounded-lg border text-[10px] font-medium transition-all ${
              selected.includes(c.id)
                ? 'bg-amber-500/12 border-amber-500/35 text-amber-300'
                : 'border-slate-800/60 text-slate-500 hover:border-slate-700 hover:text-slate-300 bg-slate-900/20'
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
    breakeven: 'bg-slate-700/50 border-slate-600 text-slate-400',
  }
  return (
    <div className={`rounded-xl border overflow-hidden ${
      trade.result === 'win'  ? 'bg-[#0a0f0d] border-emerald-500/15' :
      trade.result === 'loss' ? 'bg-[#0f0a0a] border-red-500/15' : 'bg-[#0b0b14] border-slate-800/50'
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
            <span className="text-[10.5px] font-black text-amber-300/80" style={{ fontFamily:"'JetBrains Mono',monospace" }}>
              {trade.instrument}
            </span>
            <span className="text-[9.5px] text-slate-600">{trade.chartDate}</span>
            {trade.result && (
              <span className={`ml-auto text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border ${badge[trade.result]}`}>
                {trade.result === 'win' ? `+${trade.rAchieved}R` : trade.result === 'loss' ? `${trade.rAchieved}R` : 'BE'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-[9.5px]" style={{ fontFamily:"'JetBrains Mono',monospace" }}>
            <span className="text-slate-400">{trade.entryPrice}</span>
            <span className="text-slate-700">·</span>
            <span className="text-red-400/70">SL {trade.stopPrice}</span>
            <span className="text-slate-700">·</span>
            <span className="text-emerald-400/70">TP {trade.targetPrice}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setOpen(o => !o)} className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-300 transition-colors">
            {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          <button onClick={() => onDelete(trade.id)} className="w-5 h-5 flex items-center justify-center text-slate-700 hover:text-red-400 transition-colors">
            <Trash2 size={9} />
          </button>
        </div>
      </div>
      {open && trade.conceptIds.length > 0 && (
        <div className="px-3 pb-2.5 border-t border-slate-800/30 pt-2 flex flex-wrap gap-1">
          {trade.conceptIds.map(id => {
            const c = getConceptById(id)
            return c ? <span key={id} className="text-[9.5px] text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">{c.shortName}</span> : null
          })}
          {trade.notes && <p className="w-full text-[10px] text-slate-600 mt-1">{trade.notes}</p>}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function BacktestPage() {
  const { bars, loading, error, load } = useReplayData()

  const [instrument, setInstrument] = useState<Instrument>('EURUSD')
  const [tf,         setTf]         = useState<TF>('15m')
  const [startDate,  setStartDate]  = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0,10)
  })
  const [apiKey,     setApiKey]     = useState(() => localStorage.getItem(TD_KEY_STORAGE) ?? '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [keyDraft,   setKeyDraft]   = useState('')

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

  // ── Auto-load on mount if API key is already configured ─────────────────────
  useEffect(() => {
    if (apiKey.trim()) load(instrument, tf, startDate, apiKey)
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
    load(instrument, tf, startDate, apiKey)
  }

  const saveKey = () => {
    const k = keyDraft.trim()
    setApiKey(k)
    localStorage.setItem(TD_KEY_STORAGE, k)
    setShowKeyInput(false)
    setKeyDraft('')
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
    <div className="flex flex-col h-full overflow-hidden bg-[#05050a]">

      {/* ── Top toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/50 bg-[#06060d] flex-shrink-0 flex-wrap">
        {/* Instrument */}
        <div className="flex gap-1">
          {INSTRUMENTS.map(i => (
            <button key={i} onClick={() => setInstrument(i)}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                instrument === i
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
              }`} style={monoStyle}>{i}</button>
          ))}
        </div>

        <div className="w-px h-4 bg-slate-800" />

        {/* Timeframe */}
        <div className="flex gap-1">
          {TIMEFRAMES.map(t => (
            <button key={t} onClick={() => setTf(t)}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                tf === t
                  ? 'bg-slate-700 border-slate-600 text-slate-100'
                  : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
              }`}>{t}</button>
          ))}
        </div>

        <div className="w-px h-4 bg-slate-800" />

        {/* Date */}
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          max={today()}
          style={{ colorScheme: 'dark' }}
          className="bg-slate-900/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-slate-600 transition-all" />

        {/* Load button */}
        <button onClick={handleLoad} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-amber-500/35 bg-amber-500/12 text-amber-300 text-[11px] font-bold hover:bg-amber-500/22 transition-all disabled:opacity-50">
          {loading
            ? <span className="w-3 h-3 border border-amber-400/40 border-t-amber-300 rounded-full animate-spin flex-shrink-0" />
            : <Crosshair size={11} />}
          {loading ? 'Loading…' : 'Load'}
        </button>

        {/* API key indicator */}
        <div className="ml-auto flex items-center gap-2">
          {showKeyInput ? (
            <div className="flex items-center gap-1.5">
              <input autoFocus value={keyDraft} onChange={e => setKeyDraft(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') saveKey(); if (e.key==='Escape') setShowKeyInput(false) }}
                placeholder="Paste Twelve Data API key…"
                className="w-56 bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-1.5 text-[11px] text-slate-100 placeholder-slate-600 focus:outline-none" />
              <button onClick={saveKey} disabled={!keyDraft.trim()}
                className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 disabled:opacity-30 hover:bg-amber-500/25 transition-all">Save</button>
              <button onClick={() => setShowKeyInput(false)}
                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">✕</button>
            </div>
          ) : (
            <button onClick={() => { setKeyDraft(apiKey); setShowKeyInput(true) }}
              className={`flex items-center gap-1.5 text-[10.5px] px-2.5 py-1.5 rounded-lg border transition-all ${
                apiKey
                  ? 'border-emerald-500/25 text-emerald-400/70 bg-emerald-500/5 hover:bg-emerald-500/10'
                  : 'border-red-500/25 text-red-400/70 bg-red-500/5 hover:bg-red-500/10 animate-pulse'
              }`}>
              <KeyRound size={10} />
              {apiKey ? 'API key ✓' : 'Add API key'}
            </button>
          )}
        </div>
      </div>

      {/* ── Main area ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Chart + controls ─────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Chart */}
          <div className="flex-1 overflow-hidden relative">
            {!hasData && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                {error === 'no-key' ? (
                  <>
                    <KeyRound size={32} className="text-amber-500/30" />
                    <div className="text-center">
                      <p className="text-[14px] font-bold text-slate-400 mb-1">API key required</p>
                      <p className="text-[12px] text-slate-600 max-w-xs leading-relaxed">
                        Get a free key at <span className="text-amber-400">twelvedata.com</span> — takes 30 seconds, 800 requests/day included free.
                      </p>
                    </div>
                    <button onClick={() => { setKeyDraft(''); setShowKeyInput(true) }}
                      className="px-5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[12px] font-bold hover:bg-amber-500/18 transition-all">
                      Add API key →
                    </button>
                  </>
                ) : error ? (
                  <>
                    <p className="text-[13px] font-bold text-red-400">Failed to load</p>
                    <p className="text-[11px] text-slate-600 max-w-xs text-center">{error}</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-slate-800/40 border border-slate-700/30 flex items-center justify-center">
                      <Crosshair size={22} className="text-slate-600" />
                    </div>
                    <div className="text-center max-w-xs">
                      <p className="text-[15px] font-bold text-slate-400 mb-2">Chart Replay</p>
                      <p className="text-[12px] text-slate-600 leading-relaxed">
                        Pick an instrument and timeframe, choose a start date, then hit{' '}
                        <span className="text-amber-400/70 font-semibold">Load</span>.
                      </p>
                      <p className="text-[11px] text-slate-700 mt-3 tracking-wide">Step through bars · Mark entries · Track R</p>
                    </div>
                  </>
                )}
              </div>
            )}
            <ReplayChart bars={bars} cursor={cursor} activeTrade={activeTrade} />
          </div>

          {/* Replay controls bar */}
          {hasData && (
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-slate-800/50 bg-[#06060d] flex-shrink-0">
              {/* Reset */}
              <button onClick={() => { setPlaying(false); setCursor(Math.min(INITIAL_CONTEXT, Math.floor(bars.length/2))) }}
                title="Reset to start"
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300 transition-all">
                <SkipBack size={12} />
              </button>

              {/* Step back */}
              <button onClick={() => step(-1)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300 text-[11px] font-bold transition-all">
                <ChevronLeft size={11} /> 1
              </button>

              {/* Play/Pause */}
              <button onClick={() => setPlaying(p => !p)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                  playing
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'border-slate-700 text-slate-300 hover:border-amber-500/40 hover:text-amber-300'
                }`}>
                {playing ? <Pause size={11} /> : <Play size={11} />}
                {playing ? 'Pause' : 'Play'}
              </button>

              {/* Step forward */}
              {([1,5,15] as const).map(n => (
                <button key={n} onClick={() => step(n)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300 text-[11px] font-bold transition-all">
                  +{n} <ChevronRight size={11} />
                </button>
              ))}

              <div className="w-px h-4 bg-slate-800 mx-0.5" />

              {/* Speed selector */}
              <div className="flex items-center gap-0.5">
                {SPEEDS.map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      speed === s
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                        : 'text-slate-600 hover:text-slate-300'
                    }`}>
                    {s}x
                  </button>
                ))}
              </div>

              {/* Bar info */}
              {barInfo && (
                <div className="ml-auto flex items-center gap-2 text-[10.5px]" style={monoStyle}>
                  <span className="text-slate-500">{barInfo.date}</span>
                  <span className="text-slate-600">{barInfo.time}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-slate-600">{cursor}/{bars.length}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel ──────────────────────────────────────────────────── */}
        <div className="w-[320px] flex-shrink-0 border-l border-slate-800/50 flex flex-col overflow-hidden bg-[#06060d]">

          {!hasData ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="w-10 h-10 rounded-2xl bg-slate-800/30 border border-slate-700/20 flex items-center justify-center">
                <Crosshair size={18} className="text-slate-700" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-slate-600 mb-1">No session loaded</p>
                <p className="text-[11px] text-slate-700 leading-relaxed">Load a session to replay bars and mark trades</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">

              {/* Current bar OHLC */}
              {currentBar && (
                <div className="px-4 py-3 border-b border-slate-800/40">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-3 bg-amber-500/50 rounded-full" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Current Bar</span>
                    </div>
                    {barInfo && <span className="text-[9.5px] text-slate-600" style={monoStyle}>{barInfo.date} · {barInfo.time}</span>}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['open','high','low','close'] as const).map(k => (
                      <div key={k} className="bg-slate-900/60 rounded-lg px-2 py-1.5 text-center">
                        <p className="text-[8.5px] text-slate-600 uppercase">{k[0]}</p>
                        <p className={`text-[11px] font-bold mt-0.5 ${
                          k === 'high'  ? 'text-emerald-400' :
                          k === 'low'   ? 'text-red-400' :
                          k === 'close' ? (currentBar.close >= currentBar.open ? 'text-emerald-300' : 'text-red-300') :
                          'text-slate-400'
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
                <div className="px-4 py-3 border-b border-slate-800/40">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeTrade.dir==='long'?'bg-emerald-400':'bg-red-400'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${activeTrade.dir==='long'?'text-emerald-300':'text-red-300'}`}>
                        {activeTrade.dir === 'long' ? '↑ Long' : '↓ Short'}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/50">Live</span>
                  </div>

                  {/* Entry / SL / TP */}
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {[
                      { label:'Entry', val: activeTrade.entry, cls:'text-slate-300' },
                      { label:'SL',    val: activeTrade.stop,  cls:'text-red-400' },
                      { label:'TP',    val: activeTrade.target, cls:'text-emerald-400' },
                    ].map(row => (
                      <div key={row.label} className="bg-slate-900/60 rounded-lg px-2 py-1.5 text-center">
                        <p className="text-[8.5px] text-slate-600">{row.label}</p>
                        <p className={`text-[10.5px] font-bold mt-0.5 ${row.cls}`} style={monoStyle}>
                          {priceFmt(row.val, instrument)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Live P&L */}
                  <div className={`rounded-xl px-3 py-2.5 mb-3 text-center ${
                    unrealizedPts >= 0 ? 'bg-emerald-500/8 border border-emerald-500/20' : 'bg-red-500/8 border border-red-500/20'
                  }`}>
                    <p className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Unrealized</p>
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
                      className="w-full py-2 rounded-xl border border-slate-700 text-[11px] font-bold text-slate-300 hover:border-slate-500 hover:bg-slate-800/50 transition-all">
                      Close at Current · {priceFmt(currentClose, instrument)}
                    </button>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button onClick={() => closeTrade('loss', activeTrade.stop)}
                        className="py-2 rounded-xl border border-red-500/25 bg-red-500/8 text-red-300 text-[10.5px] font-bold hover:bg-red-500/15 transition-all">
                        Close SL
                      </button>
                      <button onClick={() => closeTrade('win', activeTrade.target)}
                        className="py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/8 text-emerald-300 text-[10.5px] font-bold hover:bg-emerald-500/15 transition-all">
                        Close TP
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mark trade form */
                <div className="px-4 py-3 border-b border-slate-800/40 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-0.5 h-3 bg-amber-500/50 rounded-full" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Mark Trade</p>
                  </div>

                  {/* Direction */}
                  <div className="flex rounded-xl overflow-hidden border border-slate-800">
                    {(['long','short'] as const).map(d => (
                      <button key={d} onClick={() => setDir(d)}
                        className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wide transition-all ${
                          dir === d
                            ? d==='long' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                            : 'text-slate-600 hover:text-slate-300'
                        }`}>
                        {d === 'long' ? '↑ Long' : '↓ Short'}
                      </button>
                    ))}
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label:'Entry', val:entryInput, set:setEntryInput, cls:'text-slate-600' },
                      { label:'Stop',  val:stopInput,  set:setStopInput,  cls:'text-red-500/70' },
                      { label:'TP',    val:tpInput,    set:setTpInput,    cls:'text-emerald-500/70' },
                    ].map(f => (
                      <div key={f.label}>
                        <p className={`text-[8.5px] font-bold uppercase tracking-wider mb-1 ${f.cls}`}>{f.label}</p>
                        <input value={f.val} onChange={e => f.set(e.target.value)}
                          placeholder={instrument.includes('JPY') ? '150.000' : '1.08500'}
                          className="w-full bg-slate-900/70 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-100 placeholder-slate-700 focus:outline-none focus:border-slate-600 transition-all"
                          style={monoStyle} />
                      </div>
                    ))}
                  </div>

                  {/* R preview */}
                  {formValid && (
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50 text-[10.5px]" style={monoStyle}>
                      <span className="text-slate-600">Risk</span>
                      <span className="text-red-400">{priceFmt(riskPts!, instrument)}</span>
                      <span className="text-slate-700 mx-1">·</span>
                      <span className="text-slate-600">Planned</span>
                      <span className={`font-bold ${rPlanned! >= 2 ? 'text-emerald-400' : rPlanned! >= 1 ? 'text-amber-400' : 'text-red-400'}`}>
                        {rPlanned}R
                      </span>
                    </div>
                  )}

                  {/* Concepts (collapsed by default) */}
                  <ConceptPicker selected={tradeConcepts} onChange={setTradeConcepts} />

                  <textarea value={tradeNotes} onChange={e => setTradeNotes(e.target.value)}
                    placeholder="Why did you take this?" rows={2}
                    className="w-full bg-slate-900/70 border border-slate-800 rounded-lg px-3 py-2 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-all resize-none" />

                  <button onClick={openTrade} disabled={!formValid}
                    className="w-full py-2.5 rounded-xl border border-amber-500/35 bg-amber-500/12 text-amber-300 text-[11.5px] font-bold hover:bg-amber-500/22 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    Open Trade →
                  </button>
                </div>
              )}

              {/* Session stats */}
              {trades.length > 0 && (
                <div className="px-4 pt-3 pb-2 border-b border-slate-800/40 bg-slate-900/20">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-0.5 h-3 bg-amber-500/50 rounded-full" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Session Stats</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                  {[
                    { label:'W%',    val:`${stats.winRate}%`,   color: stats.winRate>=60?'text-emerald-400':stats.winRate>=40?'text-amber-400':'text-red-400' },
                    { label:'Avg R', val: stats.total>0?(stats.avgR>=0?`+${stats.avgR}`:String(stats.avgR)):'—', color: stats.avgR>=0?'text-emerald-400':'text-red-400' },
                    { label:'Total', val: stats.total>0?(stats.totalR>=0?`+${stats.totalR}`:String(stats.totalR)):'—', color: stats.totalR>=0?'text-emerald-400':'text-red-400' },
                    { label:'W/L',   val:`${stats.wins}/${stats.losses}`, color:'text-slate-300' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-[8.5px] text-slate-600 uppercase tracking-wider">{s.label}</p>
                      <p className={`text-[12px] font-black mt-0.5 ${s.color}`} style={monoStyle}>{s.val}</p>
                    </div>
                  ))}
                  </div>
                </div>
              )}

              {/* Trade history */}
              <div className="px-4 py-3 space-y-2">
                {trades.length === 0 ? (
                  <p className="text-[11px] text-slate-700 text-center py-6">No trades yet — step through the chart and mark setups</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 pb-1">
                      <div className="w-0.5 h-3 bg-amber-500/50 rounded-full" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
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
