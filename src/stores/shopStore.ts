import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Shop {
  id: string
  owner_id: string
  name: string
  slug: string
  shop_type: string
  logo_url: string | null
  address: string | null
  phone: string | null
  settings: Record<string, unknown>
  created_at: string
}

export interface Branch {
  id: string
  shop_id: string
  name: string
  address: string | null
  phone: string | null
  table_count: number
  is_active: boolean
  created_at: string
}

interface ShopState {
  shops: Shop[]
  branches: Branch[]
  currentShop: Shop | null
  currentBranch: Branch | null
  loading: boolean
  fetchShops: () => Promise<void>
  createShop: (data: { name: string; slug: string; shop_type: string }) => Promise<{ error?: string }>
  fetchBranches: (shopId: string) => Promise<void>
  createBranch: (data: { shop_id: string; name: string; address?: string; phone?: string; table_count?: number }) => Promise<{ error?: string }>
  updateBranch: (id: string, data: Partial<Branch>) => Promise<{ error?: string }>
  deleteBranch: (id: string) => Promise<void>
  setCurrentShop: (shop: Shop | null) => void
  setCurrentBranch: (branch: Branch | null) => void
}

export const useShopStore = create<ShopState>((set, get) => ({
  shops: [],
  branches: [],
  currentShop: null,
  currentBranch: null,
  loading: false,
  fetchShops: async () => {
    set({ loading: true })
    const { data } = await supabase.from('shops').select('*').order('created_at')
    const shops = (data || []) as Shop[]
    set({ shops, loading: false })
    if (shops.length > 0 && !get().currentShop) {
      set({ currentShop: shops[0] })
      get().fetchBranches(shops[0].id)
    }
  },
  createShop: async (shopData) => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return { error: 'Not authenticated' }
    const { error } = await supabase.from('shops').insert({ ...shopData, owner_id: userData.user.id })
    if (error) return { error: error.message }
    await get().fetchShops()
    return {}
  },
  fetchBranches: async (shopId) => {
    const { data } = await supabase.from('branches').select('*').eq('shop_id', shopId).order('created_at')
    const branches = (data || []) as Branch[]
    set({ branches })
    if (branches.length > 0 && !get().currentBranch) {
      set({ currentBranch: branches[0] })
    }
  },
  createBranch: async (branchData) => {
    const { error } = await supabase.from('branches').insert(branchData)
    if (error) return { error: error.message }
    await get().fetchBranches(branchData.shop_id)
    return {}
  },
  updateBranch: async (id, data) => {
    const { error } = await supabase.from('branches').update(data).eq('id', id)
    if (error) return { error: error.message }
    const shop = get().currentShop
    if (shop) await get().fetchBranches(shop.id)
    return {}
  },
  deleteBranch: async (id) => {
    await supabase.from('branches').delete().eq('id', id)
    const shop = get().currentShop
    if (shop) await get().fetchBranches(shop.id)
  },
  setCurrentShop: (shop) => {
    set({ currentShop: shop, currentBranch: null, branches: [] })
    if (shop) get().fetchBranches(shop.id)
  },
  setCurrentBranch: (branch) => set({ currentBranch: branch }),
}))
