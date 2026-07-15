import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { parseCSV, detectColumns, buildTrades, combineTrades } from './lib/csvParser'
import type { Trade, ColumnMap } from './lib/csvParser'
import { exportToPng, exportAllCardsToPng } from './lib/export'
import { generateVideoMontage, videoCapability } from './lib/videoExport'
import { THEMES } from './lib/themes'
import type { ThemeKey } from './lib/themes'
import { TradeCard } from './components/TradeCard'
import { Montage } from './components/Montage'
import { ColumnMapper } from './components/ColumnMapper'
import { Toolbar } from './components/Toolbar'
import { Slideshow } from './components/Slideshow'
import { StatsPanel } from './components/StatsPanel'
import type { FilterMode, SortMode } from './components/Toolbar'

type Step = 'upload' | 'mapping' | 'preview'
type View = 'cards' | 'montage' | 'video'

interface TradeEntry {
  trade: Trade
  disabled: boolean
  note: string
  selected: boolean
}

export function RecapPage() {
  // Recap is a dark studio: all ten card themes are dark, and this page paints no
  // background of its own — it draws its text straight from the card theme
  // (e.g. textPrimary '#e8f4ff') via inline styles. In the app's light theme that
  // near-white text landed on the warm-paper shell background at ~1.02 contrast,
  // i.e. invisible. Pin dark while the tab is mounted and restore on exit, the
  // same way the marketing Landing does.
  useEffect(() => {
    const html = document.documentElement
    const prev = html.getAttribute('data-theme') ?? 'light'
    html.setAttribute('data-theme', 'dark')
    return () => html.setAttribute('data-theme', prev)
  }, [])

  const [step, setStep]               = useState<Step>('upload')
  const [view, setView]               = useState<View>('cards')
  const [isDragging, setIsDragging]   = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [videoError, setVideoError]   = useState<string | null>(null)
  const [headers, setHeaders]         = useState<string[]>([])
  const [rows, setRows]               = useState<Record<string, string>[]>([])
  const [columnMap, setColumnMap]     = useState<ColumnMap>({})
  const [entries, setEntries]         = useState<TradeEntry[]>([])
  const [montageLabel, setMontageLabel] = useState('')
  const [themeKey, setThemeKey]       = useState<ThemeKey>('midnight')
  const [filterMode, setFilterMode]   = useState<FilterMode>('all')
  const [sortBy, setSortBy]           = useState<SortMode>('default')
  const [selectMode, setSelectMode]   = useState(false)
  const [slideshowOpen, setSlideshowOpen] = useState(false)
  const [symbolSearch, setSymbolSearch]   = useState('')
  const [showStats, setShowStats]         = useState(false)

  const montageRef          = useRef<HTMLDivElement>(null)
  const cardRefs            = useRef<(HTMLDivElement | null)[]>([])
  const videoCardContainerRef = useRef<HTMLDivElement>(null)

  const theme = THEMES[themeKey]

  /* ── CSV processing ─────────────────────────────────────── */
  const [filesLoaded, setFilesLoaded] = useState(0)

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const csvFiles = Array.from(files).filter(f => f.name.endsWith('.csv'))
    if (!csvFiles.length) return

    // Single file: use existing mapping flow if detection fails
    if (csvFiles.length === 1) {
      const { headers: h, rows: r } = await parseCSV(csvFiles[0])
      const detected = detectColumns(h)
      setHeaders(h); setRows(r); setColumnMap(detected)
      setFilesLoaded(1)
      if (!detected.symbol && !detected.pnl) {
        setStep('mapping')
      } else {
        setEntries(buildTrades(r, detected).map(t => ({ trade: t, disabled: false, note: '', selected: false })))
        setStep('preview')
      }
      return
    }

    // Multiple files: parse all, merge all auto-detected trades
    const allEntries: TradeEntry[] = []
    let fileIdx = 0
    for (const file of csvFiles) {
      const { headers: h, rows: r } = await parseCSV(file)
      const detected = detectColumns(h)
      if (!detected.symbol && !detected.pnl) continue // skip unmappable files
      const trades = buildTrades(r, detected).map((t, i) => ({
        trade: { ...t, id: `f${fileIdx}-${i}-${t.id}` },
        disabled: false,
        note: '',
        selected: false,
      }))
      allEntries.push(...trades)
      fileIdx++
    }
    if (allEntries.length) {
      setFilesLoaded(fileIdx)
      setEntries(allEntries)
      setStep('preview')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files)
  }, [processFiles])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files)
    e.target.value = ''
  }, [processFiles])

  const confirmMapping = useCallback(() => {
    setEntries(buildTrades(rows, columnMap).map(t => ({ trade: t, disabled: false, note: '', selected: false })))
    setStep('preview')
  }, [rows, columnMap])

  /* ── Entry mutations ─────────────────────────────────────── */
  const updateEntry = useCallback((id: string, patch: Partial<TradeEntry>) =>
    setEntries(prev => prev.map(e => e.trade.id === id ? { ...e, ...patch } : e)), [])

  const deleteEntry = useCallback((id: string) =>
    setEntries(prev => prev.filter(e => e.trade.id !== id)), [])

  const combineSelected = useCallback(() => {
    const sel = entries.filter(e => e.selected)
    if (sel.length < 2) return
    const merged = combineTrades(sel.map(e => e.trade))
    const idx = entries.findIndex(e => e.selected)
    setEntries(prev => {
      const rest = prev.filter(e => !e.selected)
      rest.splice(idx, 0, { trade: merged, disabled: false, note: `Combined ${sel.length} trades`, selected: false })
      return rest
    })
    setSelectMode(false)
  }, [entries])

  const clearSelection = useCallback(() => {
    setEntries(prev => prev.map(e => ({ ...e, selected: false })))
    setSelectMode(false)
  }, [])

  /* ── Derived state ────────────────────────────────────────── */
  const activeTrades = useMemo(() => entries.filter(e => !e.disabled).map(e => e.trade), [entries])

  const bestTradeId = useMemo(() =>
    activeTrades.length ? activeTrades.reduce((b, t) => t.pnl > b.pnl ? t : b).id : null, [activeTrades])

  const worstTradeId = useMemo(() =>
    activeTrades.length ? activeTrades.reduce((w, t) => t.pnl < w.pnl ? t : w).id : null, [activeTrades])

  const visibleEntries = useMemo(() => {
    let r = [...entries]
    if (filterMode === 'wins')   r = r.filter(e => e.trade.isWin)
    if (filterMode === 'losses') r = r.filter(e => !e.trade.isWin)
    if (symbolSearch)            r = r.filter(e => e.trade.symbol.includes(symbolSearch))
    if (sortBy === 'pnl_desc')   r.sort((a, b) => b.trade.pnl - a.trade.pnl)
    if (sortBy === 'pnl_asc')    r.sort((a, b) => a.trade.pnl - b.trade.pnl)
    if (sortBy === 'symbol')     r.sort((a, b) => a.trade.symbol.localeCompare(b.trade.symbol))
    if (sortBy === 'date')       r.sort((a, b) => a.trade.openDate.localeCompare(b.trade.openDate))
    return r
  }, [entries, filterMode, symbolSearch, sortBy])

  const montageEntries = useMemo(() => entries.filter(e => !e.disabled), [entries])

  /* ── Exports ──────────────────────────────────────────────── */
  const exportMontage = useCallback(async () => {
    if (!montageRef.current) return
    setIsExporting(true)
    await exportToPng(montageRef.current, `trade-montage-${Date.now()}.png`)
    setIsExporting(false)
  }, [])

  const exportCards = useCallback(async () => {
    const els = cardRefs.current.filter(Boolean) as HTMLElement[]
    if (!els.length) return
    setIsExporting(true)
    await exportAllCardsToPng(els)
    setIsExporting(false)
  }, [])

  const exportVideo = useCallback(async () => {
    setVideoError(null)
    if (!activeTrades.length) { setVideoError('No active trades.'); return }
    const container = videoCardContainerRef.current
    if (!container) { setVideoError('Container not found.'); return }
    const prev = container.style.cssText
    container.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;z-index:-1;display:flex;flex-wrap:wrap;'
    await new Promise(r => setTimeout(r, 80))
    const els = Array.from(container.querySelectorAll('[data-video-card]')) as HTMLElement[]
    if (!els.length) { container.style.cssText = prev; setVideoError('No cards found.'); return }
    setIsExporting(true); setExportProgress(0)
    try {
      await generateVideoMontage({
        trades: activeTrades, cardElements: els, theme,
        label: montageLabel || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        onProgress: setExportProgress,
      })
    } catch (e) {
      setVideoError(e instanceof Error ? e.message : String(e))
    } finally {
      container.style.cssText = prev
      setIsExporting(false); setExportProgress(0)
    }
  }, [activeTrades, theme, montageLabel])

  const reset = useCallback(() => {
    setStep('upload'); setEntries([]); setHeaders([]); setRows([])
    setColumnMap({}); setSelectMode(false); setFilterMode('all')
    setSortBy('default'); setSymbolSearch(''); setShowStats(false)
    setFilesLoaded(0); cardRefs.current = []
  }, [])

  const selectedCount = entries.filter(e => e.selected).length
  const cap = videoCapability()

  const handleExport = useCallback(() => {
    if (view === 'montage') exportMontage()
    else if (view === 'video') setSlideshowOpen(true)
    else exportCards()
  }, [view, exportMontage, exportCards, exportVideo])

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: theme.montageBg }}>

      {/* Sub-nav: view switcher + export */}
      {step === 'preview' && (
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 bg-[#06060d] border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <button onClick={reset}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all">
              ← New Import
            </button>
            {filesLoaded > 1 && (
              <span className="text-[10px] font-mono px-2 py-1 rounded-md"
                style={{ background: `${theme.accent}15`, border: `1px solid ${theme.accent}30`, color: theme.accentText }}>
                {filesLoaded} files merged
              </span>
            )}
            <div className="flex bg-slate-900/60 border border-slate-800 rounded-xl p-0.5 gap-0.5">
              {(['cards', 'montage', 'video'] as View[]).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all
                    ${view === v ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>
                  {v === 'cards' ? '⊞ Cards' : v === 'montage' ? '⊟ Montage' : '▶ Video'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleExport} disabled={isExporting}
            className={`flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-xl border transition-all
              ${isExporting
                ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/25 cursor-pointer'}`}>
            {isExporting
              ? `◌ ${Math.round(exportProgress * 100)}%`
              : view === 'montage' ? '↓ PNG' : view === 'video' ? '▶ Play' : '↓ Cards'}
          </button>
        </div>
      )}

      {/* Toolbar */}
      {step === 'preview' && (
        <Toolbar
          theme={theme} onThemeChange={setThemeKey}
          filterMode={filterMode} onFilterChange={setFilterMode}
          sortBy={sortBy} onSortChange={setSortBy}
          symbolSearch={symbolSearch} onSymbolSearch={setSymbolSearch}
          showStats={showStats} onToggleStats={() => setShowStats(v => !v)}
          selectMode={selectMode} onSelectModeChange={v => { setSelectMode(v); if (!v) clearSelection() }}
          selectedCount={selectedCount} onCombine={combineSelected} onClearSelection={clearSelection}
          totalTrades={entries.length} visibleCount={visibleEntries.length}
        />
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-6 py-8 min-h-full">

          {/* ── UPLOAD ── */}
          {step === 'upload' && (
            <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto animate-recap-fade-up">
              <div className="text-center">
                <h2 className="font-black mb-2"
                  style={{ fontSize: 40, letterSpacing: '-2px', lineHeight: 1, color: theme.textPrimary }}>
                  Trade Recap
                </h2>
                <p style={{ color: theme.textSecondary, fontSize: 15 }}>
                  Drop your broker CSV and get stunning trade cards instantly.
                </p>
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => document.getElementById('recap-file-input')?.click()}
                className="w-full rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300"
                style={{
                  minHeight: 180,
                  border: `2px dashed ${isDragging ? theme.accent + 'cc' : theme.divider}`,
                  background: isDragging ? `${theme.accent}08` : theme.surface2,
                  boxShadow: isDragging ? `0 0 40px ${theme.accent}18` : 'none',
                }}>
                <div className="text-3xl" style={{ transform: isDragging ? 'scale(1.1) rotate(-4deg)' : 'scale(1)', transition: 'transform 0.2s' }}>📂</div>
                <div className="text-center">
                  <p className="font-semibold text-sm mb-1" style={{ color: theme.textSecondary }}>
                    {isDragging ? 'Drop it in' : 'Drop one or more CSVs here'}
                  </p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    Apex · FTMO · TopStep · TradeStation · Webull & more
                  </p>
                </div>
                <div className="px-4 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: `${theme.accent}18`, color: theme.accentText, border: `1px solid ${theme.accent}40` }}>
                  or click to browse
                </div>
              </div>
              <input id="recap-file-input" type="file" accept=".csv" multiple className="hidden" onChange={handleFile} />

              <div className="flex flex-wrap justify-center gap-1.5">
                {['Apex Trader', 'FTMO', 'TopStep', 'TradeStation', 'TD Ameritrade', 'Webull', 'Tradovate', '+ more'].map(b => (
                  <span key={b} className="px-2.5 py-0.5 rounded-full text-xs font-mono"
                    style={{ background: theme.surface2, border: `1px solid ${theme.divider}`, color: theme.textMuted }}>{b}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── MAPPING ── */}
          {step === 'mapping' && (
            <div className="animate-recap-fade-up">
              <ColumnMapper headers={headers} map={columnMap} onChange={setColumnMap} onConfirm={confirmMapping} />
            </div>
          )}

          {/* ── PREVIEW ── */}
          {step === 'preview' && (
            <div className="w-full animate-recap-fade-up flex flex-col gap-6">

              {/* Label input */}
              {(view === 'montage' || view === 'video') && (
                <div className="flex justify-center">
                  <input type="text" placeholder="Label — e.g. 'May 2025'" value={montageLabel}
                    onChange={e => setMontageLabel(e.target.value)}
                    className="w-full max-w-xs px-4 py-2 rounded-xl text-sm font-mono outline-none text-center"
                    style={{ background: theme.surface, border: `1px solid ${montageLabel ? theme.accent + '50' : theme.divider}`, color: theme.textSecondary }} />
                </div>
              )}

              {/* Cards */}
              {view === 'cards' && (
                <div className="flex flex-col gap-6 items-center">
                  <div className="flex flex-wrap gap-4 justify-center">
                    {visibleEntries.map((entry, i) => (
                      <div key={entry.trade.id} ref={el => { if (!entry.disabled) cardRefs.current[i] = el }}>
                        <TradeCard
                          trade={entry.trade} theme={theme} rank={entries.indexOf(entry)}
                          note={entry.note} disabled={entry.disabled} selected={entry.selected}
                          selectMode={selectMode}
                          isBest={entry.trade.id === bestTradeId}
                          isWorst={entry.trade.id === worstTradeId}
                          entranceIndex={i}
                          onDelete={() => deleteEntry(entry.trade.id)}
                          onToggleDisabled={() => updateEntry(entry.trade.id, { disabled: !entry.disabled })}
                          onToggleSelected={() => updateEntry(entry.trade.id, { selected: !entry.selected })}
                          onNoteChange={note => updateEntry(entry.trade.id, { note })}
                        />
                      </div>
                    ))}
                    {visibleEntries.length === 0 && (
                      <p className="text-sm font-mono" style={{ color: theme.textMuted }}>No trades match the current filter.</p>
                    )}
                  </div>
                  {showStats && activeTrades.length > 0 && (
                    <div className="w-full max-w-4xl">
                      <StatsPanel trades={activeTrades} theme={theme} />
                    </div>
                  )}
                </div>
              )}

              {/* Montage */}
              {view === 'montage' && (
                <div className="flex justify-center overflow-x-auto pb-2">
                  <div ref={montageRef}>
                    <Montage trades={montageEntries.map(e => e.trade)} theme={theme} label={montageLabel || undefined} />
                  </div>
                </div>
              )}

              {/* Video */}
              {view === 'video' && (
                <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
                  <div className="rounded-2xl px-8 py-6 w-full text-center"
                    style={{ background: theme.surface, border: `1px solid ${theme.divider}` }}>
                    <div className="text-3xl mb-3">▶</div>
                    <h3 className="font-bold text-base mb-2" style={{ color: theme.textPrimary }}>Video Montage</h3>
                    <p className="text-sm mb-3" style={{ color: theme.textSecondary }}>
                      Fullscreen animated slideshow — works on every device including iPhone.
                    </p>
                    <p className="text-xs font-mono mb-4" style={{ color: theme.textMuted }}>
                      {activeTrades.length} trades · ~{Math.ceil(3 + activeTrades.length * 2.4 + 6)}s
                    </p>
                    <button onClick={() => setSlideshowOpen(true)}
                      className="w-full py-2.5 rounded-xl font-bold text-sm border-none"
                      style={{ background: theme.accent, color: theme.bgBase, boxShadow: `0 0 16px ${theme.accent}50`, cursor: 'pointer' }}>
                      ▶ Play Now
                    </button>
                  </div>

                  {cap !== 'none' && (
                    <div className="rounded-2xl px-8 py-4 w-full"
                      style={{ background: theme.surface2, border: `1px solid ${theme.divider}` }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: theme.textSecondary }}>
                        Download {cap === 'mp4' ? 'MP4' : 'WebM'} file
                      </p>
                      {videoError && (
                        <p className="text-xs font-mono mb-2" style={{ color: theme.loss }}>{videoError}</p>
                      )}
                      {isExporting ? (
                        <div>
                          <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: theme.surface }}>
                            <div className="h-full rounded-full" style={{ width: `${exportProgress * 100}%`, background: theme.accent }} />
                          </div>
                          <p className="text-xs font-mono" style={{ color: theme.textMuted }}>{Math.round(exportProgress * 100)}%</p>
                        </div>
                      ) : (
                        <button onClick={exportVideo}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border-none"
                          style={{ background: theme.surface, border: `1px solid ${theme.divider}`, color: theme.textSecondary, cursor: 'pointer' }}>
                          ↓ Export {cap === 'mp4' ? 'MP4' : 'WebM'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-center font-mono text-center" style={{ color: theme.textMuted, fontSize: 11 }}>
                {activeTrades.length} active · {entries.filter(e => e.disabled).length} hidden · hover card to manage
              </p>

              {/* Off-screen cards for video */}
              <div ref={videoCardContainerRef} style={{ position: 'fixed', top: '-9999px', left: 0, pointerEvents: 'none', display: 'flex', flexWrap: 'wrap' }}>
                {activeTrades.map(trade => (
                  <div key={trade.id} data-video-card="true">
                    <TradeCard trade={trade} theme={theme} exportMode />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slideshow overlay */}
      {slideshowOpen && activeTrades.length > 0 && (
        <Slideshow
          trades={activeTrades} theme={theme}
          label={montageLabel || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          onClose={() => setSlideshowOpen(false)}
        />
      )}
    </div>
  )
}
