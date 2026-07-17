import { useState, useEffect } from 'react'
import { useKillZone } from '../hooks/useKillZone'
import { useTheme } from '../hooks/useTheme'
import { Clock, Zap } from 'lucide-react'

/**
 * Zone hues are applied inline, so index.css's class-based light remap can't
 * reach them — the dark-tuned textColor sat at ~1.9:1 on the light header.
 * This clock is in the header on every page, so pick the right twin per theme.
 */
function useZoneText() {
  // Choose the zone hue from the RENDERED data-theme, not the persisted setting:
  // the Recap tab pins the DOM to dark while leaving the setting on light, so
  // keying off the setting would paint the light zone hue on Recap's dark header.
  // A MutationObserver re-renders the moment the attribute flips (no 1s flash).
  const { theme } = useTheme()
  const [, force] = useState(0)
  useEffect(() => {
    const obs = new MutationObserver(() => force(n => n + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return (z: { textColor: string; textColorLight: string }) => {
    const active = (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || theme
    return active === 'light' ? z.textColorLight : z.textColor
  }
}

/** Full-width clock for desktop header centre */
export function KillZoneClock() {
  const { time, active, next, nextMacro, timeLeft, timeToNext, timeToMacro } = useKillZone()
  const zoneText = useZoneText()

  return (
    // nowrap: this sits in a flex-1 slot that can shrink below the clock's width.
    // Without it the labels wrap and, with leading-none, clip against the header.
    <div className="flex items-center gap-5 whitespace-nowrap">

      {/* NY Clock */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <Clock size={13} className="text-slate-600 flex-shrink-0" />
        <div>
          <p className="text-[18px] font-bold text-slate-100 tabular-nums leading-none font-mono">
            {time.display}
          </p>
          <p className="text-[10px] font-bold text-slate-600 tracking-widest mt-0.5">NEW YORK</p>
        </div>
      </div>

      <div className="w-px h-8 bg-slate-800/80" />

      {/* Kill zone status */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {active ? (
          <>
            <div className="relative flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: active.color }} />
              <div className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ backgroundColor: active.color }} />
            </div>
            <div>
              <p className="text-[13px] font-bold leading-none" style={{ color: zoneText(active) }}>
                {active.name}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{timeLeft} left</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0" />
            <div>
              <p className="text-[12px] font-semibold text-slate-500 leading-none">Off Session</p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                <span style={{ color: zoneText(next.zone) }}>{next.zone.shortName}</span>
                {' '}in {timeToNext}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="w-px h-8 bg-slate-800/80" />

      {/* Next ICT Macro */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Zap size={12} className="text-amber-500/60 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-semibold text-slate-400 leading-none">
            Next Macro <span className="text-amber-400">{nextMacro.name}</span>
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">in {timeToMacro}</p>
        </div>
      </div>

    </div>
  )
}

/** Compact single-line clock strip for mobile header */
export function KillZoneClockCompact() {
  const { active, next, nextMacro, timeLeft, timeToNext, timeToMacro } = useKillZone()
  const zoneText = useZoneText()

  return (
    <div className="flex items-center gap-2 text-[10px] font-semibold">
      {/* Zone pill */}
      {active ? (
        <span className="flex items-center gap-1" style={{ color: zoneText(active) }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: active.color }} />
          {active.shortName ?? active.name}
          <span className="text-slate-600 font-normal">{timeLeft}</span>
        </span>
      ) : (
        <span className="flex items-center gap-1 text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 flex-shrink-0" />
          <span style={{ color: zoneText(next.zone) }}>{next.zone.shortName}</span>
          <span className="text-slate-700">in {timeToNext}</span>
        </span>
      )}
      <span className="text-slate-600">·</span>
      {/* Macro */}
      <span className="flex items-center gap-1 text-slate-600">
        <Zap size={9} className="text-amber-500/60 flex-shrink-0" />
        <span className="text-amber-400/80">{nextMacro.name}</span>
        <span className="text-slate-700">in {timeToMacro}</span>
      </span>
    </div>
  )
}
