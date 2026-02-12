import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Order {
  id: string
  branch_id: string
  table_id: string | null
  order_number: number
  order_type: string
  status: string
  subtotal: number
  discount: number
  total: number
  payment_method: string | null
  paid_at: string | null
  note: string | null
  customer_name: string | null
  created_by: string | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  item_name: string
  quantity: number
  unit_price: number
  options: Record<string, unknown>
  note: string | null
  status: string
  created_at: string
}

export interface CartItem {
  menu_item_id: string
  name: string
  price: number
  quantity: number
  note: string
  options: Record<string, unknown>
}

interface OrderState {
  orders: Order[]
  currentOrderItems: OrderItem[]
  cart: CartItem[]
  loading: boolean
  fetchOrders: (branchId: string, status?: string) => Promise<void>
  fetchOrderItems: (orderId: string) => Promise<void>
  createOrder: (data: {
    branch_id: string
    table_id?: string | null
    order_type: string
    items: CartItem[]
    discount: number
    payment_method?: string
    note?: string
    customer_name?: string
  }) => Promise<{ error?: string }>
  updateOrderStatus: (id: string, status: string, branchId: string) => Promise<void>
  addToCart: (item: CartItem) => void
  removeFromCart: (index: number) => void
  updateCartQuantity: (index: number, quantity: number) => void
  updateCartNote: (index: number, note: string) => void
  clearCart: () => void
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrderItems: [],
  cart: [],
  loading: false,
  fetchOrders: async (branchId, status) => {
    set({ loading: true })
    let query = supabase.from('orders').select('*').eq('branch_id', branchId).order('created_at', { ascending: false })
    if (status && status !== 'all') query = query.eq('status', status)
    const { data } = await query
    set({ orders: (data || []) as Order[], loading: false })
  },
  fetchOrderItems: async (orderId) => {
    const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId)
    set({ currentOrderItems: (data || []) as OrderItem[] })
  },
  createOrder: async ({ branch_id, table_id, order_type, items, discount, payment_method, note, customer_name }) => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const total = subtotal - discount
    const { data: userData } = await supabase.auth.getUser()
    const { data: order, error } = await supabase.from('orders').insert({
      branch_id,
      table_id: table_id || null,
      order_type,
      subtotal,
      discount,
      total,
      payment_method: payment_method || null,
      paid_at: payment_method ? new Date().toISOString() : null,
      status: payment_method ? 'paid' : 'pending',
      note: note || null,
      customer_name: customer_name || null,
      created_by: userData.user?.id || null,
    }).select().single()
    if (error) return { error: error.message }
    const orderItems = items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      options: item.options,
      note: item.note || null,
    }))
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) return { error: itemsError.message }
    set({ cart: [] })
    return {}
  },
  updateOrderStatus: async (id, status, branchId) => {
    const updates: Record<string, unknown> = { status }
    if (status === 'paid') updates.paid_at = new Date().toISOString()
    await supabase.from('orders').update(updates).eq('id', id)
    await get().fetchOrders(branchId)
  },
  addToCart: (item) => {
    const cart = [...get().cart]
    const existing = cart.findIndex((c) => c.menu_item_id === item.menu_item_id && c.note === item.note)
    if (existing >= 0) {
      cart[existing].quantity += item.quantity
    } else {
      cart.push(item)
    }
    set({ cart })
  },
  removeFromCart: (index) => {
    const cart = [...get().cart]
    cart.splice(index, 1)
    set({ cart })
  },
  updateCartQuantity: (index, quantity) => {
    const cart = [...get().cart]
    if (quantity <= 0) {
      cart.splice(index, 1)
    } else {
      cart[index].quantity = quantity
    }
    set({ cart })
  },
  updateCartNote: (index, note) => {
    const cart = [...get().cart]
    cart[index].note = note
    set({ cart })
  },
  clearCart: () => set({ cart: [] }),
}))
