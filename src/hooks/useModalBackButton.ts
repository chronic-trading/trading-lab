import { useEffect, useRef } from 'react'

export function useModalBackButton(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!open) return
    history.pushState({ modal: true }, '')
    const handler = () => onCloseRef.current()
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [open])
}
