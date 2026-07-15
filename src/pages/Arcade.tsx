import { useState, useEffect, useRef, useCallback } from 'react'
import { Gamepad2, Zap, ArrowLeft, Trophy, Skull, Newspaper } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Shared market simulator: random walk with persistent regimes
// ─────────────────────────────────────────────────────────────
interface Candle { o: number; h: number; l: number; c: number }

interface Market {
  price: () => number
  candle: (ticks?: number) => Candle
  setRegime: (trend: number, vol: number, duration: number) => void
}

function makeMarket(start = 100): Market {
  let price = start
  let trend = 0
  let trendTimer = 0
  let vol = 0.6

  const tick = () => {
    if (--trendTimer <= 0) {
      trend = (Math.random() - 0.5) * 0.9
      trendTimer = 15 + Math.floor(Math.random() * 40)
      vol = 0.3 + Math.random() * 0.9
    }
    price = Math.max(5, price + trend + (Math.random() - 0.5) * 2 * vol)
    return price
  }

  return {
    price: () => price,
    setRegime: (t, v, dur) => { trend = t * (price / 100); vol = v * (price / 100); trendTimer = dur },
    candle: (ticks = 5) => {
      const o = price
      let h = o, l = o
      for (let i = 0; i < ticks; i++) {
        const p = tick()
        h = Math.max(h, p)
        l = Math.min(l, p)
      }
      return { o, h, l, c: price }
    },
  }
}

// ─────────────────────────────────────────────────────────────
// Shared candlestick renderer
// ─────────────────────────────────────────────────────────────
function drawChart(
  cvs: HTMLCanvasElement,
  candles: Candle[],
  maxCandles: number,
  lines: { price: number; color: string; dash?: number[]; label?: string }[],
) {
  const ctx = cvs.getContext('2d')
  if (!ctx) return
  const W = cvs.width, H = cvs.height
  ctx.fillStyle = '#07070e'
  ctx.fillRect(0, 0, W, H)
  if (candles.length < 2) return

  let lo = Infinity, hi = -Infinity
  for (const c of candles) { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h) }
  for (const ln of lines) { lo = Math.min(lo, ln.price); hi = Math.max(hi, ln.price) }
  const pad = (hi - lo) * 0.1 + 0.5
  lo -= pad; hi += pad
  const y = (p: number) => H - ((p - lo) / (hi - lo)) * H
  const cw = W / maxCandles

  ctx.strokeStyle = '#1c2230'
  ctx.lineWidth = 1
  ctx.fillStyle = '#475569'
  ctx.font = '10px monospace'
  for (let i = 1; i <= 4; i++) {
    const gp = lo + (hi - lo) * (i / 5)
    const gy = y(gp)
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
    ctx.fillText(gp.toFixed(1), 4, gy - 3)
  }

  for (const ln of lines) {
    const ly = y(ln.price)
    ctx.strokeStyle = ln.color
    ctx.setLineDash(ln.dash ?? [])
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke()
    ctx.setLineDash([])
    if (ln.label) {
      ctx.fillStyle = ln.color
      ctx.font = 'bold 10px monospace'
      ctx.fillText(ln.label + ' ' + ln.price.toFixed(2), W - 110, ly - 4)
    }
  }

  candles.forEach((c, i) => {
    const x = i * cw + cw / 2
    const up = c.c >= c.o
    ctx.strokeStyle = ctx.fillStyle = up ? '#34d399' : '#f87171'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, y(c.h)); ctx.lineTo(x, y(c.l)); ctx.stroke()
    ctx.fillRect(x - cw * 0.35, y(Math.max(c.o, c.c)), cw * 0.7, Math.max(1, Math.abs(y(c.o) - y(c.c))))
  })

  const last = candles[candles.length - 1].c
  const ly = y(last)
  ctx.fillStyle = '#fbbf24'
  ctx.fillRect(W - 56, ly - 9, 56, 18)
  ctx.fillStyle = '#07070e'
  ctx.font = 'bold 11px monospace'
  ctx.fillText(last.toFixed(2), W - 52, ly + 4)
}

