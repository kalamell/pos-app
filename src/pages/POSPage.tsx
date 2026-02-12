import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useShopStore } from '@/stores/shopStore'
import { useMenuStore } from '@/stores/menuStore'
import { useOrderStore } from '@/stores/orderStore'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search, Plus, Minus, Trash2, X, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Table {
  id: string
  table_number: string
  status: string
}

export default function POSPage() {
  const { t } = useTranslation()
  const { currentShop, currentBranch } = useShopStore()
  const { categories, items, fetchCategories, fetchItems } = useMenuStore()
  const { cart, addToCart, removeFromCart, updateCartQuantity, clearCart, createOrder } = useOrderStore()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [orderType, setOrderType] = useState('dine_in')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [receivedAmount, setReceivedAmount] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [note, setNote] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (currentShop) {
      fetchCategories(currentShop.id)
      fetchItems(currentShop.id)
    }
  }, [currentShop])

  useEffect(() => {
    if (currentBranch) {
      supabase.from('tables').select('*').eq('branch_id', currentBranch.id).then(({ data }) => {
        setTables((data || []) as Table[])
      })
    }
  }, [currentBranch])

  const filteredItems = items.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !selectedCategory || item.category_id === selectedCategory
    return matchSearch && matchCategory && item.is_available
  })

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const total = subtotal - discount
  const change = paymentMethod === 'cash' && receivedAmount ? Number(receivedAmount) - total : 0

  const handlePay = async (method: string) => {
    if (!currentBranch || cart.length === 0) return
    setError('')
    if (method === 'cash') {
      setPaymentMethod('cash')
      setShowPayment(true)
      return
    }
    // transfer / card → process immediately
    await processPayment(method)
  }

  const processPayment = async (method: string) => {
    if (!currentBranch) return
    setProcessing(true)
    setError('')
    try {
      const result = await createOrder({
        branch_id: currentBranch.id,
        table_id: selectedTable,
        order_type: orderType,
        items: cart,
        discount,
        payment_method: method,
        note,
      })
      if (result.error) {
        setError(result.error)
        setProcessing(false)
        return
      }
      // Success!
      setShowPayment(false)
      setPaymentMethod(null)
      setReceivedAmount('')
      setDiscount(0)
      setNote('')
      setSelectedTable(null)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      setError((err as Error).message || 'Unknown error')
    }
    setProcessing(false)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)]">
      {/* Left: Menu */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search & filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={t('pos.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="dine_in">{t('pos.dineIn')}</option>
            <option value="takeaway">{t('pos.takeaway')}</option>
          </select>
          {orderType === 'dine_in' && tables.length > 0 && (
            <select value={selectedTable || ''} onChange={(e) => setSelectedTable(e.target.value || null)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">{t('pos.selectTable')}</option>
              {tables.map((tb) => <option key={tb.id} value={tb.id}>{tb.table_number}</option>)}
            </select>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={() => setSelectedCategory(null)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700'}`}>
            {t('pos.allCategories')}
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${selectedCategory === c.id ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700'}`}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center text-gray-500 py-20">{t('pos.noMenu')}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <button key={item.id} onClick={() => addToCart({ menu_item_id: item.id, name: item.name, price: Number(item.price), quantity: 1, note: '', options: {} })}
                  className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-primary/50 hover:shadow-sm transition-all">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-3xl">🍽️</div>
                  )}
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-primary font-bold text-sm">{formatCurrency(Number(item.price))}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <Card className="lg:w-96 flex flex-col">
        <div className="p-4 border-b border-gray-200 font-semibold flex items-center justify-between">
          <span>{t('pos.cart')} ({cart.length})</span>
          {cart.length > 0 && <button onClick={clearCart} className="text-red-500 text-sm hover:text-red-700">{t('common.delete')}</button>}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-center text-gray-400 py-8">{t('pos.emptyCart')}</p>
          ) : (
            cart.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateCartQuantity(i, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(i, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-semibold w-20 text-right">{formatCurrency(item.price * item.quantity)}</p>
                <button onClick={() => removeFromCart(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))
          )}
        </div>

        {/* Totals & payment */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <Input placeholder={t('pos.note')} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex items-center justify-between text-sm">
            <span>{t('pos.subtotal')}</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{t('pos.discount')}</span>
            <Input type="number" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} className="w-24 text-right" />
          </div>
          <div className="flex items-center justify-between font-bold text-lg">
            <span>{t('pos.total')}</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              ❌ {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Button onClick={() => handlePay('cash')} disabled={cart.length === 0 || processing} variant="secondary">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : `💵 ${t('pos.cash')}`}
            </Button>
            <Button onClick={() => handlePay('transfer')} disabled={cart.length === 0 || processing} variant="secondary">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : `📱 ${t('pos.transfer')}`}
            </Button>
            <Button onClick={() => handlePay('card')} disabled={cart.length === 0 || processing} variant="secondary">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : `💳 ${t('pos.card')}`}
            </Button>
          </div>
        </div>
      </Card>

      {/* Cash payment modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !processing && setShowPayment(false)} />
          <Card className="relative w-full max-w-sm mx-4 p-6 z-10">
            <button onClick={() => !processing && setShowPayment(false)} className="absolute top-3 right-3"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold mb-4">💵 {t('pos.cash')}</h3>
            <div className="space-y-4">
              <div className="flex justify-between font-bold text-lg">
                <span>{t('pos.total')}</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div>
                <label className="text-sm font-medium">{t('pos.received')}</label>
                <Input type="number" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} autoFocus className="text-2xl text-center font-bold" />
              </div>
              {Number(receivedAmount) >= total && (
                <div className="flex justify-between items-center text-lg">
                  <span>{t('pos.change')}</span>
                  <span className="text-lg font-bold text-green-600 bg-green-50 px-4 py-1 rounded-full">{formatCurrency(change)}</span>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-600">❌ {error}</div>
              )}
              <Button onClick={() => processPayment('cash')} disabled={Number(receivedAmount) < total || processing} className="w-full" size="lg">
                {processing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {processing ? t('common.loading') : t('pos.pay')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-right">
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-bold">✅ สำเร็จ!</p>
            <p className="text-sm">บันทึกออเดอร์เรียบร้อย</p>
          </div>
        </div>
      )}
    </div>
  )
}
