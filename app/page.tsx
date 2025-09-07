'use client'

/** Alias'ınına göre DÜZENLE:
 *  - @ -> src ise: '@/lib/database.types'
 *  - @ -> project root ise: '@/src/lib/database.types'
 */
import type { Database } from '@/src/lib/database.types'
type LinkInsert = Database['public']['Tables']['links']['Insert']
type LinkRow    = Database['public']['Tables']['links']['Row']

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useSession,
  useUser,
} from '@clerk/nextjs'

// Var olan singleton client'ını kullanıyoruz
import { getSupabaseClient, setAuthTokenGetter } from './utils/supabase'

import { FinancialData } from './components/FinancialData'
import { LinkGrid } from './components/LinkGrid'
import { AddLinkModal } from './components/AddLinkModal'
import {
  Plus,
  Download,
  Upload,
  RotateCcw,
  Search,
  X,
  Settings,
  Trash2,
} from 'lucide-react'

/* =========================
   Types & Constants
========================= */

export interface Link {
  id: string
  title: string
  url: string
  description: string
  icon: string
  category: string
  customColor?: string
  sortOrder?: number
  clickCount?: number
}

type NewLink = Omit<Link, 'id'>

const STORAGE_KEY = 'someNiceLinks'

const GRADIENTS: string[] = [
  'from-red-500 to-pink-600',
  'from-orange-500 to-yellow-600',
  'from-green-500 to-teal-600',
  'from-blue-500 to-purple-600',
  'from-purple-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-yellow-500 to-orange-600',
  'from-indigo-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-green-600',
  'from-slate-500 to-gray-600',
]

const BACKGROUND_THEMES = [
  { name: 'Dark Slate', class: 'bg-gradient-to-b from-slate-950 to-slate-900' },
  { name: 'Dark Blue', class: 'bg-gradient-to-b from-blue-950 to-blue-900' },
  { name: 'Dark Purple', class: 'bg-gradient-to-b from-purple-950 to-purple-900' },
  { name: 'Dark Green', class: 'bg-gradient-to-b from-emerald-950 to-emerald-900' },
  { name: 'Dark Red', class: 'bg-gradient-to-b from-red-950 to-red-900' },
  { name: 'Midnight', class: 'bg-gradient-to-b from-gray-900 to-black' },
  { name: 'Ocean', class: 'bg-gradient-to-br from-blue-900 via-blue-800 to-teal-900' },
  { name: 'Sunset', class: 'bg-gradient-to-br from-orange-900 via-red-900 to-pink-900' },
  { name: 'Forest', class: 'bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900' },
  { name: 'Royal', class: 'bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900' },
]

// Varsayılanlar: id’siz base; ilk yüklemede UUID atanacak.
const DEFAULT_LINKS_BASE: NewLink[] = [
  {
    title: 'GitHub',
    url: 'https://github.com',
    description: 'Kod geliştirme platformu',
    icon: 'github',
    category: 'Geliştirme',
  },
  {
    title: 'Vercel',
    url: 'https://vercel.com',
    description: 'Frontend deployment',
    icon: 'globe',
    category: 'Hosting',
  },
  {
    title: 'Eğitici Oyunlar',
    url: 'https://egiticioyunlar.vercel.app/',
    description: 'Eğlenirken öğrenin',
    icon: 'code',
    category: 'Eğitim',
  },
  {
    title: 'Ali Türkşen Hakkında',
    url: 'https://ali-turksen.vercel.app/',
    description: 'Biraz araştırın',
    icon: 'globe',
    category: 'Araştırma',
  },
  {
    title: 'Tarih Unutmaz',
    url: 'https://akp-sigma.vercel.app/',
    description: 'Unutamadık',
    icon: 'database',
    category: 'Araştırma',
  },
  {
    title: 'Havayolu Değerleme',
    url: 'https://havayolu-degerleme.vercel.app/',
    description: 'deneme bir model',
    icon: 'cpu',
    category: 'Araçlar',
  },
  {
    title: 'Geo Downloader',
    url: 'https://geodownloader.com/',
    description: 'Coğrafi veri indirme aracı',
    icon: 'globe',
    category: 'Araçlar',
  },
]

/* =========================
   Helpers (storage, id, sanitize)
========================= */

