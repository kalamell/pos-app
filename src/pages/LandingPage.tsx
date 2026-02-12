import { Link } from 'react-router-dom'
import { useTranslation } from '@/lib/i18n'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { ShoppingCart, QrCode, GitBranch, BarChart3, Check } from 'lucide-react'
import { Button } from '@/components/ui'

export default function LandingPage() {
  const { t } = useTranslation()
  const { language, setLanguage } = useSettingsStore()
  const { user } = useAuthStore()

  const features = [
    { icon: ShoppingCart, title: t('landing.features.pos.title'), desc: t('landing.features.pos.desc') },
    { icon: QrCode, title: t('landing.features.qr.title'), desc: t('landing.features.qr.desc') },
    { icon: GitBranch, title: t('landing.features.branch.title'), desc: t('landing.features.branch.desc') },
    { icon: BarChart3, title: t('landing.features.report.title'), desc: t('landing.features.report.desc') },
  ]

  const plans = [
    { name: t('landing.pricing.free.name'), price: t('landing.pricing.free.price'), features: [t('landing.pricing.free.f1'), t('landing.pricing.free.f2'), t('landing.pricing.free.f3'), t('landing.pricing.free.f4')], highlight: false },
    { name: t('landing.pricing.pro.name'), price: t('landing.pricing.pro.price'), features: [t('landing.pricing.pro.f1'), t('landing.pricing.pro.f2'), t('landing.pricing.pro.f3'), t('landing.pricing.pro.f4'), t('landing.pricing.pro.f5')], highlight: true },
    { name: t('landing.pricing.business.name'), price: t('landing.pricing.business.price'), features: [t('landing.pricing.business.f1'), t('landing.pricing.business.f2'), t('landing.pricing.business.f3'), t('landing.pricing.business.f4'), t('landing.pricing.business.f5')], highlight: false },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
            <span className="font-bold text-xl">POS</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-gray-600 hover:text-gray-900">{t('nav.features')}</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">{t('nav.pricing')}</a>
            <Link to="/contact" className="text-gray-600 hover:text-gray-900">{t('nav.contact')}</Link>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLanguage(language === 'th' ? 'en' : 'th')} className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
              {language === 'th' ? 'EN' : 'TH'}
            </button>
            {user ? (
              <Link to="/dashboard"><Button>{t('nav.dashboard')}</Button></Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">{t('nav.login')}</Link>
                <Link to="/login"><Button>{t('nav.register')}</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">{t('landing.hero.title')}</h1>
          <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">{t('landing.hero.subtitle')}</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/login"><Button size="lg">{t('landing.hero.cta')}</Button></Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('landing.features.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('landing.pricing.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div key={i} className={`rounded-xl p-8 border-2 ${plan.highlight ? 'border-primary-600 shadow-lg relative' : 'border-gray-200'}`}>
                {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-medium">Popular</div>}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="text-3xl font-bold text-primary-600 mb-6">{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login"><Button variant={plan.highlight ? 'primary' : 'outline'} className="w-full">{t('landing.pricing.cta')}</Button></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
            <span className="font-bold text-white">POS</span>
            <span className="text-sm ml-2">{t('landing.footer.desc')}</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/contact" className="hover:text-white">{t('nav.contact')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
