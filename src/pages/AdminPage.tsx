import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Card, Badge, Button } from '@/components/ui'
import { Users, Store, ShoppingBag, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Navigate } from 'react-router-dom'

interface Inquiry {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  is_read: boolean
  created_at: string
}

export default function AdminPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [tab, setTab] = useState<'stats' | 'inquiries'>('stats')
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.email === 'sankhumpha84@gmail.com'

  useEffect(() => {
    if (!isAdmin) return
    const load = async () => {
      const { data } = await supabase.from('contact_inquiries').select('*').order('created_at', { ascending: false })
      setInquiries((data || []) as Inquiry[])
      setLoading(false)
    }
    load()
  }, [isAdmin])

  if (!isAdmin) return <Navigate to="/dashboard" replace />

  const markRead = async (id: string) => {
    await supabase.from('contact_inquiries').update({ is_read: true }).eq('id', id)
    setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, is_read: true } : i))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.title')}</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('stats')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab === 'stats' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>{t('admin.stats')}</button>
        <button onClick={() => setTab('inquiries')} className={`px-4 py-1.5 rounded-full text-sm font-medium ${tab === 'inquiries' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}>{t('admin.inquiries')}</button>
      </div>

      {tab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: t('admin.totalUsers'), icon: Users, color: 'bg-blue-100 text-blue-600' },
            { label: t('admin.totalShops'), icon: Store, color: 'bg-green-100 text-green-600' },
            { label: t('admin.totalOrders'), icon: ShoppingBag, color: 'bg-purple-100 text-purple-600' },
          ].map((s, i) => (
            <Card key={i} className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-6 h-6" /></div>
              <div><p className="text-sm text-gray-500">{s.label}</p><p className="text-2xl font-bold">-</p></div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'inquiries' && (
        loading ? <p className="text-center text-gray-500 py-12">{t('common.loading')}</p> :
        inquiries.length === 0 ? <Card className="p-12 text-center text-gray-500">{t('admin.noInquiries')}</Card> :
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <Card key={inq.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{inq.name}</span>
                  <span className="text-sm text-gray-500">{inq.email}</span>
                  {!inq.is_read && <Badge variant="warning">New</Badge>}
                </div>
                <span className="text-xs text-gray-400">{formatDate(inq.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{inq.message}</p>
              {inq.phone && <p className="text-xs text-gray-500">Tel: {inq.phone}</p>}
              {!inq.is_read && <Button size="sm" variant="outline" onClick={() => markRead(inq.id)} className="mt-2">{t('admin.markRead')}</Button>}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
