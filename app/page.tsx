'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
    // quota veya private mode hataları
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
    const title = typeof raw?.title === 'string' ? raw.title : ''
    const url = typeof raw?.url === 'string' ? raw.url : ''
    if (!title || !isValidUrl(url)) continue
    cleaned.push({
      id: crypto.randomUUID(),
      title,
      url,
      description:
        typeof raw?.description === 'string' ? raw.description : '',
      icon: typeof raw?.icon === 'string' ? raw.icon : 'globe',
      category:
        typeof raw?.category === 'string' ? raw.category : 'Genel',
      customColor:
        typeof raw?.customColor === 'string'
          ? raw.customColor
          : undefined,
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

  // Import options
  const [mergeImport, setMergeImport] = useState(true)

  // Confirm dialogs
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const pushToast = useCallback((kind: ToastKind, text: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, kind, text }])
    // auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2800)
  }, [])
  const closeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  /* ------ initial load ------ */
  useEffect(() => {
    const existing = loadFromStorage()
    if (existing && existing.length) {
      setLinks(existing)
    } else {
      const seeded = withIds(DEFAULT_LINKS_BASE)
      setLinks(seeded)
      saveToStorage(seeded)
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
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettings])

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

  /* ------ CRUD & actions ------ */

  const addLink = (newLink: NewLink) => {
    const item: Link = { ...newLink, id: crypto.randomUUID() }
    setLinks((prev) => {
      const next = [...prev, item]
      saveToStorage(next)
      return next
    })
    setShowAddModal(false)
    pushToast('success', 'Yeni link eklendi.')
  }

  const deleteLink = (id: string) => {
    setLinks((prev) => {
      const next = prev.filter((l) => l.id !== id)
      saveToStorage(next)
      return next
    })
    pushToast('success', 'Link silindi.')
  }

  // Filtreli görünümde doğru reposition
  const reorderVisible = useCallback(
    (dragIndex: number, hoverIndex: number) => {
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

  const changeColor = (id: string, color: string) => {
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

  const importLinks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(String(e.target?.result ?? ''))
        const cleaned = sanitizeImportedLinks(json)
        if (!cleaned || !cleaned.length) {
          pushToast('error', 'Geçersiz veya boş dosya.')
          return
        }

        if (mergeImport) {
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
            saveToStorage(next)
            return next
          })
          pushToast('success', 'Import (merge) tamam.')
        } else {
          // replace
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

  /* ------ Render ------ */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-4 lg:p-6 text-white">
      {/* Tailwind safelist helper for gradients (hidden) */}
      <div className="hidden">
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
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-white/10 bg-slate-800 shadow-2xl">
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
                    onClick={clearSearch}
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
              Toplam <span className="font-semibold text-white">{links.length}</span> | Görünen{' '}
              <span className="font-semibold text-white">{filteredLinks.length}</span>
            </div>
          </div>
        </header>

        {/* Financial Data */}
        <section className="mb-6">
          <FinancialData />
        </section>

        {/* Links & Palette */}
        <section>
          <h2 className="mb-4 text-2xl font-semibold text-white">
            Link Koleksiyonum
          </h2>
          <div className="flex gap-6">
            {/* Color Palette - Left */}
            <div className="w-16 flex-shrink-0">
              <div className="sticky top-6">
                <h3 className="mb-3 text-center text-xs text-white/60">
                  Renkler
                </h3>
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
              />
            </div>
          </div>
        </section>

        {/* Add Link Modal */}
        {showAddModal && (
          <AddLinkModal onAdd={addLink} onClose={() => setShowAddModal(false)} />
        )}
      </div>
    </div>
  )
}
