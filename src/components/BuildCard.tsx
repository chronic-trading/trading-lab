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
      <div className="bg-[#0b0b12] border border-slate-800/60 rounded-2xl p-5 space-y-4 hover:border-slate-700/60 transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {build.instrument}
              </span>
              <span className="text-[11px] text-slate-600">{new Date(build.createdAt).toLocaleDateString()}</span>
            </div>
            <h3 className="text-[15px] font-bold text-slate-100 truncate">{build.name}</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">{conceptList.length} concept{conceptList.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={() => onShare(build)} title="Copy share link" className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all">
              <Share2 size={14} />
            </button>
            <button onClick={() => setExportOpen(true)} title="Export build" className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-blue-300 hover:bg-blue-500/10 transition-all">
              <FileText size={14} />
            </button>
            <button onClick={() => onLoad(build)} title="Load into builder" className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all">
              <ExternalLink size={14} />
            </button>
            <button onClick={() => onDelete(build.id)} title="Delete" className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-400/8 transition-all">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Concept chips — show first 8, then a +N more badge */}
        <div className="flex flex-wrap gap-1.5">
          {conceptList.slice(0, 8).map(c => c && (
            <div key={c.id} className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/50 rounded-xl px-2.5 py-1">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tierBar[c.tier]}`} />
              <span className="text-[12px] font-medium text-slate-300">{c.shortName}</span>
            </div>
          ))}
          {conceptList.length > 8 && (
            <div className="flex items-center px-2.5 py-1 rounded-xl border border-slate-800/50 bg-slate-900/40">
              <span className="text-[11px] font-semibold text-slate-500">+{conceptList.length - 8} more</span>
            </div>
          )}
        </div>

        {build.notes && (
          <div className="flex gap-2.5 bg-slate-900/40 rounded-xl p-3 border border-slate-800/40">
            <BookOpen size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-slate-400 leading-relaxed">{build.notes}</p>
          </div>
        )}
      </div>

      <ExportBuildModal build={build} open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  )
}
