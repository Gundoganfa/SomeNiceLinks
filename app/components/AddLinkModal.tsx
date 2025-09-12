'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Globe, Database, Server, FileText, Video, Music, X, Bookmark, Star, Cloud
} from "lucide-react"

import type { NewLink } from '../types'

interface AddLinkModalProps {
  onAdd: (link: NewLink) => void
  onClose: () => void
}

const iconOptions = [
  { value: 'globe', label: 'Website', icon: <Globe className="w-5 h-5" /> },
  { value: 'database', label: 'Database', icon: <Database className="w-5 h-5" /> },
  { value: 'server', label: 'Server', icon: <Server className="w-5 h-5" /> },

  // içerik & kaynak türleri
  { value: 'file', label: 'File', icon: <FileText className="w-5 h-5" /> },
  { value: 'video', label: 'Video', icon: <Video className="w-5 h-5" /> },
  { value: 'music', label: 'Music', icon: <Music className="w-5 h-5" /> },

  // genel
  { value: 'bookmark', label: 'Bookmark', icon: <Bookmark className="w-5 h-5" /> },
  { value: 'favorite', label: 'Favorite', icon: <Star className="w-5 h-5" /> },
  { value: 'cloud', label: 'Cloud', icon: <Cloud className="w-5 h-5" /> },
]

const categoryOptions = [
  // Teknik
  'Geliştirme',
  'Hosting',
  'Veritabanı',
  'API',
  'Araçlar',
  'Kod Snippet',
  'Dokümantasyon',

  // İçerik & Öğrenme
  'Eğitim',
  'Video',
  'Müzik',
  'Makale',
  'Araştırma',

  // Sosyal & İletişim
  'Sosyal',
  'Twitter',
  'LinkedIn',
  'Mail',

  // Kişisel / Genel
  'Kişisel',
  'Favori',
  'İş',
  'Kaynak',
  'Diğer'
]

// URL'yi normalize eden ve güvenli şema/port/kimlik bilgisi kontrolü yapan yardımcı
const normalizeHttpUrl = (raw: string): string | null => {
  if (!raw) return null
  const s = raw.trim()
  if (s.length > 2048) return null // temel uzunluk limiti

  // Tehlikeli şemalar
  if (/^(javascript|data|vbscript):/i.test(s)) return null

  // Şema yoksa https ekle (example.com, localhost:3000 vb. için)
  const candidate = s.includes('://') ? s : `https://${s}`

  try {
    const u = new URL(candidate)

    // Sadece web URL'leri
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null

    // URL kimlik bilgisi blokla: http://user:pass@host
    if (u.username || u.password) return null

    // Port aralığı kontrolü
    if (u.port) {
      const portNum = Number(u.port)
      if (!Number.isInteger(portNum) || portNum < 0 || portNum > 65535) return null
    }

    return u.toString() // normalize edilmiş tam URL
  } catch {
    return null
  }
}

export function AddLinkModal({ onAdd, onClose }: AddLinkModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    icon: 'globe',
    category: 'Geliştirme'
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const title = formData.title.trim()
    const normalizedUrl = normalizeHttpUrl(formData.url)

    if (!title) {
      setError('Başlık zorunlu.')
      return
    }
    if (!normalizedUrl) {
      setError('Lütfen geçerli bir URL girin (sadece http/https). Örn: example.com, https://site.com, localhost:3000')
      return
    }

    setIsSubmitting(true)

    const payload: NewLink = {
      ...formData,
      title,
      url: normalizedUrl,
      description: formData.description?.trim() ?? ''
    } as NewLink

    try {
      onAdd(payload)
      setFormData({
        title: '',
        url: '',
        description: '',
        icon: 'globe',
        category: 'Geliştirme'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setError(null)
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleBackdropMouseDown = () => onClose()

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-link-title"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-slate-800/90 backdrop-blur-md rounded-2xl w-full max-w-xs sm:max-w-md lg:max-w-lg border border-white/10 max-h-[90vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h3 id="add-link-title" className="text-xl font-semibold text-white">
            Yeni Link Ekle
          </h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Kapat"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6">
          <form id="add-link-form" onSubmit={handleSubmit} className="space-y-4 pb-4" noValidate>
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-white/80 mb-2">
                Başlık *
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Link başlığı"
                required
                maxLength={200}
                autoFocus
                autoComplete="off"
              />
            </div>

            {/* URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-white/80 mb-2">
                URL *
              </label>
              <input
                id="url"
                type="text"
                inputMode="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="example.com, https://site.com, localhost:3000"
                required
                maxLength={2048}
                autoComplete="url"
              />
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white/80 mb-2">
                Açıklama
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Link hakkında kısa açıklama"
                maxLength={1000}
                autoComplete="off"
              />
            </div>

            {/* Icon */}
            <div>
              <span className="block text-sm font-medium text-white/80 mb-2">İkon</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {iconOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: option.value }))}
                    className={`flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg border transition-colors ${
                      formData.icon === option.value
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-700/50 border-white/10 text-white/80 hover:bg-slate-600/50'
                    }`}
                    aria-pressed={formData.icon === option.value}
                  >
                    {option.icon}
                    <span className="text-[10px] sm:text-xs">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-white/80 mb-2">
                Kategori
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category} className="bg-slate-700">
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Fixed Buttons */}
        <div className="flex gap-3 p-6 pt-4 flex-shrink-0 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            form="add-link-form"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Ekleniyor…' : 'Ekle'}
          </button>
        </div>
      </div>
    </div>
  )
}
