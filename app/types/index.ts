import type { Database } from '@/src/lib/database.types'

export type LinkInsert = Database['public']['Tables']['links']['Insert']
export type LinkRow = Database['public']['Tables']['links']['Row']

export interface Link {
  id: string
  title: string
  url: string
  description: string
  icon: string
  category: string
  customColor?: string
  sortOrder?: number
}

export type NewLink = Omit<Link, 'id'>

export type ToastKind = 'success' | 'error' | 'info'
export type ToastItem = { id: string; kind: ToastKind; text: string }

export interface BackgroundTheme {
  name: string
  class: string
}