const withIds = (base: NewLink[]): Link[] =>
  base.map((l) => ({ ...l, id: crypto.randomUUID() }))

const saveToStorage = (arr: Link[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch (err) {
    console.error('localStorage write error:', err)
  }
}

const loadFromStorage = (): Link[] | null => {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (!s) return null
    const parsed = JSON.parse(s)
    if (!Array.isArray(parsed)) return null
    // Eski kayıtlardan id: number geldiyse stringe çevir
    return parsed.map((l: any) => ({
      id: String(l.id ?? crypto.randomUUID()),
      title: String(l.title ?? ''),
      url: String(l.url ?? ''),
      description: String(l.description ?? ''),
      icon: String(l.icon ?? 'globe'),
      category: String(l.category ?? 'Genel'),
      customColor:
        typeof l.customColor === 'string' ? l.customColor : undefined,
    })) as Link[]
  } catch (err) {
    console.error('localStorage read error:', err)
    return null
  }
}

const isValidUrl = (u: string) => {
  try {
    new URL(u)
    return true
  } catch {
    return false
  }
}

const sanitizeImportedLinks = (json: unknown): Link[] | null => {
  if (!Array.isArray(json)) return null
  const cleaned: Link[] = []
  for (const raw of json) {
    const title = typeof (raw as any)?.title === 'string' ? (raw as any).title : ''
    const url = typeof (raw as any)?.url === 'string' ? (raw as any).url : ''
    if (!title || !isValidUrl(url)) continue
    cleaned.push({
      id: crypto.randomUUID(),
      title,
      url,
      description: typeof (raw as any)?.description === 'string' ? (raw as any).description : '',
      icon: typeof (raw as any)?.icon === 'string' ? (raw as any).icon : 'globe',
      category: typeof (raw as any)?.category === 'string' ? (raw as any).category : 'Genel',
      customColor: typeof (raw as any)?.customColor === 'string' ? (raw as any).customColor : undefined,
    })
  }
  return cleaned
}

/* =========================
   Mini Toast (no external deps)
========================= */

type ToastKind = 'success' | 'error' | 'info'
type ToastItem = { id: string; kind: ToastKind; text: string }

