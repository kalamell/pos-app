import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { Button, Input, Card, Badge } from '@/components/ui'
import { ShoppingCart, Plus, Minus, Trash2, Check } from 'lucide-react'
import type { Category } from '@/stores/menuStore'
import type { MenuItem } from '@/stores/menuStore'

interface CartItem {
  menu_item_id: string
  name: string
  price: number
  quantity: number
}

export default function MenuPublicPage() {
  const { t } = useTranslation()
  const { shopSlug, branchId } = useParams()
  const [searchParams] = useSearchParams()
  const tableNumber = searchParams.get('table')
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shopName, setShopName] = useState('')

  useEffect(() => {
    const load = async () => {
      // Get shop by slug
      const { data: shop } = await supabase.from('shops').select('id, name').eq('slug', shopSlug).single()
      if (!shop) return
      setShopName(shop.name)
      const { data: cats } = await supabase.from('categories').select('*').eq('shop_id', shop.id).eq('is_active', true).order('sort_order')
      setCategories((cats || []) as Category[])
      const { data: menuItems } = await supabase.from('menu_items').select('*').eq('shop_id', shop.id).eq('is_available', true).order('sort_order')
      setItems((menuItems || []) as MenuItem[])
      setLoading(false)
    }
    load()
  }, [shopSlug])

  const filteredItems = selectedCat ? items.filter((i) => i.category_id === selectedCat) : items

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.menu_item_id === item.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx].quantity++
        return next
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: Number(item.price), quantity: 1 }]
    })
  }

  const updateQty = (idx: number, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((_, i) => i !== idx)
      const next = [...prev]
      next[idx].quantity = qty
      return next
    })
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  const placeOrder = async () => {
    if (!branchId || cart.length === 0) return
    // Find table id from table_number
    let tableId = null
    if (tableNumber) {
      const { data: tbl } = await supabase.from('tables').select('id').eq('branch_id', branchId).eq('table_number', tableNumber).single()
      if (tbl) tableId = tbl.id
    }
    const { data: order, error } = await supabase.from('orders').insert({
      branch_id: branchId,
      table_id: tableId,
      order_type: tableNumber ? 'dine_in' : 'takeaway',
      subtotal: total,
      discount: 0,
      total,
      status: 'pending',
      customer_name: customerName || null,
    }).select().single()
    if (error || !order) return
    const orderItems = cart.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
    }))
    await supabase.from('order_items').insert(orderItems)
    setCart([])
    setOrderPlaced(true)
    setShowCart(false)
  }

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">{t('common.loading')}</div>

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t('public.orderPlaced')}</h2>
          {tableNumber && <p className="text-gray-500">{t('public.tableNumber')} {tableNumber}</p>}
          <Button onClick={() => setOrderPlaced(false)} className="mt-6">{t('common.back')}</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{shopName}</h1>
            {tableNumber && <Badge variant="info">{t('public.tableNumber')} {tableNumber}</Badge>}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="sticky top-[65px] z-30 bg-gray-50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto">
          <button onClick={() => setSelectedCat(null)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${!selectedCat ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border'}`}>
            {t('pos.allCategories')}
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${selectedCat === c.id ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {filteredItems.map((item) => (
          <Card key={item.id} className="p-4 flex gap-4">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🍽️</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{item.name}</h3>
              {item.description && <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-primary-600">{formatCurrency(Number(item.price))}</span>
                <Button size="sm" onClick={() => addToCart(item)}><Plus className="w-4 h-4 mr-1" /> {t('public.addToCart')}</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-50">
          <button onClick={() => setShowCart(true)} className="w-full bg-primary-600 text-white rounded-xl py-4 px-6 flex items-center justify-between shadow-lg hover:bg-primary-700 transition-colors">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">{t('public.cart')} ({cartCount})</span>
            </div>
            <span className="font-bold">{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {/* Cart Sheet */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-lg">{t('public.cart')}</h2>
            </div>
            <div className="p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">{t('public.emptyCart')}</p>
              ) : (
                cart.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(i, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQty(i, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                    </div>
                    <span className="font-semibold w-20 text-right">{formatCurrency(item.price * item.quantity)}</span>
                    <button onClick={() => updateQty(i, 0)} className="text-gray-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))
              )}
              <div className="pt-4 border-t space-y-3">
                <Input placeholder={t('public.yourName')} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                <div className="flex justify-between font-bold text-lg">
                  <span>{t('pos.total')}</span>
                  <span className="text-primary-600">{formatCurrency(total)}</span>
                </div>
                <Button onClick={placeOrder} className="w-full" size="lg" disabled={cart.length === 0}>{t('public.placeOrder')}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
