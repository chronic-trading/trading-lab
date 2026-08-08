import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, Check, Download, Upload, AlertTriangle } from 'lucide-react'
import { useSettings, POINT_VALUES } from '../hooks/useSettings'
import { INSTRUMENTS } from '../data/instruments'
import type { Instrument } from '../types'
import { useModalBackButton } from '../hooks/useModalBackButton'

const BACKUP_KEYS = [
  'trading-lab-journal',
  'trading-lab-builds',
  'trading-lab-mastery',
  'trading-lab-plans',
  'trading-lab-concept-notes',
  'trading-lab-rules',
  'trading-lab-session-notes',
  'tl:settings',
  'tl:bookmarks',
  'tl:keylevels',
]

function exportData() {
  const data: Record<string, unknown> = {}
  for (const key of BACKUP_KEYS) {
    const val = localStorage.getItem(key)
    if (val !== null) {
      try { data[key] = JSON.parse(val) } catch { data[key] = val }
    }
  }
  const payload = { app: 'Trading Lab', version: 1, exportedAt: new Date().toISOString(), data }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `trading-lab-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const payload = JSON.parse(e.target?.result as string)
        if (!payload?.data || payload?.app !== 'Trading Lab') {
          reject(new Error('Not a valid Trading Lab backup file'))
          return
        }
        for (const [key, value] of Object.entries(payload.data)) {
          localStorage.setItem(key, JSON.stringify(value))
        }
        resolve()
      } catch {
        reject(new Error('Could not parse backup file'))
      }
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsText(file)
  })
}

interface Props { open: boolean; onClose: () => void }

export function SettingsModal({ open, onClose }: Props) {
  useModalBackButton(open, onClose)
  const { settings, update } = useSettings()
  const [accountSize, setAccountSize] = useState(settings.accountSize.toString())
  const [riskPercent, setRiskPercent] = useState(settings.riskPercent.toString())
  const [instrument,  setInstrument]  = useState<Instrument>(settings.defaultInstrument)
  const [saved,       setSaved]       = useState(false)
  const [importState, setImportState] = useState<'idle' | 'success' | 'error'>('idle')
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    const size = parseFloat(accountSize) || settings.accountSize
    const risk = parseFloat(riskPercent) || settings.riskPercent
    update({ accountSize: size, riskPercent: risk, defaultInstrument: instrument })
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 900)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await importData(file)
      setImportState('success')
      setTimeout(() => window.location.reload(), 1200)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
      setImportState('error')
      setTimeout(() => setImportState('idle'), 3000)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const riskDollar = ((parseFloat(accountSize) || 0) * (parseFloat(riskPercent) || 0) / 100)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.17 }}
            className="w-full max-w-sm bg-[var(--bg-elev)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center">
                  <Settings size={14} className="text-[var(--text-dim)]" />
                </div>
                <p className="text-[14px] font-bold text-[var(--text)]">Settings</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">

              {/* Account Size */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Account Size</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] text-[13px] font-semibold">$</span>
                  <input
                    type="number"
                    value={accountSize}
                    onChange={e => setAccountSize(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-7 pr-4 py-2.5 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>

              {/* Risk Per Trade */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Risk Per Trade</label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={riskPercent}
                      onChange={e => setRiskPercent(e.target.value)}
                      step="0.1"
                      placeholder="1"
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 pr-8 py-2.5 text-[13px] text-[var(--text)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] text-[12px]">%</span>
                  </div>
                  {riskDollar > 0 && (
                    <span className="text-[12px] font-semibold text-amber-400 flex-shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      = ${riskDollar.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  )}
                </div>
              </div>

              {/* Default Instrument */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Default Instrument</label>
                <div className="grid grid-cols-4 gap-2">
                  {INSTRUMENTS.map(i => (
                    <button key={i}
                      onClick={() => setInstrument(i)}
                      className={`py-2.5 rounded-xl border text-[12px] font-bold transition-all ${instrument === i ? 'bg-amber-500/15 border-amber-500/45 text-amber-300' : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-strong)] hover:text-[var(--text-dim)]'}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Point values reference */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <p className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider mb-2">Point Values (reference)</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {INSTRUMENTS.map(i => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{i}</span>
                      <span className="text-[11px] text-[var(--text-dim)]">${POINT_VALUES[i]}/pt</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data backup */}
              <div className="space-y-2 border-t border-[var(--border)] pt-4">
                <label className="text-[11px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Data Backup</label>
                <p className="text-[11px] text-[var(--text-faint)] leading-relaxed">
                  All your builds, journal entries, mastery ratings, plans, and notes are stored locally. Export a backup to protect against data loss.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={exportData}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/8 text-blue-300 text-[12px] font-semibold hover:bg-blue-500/15 transition-all"
                  >
                    <Download size={13} /> Export JSON
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[12px] font-semibold transition-all
                      ${importState === 'success' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : importState === 'error'   ? 'border-red-500/40 bg-red-500/10 text-red-300'
                      : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'}`}
                  >
                    {importState === 'success' ? <><Check size={13} /> Imported!</>
                    : importState === 'error'  ? <><AlertTriangle size={13} /> Failed</>
                    : <><Upload size={13} /> Import</>}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImport}
                  />
                </div>
                {importState === 'error' && importError && (
                  <p className="text-[10px] text-red-400 leading-relaxed">{importError}</p>
                )}
                {importState === 'success' && (
                  <p className="text-[10px] text-emerald-400">Reloading to apply your data…</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2.5 px-5 py-4 border-t border-[var(--border)]">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[12px] text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-all
                  ${saved ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300' : 'bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25'}`}
              >
                {saved ? <><Check size={13} /> Saved!</> : 'Save Settings'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
