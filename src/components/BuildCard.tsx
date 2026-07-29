import { useState } from 'react'
import { Trash2, Share2, ExternalLink, BookOpen, FileText } from 'lucide-react'
import type { Build } from '../types'
import { getConceptById } from '../data/concepts'
import { ExportBuildModal } from './ExportBuildModal'

const tierBar: Record<string, string> = { basic: 'bg-emerald-400', intermediate: 'bg-blue-400', advanced: 'bg-purple-400' }

interface Props {
  build: Build
  onDelete: (id: string) => void
  onShare:  (build: Build) => void
  onLoad:   (build: Build) => void
}

export function BuildCard({ build, onDelete, onShare, onLoad }: Props) {
  const [exportOpen, setExportOpen] = useState(false)
  const conceptList = build.conceptIds.map(id => getConceptById(id)).filter(Boolean)

  return (
    <>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4 hover:border-[var(--border)] transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {build.instrument}
              </span>
              <span className="text-[11px] text-[var(--text-faint)]">{new Date(build.createdAt).toLocaleDateString()}</span>
            </div>
            <h3 className="text-[15px] font-bold text-[var(--text)] truncate">{build.name}</h3>
            <p className="text-[12px] text-[var(--text-dim)] mt-0.5">{conceptList.length} concept{conceptList.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={() => onShare(build)} title="Copy share link" className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all">
              <Share2 size={14} />
            </button>
            <button onClick={() => setExportOpen(true)} title="Export build" className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-dim)] hover:text-blue-300 hover:bg-blue-500/10 transition-all">
              <FileText size={14} />
            </button>
            <button onClick={() => onLoad(build)} title="Load into builder" className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all">
              <ExternalLink size={14} />
            </button>
            <button onClick={() => onDelete(build.id)} title="Delete" className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-faint)] hover:text-red-400 hover:bg-red-400/8 transition-all">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Concept chips — show first 8, then a +N more badge */}
        <div className="flex flex-wrap gap-1.5">
          {conceptList.slice(0, 8).map(c => c && (
            <div key={c.id} className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-2.5 py-1">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tierBar[c.tier]}`} />
              <span className="text-[12px] font-medium text-[var(--text-dim)]">{c.shortName}</span>
            </div>
          ))}
          {conceptList.length > 8 && (
            <div className="flex items-center px-2.5 py-1 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <span className="text-[11px] font-semibold text-[var(--text-dim)]">+{conceptList.length - 8} more</span>
            </div>
          )}
        </div>

        {build.notes && (
          <div className="flex gap-2.5 bg-[var(--surface)] rounded-xl p-3 border border-[var(--border)]">
            <BookOpen size={13} className="text-[var(--text-dim)] mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-[var(--text-dim)] leading-relaxed">{build.notes}</p>
          </div>
        )}
      </div>

      <ExportBuildModal build={build} open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  )
}
