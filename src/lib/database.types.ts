export type Database = {
  public: {
    Tables: {
      links: {
        Row: {
          id: string
          owner_id: string
          title: string
          url: string
          description: string | null
          icon: string | null
          category: string | null
          custom_color: string | null
          sort_order: number
          click_count: number
          created_at: string
        }
        Insert: {
          owner_id: string
          title: string
          url: string
          description?: string | null
          icon?: string | null
          category?: string | null
          custom_color?: string | null
          sort_order?: number
          click_count?: number
        }
        Update: {
          owner_id?: string
          title?: string
          url?: string
          description?: string | null
          icon?: string | null
          category?: string | null
          custom_color?: string | null
          sort_order?: number
          click_count?: number
        }
      }
    }
  }
}