function Toasts({
  items,
  onClose,
}: {
  items: ToastItem[]
  onClose: (id: string) => void
}) {
  return (
    <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`rounded-md border px-3 py-2 shadow-lg backdrop-blur-sm ${
            t.kind === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : t.kind === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              : 'bg-slate-500/10 border-slate-500/30 text-slate-200'
          }`}
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm">{t.text}</span>
            <button
              onClick={() => onClose(t.id)}
              className="opacity-70 hover:opacity-100"
              aria-label="Kapat"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* =========================
   Basit Confirm Dialog (no external deps)
========================= */

function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-5 shadow-2xl">
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        {description ? (
          <p className="mb-4 text-sm text-white/70">{description}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-white/20 px-3 py-2 text-sm text-white/90 hover:bg-white/5"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="rounded-md bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================
   Page
========================= */

export default function Home() {
  // Auth hooks
  const { session } = useSession()
  const { isSignedIn, user } = useUser()
  const userId = user?.id

  // Initialize single Supabase client
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error('Supabase client missing (env değişkenlerini kontrol et).')
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

  // UI state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [draggedColor, setDraggedColor] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  // Data state
  const [links, setLinks] = useState<Link[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('Hepsi')
  const [backgroundTheme, setBackgroundTheme] = useState<string>(
    BACKGROUND_THEMES[0].class,
  )

  // Import options
  const [mergeImport, setMergeImport] = useState(true)
  
  // Click analytics display setting
  const [showClickCounts, setShowClickCounts] = useState(true)

  // Confirm dialogs
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  // Conflict resolution
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [cloudLinksConflict, setCloudLinksConflict] = useState<Link[]>([])
  const [localLinksConflict, setLocalLinksConflict] = useState<Link[]>([])

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const pushToast = useCallback((kind: ToastKind, text: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, kind, text }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2800)
  }, [])
  const closeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  /* ------ initial load ------ */
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

    // Load click counts display setting
    try {
      const savedClickCounts = localStorage.getItem('showClickCounts')
      if (savedClickCounts !== null) {
        setShowClickCounts(JSON.parse(savedClickCounts))
      }
    } catch (error) {
      console.error('Click counts setting load error:', error)
    }
  }, [])

  /* ------ cross-tab sync ------ */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
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

  /* ------ click outside settings ------ */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false)
      }
    }
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettings])

  /* ------ cloud data loading ------ */
  useEffect(() => {
    if (!isSignedIn || !supabase || !userId) return

    const loadCloudData = async () => {
      try {
        const { data, error } = await supabase
          .from('links')
          .select('*')
          .eq('owner_id', userId) // sadece kullanıcıya ait kayıtlar
          .order('sort_order', { ascending: true }) // şemanda 'updated_at' yoksa

        if (error) {
          console.error('Supabase error:', error)
          pushToast('error', 'Bulut verisi alınamadı.')
          return
        }

        const rows: LinkRow[] = (data ?? []) as LinkRow[]

        // Map Supabase data to our Link interface
        const cloudLinks: Link[] = rows.map((item) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          description: item.description ?? '',
          icon: item.icon ?? 'globe',
          category: item.category ?? 'Genel',
          customColor: item.custom_color ?? undefined,
          sortOrder: item.sort_order ?? 0,
          clickCount: item.click_count ?? 0,
        }))

        // Mevcut yerel linkler
        const currentLocalLinks =
          links.length > 0 ? links : loadFromStorage() || []

        // Çakışma kontrolü
        if (currentLocalLinks.length > 0 && cloudLinks.length > 0) {
          if (!areLinksEqual(currentLocalLinks, cloudLinks)) {
            setLocalLinksConflict(currentLocalLinks)
            setCloudLinksConflict(cloudLinks)
            setConflictModalOpen(true)
            return // kararı bekle
          }
        }

        // Çakışma yoksa direkt bulutu yükle
        setLinks(cloudLinks)
        saveToStorage(cloudLinks)

        if (cloudLinks.length > 0) {
          pushToast('success', `${cloudLinks.length} bulut linki yüklendi.`)
        }
      } catch (error) {
        console.error('Cloud loading error:', error)
        pushToast('error', 'Bulut bağlantısı başarısız.')
      }
    }

    loadCloudData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, supabase, userId]) // 'links'i eklemiyoruz; sonsuz döngü olmasın

  /* ------ derived: categories, filters ------ */
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

  /* ------ Conflict Resolution Utils ------ */

  const areLinksEqual = (links1: Link[], links2: Link[]): boolean => {
    if (links1.length !== links2.length) return false

    // URL'e göre sırala ve karşılaştır
    const sorted1 = [...links1].sort((a, b) => a.url.localeCompare(b.url))
    const sorted2 = [...links2].sort((a, b) => a.url.localeCompare(b.url))

    return sorted1.every((link1, index) => {
      const link2 = sorted2[index]
      return (
        link1.title === link2.title &&
        link1.url === link2.url &&
        link1.description === link2.description &&
        link1.category === link2.category &&
        link1.icon === link2.icon &&
        (link1.customColor || '') === (link2.customColor || '')
      )
    })
  }

  const mergeLinks = (localLinks: Link[], cloudLinks: Link[]): Link[] => {
    const mergedMap = new Map<string, Link>()

    // önce yereller
    localLinks.forEach((link) => {
      mergedMap.set(link.url, link)
    })

    // aynı URL varsa bulut versiyonunu tercih et
    cloudLinks.forEach((link) => {
      mergedMap.set(link.url, link)
    })

    return Array.from(mergedMap.values())
  }

  const handleConflictChoice = async (choice: 'cloud' | 'local' | 'merge') => {
    const cloudLinks = cloudLinksConflict
    const localLinks = localLinksConflict

    setConflictModalOpen(false)

    switch (choice) {
      case 'cloud':
        setLinks(cloudLinks)
        saveToStorage(cloudLinks)
        pushToast('success', `${cloudLinks.length} bulut linki yüklendi.`)
        break

      case 'local':
        if (supabase && userId) {
          try {
            // önce bulutu temizle (sadece mevcut kullanıcı için)
            await supabase.from('links').delete().eq('owner_id', userId)

            // yerel linkleri yükle
            const insertData: LinkInsert[] = localLinks.map((link, index) => ({
              owner_id: userId,
              title: link.title,
              url: link.url,
              description: link.description ?? null,
              icon: link.icon ?? null,
              category: link.category ?? null,
              custom_color: link.customColor ?? null,
              sort_order: (index + 1) * 100,
            }))

            const { error } = await supabase.from('links').insert(insertData as any)
            if (error) throw error

            pushToast(
              'success',
              `${localLinks.length} yerel link buluta yüklendi.`,
            )
          } catch (error) {
            console.error('Local to cloud upload error:', error)
            pushToast('error', 'Yerel linkler buluta yüklenemedi.')
          }
        }
        break

      case 'merge': {
        const merged = mergeLinks(localLinks, cloudLinks)
        setLinks(merged)
        saveToStorage(merged)

        if (supabase && userId) {
          try {
            await supabase.from('links').delete().eq('owner_id', userId)

            const insertData: LinkInsert[] = merged.map((link, index) => ({
              owner_id: userId,
              title: link.title,
              url: link.url,
              description: link.description ?? null,
              icon: link.icon ?? null,
              category: link.category ?? null,
              custom_color: link.customColor ?? null,
              sort_order: (index + 1) * 100,
            }))

            const { error } = await supabase.from('links').insert(insertData as any)
            if (error) throw error

            pushToast('success', `${merged.length} birleşik link hazırlandı.`)
          } catch (error) {
            console.error('Merge upload error:', error)
            pushToast('error', 'Birleşik linkler buluta yüklenemedi.')
          }
        }
        break
      }
    }
  }

  /* ------ CRUD & actions ------ */

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

    // Cloud
    if (isSignedIn && supabase && userId) {
      try {
        // Calculate next sort_order (new links go to the end)
        const maxSortOrder = Math.max(...links.map(l => l.sortOrder || 0), 0)
        const nextSortOrder = maxSortOrder + 100

        const insertData: LinkInsert[] = [
          {
            owner_id: userId,
            title: newLink.title,
            url: newLink.url,
            description: newLink.description ?? null,
            icon: newLink.icon ?? null,
            category: newLink.category ?? null,
            custom_color: newLink.customColor ?? null,
            sort_order: nextSortOrder,
            click_count: 0,
          },
        ]

        const { error } = await supabase.from('links').insert(insertData as any)

        if (error) {
          console.error('Supabase insert error:', error)
          pushToast('error', `Buluta yazılamadı: ${error.message}`)
        } else {
          pushToast('success', 'Link buluta kaydedildi.')
        }
      } catch (error) {
        console.error('Cloud save error:', error)
        pushToast('error', 'Bulut kayıt hatası.')
      }
    }
  }

  const deleteLink = async (id: string) => {
    const linkToDelete = links.find((l) => l.id === id)

    // Optimistic UI
    setLinks((prev) => {
      const next = prev.filter((l) => l.id !== id)
      saveToStorage(next)
      return next
    })
    pushToast('success', 'Link silindi.')

    // Cloud
    if (isSignedIn && supabase && userId && linkToDelete) {
      try {
        const { error } = await supabase
          .from('links')
          .delete()
          .eq('owner_id', userId)
          .eq('url', linkToDelete.url) // URL + owner_id daha güvenli

        if (error) {
          console.error('Supabase delete error:', error)
          pushToast('error', 'Buluttan silinemedi.')
        } else {
          pushToast('success', 'Link buluttan silindi.')
        }
      } catch (error) {
        console.error('Cloud delete error:', error)
        pushToast('error', 'Bulut silme hatası.')
      }
    }
  }

  // Filtreli görünümde doğru reposition
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

      let reorderedLinks: Link[] = []

      // Optimistic UI
      setLinks((prev) => {
        const next = [...prev]
        const [moved] = next.splice(from, 1)
        let insert = to
        if (from < to) insert = to - 1
        next.splice(insert, 0, moved)
        saveToStorage(next)
        reorderedLinks = next
        return next
      })

      // Cloud sync - update sort_order values
      if (isSignedIn && supabase && userId && reorderedLinks.length > 0) {
        try {
          // Assign new sort_order values (100, 200, 300, etc.)
          const updates = reorderedLinks.map((link, index) => ({
            url: link.url,
            sort_order: (index + 1) * 100,
          }))

          // Bulk update all links with new sort_order
          for (const update of updates) {
            const { error } = await (supabase as any)
              .from('links')
              .update({ sort_order: update.sort_order })
              .eq('owner_id', userId)
              .eq('url', update.url)

            if (error) {
              console.error('Sort order update error:', error)
            }
          }

          // Silent success - no toast for reordering
        } catch (error) {
          console.error('Reorder cloud sync error:', error)
          pushToast('error', 'Sıralama buluta senkronize edilemedi.')
        }
      }
    },
    [filteredIndices, isSignedIn, supabase, userId, pushToast],
  )

  const changeColor = async (id: string, color: string) => {
    const normalized = color === 'default' ? '' : color

    // Optimistic UI
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

    // Cloud
    if (isSignedIn && supabase && userId) {
      try {
        const linkToUpdate = links.find((l) => l.id === id)
        if (linkToUpdate) {
          const { error } = await (supabase as any)
            .from('links')
              .update({
                custom_color: normalized || null,
              })
            .eq('owner_id', userId)
            .eq('url', linkToUpdate.url)

          if (error) {
            console.error('Color update sync error:', error)
            pushToast(
              'error',
              'Renk değişikliği buluta senkronize edilemedi.',
            )
          }
        }
      } catch (error) {
        console.error('Color update error:', error)
        pushToast('error', 'Renk güncelleme hatası.')
      }
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

  const onPickFile = () => fileInputRef.current?.click()

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
          let mergedLinks: Link[] = []

          setLinks((prev) => {
            // URL bazlı merge (varsa update, yoksa ekle)
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
            mergedLinks = next
            saveToStorage(next)
            return next
          })

          // Cloud sync
          if (isSignedIn && supabase && userId) {
            try {
              await supabase.from('links').delete().eq('owner_id', userId)

              const insertData: LinkInsert[] = mergedLinks.map((link) => ({
                owner_id: userId,
                title: link.title,
                url: link.url,
                description: link.description ?? null,
                icon: link.icon ?? null,
                category: link.category ?? null,
                custom_color: link.customColor ?? null,
              }))

              const { error } = await supabase.from('links').insert(insertData as any)

              if (error) {
                console.error('Cloud sync error after import:', error)
                pushToast(
                  'success',
                  'Import (merge) tamam. Bulut senkronizasyonu başarısız.',
                )
              } else {
                pushToast(
                  'success',
                  `${cleaned.length} link merge edildi ve buluta senkronize edildi.`,
                )
              }
            } catch (error) {
              console.error('Cloud sync error:', error)
              pushToast(
                'success',
                'Import (merge) tamam. Bulut senkronizasyonu başarısız.',
              )
            }
          } else {
            pushToast('success', 'Import (merge) tamam.')
          }
        } else {
          // replace
          const next = cleaned.map((l) => ({
            ...l,
            id: crypto.randomUUID(),
          }))
          setLinks(next)
          saveToStorage(next)

          if (isSignedIn && supabase && userId) {
            try {
              await supabase.from('links').delete().eq('owner_id', userId)

              const insertData: LinkInsert[] = next.map((link) => ({
                owner_id: userId,
                title: link.title,
                url: link.url,
                description: link.description ?? null,
                icon: link.icon ?? null,
                category: link.category ?? null,
                custom_color: link.customColor ?? null,
              }))

              const { error } = await supabase.from('links').insert(insertData as any)

              if (error) {
                console.error('Cloud sync error after import:', error)
                pushToast(
                  'success',
                  'Import (replace) tamam. Bulut senkronizasyonu başarısız.',
                )
              } else {
                pushToast(
                  'success',
                  `${next.length} link import edildi ve buluta senkronize edildi.`,
                )
              }
            } catch (error) {
              console.error('Cloud sync error:', error)
              pushToast(
                'success',
                'Import (replace) tamam. Bulut senkronizasyonu başarısız.',
              )
            }
          } else {
            pushToast('success', 'Import (replace) tamam.')
          }
        }
      } catch (err) {
        console.error('Import error:', err)
        pushToast('error', 'Dosya okunamadı.')
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
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

  const clearSearch = () => setQuery('')

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

  const toggleClickCounts = (show: boolean) => {
    setShowClickCounts(show)
    try {
      localStorage.setItem('showClickCounts', JSON.stringify(show))
      pushToast('success', show ? 'Tıklama sayıları gösteriliyor.' : 'Tıklama sayıları gizlendi.')
    } catch (error) {
      console.error('Click counts setting save error:', error)
      pushToast('error', 'Ayar kaydedilemedi.')
    }
  }

  const trackLinkClick = async (linkId: string) => {
    // Optimistic update - click count'u local state'te artır
    setLinks((prev) => 
      prev.map((link) => 
        link.id === linkId 
          ? { ...link, clickCount: (link.clickCount || 0) + 1 }
          : link
      )
    )

    try {
      const response = await fetch('/api/click-track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Click tracking error:', errorData.error)
        
        // Hata durumunda optimistic update'i geri al
        setLinks((prev) => 
          prev.map((link) => 
            link.id === linkId 
              ? { ...link, clickCount: Math.max((link.clickCount || 1) - 1, 0) }
              : link
          )
        )
        
        pushToast('error', 'Tıklama kaydedilemedi.')
      }
    } catch (error) {
      console.error('Click tracking fetch error:', error)
      
      // Hata durumunda optimistic update'i geri al
      setLinks((prev) => 
        prev.map((link) => 
          link.id === linkId 
            ? { ...link, clickCount: Math.max((link.clickCount || 1) - 1, 0) }
            : link
        )
      )
      
      pushToast('error', 'Ağ hatası: Tıklama kaydedilemedi.')
    }
  }

  /* ------ Render ------ */
  return (
    <div className={`min-h-screen ${backgroundTheme} p-4 lg:p-6 text-white`}>
      {/* Tailwind safelist helper for gradients (hidden) */}
      <div className="hidden">
        {/* Link card gradients */}
        <div className="bg-gradient-to-br from-red-500 to-pink-600" />
        <div className="bg-gradient-to-br from-orange-500 to-yellow-600" />
        <div className="bg-gradient-to-br from-green-500 to-teal-600" />
        <div className="bg-gradient-to-br from-blue-500 to-purple-600" />
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600" />
        <div className="bg-gradient-to-br from-pink-500 to-rose-600" />
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <div className="bg-gradient-to-br from-yellow-500 to-orange-600" />
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600" />
        <div className="bg-gradient-to-br from-violet-500 to-purple-600" />
        <div className="bg-gradient-to-br from-emerald-500 to-green-600" />
        <div className="bg-gradient-to-br from-slate-500 to-gray-600" />

        {/* Background themes */}
        <div className="bg-gradient-to-b from-slate-950 to-slate-900" />
        <div className="bg-gradient-to-b from-blue-950 to-blue-900" />
        <div className="bg-gradient-to-b from-purple-950 to-purple-900" />
        <div className="bg-gradient-to-b from-emerald-950 to-emerald-900" />
        <div className="bg-gradient-to-b from-red-950 to-red-900" />
        <div className="bg-gradient-to-b from-gray-900 to-black" />
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-900" />
        <div className="bg-gradient-to-br from-orange-900 via-red-900 to-pink-900" />
        <div className="bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900" />
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900" />
      </div>

      {/* Toasts */}
      <Toasts items={toasts} onClose={closeToast} />

      {/* Confirm Reset */}
      <ConfirmDialog
        open={confirmResetOpen}
        title="Varsayılan linkler yüklensin mi?"
        description="Bu işlem mevcut tüm linkleri siler ve varsayılanları yükler."
        confirmText="Evet, yükle"
        cancelText="Vazgeç"
        onConfirm={doResetToDefaults}
        onClose={() => setConfirmResetOpen(false)}
      />

      {/* Confirm Clear All */}
      <ConfirmDialog
        open={confirmClearOpen}
        title="Tüm linkler silinsin mi?"
        description="Bu işlem geri alınamaz. Tüm linkleriniz kalıcı olarak silinecek."
        confirmText="Evet, sil"
        cancelText="Vazgeç"
        onConfirm={doClearAllLinks}
        onClose={() => setConfirmClearOpen(false)}
      />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-4xl font-bold lg:text-5xl">SomeNice Links</h1>

            <div className="flex items-center gap-3">
              {/* Auth Section */}
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700">
                    🔐 Giriş Yap
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/80">
                    Merhaba, {user?.firstName || 'Kullanıcı'}!
                  </span>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              {/* Settings Dropdown */}
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-white transition-colors duration-200 hover:bg-slate-600"
                  title="Ayarlar"
                >
                  <Settings size={18} />
                  Ayarlar
                </button>

                {showSettings && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-white/10 bg-slate-800 shadow-2xl">
                    <div className="py-2">
                      {/* Export */}
                      <button
                        onClick={() => {
                          exportLinks()
                          setShowSettings(false)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
                      >
                        <Download size={16} />
                        Export Links
                      </button>

                      {/* Import */}
                      <button
                        onClick={() => {
                          onPickFile()
                          setShowSettings(false)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
                      >
                        <Upload size={16} />
                        Import Links
                      </button>

                      {/* Merge Toggle */}
                      <label className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-sm text-white hover:bg-slate-700">
                        <input
                          type="checkbox"
                          className="accent-purple-600"
                          checked={mergeImport}
                          onChange={(e) => setMergeImport(e.target.checked)}
                        />
                        <span>Merge while importing</span>
                      </label>

                      {/* Click Counts Toggle */}
                      <label className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-sm text-white hover:bg-slate-700">
                        <input
                          type="checkbox"
                          className="accent-green-600"
                          checked={showClickCounts}
                          onChange={(e) => toggleClickCounts(e.target.checked)}
                        />
                        <span>Tıklama sayılarını göster 👆</span>
                      </label>

                      <hr className="my-2 border-white/10" />

                      {/* Background Theme */}
                      <div className="px-4 py-2">
                        <div className="mb-2 text-xs text-white/60">
                          Background Theme
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {BACKGROUND_THEMES.map((theme) => (
                            <button
                              key={theme.name}
                              onClick={() => changeBackgroundTheme(theme.class)}
                              className={`relative overflow-hidden rounded-md border text-xs p-2 transition-all ${
                                backgroundTheme === theme.class
                                  ? 'border-white/40 ring-1 ring-white/20'
                                  : 'border-white/10 hover:border-white/30'
                              }`}
                            >
                              <div
                                className={`absolute inset-0 ${theme.class} opacity-30`}
                              />
                              <div className="relative z-10 text-white">
                                {theme.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <hr className="my-2 border-white/10" />

                      {/* Load Defaults */}
                      <button
                        onClick={() => {
                          loadDefaults()
                          setShowSettings(false)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
                      >
                        <RotateCcw size={16} />
                        Load Defaults
                      </button>

                      {/* Clear All */}
                      <button
                        onClick={() => {
                          clearAllLinks()
                          setShowSettings(false)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 size={16} />
                        Clear All Links
                      </button>
                    </div>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={importLinks}
                  className="hidden"
                />
              </div>

              {/* Add Link */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors duration-200 hover:bg-blue-700"
              >
                <Plus size={20} />
                Yeni Link
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ara: başlık, URL, açıklama…"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-9 py-2 text-sm text-white placeholder:text-white/50 outline-none ring-blue-500 focus:ring-2"
                />
                {query ? (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-70 hover:bg-white/10 hover:opacity-100"
                    aria-label="Aramayı temizle"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-white/70">
              Toplam{' '}
              <span className="font-semibold text-white">{links.length}</span> | Görünen{' '}
              <span className="font-semibold text-white">
                {filteredLinks.length}
              </span>
            </div>
          </div>
        </header>

        {/* Financial Data */}
        <section className="mb-6">
          <FinancialData />
        </section>

        {/* Links & Palette */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Link Koleksiyonum</h2>

            {/* Auth Status Info */}
            <SignedOut>
              <div className="hidden sm:block text-sm text-white/60">
                💡 Giriş yapın, linkleriniz bulutla senkronlansın
              </div>
            </SignedOut>

            <SignedIn>
              <div className="hidden sm:block text-sm text-white/60">
                ☁️ Bulut senkronizasyonu aktif
              </div>
            </SignedIn>
          </div>

          {/* Mobile Auth Info */}
          <SignedOut>
            <div className="mb-4 sm:hidden rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              <span className="font-medium">💡 İpucu:</span> Giriş yaparsanız linkleriniz tüm
              cihazlarınızda senkronlanır.
            </div>
          </SignedOut>

          <div className="flex gap-6">
            {/* Color Palette - Left */}
            <div className="w-16 flex-shrink-0">
              <div className="sticky top-6">
                <h3 className="mb-3 text-center text-xs text-white/60">Renkler</h3>
                <div className="flex flex-col gap-2">
                  {GRADIENTS.map((color, idx) => (
                    <button
                      key={idx}
                      className={`h-8 w-12 cursor-grab rounded-lg border border-white/20 bg-gradient-to-br shadow-lg transition-transform hover:scale-110 active:cursor-grabbing ${color}`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedColor(color)
                        e.dataTransfer.setData('text/plain', `color:${color}`)
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onDragEnd={() => setDraggedColor(null)}
                      title="Rengi sürükleyip karta bırakın"
                      aria-label={`Renk: ${color}`}
                    />
                  ))}
                  {/* Rengi Sil */}
                  <button
                    className="flex h-8 w-12 cursor-grab items-center justify-center rounded-lg border-2 border-dashed border-red-400/60 bg-red-500/10 transition-all hover:scale-110 hover:border-red-400 hover:bg-red-500/20 active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => {
                      setDraggedColor('default')
                      e.dataTransfer.setData('text/plain', 'color:default')
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    onDragEnd={() => setDraggedColor(null)}
                    title="Rengi sil - Varsayılan renge dön"
                    aria-label="Rengi sil"
                  >
                    <span className="text-xs text-red-400">🗑️</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Links Grid - Right */}
            <div className="flex-1">
              <LinkGrid
                links={filteredLinks}
                onDelete={deleteLink}
                onReorder={reorderVisible}
                onColorChange={changeColor}
                draggedColor={draggedColor}
                onLinkClick={trackLinkClick}
                showClickCounts={showClickCounts}
              />
            </div>
          </div>
        </section>

        {/* Conflict Resolution Modal */}
        {conflictModalOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
            <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-slate-900 p-6 shadow-2xl">
              <h3 className="mb-4 text-xl font-semibold text-white">
                🔄 Veri Çakışması Tespit Edildi
              </h3>

              <div className="mb-6 text-sm text-white/70">
                Yerel ve bulut verileriniz farklı. Hangi veriyi kullanmak istiyorsunuz?
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded border border-white/10 bg-white/5 p-4">
                  <h4 className="mb-2 font-medium text-white">📱 Yerel Veriler</h4>
                  <p className="text-sm text-white/60">{localLinksConflict.length} link</p>
                  <p className="text-xs text-white/50">Cihazınızda kayıtlı</p>
                </div>

                <div className="rounded border border-white/10 bg-white/5 p-4">
                  <h4 className="mb-2 font-medium text-white">☁️ Bulut Veriler</h4>
                  <p className="text-sm text-white/60">{cloudLinksConflict.length} link</p>
                  <p className="text-xs text-white/50">Sunucuda kayıtlı</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => handleConflictChoice('cloud')}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <div>☁️ Bulut Kullan</div>
                  <div className="text-xs opacity-75">
                    Bulut veriyi yükle, yerel veriyi sil
                  </div>
                </button>

                <button
                  onClick={() => handleConflictChoice('local')}
                  className="flex-1 rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700"
                >
                  <div>📱 Yerel Kullan</div>
                  <div className="text-xs opacity-75">Yerel veriyi buluta gönder</div>
                </button>

                <button
                  onClick={() => handleConflictChoice('merge')}
                  className="flex-1 rounded-md bg-purple-600 px-4 py-3 text-sm font-medium text-white hover:bg-purple-700"
                >
                  <div>🔗 Birleştir</div>
                  <div className="text-xs opacity-75">İkisini de kullan</div>
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setConflictModalOpen(false)}
                  className="text-xs text-white/50 hover:text-white/70"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Link Modal */}
        {showAddModal && (
          <AddLinkModal onAdd={addLink} onClose={() => setShowAddModal(false)} />
        )}
      </div>
    </div>
  )
}
