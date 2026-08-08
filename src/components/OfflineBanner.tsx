import { CloudOff } from 'lucide-react'
import { useOnline } from '../hooks/useOnline'

/**
 * Tells the user their work is safe while there is no connection.
 *
 * Everything in this app is written to localStorage first and synced to
 * Supabase afterwards, so going offline costs nothing: builds, trades, plans
 * and notes all keep working. Without saying so, though, the honest assumption
 * is the opposite — people stop entering data when they think it will be lost.
 * The banner exists to remove that doubt, which is why it says "saved on this
 * device" rather than just "offline".
 *
 * Deliberately not dismissible: it disappears by itself the moment the
 * connection returns, and a dismissed banner would leave someone believing
 * they were synced when they were not.
 */
export function OfflineBanner() {
  const online = useOnline()
  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="tl-safe-x flex items-center justify-center gap-2 px-4 py-1.5 bg-amber-500/12 border-b border-amber-500/25 text-amber-300 flex-shrink-0"
    >
      <CloudOff size={12} className="flex-shrink-0" aria-hidden />
      <p className="text-[11px] font-semibold leading-tight">
        Offline — changes are saved on this device and will sync later
      </p>
    </div>
  )
}
