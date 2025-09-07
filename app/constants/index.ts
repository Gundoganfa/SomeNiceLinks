import type { NewLink, BackgroundTheme } from '../types'

export const STORAGE_KEY = 'someNiceLinks'

export const GRADIENTS: string[] = [
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

export const BACKGROUND_THEMES: BackgroundTheme[] = [
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

export const DEFAULT_LINKS_BASE: NewLink[] = [
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
