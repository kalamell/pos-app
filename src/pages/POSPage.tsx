import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useShopStore } from '@/stores/shopStore'
import { useMenuStore } from '@/stores/menuStore'
import { useOrderStore } from '@/stores/orderStore'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search, Plus, Minus, Trash2, X, CheckCircle, Loader2, ScanBarcode } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import generatePayload from 'promptpay-qr'
import { QRCodeSVG } from 'qrcode.react'

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
  const [showTransfer, setShowTransfer] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const barcodeRef = useRef<HTMLInputElement>(null)

  const isRetail = currentShop?.shop_type === 'retail'

  const handleBarcodeScan = useCallback((barcode: string) => {
    const item = items.find((i) => i.barcode === barcode && i.is_available)
    if (item) {
      addToCart({ menu_item_id: item.id, name: item.name, price: Number(item.price), quantity: 1, note: '', options: {} })
    } else {
      alert(`ไม่พบสินค้าที่มีบาร์โค้ด: ${barcode}`)
    }
    setBarcodeInput('')
  }, [items, addToCart])

  useEffect(() => {
    if (currentShop) {
      fetchCategories(currentShop.id)
      fetchItems(currentShop.id)
    }
  }, [currentShop])

  useEffect(() => {
    if (isRetail && barcodeRef.current) {
      barcodeRef.current.focus()
    }
  }, [isRetail])

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
    console.log('handlePay called:', method, { currentBranch, cartLength: cart.length })
    if (cart.length === 0) {
      alert('ไม่มีสินค้าในตะกร้า')
      return
    }
    if (!currentBranch) {
      alert('กรุณาเลือกสาขาก่อน — ไปที่เมนู "สาขา" เพื่อสร้างสาขา')
      return
    }
    setError('')
    if (method === 'cash') {
      setPaymentMethod('cash')
      setShowPayment(true)
      return
    }
    if (method === 'transfer') {
      setShowTransfer(true)
      return
    }
    await processPayment(method)
  }

  const processPayment = async (method: string) => {
    console.log('processPayment called:', method)
    if (!currentBranch) {
      alert('ไม่มีสาขา')
      return
    }
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
      // Decrement stock for retail mode
      if (isRetail) {
        for (const cartItem of cart) {
          const menuItem = items.find((i) => i.id === cartItem.menu_item_id)
          if (menuItem?.track_stock && menuItem.stock_quantity != null) {
            await supabase.from('menu_items').update({
              stock_quantity: menuItem.stock_quantity - cartItem.quantity,
            }).eq('id', menuItem.id)
          }
        }
        if (currentShop) fetchItems(currentShop.id)
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
        {/* Barcode scanner input (retail mode) */}
        {isRetail && (
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={barcodeRef}
                placeholder={t('pos.scanBarcode')}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && barcodeInput.trim()) {
                    e.preventDefault()
                    handleBarcodeScan(barcodeInput.trim())
                  }
                }}
                onBlur={() => { setTimeout(() => barcodeRef.current?.focus(), 100) }}
                className="pl-9 text-lg font-mono"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Search & filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={t('pos.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          {!isRetail && (
            <>
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
            </>
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

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => handlePay('cash')} disabled={cart.length === 0 || processing} variant="secondary" className="py-3">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : `💵 ${t('pos.cash')}`}
            </Button>
            <Button onClick={() => handlePay('transfer')} disabled={cart.length === 0 || processing} variant="secondary" className="py-3">
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : `📱 ${t('pos.transfer')}`}
            </Button>
          </div>
        </div>
      </Card>

      {/* Cash payment modal — full screen, numpad left, summary right */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onKeyDown={(e) => {
            if (processing) return
            if (e.key >= '0' && e.key <= '9') setReceivedAmount(prev => prev + e.key)
            else if (e.key === '.' && !receivedAmount.includes('.')) setReceivedAmount(prev => prev + '.')
            else if (e.key === 'Backspace') setReceivedAmount(prev => prev.slice(0, -1))
            else if (e.key === 'Delete') setReceivedAmount('')
            else if (e.key === 'Enter' && Number(receivedAmount) >= total) processPayment('cash')
            else if (e.key === 'Escape') setShowPayment(false)
          }}
          tabIndex={0}
          ref={(el) => el?.focus()}
        >
          <Card className="relative w-full max-w-3xl mx-4 z-10 overflow-hidden">
            <button onClick={() => !processing && setShowPayment(false)} className="absolute top-3 right-3 z-10 p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            
            <div className="flex flex-col md:flex-row">
              {/* Left: Numpad */}
              <div className="flex-1 p-6 space-y-4">
                <h3 className="text-lg font-bold">💵 {t('pos.cash')}</h3>

                {/* Amount display */}
                <div className="bg-white border-2 border-primary rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">{t('pos.received')}</p>
                  <span className="text-4xl font-bold text-primary">
                    {receivedAmount ? `฿${Number(receivedAmount).toLocaleString()}` : '฿0'}
                  </span>
                </div>

                {/* Quick amounts */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[20, 50, 100, 500, 1000].map((amt) => (
                    <button key={amt} onClick={() => setReceivedAmount(String(amt))}
                      className="py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs hover:bg-blue-100">
                      ฿{amt.toLocaleString()}
                    </button>
                  ))}
                  <button onClick={() => setReceivedAmount(String(Math.ceil(total)))}
                    className="py-2 rounded-lg bg-green-50 text-green-700 font-semibold text-xs hover:bg-green-100">
                    พอดี
                  </button>
                  <button onClick={() => setReceivedAmount(String(Math.ceil(total / 100) * 100))}
                    className="py-2 rounded-lg bg-green-50 text-green-700 font-semibold text-xs hover:bg-green-100">
                    ฿{(Math.ceil(total / 100) * 100).toLocaleString()}
                  </button>
                  <button onClick={() => setReceivedAmount('')}
                    className="py-2 rounded-lg bg-gray-100 text-gray-500 font-semibold text-xs hover:bg-gray-200">
                    ล้าง
                  </button>
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-2">
                  {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '⌫'].map((key) => (
                    <button key={key} onClick={() => {
                      if (key === '⌫') setReceivedAmount(prev => prev.slice(0, -1))
                      else if (key === '00') setReceivedAmount(prev => prev + '00')
                      else setReceivedAmount(prev => prev + key)
                    }}
                      className={`py-4 rounded-xl text-xl font-bold transition-colors ${
                        key === '⌫' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-200 active:bg-gray-300'
                      }`}>
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Order summary + change + pay */}
              <div className="w-full md:w-72 bg-gray-50 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-200">
                {/* Order items */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-3">{t('pos.cart')} ({cart.length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="truncate flex-1">{item.name} x{item.quantity}</span>
                        <span className="font-medium ml-2">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 mt-3 pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t('pos.subtotal')}</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-red-500">
                        <span>{t('pos.discount')}</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-1">
                      <span>{t('pos.total')}</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Change + Pay */}
                <div className="mt-4 space-y-3">
                  {Number(receivedAmount) >= total && (
                    <div className="bg-green-100 rounded-xl p-4 text-center">
                      <p className="text-sm text-green-700">{t('pos.change')}</p>
                      <p className="text-3xl font-bold text-green-600">{formatCurrency(change)}</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-600">❌ {error}</div>
                  )}

                  <Button onClick={() => processPayment('cash')} disabled={Number(receivedAmount) < total || processing}
                    className="w-full py-5 text-lg" size="lg">
                    {processing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {processing ? t('common.loading') : `✅ ${t('pos.pay')}`}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Transfer / PromptPay modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="relative w-full max-w-lg mx-4 z-10 overflow-hidden">
            <button onClick={() => !processing && setShowTransfer(false)} className="absolute top-3 right-3 z-10 p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            
            <div className="flex flex-col md:flex-row">
              {/* Left: QR Code */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center">
                <h3 className="text-lg font-bold mb-4">📱 PromptPay</h3>
                {currentShop?.settings?.promptpay_id ? (
                  <>
                    <div className="bg-white p-4 rounded-xl border-2 border-blue-200">
                      <QRCodeSVG
                        value={generatePayload(String(currentShop.settings.promptpay_id), { amount: total })}
                        size={200}
                        level="M"
                      />
                    </div>
                    <p className="mt-3 text-sm text-gray-500">
                      PromptPay: {String(currentShop.settings.promptpay_id)}
                    </p>
                    <div className="mt-2 bg-blue-50 rounded-lg px-4 py-2 text-center">
                      <p className="text-sm text-blue-600">ยอดที่ต้องโอน</p>
                      <p className="text-2xl font-bold text-blue-700">{formatCurrency(total)}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-2">⚠️ ยังไม่ได้ตั้งค่า PromptPay</p>
                    <p className="text-sm text-gray-400">ไปที่ ตั้งค่า → ใส่เบอร์ PromptPay ของร้าน</p>
                  </div>
                )}
              </div>

              {/* Right: Order summary + confirm */}
              <div className="w-full md:w-64 bg-gray-50 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-200">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-3">{t('pos.cart')} ({cart.length})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cart.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="truncate flex-1">{item.name} x{item.quantity}</span>
                        <span className="font-medium ml-2">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 mt-3 pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t('pos.total')}</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-600">❌ {error}</div>
                  )}
                  <Button onClick={async () => {
                    await processPayment('transfer')
                    setShowTransfer(false)
                  }} disabled={processing} className="w-full py-4" size="lg">
                    {processing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                    {processing ? t('common.loading') : 'ลูกค้าโอนแล้ว'}
                  </Button>
                  <Button onClick={() => setShowTransfer(false)} variant="outline" className="w-full" disabled={processing}>
                    ยกเลิก
                  </Button>
                </div>
              </div>
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
