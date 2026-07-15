import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronDown, ChevronUp, Wrench, Lightbulb, ListChecks, RefreshCw } from 'lucide-react'
import { tvInstructions } from '../data/tvInstructions'
import { getConceptById } from '../data/concepts'
import { useBuilds } from '../hooks/useBuilds'

// ── Symbol presets ────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'QQQ',   symbol: 'NASDAQ:QQQ',  desc: 'Nasdaq 100 ETF'    },
  { label: 'SPY',   symbol: 'AMEX:SPY',    desc: 'S&P 500 ETF'       },
  { label: 'GLD',   symbol: 'AMEX:GLD',    desc: 'Gold ETF'          },
  { label: 'AAPL',  symbol: 'NASDAQ:AAPL', desc: 'Apple'             },
  { label: 'MSFT',  symbol: 'NASDAQ:MSFT', desc: 'Microsoft'         },
  { label: 'NVDA',  symbol: 'NASDAQ:NVDA', desc: 'Nvidia'            },
  { label: 'META',  symbol: 'NASDAQ:META', desc: 'Meta'              },
  { label: 'AMZN',  symbol: 'NASDAQ:AMZN', desc: 'Amazon'            },
]

const TIMEFRAMES = [
  { label: '1m',  value: '1'   },
  { label: '5m',  value: '5'   },
  { label: '15m', value: '15'  },
  { label: '1H',  value: '60'  },
  { label: '4H',  value: '240' },
  { label: 'D',   value: 'D'   },
]

const tierColor: Record<string, string> = {
  basic: 'text-emerald-400', intermediate: 'text-blue-400', advanced: 'text-purple-400',
}
const tierDot: Record<string, string> = {
  basic: 'bg-emerald-400', intermediate: 'bg-blue-400', advanced: 'bg-purple-400',
}

// ── TV Script loader ──────────────────────────────────────────────────────────
let _tvReady: Promise<void> | null = null
function getTVReady(): Promise<void> {
  if (_tvReady) return _tvReady
  _tvReady = new Promise<void>((resolve) => {
    if ((window as any).TradingView) { resolve(); return }
    if (!document.querySelector('script[data-tv]')) {
      const s = document.createElement('script')
      s.src = 'https://s3.tradingview.com/tv.js'
      s.setAttribute('data-tv', '1')
      s.async = true
      document.head.appendChild(s)
    }
    const poll = setInterval(() => {
      if ((window as any).TradingView) { clearInterval(poll); resolve() }
    }, 100)
  })
  return _tvReady
}