const fmt = (n: number) => '$' + Math.round(Math.abs(n)).toLocaleString()
const signed = (n: number) => (n >= 0 ? '+' : '−') + fmt(n)

// ─────────────────────────────────────────────────────────────
// Game 1: TAPE READER — 60s long/short scalping
// ─────────────────────────────────────────────────────────────
const TR_MAX = 80
const TR_START = 10000

function TapeReader({ onBack }: { onBack: () => void }) {
  const cvsRef = useRef<HTMLCanvasElement>(null)
  const game = useRef({ market: makeMarket(), candles: [] as Candle[], cash: TR_START, shares: 0, entry: 0 })
  const [hud, setHud] = useState({ cash: TR_START, shares: 0, entry: 0, equity: TR_START, timeLeft: 60 })
  const [phase, setPhase] = useState<'idle' | 'playing' | 'over'>('idle')
  const [result, setResult] = useState({ pnl: 0, best: Number(localStorage.getItem('arcadeTapeBest') ?? '-Infinity') })

  const paint = useCallback(() => {
    const g = game.current
    if (!cvsRef.current) return
    const lines = g.shares !== 0
      ? [{ price: g.entry, color: '#fbbf24', dash: [5, 4], label: g.shares > 0 ? 'LONG' : 'SHORT' }]
      : []
    drawChart(cvsRef.current, g.candles, TR_MAX, lines)
  }, [])

  const syncHud = useCallback((timeLeft: number) => {
    const g = game.current
    setHud({ cash: g.cash, shares: g.shares, entry: g.entry, equity: g.cash + g.shares * g.market.price(), timeLeft })
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    let timeLeft = 60
    const loop = window.setInterval(() => {
      const g = game.current
      g.candles.push(g.market.candle())
      if (g.candles.length > TR_MAX) g.candles.shift()
      paint()
      syncHud(timeLeft)
    }, 350)
    const clock = window.setInterval(() => {
      timeLeft -= 1
      syncHud(timeLeft)
      if (timeLeft <= 0) {
        const g = game.current
        g.cash += g.shares * g.market.price()
        g.shares = 0
        const pnl = g.cash - TR_START
        const best = Math.max(pnl, Number(localStorage.getItem('arcadeTapeBest') ?? '-Infinity'))
        localStorage.setItem('arcadeTapeBest', String(best))
        setResult({ pnl, best })
        setPhase('over')
      }
    }, 1000)
    return () => { window.clearInterval(loop); window.clearInterval(clock) }
  }, [phase, paint, syncHud])

  const start = () => {
    game.current = { market: makeMarket(), candles: [], cash: TR_START, shares: 0, entry: 0 }
    for (let i = 0; i < 30; i++) game.current.candles.push(game.current.market.candle())
    setHud({ cash: TR_START, shares: 0, entry: 0, equity: TR_START, timeLeft: 60 })
    setPhase('playing')
  }

  // shares > 0 long, < 0 short, 0 flat — equity = cash + shares × price either way
  const trade = useCallback((dir: 1 | -1) => {
    const g = game.current
    const p = g.market.price()
    if (g.shares !== 0) {
      if (Math.sign(g.shares) === dir) return
      g.cash += g.shares * p
      g.shares = 0
    } else {
      const qty = Math.floor(g.cash / p)
      if (qty === 0) return
      g.shares = qty * dir
      g.cash -= qty * dir * p
      g.entry = p
    }
    paint()
    setHud(h => ({ ...h, cash: g.cash, shares: g.shares, entry: g.entry, equity: g.cash + g.shares * p }))
  }, [paint])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'playing') return
      if (e.key === 'b' || e.key === 'B') trade(1)
      if (e.key === 's' || e.key === 'S') trade(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, trade])

  const pnl = hud.equity - TR_START
  return (
    <GameFrame onBack={onBack} title="TAPE READER" ticker="$FAKE" subtitle="60 seconds · long & short · all-in scalps">
      <div className="grid grid-cols-4 gap-2 mb-3">
        <Stat label="Cash" value={fmt(hud.cash)} />
        <Stat label="Position" value={hud.shares === 0 ? '—' : `${hud.shares > 0 ? 'L' : 'S'} ${Math.abs(hud.shares)}`} color={hud.shares > 0 ? 'var(--green)' : hud.shares < 0 ? 'var(--red)' : undefined} />
        <Stat label="P&L" value={signed(pnl)} color={pnl >= 0 ? 'var(--green)' : 'var(--red)'} />
        <Stat label="Time" value={String(hud.timeLeft)} color={hud.timeLeft <= 10 ? 'var(--red)' : undefined} />
      </div>

      <div className="relative rounded-2xl border border-slate-800/60 overflow-hidden">
        <canvas ref={cvsRef} width={760} height={340} className="w-full block" />
        {phase !== 'playing' && (
          <div className="absolute inset-0 bg-[#05050a]/90 flex flex-col items-center justify-center text-center p-6">
            {phase === 'idle' ? (
              <>
                <p className="text-[15px] font-black tracking-widest text-white mb-2">TAPE READER</p>
                <p className="text-[11px] text-slate-500 mb-1">B goes all-in long · S goes all-in short · opposite key closes</p>
                <p className="text-[11px] text-slate-500 mb-4">Open positions are marked to market at the bell.</p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-black tracking-widest text-white mb-1">{result.pnl >= 0 ? 'CLOSING BELL 🔔' : 'REKT 📉'}</p>
                <p className="text-[28px] font-black mb-2" style={{ color: result.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{signed(result.pnl)}</p>
              </>
            )}
            {Number.isFinite(result.best) && (
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 mb-4"><Trophy size={12} /> Best: {signed(result.best)}</p>
            )}
            <button onClick={start} className="px-8 py-2.5 rounded-xl text-[13px] font-black tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 transition-all">
              {phase === 'idle' ? 'START ROUND' : 'PLAY AGAIN'}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-3">
        <button onClick={() => trade(1)} disabled={phase !== 'playing'}
          className="flex-1 py-3 rounded-xl text-[13px] font-black tracking-wider bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-30 transition-all">
          {hud.shares < 0 ? 'COVER (B)' : 'BUY (B)'}
        </button>
        <button onClick={() => trade(-1)} disabled={phase !== 'playing'}
          className="flex-1 py-3 rounded-xl text-[13px] font-black tracking-wider bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 disabled:opacity-30 transition-all">
          {hud.shares > 0 ? 'CLOSE (S)' : 'SHORT (S)'}
        </button>
      </div>
    </GameFrame>
  )
}

// ─────────────────────────────────────────────────────────────
// Game 2: LIQUIDATION — leveraged perps vs the news feed
// ─────────────────────────────────────────────────────────────
const LIQ_MAX = 90
const LIQ_START = 10000
const LEVERAGES = [5, 10, 25, 50]

interface NewsEvent { text: string; trend: number; vol: number; dur: number }
const NEWS: NewsEvent[] = [
  { text: '🟢 SPOT ETF APPROVED — INSTITUTIONS PILING IN', trend: 0.9,  vol: 1.1, dur: 45 },
  { text: '🚨 FED EMERGENCY RATE CUT',                     trend: 0.7,  vol: 1.4, dur: 40 },
  { text: '🐋 WHALE MARKET-SELLS ENTIRE STACK',            trend: -1.0, vol: 1.3, dur: 40 },
  { text: '📊 CPI COMES IN HOT — RISK OFF',                trend: -0.6, vol: 1.0, dur: 45 },
  { text: '🔥 SHORT SQUEEZE IN PROGRESS',                  trend: 1.1,  vol: 1.6, dur: 30 },
  { text: '💀 EXCHANGE INSOLVENCY RUMORS',                 trend: -1.2, vol: 1.8, dur: 35 },
  { text: '😴 LOW VOLUME WEEKEND CHOP',                    trend: 0,    vol: 0.3, dur: 55 },
  { text: '🏛️ REGULATION FUD HITS THE WIRE',               trend: -0.5, vol: 0.9, dur: 40 },
  { text: '🚀 BIG TECH ADDS IT TO THE BALANCE SHEET',      trend: 0.8,  vol: 1.0, dur: 45 },
  { text: '⚡ FLASH CRASH — STOPS GETTING RUN',            trend: -0.9, vol: 2.0, dur: 20 },
]

interface Position { dir: 1 | -1; entry: number; margin: number; notional: number; liq: number }

function Liquidation({ onBack }: { onBack: () => void }) {
  const cvsRef = useRef<HTMLCanvasElement>(null)
  const game = useRef({
    market: makeMarket(),
    candles: [] as Candle[],
    equity: LIQ_START,
    pos: null as Position | null,
    peak: LIQ_START,
    trades: 0,
    bestTrade: -Infinity,
  })
  const [hud, setHud] = useState({ equity: LIQ_START, pos: null as Position | null, unreal: 0, peak: LIQ_START })
  const [phase, setPhase] = useState<'idle' | 'playing' | 'rekt'>('idle')
  const [lev, setLev] = useState(10)
  const [headline, setHeadline] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [stats, setStats] = useState({ peak: LIQ_START, trades: 0, bestTrade: 0, best: Number(localStorage.getItem('arcadeLiqBest') ?? '0') })

  const unrealized = (g: typeof game.current) =>
    g.pos ? g.pos.notional * g.pos.dir * (g.market.price() - g.pos.entry) / g.pos.entry : 0

  const paint = useCallback(() => {
    const g = game.current
    if (!cvsRef.current) return
    const lines = g.pos
      ? [
          { price: g.pos.entry, color: '#fbbf24', dash: [5, 4], label: g.pos.dir > 0 ? 'LONG' : 'SHORT' },
          { price: g.pos.liq, color: '#f87171', dash: [2, 3], label: 'LIQ' },
        ]
      : []
    drawChart(cvsRef.current, g.candles, LIQ_MAX, lines)
  }, [])

  const endRun = useCallback(() => {
    const g = game.current
    const best = Math.max(g.peak - LIQ_START, Number(localStorage.getItem('arcadeLiqBest') ?? '0'))
    localStorage.setItem('arcadeLiqBest', String(best))
    setStats({ peak: g.peak, trades: g.trades, bestTrade: Number.isFinite(g.bestTrade) ? g.bestTrade : 0, best })
    setShake(true)
    window.setTimeout(() => setShake(false), 600)
    setPhase('rekt')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const loop = window.setInterval(() => {
      const g = game.current
      const c = g.market.candle()
      g.candles.push(c)
      if (g.candles.length > LIQ_MAX) g.candles.shift()

      // liquidation check uses the candle's wick, not just the close — no hiding from the wick
      if (g.pos) {
        const breached = g.pos.dir > 0 ? c.l <= g.pos.liq : c.h >= g.pos.liq
        if (breached) {
          g.pos = null
          g.equity = 0
          paint()
          setHud({ equity: 0, pos: null, unreal: 0, peak: g.peak })
          endRun()
          return
        }
      }
      const unreal = unrealized(g)
      const liveEq = g.pos ? g.pos.margin + unreal : g.equity
      g.peak = Math.max(g.peak, liveEq)
      paint()
      setHud({ equity: liveEq, pos: g.pos, unreal, peak: g.peak })
    }, 300)

    let newsTimer: number
    const scheduleNews = () => {
      newsTimer = window.setTimeout(() => {
        const ev = NEWS[Math.floor(Math.random() * NEWS.length)]
        game.current.market.setRegime(ev.trend, ev.vol, ev.dur)
        setHeadline(ev.text)
        window.setTimeout(() => setHeadline(null), 5000)
        scheduleNews()
      }, 7000 + Math.random() * 8000)
    }
    scheduleNews()
    return () => { window.clearInterval(loop); window.clearTimeout(newsTimer) }
  }, [phase, paint, endRun])

  const start = () => {
    game.current = { market: makeMarket(), candles: [], equity: LIQ_START, pos: null, peak: LIQ_START, trades: 0, bestTrade: -Infinity }
    for (let i = 0; i < 35; i++) game.current.candles.push(game.current.market.candle())
    setHud({ equity: LIQ_START, pos: null, unreal: 0, peak: LIQ_START })
    setHeadline(null)
    setPhase('playing')
  }

  const open = (dir: 1 | -1) => {
    const g = game.current
    if (phase !== 'playing' || g.pos || g.equity < 10) return
    const entry = g.market.price()
    // full equity posted as margin; ~5% maintenance buffer before the wick gets you
    const liq = entry * (1 - dir * (1 / lev) * 0.95)
    g.pos = { dir, entry, margin: g.equity, notional: g.equity * lev, liq }
    g.equity = 0
    paint()
    setHud(h => ({ ...h, pos: g.pos, unreal: 0 }))
  }

  const close = () => {
    const g = game.current
    if (phase !== 'playing' || !g.pos) return
    const pnl = unrealized(g)
    g.equity = Math.max(0, g.pos.margin + pnl)
    g.trades += 1
    g.bestTrade = Math.max(g.bestTrade, pnl)
    g.pos = null
    paint()
    setHud({ equity: g.equity, pos: null, unreal: 0, peak: g.peak })
    if (g.equity < 10) endRun()
  }

  const roi = hud.pos ? (hud.unreal / hud.pos.margin) * 100 : 0
  return (
    <GameFrame onBack={onBack} title="LIQUIDATION" ticker="$DEGEN-PERP" subtitle="leveraged perps · trade the news · don't get wicked">
      <div className="grid grid-cols-4 gap-2 mb-3">
        <Stat label="Equity" value={fmt(hud.equity)} />
        <Stat label="Position" value={hud.pos ? `${hud.pos.dir > 0 ? 'LONG' : 'SHORT'} ${lev}x` : '—'} color={hud.pos ? (hud.pos.dir > 0 ? 'var(--green)' : 'var(--red)') : undefined} />
        <Stat label="Unrealized" value={hud.pos ? `${signed(hud.unreal)} (${roi >= 0 ? '+' : ''}${roi.toFixed(0)}%)` : '—'} color={hud.unreal >= 0 ? 'var(--green)' : 'var(--red)'} />
        <Stat label="Peak" value={fmt(hud.peak)} color="var(--accent-ink)" />
      </div>

      <div className={`relative rounded-2xl border border-slate-800/60 overflow-hidden ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }`}</style>
        <canvas ref={cvsRef} width={760} height={340} className="w-full block" />

        {headline && phase === 'playing' && (
          <div className="absolute top-3 inset-x-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#05050a]/95 border border-amber-500/40 shadow-lg shadow-amber-500/10">
            <Newspaper size={13} className="text-amber-400 flex-shrink-0" />
            <span className="text-[11px] font-black tracking-wide text-amber-300 truncate">{headline}</span>
          </div>
        )}

        {phase !== 'playing' && (
          <div className="absolute inset-0 bg-[#05050a]/90 flex flex-col items-center justify-center text-center p-6">
            {phase === 'idle' ? (
              <>
                <p className="text-[15px] font-black tracking-widest text-white mb-2">LIQUIDATION</p>
                <p className="text-[11px] text-slate-500 mb-1">Pick your leverage. Go long or short with your whole stack.</p>
                <p className="text-[11px] text-slate-500 mb-4">News moves the tape. The red line is your liquidation — wicks count. No timer: compound until you're rekt.</p>
              </>
            ) : (
              <>
                <Skull size={28} className="text-red-400 mb-2" />
                <p className="text-[15px] font-black tracking-widest text-red-400 mb-2">LIQUIDATED</p>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Peak equity</p><p className="text-[15px] font-black text-amber-400">{fmt(stats.peak)}</p></div>
                  <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Trades closed</p><p className="text-[15px] font-black text-slate-200">{stats.trades}</p></div>
                  <div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Best trade</p><p className="text-[15px] font-black text-emerald-400">{signed(stats.bestTrade)}</p></div>
                </div>
              </>
            )}
            {stats.best > 0 && (
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 mb-4"><Trophy size={12} /> Best run: {signed(stats.best)} above start</p>
            )}
            <button onClick={start} className="px-8 py-2.5 rounded-xl text-[13px] font-black tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 transition-all">
              {phase === 'idle' ? 'OPEN TERMINAL' : 'REDEPLOY'}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 mb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">Leverage</span>
        {LEVERAGES.map(l => (
          <button key={l} onClick={() => setLev(l)} disabled={!!hud.pos}
            className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all disabled:opacity-40 ${
              lev === l ? 'bg-amber-500/15 border border-amber-500/40 text-amber-400' : 'border border-slate-800 text-slate-500 hover:text-slate-300'
            }`}>
            {l}x
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-600 font-semibold hidden md:block">
          {lev}x → ±{(95 / lev).toFixed(1)}% move = liquidation
        </span>
      </div>

      {hud.pos ? (
        <button onClick={close} disabled={phase !== 'playing'}
          className="w-full py-3 rounded-xl text-[13px] font-black tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 disabled:opacity-30 transition-all">
          CLOSE POSITION — BANK {signed(hud.unreal)}
        </button>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => open(1)} disabled={phase !== 'playing'}
            className="flex-1 py-3 rounded-xl text-[13px] font-black tracking-wider bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-30 transition-all">
            LONG {lev}x
          </button>
          <button onClick={() => open(-1)} disabled={phase !== 'playing'}
            className="flex-1 py-3 rounded-xl text-[13px] font-black tracking-wider bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 disabled:opacity-30 transition-all">
            SHORT {lev}x
          </button>
        </div>
      )}
    </GameFrame>
  )
}

// ─────────────────────────────────────────────────────────────
// Shared UI bits + page shell
// ─────────────────────────────────────────────────────────────
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-3 py-2 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">{label}</p>
      <p className="text-[14px] md:text-[16px] font-black tabular-nums text-slate-100" style={color ? { color } : undefined}>{value}</p>
    </div>
  )
}

function GameFrame({ onBack, title, ticker, subtitle, children }: {
  onBack: () => void; title: string; ticker: string; subtitle: string; children: React.ReactNode
}) {
  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all">
          <ArrowLeft size={12} /> Arcade
        </button>
        <div>
          <p className="text-[14px] font-black tracking-widest text-white leading-none">{title} <span className="text-amber-400">{ticker}</span></p>
          <p className="text-[10px] text-slate-600 font-semibold mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function Arcade() {
  const [game, setGame] = useState<'menu' | 'tape' | 'liq'>('menu')

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      {game === 'menu' && (
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 size={16} className="text-amber-400" />
            <h1 className="text-[16px] font-black tracking-widest text-white">ARCADE</h1>
          </div>
          <p className="text-[11px] text-slate-500 mb-5">Train your tape instincts. Fake money, real lessons.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button onClick={() => setGame('tape')}
              className="text-left rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📈</span>
                <p className="text-[13px] font-black tracking-widest text-white group-hover:text-amber-400 transition-colors">TAPE READER</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">60-second scalping sprint. Read the trend, go long or short with your whole stack, and bank as much as you can before the bell.</p>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">No leverage · Timed · Pure tape reading</p>
            </button>

            <button onClick={() => setGame('liq')}
              className="text-left rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 hover:border-red-500/40 hover:bg-red-500/5 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-red-400" />
                <p className="text-[13px] font-black tracking-widest text-white group-hover:text-red-400 transition-colors">LIQUIDATION</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-3">Leveraged perps with a live news feed. Up to 50x, a liquidation line that hunts your wicks, and no timer — compound until you blow up.</p>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-400/70">5–50x leverage · News events · Survival</p>
            </button>
          </div>
        </div>
      )}
      {game === 'tape' && <TapeReader onBack={() => setGame('menu')} />}
      {game === 'liq' && <Liquidation onBack={() => setGame('menu')} />}
    </div>
  )
}
