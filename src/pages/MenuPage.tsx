import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useShopStore } from '@/stores/shopStore'
import { useMenuStore, type MenuItem } from '@/stores/menuStore'
import { formatCurrency } from '@/lib/utils'
import { Button, Input, Label, Card, Modal, Select, Badge, Textarea } from '@/components/ui'
import { ImageUpload } from '@/components/ui/image-upload'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'

export default function MenuPage() {
  const { t } = useTranslation()
  const { currentShop } = useShopStore()
  const { categories, items, loading, fetchCategories, fetchItems, createCategory, deleteCategory, createItem, updateItem, deleteItem } = useMenuStore()
  const [showCatModal, setShowCatModal] = useState(false)
  const [catName, setCatName] = useState('')
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemForm, setItemForm] = useState({ name: '', price: '', description: '', image_url: '', category_id: '', is_available: true })

  useEffect(() => {
    if (currentShop) {
      fetchCategories(currentShop.id)
      fetchItems(currentShop.id)
    }
  }, [currentShop])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentShop) return
    await createCategory({ shop_id: currentShop.id, name: catName })
    setCatName('')
    setShowCatModal(false)
  }

  const openItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item)
      setItemForm({ name: item.name, price: String(item.price), description: item.description || '', image_url: item.image_url || '', category_id: item.category_id || '', is_available: item.is_available })
    } else {
      setEditingItem(null)
      setItemForm({ name: '', price: '', description: '', image_url: '', category_id: categories[0]?.id || '', is_available: true })
    }
    setShowItemModal(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentShop) return
    const data = { name: itemForm.name, price: Number(itemForm.price), description: itemForm.description || null, image_url: itemForm.image_url || null, category_id: itemForm.category_id || null, is_available: itemForm.is_available }
    if (editingItem) {
      await updateItem(editingItem.id, data)
      await fetchItems(currentShop.id)
    } else {
      await createItem({ ...data, shop_id: currentShop.id })
    }
    setShowItemModal(false)
  }

  const handleDeleteItem = async (id: string) => {
    if (!currentShop || !confirm(t('menu.confirmDelete'))) return
    await deleteItem(id, currentShop.id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('menu.title')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCatModal(true)}><Tag className="w-4 h-4 mr-1" /> {t('menu.addCategory')}</Button>
          <Button onClick={() => openItemModal()}><Plus className="w-4 h-4 mr-1" /> {t('menu.addItem')}</Button>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1.5">
              <span className="text-sm font-medium">{c.name}</span>
              <button onClick={() => { if (currentShop && confirm(t('menu.confirmDelete'))) deleteCategory(c.id, currentShop.id) }} className="text-gray-400 hover:text-red-500 ml-1"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Items */}
      {loading ? (
        <p className="text-center text-gray-500 py-12">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-gray-500">{t('menu.noItems')}</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex gap-3">
                {item.image_url && <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold truncate">{item.name}</p>
                      <p className="text-primary-600 font-bold text-sm">{formatCurrency(Number(item.price))}</p>
                    </div>
                    <Badge variant={item.is_available ? 'success' : 'danger'}>{item.is_available ? t('menu.available') : t('menu.unavailable')}</Badge>
                  </div>
                  {item.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openItemModal(item)} className="text-gray-500 hover:text-primary-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteItem(item.id)} className="text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Category Modal */}
      <Modal open={showCatModal} onClose={() => setShowCatModal(false)} title={t('menu.addCategory')}>
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <Label>{t('menu.categoryName')}</Label>
            <Input value={catName} onChange={(e) => setCatName(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full">{t('common.save')}</Button>
        </form>
      </Modal>

      {/* Item Modal */}
      <Modal open={showItemModal} onClose={() => setShowItemModal(false)} title={editingItem ? t('menu.editItem') : t('menu.addItem')}>
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <Label>{t('menu.itemName')}</Label>
            <Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required />
          </div>
          <div>
            <Label>{t('menu.price')}</Label>
            <Input type="number" step="0.01" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} required />
          </div>
          <div>
            <Label>{t('menu.category')}</Label>
            <Select value={itemForm.category_id} onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}>
              <option value="">-</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>{t('menu.description')}</Label>
            <Textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>{t('image.upload')}</Label>
            <ImageUpload value={itemForm.image_url || null} onChange={(url) => setItemForm({ ...itemForm, image_url: url || '' })} shopId={currentShop?.id || ''} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={itemForm.is_available} onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })} id="available" />
            <label htmlFor="available" className="text-sm">{t('menu.available')}</label>
          </div>
          <Button type="submit" className="w-full">{t('common.save')}</Button>
        </form>
      </Modal>
    </div>
  )
}
