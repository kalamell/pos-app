import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface UserPlan {
  id: string
  user_id: string
  plan: string
  max_shops: number
  max_branches: number
  max_menu_items: number
  features: Record<string, unknown>
}

interface PlanState {
  plan: UserPlan | null
  loading: boolean
  fetchPlan: () => Promise<void>
}

export const usePlanStore = create<PlanState>((set) => ({
  plan: null,
  loading: false,
  fetchPlan: async () => {
    set({ loading: true })
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { set({ loading: false }); return }
    const { data } = await supabase.from('user_plans').select('*').eq('user_id', userData.user.id).single()
    set({ plan: data as UserPlan | null, loading: false })
  },
}))
