import { useState, useEffect } from 'react'
import type { Build } from '../types'
import { getCurrentUserId } from '../lib/currentUser'

// App.tsx calls useBuilds at the shell level, so a static Supabase import here
// would land the client in the entry chunk and back onto the landing page's
// critical path. Both call sites are already gated on a signed-in user, so the
// client is fetched at the point of the write instead — the local state and
// localStorage update immediately either way.

const STORAGE_KEY = 'trading-lab-builds'

export function useBuilds() {
  const [builds, setBuilds] = useState<Build[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds))
  }, [builds])

  const saveBuild = (build: Build) => {
    setBuilds(prev => {
      const next = prev.find(b => b.id === build.id)
        ? prev.map(b => b.id === build.id ? build : b)
        : [...prev, build]
      const uid = getCurrentUserId()
      if (uid) {
        import('../lib/supabase').then(({ supabase }) =>
          supabase.from('builds').upsert({ ...build, user_id: uid }, { onConflict: 'id' }).then()
        )
      }
      return next
    })
  }

  const deleteBuild = (id: string) => {
    setBuilds(prev => prev.filter(b => b.id !== id))
    const uid = getCurrentUserId()
    if (uid) {
      import('../lib/supabase').then(({ supabase }) =>
        supabase.from('builds').delete().eq('id', id).eq('user_id', uid).then()
      )
    }
  }

  const getBuildShareUrl = (build: Build) => {
    const encoded = btoa(JSON.stringify(build))
    return `${window.location.origin}${window.location.pathname}#shared=${encoded}`
  }

  const loadSharedBuild = (): Build | null => {
    const hash = window.location.hash
    if (!hash.startsWith('#shared=')) return null
    try {
      return JSON.parse(atob(hash.replace('#shared=', ''))) as Build
    } catch { return null }
  }

  return { builds, saveBuild, deleteBuild, getBuildShareUrl, loadSharedBuild }
}
