'use client'

import { useState } from 'react'
import {
  Github, Globe, Database, Server, Cpu, Code,
  Book, FileText, Video, Image, Music,
  X, Twitter, Linkedin, Mail, Bookmark, Star,
  Cloud, Package, Terminal, FileCode
} from "lucide-react"

import type { NewLink } from '../types'

interface AddLinkModalProps {
  onAdd: (link: NewLink) => void
  onClose: () => void
}


const iconOptions = [
  { value: 'github', label: 'GitHub', icon: <Github className="w-5 h-5" /> },
  { value: 'globe', label: 'Website', icon: <Globe className="w-5 h-5" /> },
  { value: 'database', label: 'Database', icon: <Database className="w-5 h-5" /> },
  { value: 'server', label: 'Server', icon: <Server className="w-5 h-5" /> },
  { value: 'cpu', label: 'System', icon: <Cpu className="w-5 h-5" /> },
  { value: 'code', label: 'Code', icon: <Code className="w-5 h-5" /> },

  // içerik & kaynak türleri
  { value: 'docs', label: 'Docs', icon: <Book className="w-5 h-5" /> },
  { value: 'file', label: 'File', icon: <FileText className="w-5 h-5" /> },
  { value: 'video', label: 'Video', icon: <Video className="w-5 h-5" /> },
  { value: 'image', label: 'Image', icon: <Image className="w-5 h-5" /> },
  { value: 'music', label: 'Music', icon: <Music className="w-5 h-5" /> },

  // sosyal & iletişim
  { value: 'twitter', label: 'Twitter', icon: <Twitter className="w-5 h-5" /> },
  { value: 'linkedin', label: 'LinkedIn', icon: <Linkedin className="w-5 h-5" /> },
  { value: 'mail', label: 'Mail', icon: <Mail className="w-5 h-5" /> },

  // genel
  { value: 'bookmark', label: 'Bookmark', icon: <Bookmark className="w-5 h-5" /> },
  { value: 'favorite', label: 'Favorite', icon: <Star className="w-5 h-5" /> },
  { value: 'cloud', label: 'Cloud', icon: <Cloud className="w-5 h-5" /> },
  { value: 'package', label: 'Package', icon: <Package className="w-5 h-5" /> },
  { value: 'terminal', label: 'Terminal', icon: <Terminal className="w-5 h-5" /> },
  { value: 'snippet', label: 'Snippet', icon: <FileCode className="w-5 h-5" /> },
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

export function AddLinkModal({ onAdd, onClose }: AddLinkModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    icon: 'globe',
    category: 'Geliştirme'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title && formData.url) {
      onAdd(formData)
      setFormData({
        title: '',
        url: '',
        description: '',
        icon: 'globe',
        category: 'Geliştirme'
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 w-full max-w-md border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            Yeni Link Ekle
          </h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Başlık *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Link başlığı"
              required
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              URL *
            </label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Açıklama
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Link hakkında kısa açıklama"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              İkon
            </label>
            <div className="grid grid-cols-3 gap-2">
              {iconOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: option.value })}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                    formData.icon === option.value
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-700/50 border-white/10 text-white/80 hover:bg-slate-600/50'
                  }`}
                >
                  {option.icon}
                  <span className="text-xs">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Kategori
            </label>
            <select
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

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
