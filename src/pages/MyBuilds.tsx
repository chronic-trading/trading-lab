import { useState } from 'react'
import { Package, GitCompare } from 'lucide-react'
import { useBuilds } from '../hooks/useBuilds'
import { BuildCard } from '../components/BuildCard'
import { BuildCompareModal } from '../components/BuildCompareModal'
import { EmptyState } from '../components/EmptyState'
import type { Build } from '../types'

interface Props {
  onLoadBuild: (build: Build) => void
  /** Lets the empty state open the Builder instead of just naming it. */
  onNavigate?: (tab: string) => void
}

export function MyBuilds({ onLoadBuild, onNavigate }: Props) {
  const { builds, deleteBuild, getBuildShareUrl } = useBuilds()
  const [compareOpen, setCompareOpen] = useState(false)

  const handleShare = async (build: Build) => {
    await navigator.clipboard.writeText(getBuildShareUrl(build))
  }

  if (builds.length === 0) {
    return (
      <EmptyState
        icon={<Package size={24} />}
        title="No saved builds yet"
        description="Pick the concepts your model uses in the Builder, then hit Save Build."
        action={onNavigate ? { label: 'Open Builder', onClick: () => onNavigate('builder') } : undefined}
      />
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 md:px-8 py-6 md:py-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="tl-title-sm">My Builds</h2>
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
