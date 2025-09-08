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
  
  // Click counter visibility
  const [showClickCount, setShowClickCount] = useState(false)

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

  // Helper function to compare links
  const compareLinks = (local: Link[], cloud: Link[]): boolean => {
    if (local.length !== cloud.length) return false
    
    // Sort both arrays by URL for comparison
    const sortedLocal = [...local].sort((a, b) => a.url.localeCompare(b.url))
    const sortedCloud = [...cloud].sort((a, b) => a.url.localeCompare(b.url))
    
    return sortedLocal.every((localLink, index) => {
      const cloudLink = sortedCloud[index]
      return (
        localLink.url === cloudLink.url &&
        localLink.title === cloudLink.title &&
        localLink.description === cloudLink.description &&
        localLink.category === cloudLink.category
      )
    })
  }

  // Helper function to upload local links to cloud
  const uploadLocalLinksToCloud = async (localLinks: Link[]) => {
    if (!supabase || !userId) return

    try {
      // Convert local links to database format
      const insertData = localLinks.map((link, index) => ({
        owner_id: userId,
        title: link.title,
        url: link.url,
        description: link.description || null,
        icon: link.icon || null,
        category: link.category || null,
        custom_color: link.customColor || null,
        sort_order: index,
        click_count: 0
      }))

      const { error } = await (supabase as any)
        .from('links')
        .insert(insertData)

      if (error) {
        console.error('Upload local links error:', error)
        pushToast('error', `Yerel linkler yüklenemedi: ${error.message}`)
        return
      }

      // Update local links with new IDs and sync to cloud
      setLinks(localLinks)
      saveToStorage(localLinks)
      pushToast('success', 'Yerel linkler buluta yüklendi.')
    } catch (error) {
      console.error('Upload local links error:', error)
      pushToast('error', 'Yerel linkler yüklenirken hata oluştu.')
    }
  }

  // Load links from Supabase with conflict detection
  const loadLinksFromSupabase = async () => {
    if (!isSignedIn || !userId || !supabase) return

    try {
      // Get local links first
      const localLinks = loadFromStorage() || []
      
      // Get cloud links
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('owner_id', userId)
        .order('sort_order', { ascending: true }) as any

      if (error) {
        console.error('Supabase load error:', error)
        pushToast('error', `Linkler yüklenemedi: ${error.message}`)
        return
      }

      // Convert database format to app format
      const cloudLinks: Link[] = data ? data.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        description: item.description || '',
        icon: item.icon || 'globe',
        category: item.category || 'Genel',
        customColor: item.custom_color || undefined,
        sortOrder: item.sort_order || 0,
        clickCount: item.click_count || 0
      })) : []

      // Conflict detection
      const hasLocalLinks = localLinks.length > 0
      const hasCloudLinks = cloudLinks.length > 0

      if (!hasLocalLinks && !hasCloudLinks) {
        // Both empty, load defaults
        const seeded = withIds(DEFAULT_LINKS_BASE)
        setLinks(seeded)
        saveToStorage(seeded)
        return
      }

      if (!hasLocalLinks && hasCloudLinks) {
        // Only cloud has links, use cloud
        setLinks(cloudLinks)
        saveToStorage(cloudLinks)
        pushToast('success', 'Bulut linkler yüklendi.')
        return
      }

      if (hasLocalLinks && !hasCloudLinks) {
        // Only local has links, upload to cloud and use local
        await uploadLocalLinksToCloud(localLinks)
        return
      }

      // Both have links - check if they're different
      const areLinksEqual = compareLinks(localLinks, cloudLinks)
      
      if (areLinksEqual) {
        // Same links, use cloud (more authoritative)
        setLinks(cloudLinks)
        saveToStorage(cloudLinks)
        pushToast('success', 'Linkler senkronize.')
      } else {
        // Different links - show conflict modal
        setLocalLinksConflict(localLinks)
        setCloudLinksConflict(cloudLinks)
        setConflictModalOpen(true)
      }
    } catch (error) {
      console.error('Load links error:', error)
      pushToast('error', 'Linkler yüklenirken hata oluştu.')
    }
  }

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

  // Sync pending deltas when online (incremental sync)
  const syncPendingDeltas = useCallback(async () => {
    if (!isSignedIn || !userId) return
    
    const pendingDeltas = JSON.parse(localStorage.getItem('pendingDeltas') || '{}')
    const deltaKeys = Object.keys(pendingDeltas)
    
    if (deltaKeys.length === 0) return
    
    console.log('🔄 Syncing', deltaKeys.length, 'pending deltas...')
    
    // Try to sync each pending delta
    const successfulSyncs = []
    for (const key of deltaKeys) {
      const delta = pendingDeltas[key]
      try {
        const response = await fetch('/api/click-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkId: delta.linkId,
            ownerID: userId,
            url: delta.url,
            deltaCount: delta.count // Send accumulated delta
          }),
        })
        
        if (response.ok) {
          const result = await response.json()
          successfulSyncs.push(key)
          console.log('✅ Synced delta', delta.count, 'for:', delta.url, '→ Server count:', result.clickCount)
          
          // Update local link with server count
          setLinks((prev) => {
            const next = prev.map((link) => 
              (link.id === delta.linkId || link.url === delta.url)
                ? { ...link, clickCount: result.clickCount }
                : link
            )
            saveToStorage(next)
            return next
          })
        }
      } catch (error) {
        console.warn('Failed to sync delta for:', delta.url)
      }
    }
    
    // Remove successful syncs from pending deltas
    if (successfulSyncs.length > 0) {
      const remainingDeltas = { ...pendingDeltas }
      successfulSyncs.forEach(key => delete remainingDeltas[key])
      
      localStorage.setItem('pendingDeltas', JSON.stringify(remainingDeltas))
      console.log('🎉 Synced', successfulSyncs.length, 'deltas,', Object.keys(remainingDeltas).length, 'remaining')
    }
  }, [isSignedIn, userId, setLinks])

  // Load links when user signs in
  useEffect(() => {
    if (isSignedIn && userId) {
      loadLinksFromSupabase()
      // Sync any pending offline deltas
      setTimeout(syncPendingDeltas, 1000) // Wait 1s for links to load
    } else {
      // Load from localStorage if not signed in
      const existing = loadFromStorage()
      
      if (existing && existing.length) {
        setLinks(existing)
      } else {
        const seeded = withIds(DEFAULT_LINKS_BASE)
        setLinks(seeded)
        saveToStorage(seeded)
      }
    }
  }, [isSignedIn, userId])

  // Auth-based online/offline state
  const [wasSignedIn, setWasSignedIn] = useState(false)

  // Auth state change detection for sync
  useEffect(() => {
    const currentlySignedIn = !!(isSignedIn && userId)
    
    // Auth state changed from offline to online
    if (!wasSignedIn && currentlySignedIn) {
      console.log('🔐 Auth: SIGNED IN detected (offline → online)')
      console.log('🔄 Auto-syncing pending deltas...')
      setTimeout(syncPendingDeltas, 500) // Small delay for auth stability
    }
    
    // Auth state changed from online to offline
    if (wasSignedIn && !currentlySignedIn) {
      console.log('🚪 Auth: SIGNED OUT detected (online → offline)')
      console.log('📱 Switching to local-only mode')
    }
    
    setWasSignedIn(currentlySignedIn)
  }, [isSignedIn, userId, syncPendingDeltas])

  // Load preferences on initial mount
  useEffect(() => {
    try {
      // Load background theme
      const savedTheme = localStorage.getItem('backgroundTheme')
      if (savedTheme) {
        setBackgroundTheme(savedTheme)
      }
      
      // Load click count visibility (default: false)
      const savedShowClickCount = localStorage.getItem('showClickCount')
      if (savedShowClickCount === 'true') {
        setShowClickCount(true)
      }
    } catch (error) {
      console.error('Preferences load error:', error)
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
    if (!isSignedIn || !userId) {
      pushToast('error', 'Lütfen önce giriş yapın.')
      return
    }

    if (!supabase) {
      pushToast('error', 'Veritabanı bağlantısı bulunamadı.')
      return
    }

    try {
      // Map NewLink to database format
      const insertData: LinkInsert = {
        owner_id: userId,
        title: newLink.title,
        url: newLink.url,
        description: newLink.description || null,
        icon: newLink.icon || null,
        category: newLink.category || null,
        custom_color: newLink.customColor || null,
        sort_order: newLink.sortOrder || 0,
        click_count: 0
      }

      const { data, error } = await (supabase as any)
        .from('links')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Supabase insert error:', error)
        pushToast('error', `Link eklenemedi: ${error.message}`)
        return
      }

      if (data) {
        // Convert database format to app format
        const newItem: Link = {
          id: data.id,
          title: data.title,
          url: data.url,
          description: data.description || '',
          icon: data.icon || 'globe',
          category: data.category || 'Genel',
          customColor: data.custom_color || undefined,
          sortOrder: data.sort_order || 0,
          clickCount: data.click_count || 0
        }

        // Update local state
        setLinks((prev) => {
          const next = [...prev, newItem]
          saveToStorage(next)
          return next
        })
        
        setShowAddModal(false)
        pushToast('success', 'Yeni link eklendi.')
      }
    } catch (error) {
      console.error('Add link error:', error)
      pushToast('error', 'Link eklenirken hata oluştu.')
    }
  }

  const deleteLink = async (id: string) => {
    if (!isSignedIn || !userId) {
      pushToast('error', 'Lütfen önce giriş yapın.')
      return
    }

    if (!supabase) {
      pushToast('error', 'Veritabanı bağlantısı bulunamadı.')
      return
    }

    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id)
        .eq('owner_id', userId) as any // Security: only delete own links

      if (error) {
        console.error('Supabase delete error:', error)
        pushToast('error', `Link silinemedi: ${error.message}`)
        return
      }

      // Update local state only if Supabase delete was successful
      setLinks((prev) => {
        const next = prev.filter((l) => l.id !== id)
        saveToStorage(next)
        return next
      })
      pushToast('success', 'Link silindi.')
    } catch (error) {
      console.error('Delete link error:', error)
      pushToast('error', 'Link silinirken hata oluştu.')
    }
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

      if (!isSignedIn || !userId || !supabase) {
        // If not signed in, only update local state
        setLinks((prev) => {
          const next = [...prev]
          const [moved] = next.splice(from, 1)
          let insert = to
          if (from < to) insert = to - 1
          next.splice(insert, 0, moved)
          saveToStorage(next)
          return next
        })
        return
      }

      // Create new order for local update
      const newLinks = [...links]
      const [moved] = newLinks.splice(from, 1)
      let insert = to
      if (from < to) insert = to - 1
      newLinks.splice(insert, 0, moved)

      try {
        // Update sort_order for all affected links in Supabase
        const updates = newLinks.map((link, index) => ({
          id: link.id,
          sort_order: index
        }))

        // Use a transaction-like approach: update all sort orders
        const updatePromises = updates.map(({ id, sort_order }) =>
          (supabase as any)
            .from('links')
            .update({ sort_order })
            .eq('id', id)
            .eq('owner_id', userId)
        )

        const results = await Promise.all(updatePromises)
        
        // Check if any update failed
        const hasError = results.some(result => result.error)
        if (hasError) {
          console.error('Some reorder updates failed')
          pushToast('error', 'Sıralama kaydedilemedi.')
          return
        }

        // Update local state only if all Supabase updates were successful
        setLinks(newLinks.map((link, index) => ({
          ...link,
          sortOrder: index
        })))
        saveToStorage(newLinks.map((link, index) => ({
          ...link,
          sortOrder: index
        })))
      } catch (error) {
        console.error('Reorder error:', error)
        pushToast('error', 'Sıralama değiştirilirken hata oluştu.')
      }
    },
    [filteredIndices, links, isSignedIn, userId, supabase],
  )

  const incrementClickCount = async (linkId: string, url: string) => {
    // 1. IMMEDIATE LOCAL UPDATE (offline-first)
    let newClickCount = 0;
    setLinks((prev) => {
      const next = prev.map((link) => {
        if (link.id === linkId) {
          newClickCount = (link.clickCount || 0) + 1;
          return { ...link, clickCount: newClickCount };
        }
        return link;
      });
      saveToStorage(next);
      return next;
    });

    // 2. TRACK PENDING DELTAS (for incremental sync)
    const trackPendingDelta = (linkId: string, url: string) => {
      const pendingDeltas = JSON.parse(localStorage.getItem('pendingDeltas') || '{}')
      const key = linkId || url // Use linkId as primary key, fallback to URL
      
      if (pendingDeltas[key]) {
        pendingDeltas[key].count += 1
        pendingDeltas[key].lastClick = Date.now()
      } else {
        pendingDeltas[key] = {
          linkId: linkId,
          url: url,
          count: 1,
          firstClick: Date.now(),
          lastClick: Date.now()
        }
      }
      
      localStorage.setItem('pendingDeltas', JSON.stringify(pendingDeltas))
      console.log('📊 Pending delta for', url, ':', pendingDeltas[key].count)
    }

    // 3. BACKGROUND API SYNC (online sync)
    try {
      const response = await fetch('/api/click-track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkId: linkId,
          ownerID: userId, // Clerk user ID
          url: url
        }),
      })

      console.log('🌐 Click API Response:', response)

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Online sync successful:', result.clickCount)
        
        // Sync successful - update local to match server
        setLinks((prev) => {
          const next = prev.map((link) => 
            link.id === linkId 
              ? { ...link, clickCount: result.clickCount }
              : link
          )
          saveToStorage(next)
          return next
        })
      } else {
        console.warn('⚠️ Online sync failed, tracking for later sync')
        trackPendingDelta(linkId, url)
      }
    } catch (error) {
      console.warn('📱 Offline mode: Click tracked locally, will sync when online')
      trackPendingDelta(linkId, url)
    }
  }

  const changeColor = async (id: string, color: string) => {
    const normalized = color === 'default' ? '' : color

    if (!isSignedIn || !userId) {
      pushToast('error', 'Lütfen önce giriş yapın.')
      return
    }

    if (!supabase) {
      pushToast('error', 'Veritabanı bağlantısı bulunamadı.')
      return
    }

    try {
      const { error } = await (supabase as any)
        .from('links')
        .update({ 
          custom_color: normalized || null 
        })
        .eq('id', id)
        .eq('owner_id', userId) // Security: only update own links

      if (error) {
        console.error('Supabase color update error:', error)
        pushToast('error', `Renk değiştirilemedi: ${error.message}`)
        return
      }

      // Update local state only if Supabase update was successful
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
    } catch (error) {
      console.error('Change color error:', error)
      pushToast('error', 'Renk değiştirilirken hata oluştu.')
    }
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

  const toggleClickCount = () => {
    const newValue = !showClickCount
    setShowClickCount(newValue)
    try {
      localStorage.setItem('showClickCount', newValue.toString())
      pushToast('success', `Click sayaçları ${newValue ? 'açıldı' : 'kapatıldı'}.`)
    } catch (error) {
      console.error('Click count preference save error:', error)
      pushToast('error', 'Ayar kaydedilemedi.')
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

  // Conflict resolution functions
  const useLocalLinks = async () => {
    if (!supabase || !userId) return

    try {
      // Clear cloud links first
      await (supabase as any)
        .from('links')
        .delete()
        .eq('owner_id', userId)

      // Upload local links to cloud
      await uploadLocalLinksToCloud(localLinksConflict)
      
      // Use local links
      setLinks(localLinksConflict)
      saveToStorage(localLinksConflict)
      
      // Close conflict modal
      setConflictModalOpen(false)
      setLocalLinksConflict([])
      setCloudLinksConflict([])
      
      pushToast('success', 'Yerel linkler kullanıldı ve buluta kaydedildi.')
    } catch (error) {
      console.error('Use local links error:', error)
      pushToast('error', 'Yerel linkler kaydedilemedi.')
    }
  }

  const useCloudLinks = () => {
    // Use cloud links
    setLinks(cloudLinksConflict)
    saveToStorage(cloudLinksConflict)
    
    // Close conflict modal
    setConflictModalOpen(false)
    setLocalLinksConflict([])
    setCloudLinksConflict([])
    
    pushToast('success', 'Bulut linkleri kullanıldı.')
  }

  const mergeLinks = async () => {
    if (!supabase || !userId) return

    try {
      // Merge logic: combine both sets, avoid duplicates by URL
      const urlMap = new Map<string, Link>()
      
      // Add cloud links first (lower priority)
      cloudLinksConflict.forEach(link => {
        urlMap.set(link.url, link)
      })
      
      // Add local links (higher priority - will overwrite duplicates)
      localLinksConflict.forEach(link => {
        urlMap.set(link.url, link)
      })
      
      const mergedLinks = Array.from(urlMap.values())
      
      // Clear cloud links
      await (supabase as any)
        .from('links')
        .delete()
        .eq('owner_id', userId)

      // Upload merged links to cloud
      const insertData = mergedLinks.map((link, index) => ({
        owner_id: userId,
        title: link.title,
        url: link.url,
        description: link.description || null,
        icon: link.icon || null,
        category: link.category || null,
        custom_color: link.customColor || null,
        sort_order: index,
        click_count: 0
      }))

      const { error } = await (supabase as any)
        .from('links')
        .insert(insertData)

      if (error) {
        console.error('Merge links error:', error)
        pushToast('error', `Linkler birleştirilemedi: ${error.message}`)
        return
      }

      // Use merged links
      setLinks(mergedLinks)
      saveToStorage(mergedLinks)
      
      // Close conflict modal
      setConflictModalOpen(false)
      setLocalLinksConflict([])
      setCloudLinksConflict([])
      
      pushToast('success', `Linkler birleştirildi. Toplam ${mergedLinks.length} link.`)
    } catch (error) {
      console.error('Merge links error:', error)
      pushToast('error', 'Linkler birleştirilirken hata oluştu.')
    }
  }

  // Check if local and cloud links are in sync
  const checkCloudSync = async () => {
    if (!isSignedIn || !userId) {
      pushToast('error', 'Lütfen önce giriş yapın.')
      return
    }

    if (!supabase) {
      pushToast('error', 'Veritabanı bağlantısı bulunamadı.')
      return
    }

    try {
      // Get local links
      const localLinks = loadFromStorage() || []
      
      // Get cloud links
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('owner_id', userId)
        .order('sort_order', { ascending: true }) as any

      if (error) {
        console.error('Cloud sync check error:', error)
        pushToast('error', `Bulut kontrolü başarısız: ${error.message}`)
        return
      }

      // Convert database format to app format
      const cloudLinks: Link[] = data ? data.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        description: item.description || '',
        icon: item.icon || 'globe',
        category: item.category || 'Genel',
        customColor: item.custom_color || undefined,
        sortOrder: item.sort_order || 0,
        clickCount: item.click_count || 0
      })) : []

      // Compare links
      const hasLocalLinks = localLinks.length > 0
      const hasCloudLinks = cloudLinks.length > 0

      if (!hasLocalLinks && !hasCloudLinks) {
        pushToast('info', 'Hem yerel hem de bulutta link yok.')
        return
      }

      if (!hasLocalLinks && hasCloudLinks) {
        pushToast('info', `Sadece bulutta ${cloudLinks.length} link var.`)
        return
      }

      if (hasLocalLinks && !hasCloudLinks) {
        pushToast('info', `Sadece yerel cihazda ${localLinks.length} link var.`)
        return
      }

      // Both have links - check if they're the same
      const areLinksEqual = compareLinks(localLinks, cloudLinks)
      
      if (areLinksEqual) {
        pushToast('success', `✅ Senkronize! Yerel: ${localLinks.length}, Bulut: ${cloudLinks.length}`)
      } else {
        pushToast('info', `⚠️ Farklı! Yerel: ${localLinks.length}, Bulut: ${cloudLinks.length}`)
      }
    } catch (error) {
      console.error('Check cloud sync error:', error)
      pushToast('error', 'Bulut senkronizasyonu kontrol edilemedi.')
    }
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
    showClickCount,
    
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
    toggleClickCount,
    exportLinks,
    importLinks,
    loadDefaults,
    doResetToDefaults,
    clearAllLinks,
    doClearAllLinks,
    incrementClickCount,
    
    // Conflict resolution
    useLocalLinks,
    useCloudLinks,
    mergeLinks,
    setConflictModalOpen,
    checkCloudSync,
    
    // User info
    isSignedIn,
    user,
  }
}