// ── TVChart component ─────────────────────────────────────────────────────────
function TVChart({ symbol, interval }: { symbol: string; interval: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef   = useRef(true)
  const idRef        = useRef(`tv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`)
  const [error,      setError] = useState(false)

  useEffect(() => {
    mountedRef.current = true
    setError(false)
    const id = idRef.current

    getTVReady().then(() => {
      if (!mountedRef.current || !containerRef.current) return
      try {
        new (window as any).TradingView.widget({
          container_id:        id,
          autosize:            true,
          symbol,
          interval,
          timezone:            'America/New_York',
          theme:               'dark',
          style:               '1',
          locale:              'en',
          toolbar_bg:          '#06060d',
          enable_publishing:   false,
          hide_top_toolbar:    false,
          hide_side_toolbar:   false,
          allow_symbol_change: true,
          save_image:          false,
          backgroundColor:     '#05050a',
          gridColor:           'rgba(30,32,48,0.6)',
          disabled_features:   ['border_around_the_chart'],
        })
      } catch {
        if (mountedRef.current) setError(true)
      }
    }).catch(() => {
      if (mountedRef.current) setError(true)
    })

    return () => { mountedRef.current = false }
  }, [symbol, interval])

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#05050a]">
        <p className="text-slate-400 text-[14px] font-semibold">Chart couldn't load</p>
        <p className="text-slate-600 text-[12px]">Try the Reload button, or open TradingView directly.</p>
        <a
          href={`https://www.tradingview.com/chart/?symbol=${symbol}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/35 text-blue-300 hover:bg-blue-500/25 transition-all"
        >
          Open on TradingView ↗
        </a>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <div id={idRef.current} style={{ width: '100%', height: '100%' }} ref={containerRef} />
    </div>
  )
}

// ── Main Chart Page ───────────────────────────────────────────────────────────
export function Chart() {
  const [symbol,      setSymbol]      = useState('NASDAQ:QQQ')
  const [tf,          setTf]          = useState('15')
  const [chartKey,    setChartKey]    = useState(0)
  const [custom,      setCustom]      = useState('')
  const [buildId,     setBuildId]     = useState('')
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [guideOpen,   setGuideOpen]   = useState(false)
  const { builds }                    = useBuilds()

  const _activePreset = PRESETS.find(p => p.symbol === symbol); void _activePreset
  const activeBuild  = builds.find(b => b.id === buildId)
  const conceptList  = (activeBuild?.conceptIds ?? []).map(id => getConceptById(id)).filter(Boolean)

  const apply = useCallback((sym: string, newTf?: string) => {
    setSymbol(sym)
    if (newTf) setTf(newTf)
    setChartKey(k => k + 1)
  }, [])

  const applyCustom = () => {
    const cleaned = custom.trim().toUpperCase()
    if (!cleaned) return
    // If user types just a ticker, try NASDAQ first
    const sym = cleaned.includes(':') ? cleaned : `NASDAQ:${cleaned}`
    apply(sym)
    setCustom('')
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Chart ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800/50 bg-[#06060d] flex-shrink-0 flex-wrap">

          {/* Preset symbols */}
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map(p => (
              <button
                key={p.symbol}
                onClick={() => apply(p.symbol)}
                title={p.desc}
                className={`text-[12px] font-bold px-3 py-1.5 rounded-xl border transition-all
                  ${symbol === p.symbol
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-200'}`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-slate-800 flex-shrink-0" />

          {/* Custom symbol input */}
          <div className="flex items-center gap-1.5">
            <input
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyCustom()}
              placeholder="AAPL, TSLA…"
              className="bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-1.5 text-[12px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-all w-28"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
            <button
              onClick={applyCustom}
              disabled={!custom.trim()}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-all disabled:opacity-30"
            >
              Go
            </button>
          </div>

          <div className="w-px h-5 bg-slate-800 flex-shrink-0" />

          {/* Timeframes */}
          <div className="flex gap-1">
            {TIMEFRAMES.map(t => (
              <button
                key={t.value}
                onClick={() => { setTf(t.value); setChartKey(k => k + 1) }}
                className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition-all
                  ${tf === t.value
                    ? 'bg-slate-700 border-slate-600 text-slate-100'
                    : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Guide button (mobile prominent) + reload */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setGuideOpen(o => !o)}
              className={`md:hidden flex items-center gap-2 text-[12px] font-bold px-4 py-2 rounded-xl border transition-all
                ${guideOpen
                  ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
            >
              <Lightbulb size={13} /> Drawing Guide
            </button>
            <button
              onClick={() => setChartKey(k => k + 1)}
              className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-slate-300 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-all"
            >
              <RefreshCw size={11} /> Reload
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 overflow-hidden">
          <TVChart key={chartKey} symbol={symbol} interval={tf} />
        </div>
      </div>

      {/* ── Instructions panel ──────────────────────────────── */}
      <div className={`${guideOpen ? 'flex' : 'hidden'} md:flex w-full md:w-[310px] flex-shrink-0 border-l border-slate-800/50 flex-col bg-[#06060d] overflow-hidden absolute md:relative inset-0 z-10 md:z-auto`}>
        <div className="px-5 py-4 border-b border-slate-800/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-bold text-white">Drawing Guide</p>
              <p className="text-[11px] text-slate-500 mt-0.5">TradingView steps for each concept in your build</p>
            </div>
            <button
              onClick={() => setGuideOpen(false)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
            >
              <ChevronDown size={16} />
            </button>
          </div>
          <select
            className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-[12px] text-slate-200 focus:outline-none focus:border-slate-500 transition-colors"
            value={buildId}
            onChange={e => { setBuildId(e.target.value); setExpanded(null) }}
          >
            <option value="">— select a saved build —</option>
            {builds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {!buildId && (
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Select a build to get step-by-step TradingView drawing guides for each concept.
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {conceptList.map(c => {
            if (!c) return null
            const instr  = tvInstructions[c.id]
            const isOpen = expanded === c.id
            return (
              <div key={c.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : c.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800/20 transition-colors text-left"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tierDot[c.tier]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-100 truncate">{c.name}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${tierColor[c.tier]}`}>{c.tier}</p>
                  </div>
                  {isOpen
                    ? <ChevronUp size={13} className="text-slate-600 flex-shrink-0" />
                    : <ChevronDown size={13} className="text-slate-600 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 bg-slate-900/20 border-t border-slate-800/30 space-y-4 pt-4">
                    {instr ? (
                      <>
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Wrench size={11} className="text-amber-400" />
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Tools</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {instr.tools.map(t => (
                              <span key={t} className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700/50 px-2 py-0.5 rounded-lg">{t}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <ListChecks size={11} className="text-blue-400" />
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Steps</span>
                          </div>
                          <ol className="space-y-2.5">
                            {instr.steps.map((step, i) => (
                              <li key={i} className="flex gap-2.5">
                                <span className="text-[10px] font-bold text-slate-600 w-4 flex-shrink-0 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}.</span>
                                <p className="text-[12px] text-slate-300 leading-relaxed">{step}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div className="bg-amber-500/6 border border-amber-500/20 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Lightbulb size={11} className="text-amber-400" />
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pro tip</span>
                          </div>
                          <p className="text-[12px] text-amber-200/70 leading-relaxed">{instr.tip}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-600">No drawing guide yet for this concept.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
