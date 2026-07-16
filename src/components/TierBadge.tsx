import type { Tier } from '../types'

const config: Record<Tier, { label: string; className: string }> = {
  basic: { label: 'BASIC', className: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10' },
  intermediate: { label: 'INTERMEDIATE', className: 'text-blue-400 border-blue-400/40 bg-blue-400/10' },
  advanced: { label: 'ADVANCED', className: 'text-purple-400 border-purple-400/40 bg-purple-400/10' },
}

export function TierBadge({ tier }: { tier: Tier }) {
  const { label, className } = config[tier]
  return (
    <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-lg border ${className}`}>
      {label}
    </span>
  )
}
