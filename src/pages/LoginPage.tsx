import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from '@/lib/i18n'
import { useAuthStore } from '@/stores/authStore'
import { Button, Input, Label, Card } from '@/components/ui'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, register } = useAuthStore()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    if (tab === 'login') {
      const result = await login(email, password)
      if (result.error) setError(t('auth.error.login'))
      else navigate('/dashboard')
    } else {
      const result = await register(email, password, fullName)
      if (result.error) setError(t('auth.error.register'))
      else { setSuccess(t('auth.success.register')); setTab('login') }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
          <span className="font-bold text-xl">POS</span>
        </Link>

        <div className="flex mb-6 border-b border-gray-200">
          <button onClick={() => setTab('login')} className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'login' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>{t('auth.login')}</button>
          <button onClick={() => setTab('register')} className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'register' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>{t('auth.register')}</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <Label>{t('auth.fullName')}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}
          <div>
            <Label>{t('auth.email')}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>{t('auth.password')}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('common.loading') : tab === 'login' ? t('auth.loginBtn') : t('auth.registerBtn')}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {tab === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
          <button onClick={() => setTab(tab === 'login' ? 'register' : 'login')} className="text-primary-600 font-medium">
            {tab === 'login' ? t('auth.register') : t('auth.login')}
          </button>
        </p>
      </Card>
    </div>
  )
}
