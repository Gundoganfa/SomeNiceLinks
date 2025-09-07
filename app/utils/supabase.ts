// Supabase singleton client
import { createClient } from '@supabase/supabase-js'

// Global singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Current token getter function
let currentTokenGetter: (() => Promise<string | null>) | null = null

export const initSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    return null
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const headers = new Headers(init?.headers)
            
            // Add auth token if available
            if (currentTokenGetter) {
              try {
                const token = await currentTokenGetter()
                if (token) {
                  headers.set('Authorization', `Bearer ${token}`)
                }
              } catch (error) {
                console.error('Failed to get auth token:', error)
              }
            }
            
            return fetch(input, { ...init, headers })
          },
        },
      }
    )
  }

  return supabaseInstance
}

export const setAuthTokenGetter = (tokenGetter: (() => Promise<string | null>) | null) => {
  currentTokenGetter = tokenGetter
}

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    return initSupabaseClient()
  }
  return supabaseInstance
}
