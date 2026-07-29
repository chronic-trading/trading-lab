import { useState } from 'react'
import { syncUserDataField } from '../lib/sync'
import { getCurrentUserId } from '../lib/currentUser'

const STORAGE_KEY = 'tl:bookmarks'

type Listener = () => void

let _data: Set<string> = new Set(
  JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[]
)
const _listeners = new Set<Listener>()

function persist() {
  const arr = [..._data]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  syncUserDataField('bookmarks', arr, getCurrentUserId())
  _listeners.forEach(fn => fn())
}

export function useBookmarks() {
  const [, rerender] = useState(0)

  useState(() => {
    const fn = () => rerender(n => n + 1)
    _listeners.add(fn)
    return () => { _listeners.delete(fn) }
  })

  const toggle = (id: string) => {
    if (_data.has(id)) _data.delete(id)
    else _data.add(id)
    persist()
  }

  return {
    bookmarkedIds: [..._data] as string[],
    isBookmarked: (id: string) => _data.has(id),
    toggle,
  }
}
