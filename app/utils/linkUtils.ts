import type { Link, NewLink } from '../types'
import { STORAGE_KEY } from '../constants'

export const withIds = (base: NewLink[]): Link[] =>
  base.map((l) => ({ ...l, id: crypto.randomUUID() }))

export const saveToStorage = (arr: Link[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch (err) {
    console.error('localStorage write error:', err)
  }
}

export const loadFromStorage = (): Link[] | null => {
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

export const isValidUrl = (u: string) => {
  try {
    new URL(u)
    return true
  } catch {
    return false
  }
}

export const sanitizeImportedLinks = (json: unknown): Link[] | null => {
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
