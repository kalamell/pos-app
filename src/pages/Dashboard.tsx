import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useShopStore } from '@/stores/shopStore'
import { useOrderStore } from '@/stores/orderStore'
import { formatCurrency } from '@/lib/utils'
import { Button, Input, Label, Card, Modal, Select } from '@/components/ui'
import { DollarSign, ShoppingBag, TrendingUp, Clock } from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation()
  const { shops, currentShop, currentBranch, fetchShops, createShop } = useShopStore()
  const { orders, fetchOrders } = useOrderStore()
  const [showCreateShop, setShowCreateShop] = useState(false)
  const [shopForm, setShopForm] = useState({ name: '', slug: '', shop_type: 'restaurant' })
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchShops() }, [])
  useEffect(() => { if (currentBranch) fetchOrders(currentBranch.id) }, [currentBranch])

  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString())
  const todaySales = todayOrders.filter((o) => o.status === 'paid').reduce((sum, o) => sum + Number(o.total), 0)

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    await createShop(shopForm)
    setShowCreateShop(false)
    setShopForm({ name: '', slug: '', shop_type: 'restaurant' })
    setCreating(false)
  }

  if (!currentShop && !shops.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{t('dashboard.noShop')}</h2>
          <Button onClick={() => setShowCreateShop(true)}>{t('dashboard.createShop')}</Button>
        </div>
        <Modal open={showCreateShop} onClose={() => setShowCreateShop(false)} title={t('dashboard.createShop')}>
          <form onSubmit={handleCreateShop} className="space-y-4">
            <div>
              <Label>{t('dashboard.shopName')}</Label>
              <Input value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} required />
            </div>
            <div>
              <Label>{t('dashboard.shopSlug')}</Label>
              <Input value={shopForm.slug} onChange={(e) => setShopForm({ ...shopForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} required />
            </div>
            <div>
              <Label>{t('dashboard.shopType')}</Label>
              <Select value={shopForm.shop_type} onChange={(e) => setShopForm({ ...shopForm, shop_type: e.target.value })}>
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Cafe</option>
                <option value="bakery">Bakery</option>
                <option value="buffet">Buffet</option>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={creating}>{creating ? t('common.loading') : t('common.save')}</Button>
          </form>
        </Modal>
      </div>
    )
  }

  const stats = [
    { label: t('dashboard.todaySales'), value: formatCurrency(todaySales), icon: DollarSign, color: 'bg-green-100 text-green-600' },
    { label: t('dashboard.todayOrders'), value: todayOrders.length.toString(), icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
    { label: t('dashboard.popularItems'), value: '-', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((s, i) => (
          <Card key={i} className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> {t('dashboard.recentOrders')}</h2>
        {todayOrders.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">{t('orders.noOrders')}</p>
        ) : (
          <div className="space-y-2">
            {todayOrders.slice(0, 10).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="font-medium">#{o.order_number}</span>
                  <span className="text-sm text-gray-500 ml-2">{o.order_type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{o.status}</span>
                  <span className="font-semibold">{formatCurrency(Number(o.total))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showCreateShop} onClose={() => setShowCreateShop(false)} title={t('dashboard.createShop')}>
        <form onSubmit={handleCreateShop} className="space-y-4">
          <div>
            <Label>{t('dashboard.shopName')}</Label>
            <Input value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} required />
          </div>
          <div>
            <Label>{t('dashboard.shopSlug')}</Label>
            <Input value={shopForm.slug} onChange={(e) => setShopForm({ ...shopForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} required />
          </div>
          <div>
            <Label>{t('dashboard.shopType')}</Label>
            <Select value={shopForm.shop_type} onChange={(e) => setShopForm({ ...shopForm, shop_type: e.target.value })}>
              <option value="restaurant">Restaurant</option>
              <option value="cafe">Cafe</option>
              <option value="bakery">Bakery</option>
              <option value="buffet">Buffet</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={creating}>{creating ? t('common.loading') : t('common.save')}</Button>
        </form>
      </Modal>
    </div>
  )
}
