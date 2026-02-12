import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Category {
  id: string
  shop_id: string
  name: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  shop_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  sort_order: number
  options: unknown[]
  created_at: string
}

interface MenuState {
  categories: Category[]
  items: MenuItem[]
  loading: boolean
  fetchCategories: (shopId: string) => Promise<void>
  createCategory: (data: { shop_id: string; name: string }) => Promise<{ error?: string }>
  updateCategory: (id: string, data: Partial<Category>) => Promise<{ error?: string }>
  deleteCategory: (id: string, shopId: string) => Promise<void>
  fetchItems: (shopId: string) => Promise<void>
  createItem: (data: Partial<MenuItem> & { shop_id: string; name: string; price: number }) => Promise<{ error?: string }>
  updateItem: (id: string, data: Partial<MenuItem>) => Promise<{ error?: string }>
  deleteItem: (id: string, shopId: string) => Promise<void>
}

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: [],
  items: [],
  loading: false,
  fetchCategories: async (shopId) => {
    const { data } = await supabase.from('categories').select('*').eq('shop_id', shopId).order('sort_order')
    set({ categories: (data || []) as Category[] })
  },
  createCategory: async (catData) => {
    const { error } = await supabase.from('categories').insert(catData)
    if (error) return { error: error.message }
    await get().fetchCategories(catData.shop_id)
    return {}
  },
  updateCategory: async (id, data) => {
    const { error } = await supabase.from('categories').update(data).eq('id', id)
    if (error) return { error: error.message }
    return {}
  },
  deleteCategory: async (id, shopId) => {
    await supabase.from('categories').delete().eq('id', id)
    await get().fetchCategories(shopId)
  },
  fetchItems: async (shopId) => {
    set({ loading: true })
    const { data } = await supabase.from('menu_items').select('*').eq('shop_id', shopId).order('sort_order')
    set({ items: (data || []) as MenuItem[], loading: false })
  },
  createItem: async (itemData) => {
    const { error } = await supabase.from('menu_items').insert(itemData)
    if (error) return { error: error.message }
    await get().fetchItems(itemData.shop_id)
    return {}
  },
  updateItem: async (id, data) => {
    const { error } = await supabase.from('menu_items').update(data).eq('id', id)
    if (error) return { error: error.message }
    return {}
  },
  deleteItem: async (id, shopId) => {
    await supabase.from('menu_items').delete().eq('id', id)
    await get().fetchItems(shopId)
  },
}))
