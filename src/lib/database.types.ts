export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string                    // UUID primary key
          clerk_user_id: string         // Clerk user ID (e.g., "user_31ILlNtj9fvjvs19Q2vweeqnfmu")
          email: string | null
          name: string | null
          created_at: string            // timestamp with time zone
        }
        Insert: {
          clerk_user_id: string
          email?: string | null
          name?: string | null
        }
        Update: {
          clerk_user_id?: string
          email?: string | null
          name?: string | null
        }
      }
      links: {
        Row: {
          id: string                    // UUID primary key (auto-generated)
          owner_id: string              // References users.clerk_user_id (Clerk format)
          title: string
          url: string
          description: string | null
          icon: string | null           // Default: 'globe'
          category: string | null       // Default: 'Genel'
          custom_color: string | null
          created_at: string | null     // timestamp with time zone, default: now()
          updated_at: string | null     // timestamp with time zone, default: now()
          sort_order: number | null     // Default: 100
          click_count: number           // Default: 0, NOT NULL
        }
        Insert: {
          owner_id: string              // Clerk user ID (required)
          title: string
          url: string
          description?: string | null
          icon?: string | null          // Will use 'globe' if not provided
          category?: string | null      // Will use 'Genel' if not provided
          custom_color?: string | null
          sort_order?: number | null    // Will use 100 if not provided
          click_count?: number          // Will use 0 if not provided
        }
        Update: {
          owner_id?: string
          title?: string
          url?: string
          description?: string | null
          icon?: string | null
          category?: string | null
          custom_color?: string | null
          sort_order?: number | null
          click_count?: number
          updated_at?: string | null
        }
      }
    }
  }
}
