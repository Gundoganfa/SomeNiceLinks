import type { Database } from '@/src/types/database'

// Users table types
export type UserRow = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

// Links table types
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
  clickCount?: number
}

export type NewLink = Omit<Link, 'id'>

export type ToastKind = 'success' | 'error' | 'info' | 'warning'
export type ToastItem = { id: string; kind: ToastKind; text: string }

export interface BackgroundTheme {
  name: string
  class: string
}
