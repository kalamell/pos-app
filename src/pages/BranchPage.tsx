import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useShopStore } from '@/stores/shopStore'
import { supabase } from '@/lib/supabase'
import { Button, Input, Label, Card, Modal } from '@/components/ui'
import { Plus, QrCode, Pencil, Trash2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface Table {
  id: string
  branch_id: string
  table_number: string
  seats: number
  status: string
}

export default function BranchPage() {
  const { t } = useTranslation()
  const { currentShop, branches, fetchBranches, createBranch, updateBranch, deleteBranch } = useShopStore()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', address: '', phone: '', table_count: 10 })
  const [tables, setTables] = useState<Record<string, Table[]>>({})
  const [showQr, setShowQr] = useState<{ url: string; label: string } | null>(null)

  useEffect(() => {
    if (currentShop) fetchBranches(currentShop.id)
  }, [currentShop])

  useEffect(() => {
    branches.forEach((b) => {
      supabase.from('tables').select('*').eq('branch_id', b.id).order('table_number').then(({ data }) => {
        setTables((prev) => ({ ...prev, [b.id]: (data || []) as Table[] }))
      })
    })
  }, [branches])

  const openModal = (branch?: typeof branches[0]) => {
    if (branch) {
      setEditingId(branch.id)
      setForm({ name: branch.name, address: branch.address || '', phone: branch.phone || '', table_count: branch.table_count })
    } else {
      setEditingId(null)
      setForm({ name: '', address: '', phone: '', table_count: 10 })
    }
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentShop) return
    if (editingId) {
      await updateBranch(editingId, form)
    } else {
      await createBranch({ ...form, shop_id: currentShop.id })
    }
    setShowModal(false)
  }

  const generateTables = async (branchId: string, count: number) => {
    const existing = tables[branchId]?.length || 0
    const newTables = Array.from({ length: count - existing }, (_, i) => ({
      branch_id: branchId,
      table_number: String(existing + i + 1),
      seats: 4,
    }))
    if (newTables.length > 0) {
      await supabase.from('tables').insert(newTables)
      const { data } = await supabase.from('tables').select('*').eq('branch_id', branchId).order('table_number')
      setTables((prev) => ({ ...prev, [branchId]: (data || []) as Table[] }))
    }
  }

  const getQrUrl = (branchId: string, tableNumber: string) => {
    return `${window.location.origin}/menu/${currentShop?.slug}/${branchId}?table=${tableNumber}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('branch.title')}</h1>
        <Button onClick={() => openModal()}><Plus className="w-4 h-4 mr-1" /> {t('branch.add')}</Button>
      </div>

      {branches.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">{t('branch.noBranches')}</Card>
      ) : (
        <div className="space-y-4">
          {branches.map((branch) => (
            <Card key={branch.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{branch.name}</h3>
                  {branch.address && <p className="text-sm text-gray-500">{branch.address}</p>}
                  {branch.phone && <p className="text-sm text-gray-500">{branch.phone}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(branch)} className="p-2 hover:bg-gray-100 rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm(t('menu.confirmDelete'))) deleteBranch(branch.id) }} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium text-sm">{t('branch.tables')}</h4>
                {(!tables[branch.id] || tables[branch.id].length < branch.table_count) && (
                  <Button size="sm" variant="outline" onClick={() => generateTables(branch.id, branch.table_count)}>
                    {t('branch.generateTables')}
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {(tables[branch.id] || []).map((tb) => (
                  <button key={tb.id} onClick={() => setShowQr({ url: getQrUrl(branch.id, tb.table_number), label: `${branch.name} - ${t('branch.tables')} ${tb.table_number}` })}
                    className="w-14 h-14 rounded-lg border border-gray-200 flex flex-col items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-colors">
                    <span className="text-xs text-gray-500">{t('orders.table')}</span>
                    <span className="font-bold text-sm">{tb.table_number}</span>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Branch Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? t('branch.edit') : t('branch.add')}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><Label>{t('branch.name')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><Label>{t('branch.address')}</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>{t('branch.phone')}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>{t('branch.tableCount')}</Label><Input type="number" value={form.table_count} onChange={(e) => setForm({ ...form, table_count: Number(e.target.value) })} /></div>
          <Button type="submit" className="w-full">{t('common.save')}</Button>
        </form>
      </Modal>

      {/* QR Modal */}
      <Modal open={!!showQr} onClose={() => setShowQr(null)} title={t('branch.qrCode')}>
        {showQr && (
          <div className="text-center space-y-4">
            <p className="font-medium">{showQr.label}</p>
            <div className="flex justify-center">
              <QRCodeSVG value={showQr.url} size={200} />
            </div>
            <p className="text-xs text-gray-500 break-all">{showQr.url}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
