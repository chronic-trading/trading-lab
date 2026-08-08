import { useEffect, useState } from 'react'

/**
 * Whether the device currently has a network connection.
 *
 * `navigator.onLine` only reports whether there is *a* connection, not whether
 * anything is actually reachable — a captive portal reads as online. That is
 * fine for what this drives: telling someone their changes are saved locally
 * and not yet synced. It is used to explain state, never to gate access to
 * local data, so a false positive costs a banner that should not be there
 * rather than locking anyone out.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine !== false)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    // No re-sync here on purpose: the initialiser above already read
    // navigator.onLine, and setting state synchronously in an effect forces an
    // extra render on every mount to correct for a sub-millisecond window. A
    // transition inside it would be reported by the next online/offline event.
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}
