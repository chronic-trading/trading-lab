import { useState, useMemo } from 'react'
import { FIRMS, TOP3, ACCOUNT_SIZES, formatPrice, formatSize, type PropFirm } from './propData'

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 80 ? '#34d399' : score >= 65 ? '#f59e0b' : '#f87171'
  const sz = size === 'lg' ? 'text-[26px]' : size === 'md' ? 'text-[17px]' : 'text-[12px]'
  return <span className={`font-black ${sz}`} style={{ color, textShadow: `0 0 16px ${color}55` }}>{score}</span>
}

function Tag({ yes, label }: { yes: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
      style={{ background: yes ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.1)', color: yes ? '#34d399' : '#f87171', border: `1px solid ${yes ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.2)'}` }}>
      {yes ? '✓' : '✗'} {label}
    </span>
  )
}

function DrawdownBadge({ type }: { type: PropFirm['drawdownType'] }) {
  const map = { eod: { label: 'EOD', color: '#34d399' }, static: { label: 'Static', color: '#f59e0b' }, trailing: { label: 'Trailing', color: '#f87171' } }
  const { label, color } = map[type]
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>{label}</span>
  )
}

function Podium({ selectedSize }: { selectedSize: number }) {
  const medals = [
    { rank: 1, cls: 'gold',   bg: 'rgba(255,215,0,0.08)',    border: 'rgba(255,215,0,0.25)',   shadow: 'rgba(255,215,0,0.12)',   crown: '👑', order: 2 },
    { rank: 2, cls: 'silver', bg: 'rgba(192,192,192,0.06)',  border: 'rgba(192,192,192,0.18)', shadow: 'rgba(192,192,192,0.08)', crown: '🥈', order: 1 },
    { rank: 3, cls: 'bronze', bg: 'rgba(205,127,50,0.07)',   border: 'rgba(205,127,50,0.2)',   shadow: 'rgba(205,127,50,0.08)', crown: '🥉', order: 3 },
  ]
  const goldGrad   = 'linear-gradient(125deg,#ffd700,#ffb800,#ffe566,#ffb800,#ffd700)'
  const silverGrad = 'linear-gradient(125deg,#c0c0c0,#e8e8e8,#a8a8a8,#e8e8e8)'
  const bronzeGrad = 'linear-gradient(125deg,#cd7f32,#e8a060,#b86a20,#e8a060)'

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {medals.map(({ rank, bg, border, shadow, crown, order }) => {
        const firm = TOP3[rank - 1]
        const plan = firm.accounts.find(a => a.size === selectedSize) ?? firm.accounts[Math.floor(firm.accounts.length / 2)]
        const grad = rank === 1 ? goldGrad : rank === 2 ? silverGrad : bronzeGrad
        return (
          <div key={firm.id} className="relative rounded-2xl p-5 flex flex-col items-center text-center"
            style={{ background: bg, border: `1px solid ${border}`, boxShadow: `0 0 40px ${shadow}`, order }}>
            <div className="absolute top-0 inset-x-0 h-[1px] rounded-t-2xl"
              style={{ background: `linear-gradient(90deg,transparent,${border},transparent)` }} />
            <div className="text-2xl mb-1">{crown}</div>
            <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-2"
              style={{ background: grad, backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              #{rank} Ranked
            </p>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 font-black text-[15px]"
              style={{ background: `${firm.color}20`, border: `2px solid ${firm.color}40`, color: firm.color }}>
              {firm.shortName[0]}
            </div>
            <p className="text-[14px] font-black text-white mb-1">{firm.name}</p>
            <div className="flex items-center gap-1.5 mb-4">
              <ScoreBadge score={firm.score!} size="lg" />
              <span className="text-[10px] text-slate-600">/ 100</span>
            </div>
            <div className="w-full space-y-1.5 text-left text-[11px]">
              {[
                ['Price', plan ? `${formatPrice(plan.price)}/mo` : '—'],
                ['Split', `${firm.profitSplit}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-white font-bold">{v}</span>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Drawdown</span>
                <DrawdownBadge type={firm.drawdownType} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">News</span>
                <Tag yes={firm.newsTrading} label={firm.newsTrading ? 'Allowed' : 'Blocked'} />
              </div>
            </div>
            {firm.hasPricePromos && (
              <div className="mt-3 w-full px-2 py-1.5 rounded-lg text-[10px] font-semibold text-amber-300 text-center"
                style={{ background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.2)' }}>
                🔥 {firm.promoNote}
              </div>
            )}
            <a href={firm.website} target="_blank" rel="noopener noreferrer"
              className="mt-3 w-full py-2 rounded-xl text-[11px] font-bold text-center transition-all hover:opacity-80"
              style={{ background: `${firm.color}20`, border: `1px solid ${firm.color}35`, color: firm.color }}>
              Visit {firm.shortName} →
            </a>
          </div>
        )
      })}
    </div>
  )
}

function FirmRow({ firm, selectedSize, onSelect, isSelected }: {
  firm: PropFirm; selectedSize: number; onSelect: () => void; isSelected: boolean
}) {
  const plan = firm.accounts.find(a => a.size === selectedSize)
  return (
    <div onClick={onSelect} className="relative rounded-xl p-4 cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
      style={{ background: isSelected ? `${firm.color}0c` : 'rgba(7,7,14,0.98)', border: `1px solid ${isSelected ? firm.color + '35' : 'rgba(255,255,255,0.06)'}` }}>
      <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-xl"
        style={{ background: `linear-gradient(90deg,transparent,${firm.color}50,transparent)`, opacity: isSelected ? 1 : 0.3 }} />
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
          style={{ background: `${firm.score! >= 80 ? '#34d399' : firm.score! >= 65 ? '#f59e0b' : '#f87171'}10`, border: `1px solid ${firm.score! >= 80 ? '#34d399' : firm.score! >= 65 ? '#f59e0b' : '#f87171'}25` }}>
          <ScoreBadge score={firm.score!} />
          <span className="text-[7px] text-slate-600 uppercase tracking-wider">score</span>
        </div>
        <div className="flex-shrink-0 min-w-[110px]">
          <p className="text-[13px] font-bold text-white">{firm.name}</p>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <DrawdownBadge type={firm.drawdownType} />
            {firm.liveAccount    && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>LIVE</span>}
            {firm.hasPricePromos && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>PROMO</span>}
          </div>
        </div>
        <div className="hidden md:block flex-shrink-0 text-center min-w-[80px]">
          {plan ? <><p className="text-[15px] font-black text-white">{formatPrice(plan.price)}</p><p className="text-[10px] text-slate-600">/month</p></> : <p className="text-[11px] text-slate-600">—</p>}
        </div>
        <div className="hidden md:block flex-shrink-0 text-center min-w-[60px]">
          <p className="text-[15px] font-black" style={{ color: firm.color }}>{firm.profitSplit}%</p>
          <p className="text-[10px] text-slate-600">split</p>
        </div>
        <div className="hidden lg:flex flex-wrap gap-1 flex-1">
          <Tag yes={firm.newsTrading} label="News" />
          <Tag yes={firm.liveAccount} label="Live" />
          <Tag yes={firm.drawdownType === 'eod'} label="EOD" />
        </div>
        <div className="hidden md:block flex-shrink-0 text-center min-w-[50px]">
          <p className="text-[15px] font-black text-slate-300">{firm.minTradingDays}</p>
          <p className="text-[10px] text-slate-600">min days</p>
        </div>
        <div className="flex-shrink-0 ml-auto text-slate-600 text-[12px]">{isSelected ? '▲' : '▼'}</div>
      </div>

      {isSelected && (
        <div className="mt-4 pt-4 border-t border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 mb-2">Account Plans</p>
            <div className="space-y-1.5">
              {firm.accounts.map(a => (
                <div key={a.size} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                  style={{ background: a.size === selectedSize ? `${firm.color}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${a.size === selectedSize ? firm.color + '22' : 'rgba(255,255,255,0.05)'}` }}>
                  <span className="text-[12px] font-bold text-white">{formatSize(a.size)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">{formatPrice(a.price)}/mo</span>
                    <span className="text-[10px] text-slate-600">Reset: {formatPrice(a.resetPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 mb-2">Details</p>
            {[
              ['Max Drawdown', `${firm.maxDrawdown}%`],
              ['Daily Loss',   firm.dailyLoss > 0 ? `${firm.dailyLoss}%` : 'None'],
              ['Payout',       firm.payoutSpeed],
              ['Instruments',  firm.instruments.join(', ')],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-[11px]">
                <span className="text-slate-500 flex-shrink-0">{k}</span>
                <span className="text-slate-300 text-right">{v}</span>
              </div>
            ))}
            <div className="mt-2 space-y-1">
              {firm.highlights.map(h => (
                <p key={h} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                  <span style={{ color: firm.color, flexShrink: 0 }}>▸</span>{h}
                </p>
              ))}
            </div>
          </div>
          {firm.hasPricePromos && firm.promoNote && (
            <div className="col-span-full px-3 py-2 rounded-lg text-[11px] text-amber-300"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
              🔥 {firm.promoNote}
            </div>
          )}
          <div className="col-span-full flex items-center justify-between flex-wrap gap-2">
            <p className="text-[10px] text-slate-700">Last verified {firm.lastVerified} — confirm on official site.</p>
            <a href={firm.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-[11px] transition-all hover:opacity-80"
              style={{ background: `${firm.color}18`, border: `1px solid ${firm.color}30`, color: firm.color }}>
              Visit {firm.name} →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export function PropFirms() {
  const [selectedSize, setSelectedSize] = useState(100000)
  const [sortBy, setSortBy]             = useState<'score' | 'price' | 'split' | 'days'>('score')
  const [filterNews, setFilterNews]     = useState(false)
  const [filterEOD,  setFilterEOD]      = useState(false)
  const [filterLive, setFilterLive]     = useState(false)
  const [expanded,   setExpanded]       = useState<string | null>(null)

  const sorted = useMemo(() => {
    let list = [...FIRMS]
    if (filterNews) list = list.filter(f => f.newsTrading)
    if (filterEOD)  list = list.filter(f => f.drawdownType === 'eod')
    if (filterLive) list = list.filter(f => f.liveAccount)
    list.sort((a, b) => {
      if (sortBy === 'score') return (b.score ?? 0) - (a.score ?? 0)
      if (sortBy === 'split') return b.profitSplit - a.profitSplit
      if (sortBy === 'days')  return a.minTradingDays - b.minTradingDays
      const pa = a.accounts.find(x => x.size === selectedSize)?.price ?? 9999
      const pb = b.accounts.find(x => x.size === selectedSize)?.price ?? 9999
      return pa - pb
    })
    return list
  }, [sortBy, filterNews, filterEOD, filterLive, selectedSize])

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6" style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>

      {/* Header */}
      <div className="text-center py-2">
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-amber-500/60 mb-2">Live Rankings</p>
        <h1 className="font-black text-white mb-2" style={{ fontSize: 'clamp(22px,4vw,36px)', letterSpacing: '-1px' }}>
          Prop Firm Comparison
        </h1>
        <p className="text-[13px] text-slate-500" style={{ maxWidth: '420px', margin: '0 auto' }}>
          {FIRMS.length} futures prop firms scored for ICT and SMC traders. Real prices, real rules.
        </p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { val: `${FIRMS.length}`,                                      label: 'Firms',         color: '#f59e0b' },
          { val: `${FIRMS.filter(f => f.newsTrading).length}`,            label: 'Allow News',    color: '#34d399' },
          { val: `${FIRMS.filter(f => f.drawdownType === 'eod').length}`, label: 'EOD Drawdown',  color: '#60a5fa' },
          { val: `${FIRMS.filter(f => f.liveAccount).length}`,            label: 'Live Accounts', color: '#c084fc' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(7,7,14,0.98)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-black text-[22px]" style={{ color: s.color, fontFamily: "'JetBrains Mono',monospace", textShadow: `0 0 16px ${s.color}40` }}>{s.val}</p>
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Podium size selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-amber-500/60">Top 3 Leaderboard</p>
          <div className="flex gap-1.5">
            {[50000, 100000, 150000].map(s => (
              <button key={s} onClick={() => setSelectedSize(s)}
                className="px-3 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: selectedSize === s ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selectedSize === s ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.07)'}`, color: selectedSize === s ? '#f59e0b' : '#64748b' }}>
                ${(s / 1000).toFixed(0)}K
              </button>
            ))}
          </div>
        </div>
        <Podium selectedSize={selectedSize} />
      </div>

      {/* Filters */}
      <div className="rounded-xl p-3" style={{ background: 'rgba(7,7,14,0.98)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider w-8">Size</span>
            {ACCOUNT_SIZES.map(s => (
              <button key={s} onClick={() => setSelectedSize(s)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: selectedSize === s ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedSize === s ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.06)'}`, color: selectedSize === s ? '#f59e0b' : '#64748b' }}>
                {formatSize(s)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider w-8">Sort</span>
            {(['score', 'price', 'split', 'days'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all"
                style={{ background: sortBy === s ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${sortBy === s ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.06)'}`, color: sortBy === s ? '#60a5fa' : '#64748b' }}>
                {s === 'days' ? 'Min Days' : s}
              </button>
            ))}
            <div className="w-px h-4 bg-slate-800/60 mx-1" />
            {[
              { label: 'News',    val: filterNews, set: setFilterNews },
              { label: 'EOD',     val: filterEOD,  set: setFilterEOD  },
              { label: 'Live',    val: filterLive, set: setFilterLive },
            ].map(({ label, val, set }) => (
              <button key={label} onClick={() => set(!val)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{ background: val ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${val ? 'rgba(52,211,153,0.28)' : 'rgba(255,255,255,0.06)'}`, color: val ? '#34d399' : '#64748b' }}>
                {val ? '✓ ' : ''}{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Firm list */}
      <div>
        <p className="text-[11px] text-slate-600 mb-3">{sorted.length} firm{sorted.length !== 1 ? 's' : ''} — click to expand · priced at {formatSize(selectedSize)}</p>
        <div className="space-y-2">
          {sorted.map(firm => (
            <FirmRow key={firm.id} firm={firm} selectedSize={selectedSize}
              isSelected={expanded === firm.id}
              onSelect={() => setExpanded(expanded === firm.id ? null : firm.id)} />
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-slate-700 text-center pb-4">
        Prices are approximate and change frequently during promotions. Always verify on official firm sites before purchasing. Not financial advice.
      </p>
    </div>
  )
}
