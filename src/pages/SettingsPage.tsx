import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { useShopStore } from '@/stores/shopStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Save, Loader2, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { currentShop, fetchShops } = useShopStore()
  const [promptpayId, setPromptpayId] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopType, setShopType] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (currentShop) {
      setShopName(currentShop.name || '')
      setShopType(currentShop.shop_type || 'restaurant')
      setShopPhone(currentShop.phone || '')
      setShopAddress(currentShop.address || '')
      setPromptpayId(String(currentShop.settings?.promptpay_id || ''))
    }
  }, [currentShop])

  const handleSave = async () => {
    if (!currentShop) return
    setSaving(true)
    setSaved(false)

    await supabase.from('shops').update({
      name: shopName,
      shop_type: shopType,
      phone: shopPhone,
      address: shopAddress,
      settings: {
        ...((currentShop.settings as Record<string, unknown>) || {}),
        promptpay_id: promptpayId,
      },
    }).eq('id', currentShop.id)

    await fetchShops()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!currentShop) {
    return <div className="text-center text-gray-500 py-20">{t('common.loading')}</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>

      {/* Shop Info */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-lg">ข้อมูลร้าน</h2>
        <div>
          <Label>ชื่อร้าน</Label>
          <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
        </div>
        <div>
          <Label>{t('dashboard.shopType')}</Label>
          <select value={shopType} onChange={(e) => setShopType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="restaurant">{t('shop.type.restaurant')}</option>
            <option value="cafe">{t('shop.type.cafe')}</option>
            <option value="bakery">{t('shop.type.bakery')}</option>
            <option value="buffet">{t('shop.type.buffet')}</option>
            <option value="retail">{t('shop.type.retail')}</option>
          </select>
        </div>
        <div>
          <Label>เบอร์โทรร้าน</Label>
          <Input value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} placeholder="08x-xxx-xxxx" />
        </div>
        <div>
          <Label>ที่อยู่ร้าน</Label>
          <Input value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} placeholder="ที่อยู่" />
        </div>
      </Card>

      {/* PromptPay */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-lg">💚 PromptPay</h2>
        <p className="text-sm text-gray-500">ใส่เบอร์โทรหรือเลขบัตรประชาชน สำหรับรับโอนเงินผ่าน QR Code</p>
        <div>
          <Label>PromptPay ID (เบอร์โทร / เลขบัตร ปชช.)</Label>
          <Input
            value={promptpayId}
            onChange={(e) => setPromptpayId(e.target.value)}
            placeholder="08xxxxxxxx หรือ 1234567890123"
            className="text-lg font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">เบอร์โทร 10 หลัก หรือ เลขบัตร ปชช. 13 หลัก</p>
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" /> บันทึกแล้ว
          </span>
        )}
      </div>
    </div>
  )
}
