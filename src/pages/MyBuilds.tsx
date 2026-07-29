import { useState } from 'react'
import { Package, GitCompare } from 'lucide-react'
import { useBuilds } from '../hooks/useBuilds'
import { BuildCard } from '../components/BuildCard'
import { BuildCompareModal } from '../components/BuildCompareModal'
import type { Build } from '../types'

interface Props { onLoadBuild: (build: Build) => void }

export function MyBuilds({ onLoadBuild }: Props) {
  const { builds, deleteBuild, getBuildShareUrl } = useBuilds()
  const [compareOpen, setCompareOpen] = useState(false)

  const handleShare = async (build: Build) => {
    await navigator.clipboard.writeText(getBuildShareUrl(build))
  }

  if (builds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center py-24">
        <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center">
          <Package size={24} className="text-[var(--text-faint)]" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[var(--text-dim)]">No saved builds yet</p>
          <p className="text-[12px] text-[var(--text-faint)] mt-2 leading-relaxed">Craft a model in the Builder and hit Save Build</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-6 md:px-8 py-6 md:py-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-[var(--text)]">My Builds</h2>
              <p className="text-[12px] text-[var(--text-dim)] mt-0.5">{builds.length} saved</p>
            </div>
            {builds.length >= 2 && (
              <button
                onClick={() => setCompareOpen(true)}
                className="flex items-center gap-2 text-[12px] font-semibold px-3.5 py-2 rounded-xl border border-purple-500/30 bg-purple-500/8 text-purple-300 hover:bg-purple-500/15 hover:border-purple-500/50 transition-all"
              >
                <GitCompare size={13} /> Compare
              </button>
            )}
          </div>

          <div className="space-y-3">
            {builds.map(build => (
              <BuildCard
                key={build.id}
                build={build}
                onDelete={deleteBuild}
                onShare={handleShare}
                onLoad={onLoadBuild}
              />
            ))}
          </div>
        </div>
      </div>

      <BuildCompareModal open={compareOpen} onClose={() => setCompareOpen(false)} />
    </>
  )
}
