'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession, useUser } from '@clerk/nextjs'
import type { Link, NewLink, LinkInsert, LinkRow, ToastKind } from '../types'
import { DEFAULT_LINKS_BASE, BACKGROUND_THEMES } from '../constants'
import { 
  withIds, 
  saveToStorage, 
  loadFromStorage, 
  sanitizeImportedLinks 
} from '../utils/linkUtils'
import { getSupabaseClient, setAuthTokenGetter } from '../utils/supabase'

export function useLinks() {
  const { session } = useSession()
  const { isSignedIn, user } = useUser()
  const userId = user?.id

  // Initialize single Supabase client
  const supabase = getSupabaseClient()

  // Data state
  const [links, setLinks] = useState<Link[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('Hepsi')
  const [backgroundTheme, setBackgroundTheme] = useState<string>(
    BACKGROUND_THEMES[0].class,
  )

  // UI state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [draggedColor, setDraggedColor] = useState<string | null>(null)
  
  // Import options
  const [mergeImport, setMergeImport] = useState(true)

  // Conflict resolution
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [cloudLinksConflict, setCloudLinksConflict] = useState<Link[]>([])
  const [localLinksConflict, setLocalLinksConflict] = useState<Link[]>([])

  // Confirm dialogs
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  // Toast system
  const [toasts, setToasts] = useState<Array<{ id: string; kind: ToastKind; text: string }>>([])
  
  const pushToast = useCallback((kind: ToastKind, text: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, kind, text }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2800)
  }, [])
  
  const closeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  // Update auth token getter when session changes
  useEffect(() => {
    if (session) {
      setAuthTokenGetter(async () => {
        return await session.getToken()
      })
    } else {
      setAuthTokenGetter(null)
    }
  }, [session])

  // Initial load
  useEffect(() => {
    // Load links
    const existing = loadFromStorage()
    
    if (existing && existing.length) {
      setLinks(existing)
    } else {
      const seeded = withIds(DEFAULT_LINKS_BASE)
      setLinks(seeded)
      saveToStorage(seeded)
    }

    // Load background theme
    try {
      const savedTheme = localStorage.getItem('backgroundTheme')
      if (savedTheme) {
        setBackgroundTheme(savedTheme)
      }
    } catch (error) {
      console.error('Background theme load error:', error)
    }
  }, [])

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'someNiceLinks' && e.newValue) {
        try {
          const next = JSON.parse(e.newValue)
          if (Array.isArray(next)) {
            setLinks(
              next.map((l: any) => ({
                ...l,
                id: String(l.id),
              })),
            )
          }
        } catch {}
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Derived values
  const categories = useMemo(() => {
    const set = new Set<string>()
    links.forEach((l) => set.add(l.category || 'Genel'))
    return ['Hepsi', ...Array.from(set)]
  }, [links])

  const normalizedQuery = query.trim().toLowerCase()

  const filteredIndices = useMemo(() => {
    const res: number[] = []
    for (let i = 0; i < links.length; i++) {
      const l = links[i]
      const catOk = category === 'Hepsi' || l.category === category
      const qOk =
        !normalizedQuery ||
        l.title.toLowerCase().includes(normalizedQuery) ||
        l.url.toLowerCase().includes(normalizedQuery) ||
        l.description.toLowerCase().includes(normalizedQuery)
      if (catOk && qOk) res.push(i)
    }
    return res
  }, [links, category, normalizedQuery])

  const filteredLinks = useMemo(
    () => filteredIndices.map((i) => links[i]),
    [filteredIndices, links],
  )

  // Actions
  const addLink = async (newLink: NewLink) => {
    const item: Link = { ...newLink, id: crypto.randomUUID() }

    // Optimistic UI
    setLinks((prev) => {
      const next = [...prev, item]
      saveToStorage(next)
      return next
    })
    setShowAddModal(false)
    pushToast('success', 'Yeni link eklendi.')

    // Cloud sync logic would go here if needed
  }

  const deleteLink = async (id: string) => {
    setLinks((prev) => {
      const next = prev.filter((l) => l.id !== id)
      saveToStorage(next)
      return next
    })
    pushToast('success', 'Link silindi.')
  }

  const reorderVisible = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      const from = filteredIndices[dragIndex]
      const to = filteredIndices[hoverIndex]
      if (
        from === undefined ||
        to === undefined ||
        from === to ||
        from < 0 ||
        to < 0
      )
        return

      setLinks((prev) => {
        const next = [...prev]
        const [moved] = next.splice(from, 1)
        let insert = to
        if (from < to) insert = to - 1
        next.splice(insert, 0, moved)
        saveToStorage(next)
        return next
      })
    },
    [filteredIndices],
  )

  const changeColor = async (id: string, color: string) => {
    const normalized = color === 'default' ? '' : color

    setLinks((prev) => {
      const next = prev.map((l) => {
        if (l.id !== id) return l
        const updated = { ...l }
        if (!normalized) delete updated.customColor
        else updated.customColor = normalized
        return updated
      })
      saveToStorage(next)
      return next
    })
  }


  const changeBackgroundTheme = (themeClass: string) => {
    setBackgroundTheme(themeClass)
    try {
      localStorage.setItem('backgroundTheme', themeClass)
      pushToast('success', 'Background tema değiştirildi.')
    } catch (error) {
      console.error('Background theme save error:', error)
      pushToast('error', 'Tema kaydedilemedi.')
    }
  }


  const exportLinks = () => {
    try {
      const dataStr = JSON.stringify(links, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date()
        .toISOString()
        .replace('T', '_')
        .replace(/:\d+\.\d+Z$/, '')
        .replace(/:/g, '-')
      a.href = url
      a.download = `somenice-links-${stamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      pushToast('success', 'Export tamam.')
    } catch (err) {
      console.error('Export error:', err)
      pushToast('error', 'Export başarısız.')
    }
  }

  const importLinks = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(String(e.target?.result ?? ''))
        const cleaned = sanitizeImportedLinks(json)
        if (!cleaned || !cleaned.length) {
          pushToast('error', 'Geçersiz veya boş dosya.')
          return
        }

        if (mergeImport) {
          setLinks((prev) => {
            // URL bazlı merge
            const byUrl = new Map(prev.map((l) => [l.url, l] as const))
            for (const inc of cleaned) {
              if (byUrl.has(inc.url)) {
                const existing = byUrl.get(inc.url)!
                const updated: Link = {
                  ...existing,
                  title: inc.title || existing.title,
                  description: inc.description ?? existing.description,
                  icon: inc.icon || existing.icon,
                  category: inc.category || existing.category,
                  customColor: inc.customColor ?? existing.customColor,
                }
                byUrl.set(inc.url, updated)
              } else {
                byUrl.set(inc.url, { ...inc, id: crypto.randomUUID() })
              }
            }
            const next = Array.from(byUrl.values())
            saveToStorage(next)
            return next
          })
          pushToast('success', 'Import (merge) tamam.')
        } else {
          // Replace
          const next = cleaned.map((l) => ({
            ...l,
            id: crypto.randomUUID(),
          }))
          setLinks(next)
          saveToStorage(next)
          pushToast('success', 'Import (replace) tamam.')
        }
      } catch (err) {
        console.error('Import error:', err)
        pushToast('error', 'Dosya okunamadı.')
      }
    }
    reader.readAsText(file)
  }

  const loadDefaults = () => {
    setConfirmResetOpen(true)
  }

  const doResetToDefaults = () => {
    const seeded = withIds(DEFAULT_LINKS_BASE)
    setLinks(seeded)
    saveToStorage(seeded)
    setCategory('Hepsi')
    setQuery('')
    pushToast('success', 'Varsayılan linkler yüklendi.')
  }

  const clearAllLinks = () => {
    setConfirmClearOpen(true)
  }

  const doClearAllLinks = () => {
    setLinks([])
    saveToStorage([])
    setCategory('Hepsi')
    setQuery('')
    pushToast('success', 'Tüm linkler silindi.')
  }

  return {
    // Data
    links,
    filteredLinks,
    categories,
    query,
    category,
    backgroundTheme,
    
    // UI State
    showAddModal,
    showSettings,
    draggedColor,
    mergeImport,
    
    // Confirm dialogs
    confirmResetOpen,
    confirmClearOpen,
    
    // Conflict resolution
    conflictModalOpen,
    cloudLinksConflict,
    localLinksConflict,
    
    // Toast system
    toasts,
    pushToast,
    closeToast,
    
    // Setters
    setQuery,
    setCategory,
    setShowAddModal,
    setShowSettings,
    setDraggedColor,
    setMergeImport,
    setConfirmResetOpen,
    setConfirmClearOpen,
    
    // Actions
    addLink,
    deleteLink,
    reorderVisible,
    changeColor,
    changeBackgroundTheme,
    exportLinks,
    importLinks,
    loadDefaults,
    doResetToDefaults,
    clearAllLinks,
    doClearAllLinks,
    
    // User info
    isSignedIn,
    user,
  }
}
