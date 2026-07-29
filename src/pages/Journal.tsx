import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, BookOpen, X, Save, BarChart2, List, Radio, FlaskConical } from 'lucide-react'
import { useJournal, KILLZONES, type JournalEntry, type JournalMode, type Killzone } from '../hooks/useJournal'
import { JournalAnalytics } from '../components/JournalAnalytics'
import { concepts, getConceptById } from '../data/concepts'
import { useBuilds } from '../hooks/useBuilds'
import { POINT_VALUES } from '../hooks/useSettings'
import type { Instrument } from '../types'

const instruments: Instrument[] = ['EURUSD','GBPUSD','USDJPY','GBPJPY','AUDUSD','NZDUSD'] as Instrument[]
const resultConfig = {
  win:       { label: 'Win',       icon: TrendingUp,   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  loss:      { label: 'Loss',      icon: TrendingDown, color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30'         },
  breakeven: { label: 'Breakeven', icon: Minus,        color: 'text-[var(--text-dim)]',   bg: 'bg-[var(--surface-hover)] border-[var(--border)]'     },
}

const tierDot: Record<string, string> = {
  basic: 'bg-emerald-400', intermediate: 'bg-blue-400', advanced: 'bg-purple-400',
}

// Selected-state styling per killzone (matches KillZoneClock colors)
const kzActive: Record<Killzone, string> = {
  'Asian':  'bg-indigo-500/15 border-indigo-500/45 text-indigo-300',
  'London': 'bg-blue-500/15 border-blue-500/45 text-blue-300',
  'NY AM':  'bg-emerald-500/15 border-emerald-500/45 text-emerald-300',
  'NY PM':  'bg-amber-500/15 border-amber-500/45 text-amber-300',
  'Other':  'bg-[var(--border-strong)] border-[var(--border-strong)] text-[var(--text-dim)]',
}

// ── Log Trade Modal ──────────────────────────────────────────────────────────
function LogModal({ open, onClose, onSave, existing }: {
  open: boolean; onClose: () => void; onSave: (e: JournalEntry) => void; existing?: JournalEntry | null
}) {
  const { builds } = useBuilds()
  const [date,       setDate]       = useState(existing?.date       ?? new Date().toISOString().slice(0,10))
  const [instrument, setInstrument] = useState<Instrument>(existing?.instrument ?? 'EURUSD')
  const [direction,  setDirection]  = useState<'long'|'short'>(existing?.direction ?? 'long')
  const [result,     setResult]     = useState<'win'|'loss'|'breakeven'>(existing?.result ?? 'win')
  const [mode,       setMode]       = useState<JournalMode>(existing?.mode ?? 'live')
  const [killzone,   setKillzone]   = useState<Killzone | null>(existing?.killzone ?? null)
  const [conceptIds, setConceptIds] = useState<string[]>(existing?.conceptIds ?? [])
  const [points,     setPoints]     = useState<string>(existing?.points?.toString() ?? '')
  const [notes,      setNotes]      = useState(existing?.notes ?? '')
  const [buildId,    setBuildId]    = useState('')

  const loadBuild = (id: string) => {
    const b = builds.find(x => x.id === id)
    if (b) { setConceptIds(b.conceptIds); setInstrument(b.instrument) }
    setBuildId(id)
  }

  const toggleConcept = (id: string) =>
    setConceptIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleSave = () => {
    onSave({
      id:        existing?.id ?? crypto.randomUUID(),
      date, instrument, direction, result, mode, killzone, conceptIds,
      points:    points ? parseFloat(points) : null,
      notes,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    })
    onClose()
  }

  const pts = parseFloat(points)
  const dollarEst = !isNaN(pts) && pts !== 0 ? Math.abs(pts) * POINT_VALUES[instrument] : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm px-3 md:px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg tl-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-[15px] font-bold text-[var(--text)]">{existing ? 'Edit Trade' : 'Log a Trade'}</h2>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-xl text-[var(--text-dim)] hover:text-[var(--text-dim)] hover:bg-[var(--surface-2)] transition-all">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">

              {/* Live / Backtest toggle */}
              <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl p-0.5 gap-0.5">
                <button
                  onClick={() => setMode('live')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${mode === 'live' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-[var(--text-dim)] hover:text-[var(--text-dim)]'}`}
                >
                  <Radio size={11} /> Live Trade
                </button>
                <button
                  onClick={() => setMode('backtest')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${mode === 'backtest' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'text-[var(--text-dim)] hover:text-[var(--text-dim)]'}`}
                >
                  <FlaskConical size={11} /> Backtest
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[var(--text-dim)]">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--border-strong)] transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[var(--text-dim)]">Instrument</label>
                  <div className="grid grid-cols-4 gap-1">
                    {instruments.map(i => (
                      <button key={i} onClick={() => setInstrument(i)}
                        className={`py-2 rounded-xl border text-[11px] font-bold transition-all ${instrument === i ? 'bg-amber-500/15 border-amber-500/45 text-amber-300' : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-strong)] hover:text-[var(--text-dim)]'}`}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[var(--text-dim)]">Direction</label>
                  <div className="flex gap-2">
                    {(['long', 'short'] as const).map(d => (
                      <button key={d} onClick={() => setDirection(d)}
                        className={`flex-1 py-2 rounded-xl border text-[12px] font-semibold capitalize transition-all
                          ${direction === d
                            ? d === 'long' ? 'bg-emerald-500/12 border-emerald-500/45 text-emerald-300' : 'bg-red-500/12 border-red-500/45 text-red-300'
                            : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-strong)] hover:text-[var(--text-dim)]'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[var(--text-dim)]">Result</label>
                  <div className="flex gap-1.5">
                    {(['win', 'loss', 'breakeven'] as const).map(r => {
                      const cfg = resultConfig[r]
                      return (
                        <button key={r} onClick={() => setResult(r)}
                          className={`flex-1 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all
                            ${result === r ? cfg.bg + ' ' + cfg.color : 'border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--border-strong)]'}`}>
                          {r === 'breakeven' ? 'BE' : r}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-dim)]">Kill Zone</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {KILLZONES.map(kz => (
                    <button key={kz} onClick={() => setKillzone(k => k === kz ? null : kz)}
                      className={`py-2 rounded-xl border text-[10px] font-bold transition-all ${
                        killzone === kz ? kzActive[kz] : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-strong)] hover:text-[var(--text-dim)]'
                      }`}>
                      {kz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[var(--text-dim)]">Points / Ticks</label>
                  {dollarEst && (
                    <span className="text-[11px] font-bold text-amber-400">
                      ≈ ${dollarEst.toLocaleString()} on {instrument}
                    </span>
                  )}
                </div>
                <input
                  type="number" value={points} onChange={e => setPoints(e.target.value)}
                  placeholder="e.g. 45 or -12"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[13px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[var(--text-dim)]">Concepts in this trade</label>
                  {builds.length > 0 && (
                    <select value={buildId} onChange={e => loadBuild(e.target.value)}
                      className="text-[10px] bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1 text-[var(--text-dim)] focus:outline-none">
                      <option value="">load from build…</option>
                      {builds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {concepts.map(c => {
                    const on = conceptIds.includes(c.id)
                    return (
                      <button key={c.id} onClick={() => toggleConcept(c.id)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-[11px] font-medium transition-all
                          ${on ? 'bg-[var(--surface-hover)] border-[var(--border-strong)] text-[var(--text)]' : 'border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--border)] hover:text-[var(--text-dim)]'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${tierDot[c.tier]} ${on ? 'opacity-100' : 'opacity-30'}`} />
                        {c.shortName}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[var(--text-dim)]">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="What did you see? What went wrong or right?"
                  rows={3}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[13px] text-[var(--text)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-strong)] transition-colors resize-none" />
              </div>
            </div>

            <div className="flex gap-2.5 px-5 py-4 border-t border-[var(--border)]">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[13px] text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[13px] font-semibold hover:bg-amber-500/25 transition-all flex items-center justify-center gap-2">
                <Save size={13} /> Save Trade
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Main Journal Page ────────────────────────────────────────────────────────
export function Journal() {
  const { entries, addEntry, delEntry, editEntry, wins, losses, bes, total, winRate, totalPoints } = useJournal()
  const [logOpen,   setLogOpen]   = useState(false)
  const [editing,   setEditing]   = useState<JournalEntry | null>(null)
  const [view,      setView]      = useState<'trades' | 'analytics'>('trades')
  const [modeFilter, setModeFilter] = useState<'all' | 'live' | 'backtest'>('all')

  const filtered = entries.filter(e => modeFilter === 'all' || e.mode === modeFilter)
  const filteredWins  = filtered.filter(e => e.result === 'win').length
  const filteredTotal = filtered.length
  const filteredRate  = filteredTotal > 0 ? Math.round((filteredWins / filteredTotal) * 100) : 0
  const filteredPts   = filtered.reduce((s, e) => s + (e.points ?? 0), 0)
  const filteredLoss  = filtered.filter(e => e.result === 'loss').length
  const filteredBE    = filtered.filter(e => e.result === 'breakeven').length

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-elev)] flex-shrink-0">
        <div className="max-w-5xl mx-auto px-5 md:px-6 py-3 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-[15px] font-bold text-[var(--text)]">Trade Journal</h2>
          <p className="text-[11px] text-[var(--text-dim)] mt-0.5">{total} trade{total !== 1 ? 's' : ''} total</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode filter */}
          <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl p-0.5 gap-0.5">
            {([
              { id: 'all',      label: 'All',      icon: null },
              { id: 'live',     label: 'Live',     icon: Radio },
              { id: 'backtest', label: 'Backtest', icon: FlaskConical },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setModeFilter(id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all
                  ${modeFilter === id
                    ? id === 'live' ? 'bg-emerald-500/15 text-emerald-300' : id === 'backtest' ? 'bg-purple-500/15 text-purple-300' : 'bg-[var(--surface-hover)] text-[var(--text)]'
                    : 'text-[var(--text-dim)] hover:text-[var(--text-dim)]'}`}
              >
                {Icon && <Icon size={10} />} {label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl p-0.5 gap-0.5">
            <button
              onClick={() => setView('trades')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${view === 'trades' ? 'bg-[var(--surface-hover)] text-[var(--text)]' : 'text-[var(--text-dim)] hover:text-[var(--text-dim)]'}`}
            >
              <List size={11} /> Trades
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${view === 'analytics' ? 'bg-[var(--surface-hover)] text-[var(--text)]' : 'text-[var(--text-dim)] hover:text-[var(--text-dim)]'}`}
            >
              <BarChart2 size={11} /> Analytics
            </button>
          </div>

          {view === 'trades' && (
            <button
              onClick={() => { setEditing(null); setLogOpen(true) }}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/25 transition-all"
            >
              <Plus size={13} /> Log Trade
            </button>
          )}
        </div>
        </div>
      </div>

      {view === 'analytics' ? (
        <JournalAnalytics entries={filtered} />
      ) : (
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

          <div className="flex flex-col flex-1 overflow-hidden min-w-0">

            {/* Stats bar */}
            <div className="border-b border-[var(--border)] bg-[var(--bg-elev)] flex-shrink-0">
            <div className="grid grid-cols-2 md:grid-cols-4 max-w-5xl mx-auto w-full">
              {[
                { label: 'Showing',  value: filteredTotal, color: 'text-[var(--text)]' },
                { label: 'Win Rate', value: `${filteredRate}%`, color: filteredRate >= 60 ? 'text-emerald-400' : filteredRate >= 40 ? 'text-amber-400' : 'text-red-400' },
                { label: 'W/L/BE',   value: `${filteredWins}/${filteredLoss}/${filteredBE}`, color: 'text-[var(--text-dim)]', mono: true },
                { label: 'Pts',      value: filteredPts >= 0 ? `+${filteredPts}` : `${filteredPts}`, color: filteredPts >= 0 ? 'text-emerald-400' : 'text-red-400', mono: true },
              ].map(s => (
                // h-[60px] matches the Quick Stats header exactly, so the bottom
                // rules of the stats bar and the sidebar meet as one line.
                <div key={s.label} className="px-4 md:px-5 h-[60px] flex flex-col justify-center border-r border-[var(--border)] last:border-r-0">
                  <p className="text-[10px] text-[var(--text-faint)] uppercase tracking-wider font-semibold">{s.label}</p>
                  <p className={`text-[14px] font-bold mt-0.5 ${s.color}`} style={{ fontFamily: s.mono ? "'JetBrains Mono', monospace" : undefined }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
            </div>

            {/* Entry list */}
            <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-6 md:px-8 py-5 space-y-3">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center text-[22px]">📓</div>
                  <div className="text-center">
                    <p className="text-[14px] font-semibold text-[var(--text-dim)]">{entries.length === 0 ? 'No trades logged yet' : 'No trades match this filter'}</p>
                    <p className="text-[12px] text-[var(--text-faint)] mt-1.5">{entries.length === 0 ? 'Hit "Log Trade" to start tracking' : 'Switch the filter above to see other trades'}</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map(entry => {
                    const cfg = resultConfig[entry.result]
                    const Icon = cfg.icon
                    const entryConceptList = entry.conceptIds.map(id => getConceptById(id)).filter(Boolean)
                    const dollarVal = entry.points !== null ? Math.abs(entry.points) * POINT_VALUES[entry.instrument] : null
                    return (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className="tl-card p-5 hover:border-[var(--border)] transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                              <Icon size={14} className={cfg.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className={`text-[12px] font-bold ${cfg.color}`}>{cfg.label}</span>
                                <span className="text-[11px] font-bold text-amber-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{entry.instrument}</span>
                                <span className={`text-[11px] font-semibold capitalize ${entry.direction === 'long' ? 'text-emerald-400/70' : 'text-red-400/70'}`}>{entry.direction}</span>
                                {/* Mode badge */}
                                {entry.mode === 'backtest' && (
                                  <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-full">BT</span>
                                )}
                                {entry.killzone && (
                                  <span className="text-[10px] font-bold text-[var(--text-dim)] bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded-full">{entry.killzone}</span>
                                )}
                                {entry.points !== null && (
                                  <span className={`text-[11px] font-bold ml-auto ${(entry.points ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    {(entry.points ?? 0) >= 0 ? '+' : ''}{entry.points}pt
                                    {/* !!: dollarVal is 0 for breakeven trades, and `0 && …`
                                        renders the literal 0 — the row read "+0pt0". */}
                                    {!!dollarVal && <span className="text-[10px] text-[var(--text-faint)] ml-1">(${dollarVal.toLocaleString()})</span>}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--text-faint)]">{new Date(entry.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                              {entryConceptList.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {entryConceptList.map(c => c && (
                                    <span key={c.id} className="flex items-center gap-1 text-[10px] text-[var(--text-dim)] bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded-lg">
                                      <div className={`w-1 h-1 rounded-full ${tierDot[c.tier]}`} />
                                      {c.shortName}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {entry.notes && (
                                <div className="flex gap-2 mt-2.5 bg-[var(--surface)] rounded-xl p-2.5">
                                  <BookOpen size={11} className="text-[var(--text-faint)] mt-0.5 flex-shrink-0" />
                                  <p className="text-[11px] text-[var(--text-dim)] leading-relaxed">{entry.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => { setEditing(entry); setLogOpen(true) }}
                              className="w-7 h-7 rounded-xl text-[var(--text-faint)] hover:text-[var(--text-dim)] hover:bg-[var(--surface-2)] flex items-center justify-center transition-all text-[10px] font-bold">
                              Edit
                            </button>
                            <button onClick={() => delEntry(entry.id)}
                              className="w-7 h-7 rounded-xl text-[var(--text-faint)] hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-all">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>
            </div>
          </div>

          {/* Quick stats sidebar — desktop only */}
          <div className="hidden md:flex w-[240px] flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-elev)] flex-col overflow-hidden">
            {/* 61px, not 60: the stats bar is 60px cells + a 1px border on its
                wrapper, while this header's border-box keeps the border inside.
                Equal heights here means bottom rules meeting as one line. */}
            <div className="flex items-center gap-2.5 px-5 h-[61px] flex-shrink-0 border-b border-[var(--border)]">
              <BarChart2 size={12} className="text-blue-400" />
              <span className="text-[12px] font-semibold text-[var(--text)]">Quick Stats</span>
            </div>
            <div className="flex-1 p-5 space-y-5">
              {total > 0 && (
                <>
                  <div className="tl-card p-5 text-center">
                    <div className="relative w-16 h-16 mx-auto mb-2.5">
                      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#1e2030" strokeWidth="8" />
                        <circle cx="40" cy="40" r="32" fill="none"
                          stroke={winRate >= 60 ? '#34d399' : winRate >= 40 ? '#f59e0b' : '#f87171'}
                          strokeWidth="8" strokeDasharray={`${winRate * 2.01} 201`} strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.6s ease' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-[15px] font-bold ${winRate >= 60 ? 'text-emerald-400' : winRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{winRate}%</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-[var(--text-dim)]">{wins}W · {losses}L · {bes}BE</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-[var(--text-faint)]">Total points</p>
                    <p className={`text-[16px] font-bold mt-0.5 ${totalPoints >= 0 ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {totalPoints >= 0 ? '+' : ''}{totalPoints}
                    </p>
                  </div>
                  <p className="text-[10px] text-[var(--text-faint)] text-center">
                    Switch to <button onClick={() => setView('analytics')} className="text-blue-400 hover:underline font-semibold">Analytics</button> for full breakdown
                  </p>
                </>
              )}
              {total === 0 && (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                  <BarChart2 size={22} className="text-[var(--text-faint)]" />
                  <p className="text-[11px] text-[var(--text-faint)]">Log trades to see stats</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <LogModal
        open={logOpen}
        onClose={() => { setLogOpen(false); setEditing(null) }}
        onSave={e => { editing ? editEntry(e) : addEntry(e) }}
        existing={editing}
      />
    </div>
  )
}
