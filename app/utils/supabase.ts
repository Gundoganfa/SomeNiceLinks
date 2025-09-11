// utils/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/src/types/database'   // << ekle

let supabaseInstance: SupabaseClient<Database> | null = null   // << tip ekle
let currentTokenGetter: (() => Promise<string | null>) | null = null

export const initSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // (genelde ANON key kullanılır: NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    })
    return null
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(   // << generic
      supabaseUrl,
      supabaseKey,
      {
        global: {
          fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const headers = new Headers(init?.headers)
            if (currentTokenGetter) {
              try {
                const token = await currentTokenGetter()
                if (token) headers.set('Authorization', `Bearer ${token}`)
              } catch (e) {
                console.error('Failed to get auth token:', e)
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

export const getSupabaseClient = (): SupabaseClient<Database> | null => {  // << tip
  if (!supabaseInstance) return initSupabaseClient()
  return supabaseInstance
}
