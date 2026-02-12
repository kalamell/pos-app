import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (email: string, password: string, fullName: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialize: async () => {
    const { data } = await supabase.auth.getSession()
    set({ user: data.session?.user ?? null, loading: false })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null })
    })
  },
  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  },
  register: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (error) return { error: error.message }

    // Create profile + plan (trigger was removed)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        role: 'owner',
      })
      await supabase.from('user_plans').upsert({
        user_id: data.user.id,
        plan: 'free',
        max_shops: 1,
        max_branches: 1,
        max_menu_items: 30,
      }, { onConflict: 'user_id' })
    }
    return {}
  },
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
