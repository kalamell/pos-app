import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useShopStore } from '@/stores/shopStore'
import { useOrderStore, type Order, type OrderItem } from '@/stores/orderStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button, Card, Badge, Modal } from '@/components/ui'

const statusVariant: Record<string, 'default' | 'warning' | 'info' | 'success' | 'danger'> = {
  pending: 'warning', preparing: 'info', ready: 'info', served: 'success', paid: 'success', cancelled: 'danger',
}
const nextStatus: Record<string, string> = {
  pending: 'preparing', preparing: 'ready', ready: 'served', served: 'paid',
}

export default function OrdersPage() {
  const { t } = useTranslation()
  const { currentBranch } = useShopStore()
  const { orders, currentOrderItems, loading, fetchOrders, fetchOrderItems, updateOrderStatus } = useOrderStore()
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => { if (currentBranch) fetchOrders(currentBranch.id, statusFilter) }, [currentBranch, statusFilter])

  const openDetail = async (order: Order) => {
    setSelectedOrder(order)
    await fetchOrderItems(order.id)
  }

  const handleUpdateStatus = async (order: Order) => {
    if (!currentBranch) return
    const next = nextStatus[order.status]
    if (next) {
      await updateOrderStatus(order.id, next, currentBranch.id)
      setSelectedOrder(null)
    }
  }

  const statusLabels: Record<string, string> = {
    all: t('orders.all'), pending: t('orders.pending'), preparing: t('orders.preparing'),
    ready: t('orders.ready'), served: t('orders.served'), paid: t('orders.paid'), cancelled: t('orders.cancelled'),
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('orders.title')}</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {Object.entries(statusLabels).map(([key, label]) => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${statusFilter === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-12">{t('common.loading')}</p>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">{t('orders.noOrders')}</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(order)}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{t('orders.orderNumber')}{order.order_number}</span>
                <Badge variant={statusVariant[order.status] || 'default'}>{statusLabels[order.status] || order.status}</Badge>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>{t('orders.type')}: {order.order_type === 'dine_in' ? t('pos.dineIn') : t('pos.takeaway')}</p>
                {order.customer_name && <p>{order.customer_name}</p>}
                <p>{formatDate(order.created_at)}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                <span className="text-sm text-gray-500">{order.payment_method || '-'}</span>
                <span className="font-bold text-primary-600">{formatCurrency(Number(order.total))}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`${t('orders.orderNumber')}${selectedOrder?.order_number}`}>
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={statusVariant[selectedOrder.status] || 'default'}>{statusLabels[selectedOrder.status] || selectedOrder.status}</Badge>
              <span className="text-sm text-gray-500">{formatDate(selectedOrder.created_at)}</span>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2">
              {currentOrderItems.map((item: OrderItem) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.item_name} x{item.quantity}</span>
                  <span>{formatCurrency(Number(item.unit_price) * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1">
              <div className="flex justify-between text-sm"><span>{t('pos.subtotal')}</span><span>{formatCurrency(Number(selectedOrder.subtotal))}</span></div>
              {Number(selectedOrder.discount) > 0 && <div className="flex justify-between text-sm text-red-500"><span>{t('pos.discount')}</span><span>-{formatCurrency(Number(selectedOrder.discount))}</span></div>}
              <div className="flex justify-between font-bold text-lg"><span>{t('pos.total')}</span><span className="text-primary-600">{formatCurrency(Number(selectedOrder.total))}</span></div>
            </div>

            {nextStatus[selectedOrder.status] && (
              <Button onClick={() => handleUpdateStatus(selectedOrder)} className="w-full">
                {t('orders.updateStatus')} → {statusLabels[nextStatus[selectedOrder.status]]}
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
