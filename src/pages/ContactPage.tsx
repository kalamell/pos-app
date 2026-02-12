import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { Button, Input, Textarea, Label, Card } from '@/components/ui'
import { MessageCircle, ArrowLeft } from 'lucide-react'

export default function ContactPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.from('contact_inquiries').insert(form)
    if (err) setError(t('contact.form.error'))
    else { setSuccess(true); setForm({ name: '', email: '', phone: '', message: '' }) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </Link>
        <h1 className="text-3xl font-bold mb-2">{t('contact.title')}</h1>
        <p className="text-gray-600 mb-8">{t('contact.subtitle')}</p>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold">{t('contact.line')}</p>
              <p className="text-gray-600">{t('contact.lineId')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold">{t('contact.form.success')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>{t('contact.form.name')}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label>{t('contact.form.email')}</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <Label>{t('contact.form.phone')}</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>{t('contact.form.message')}</Label>
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} required />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : t('contact.form.submit')}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
