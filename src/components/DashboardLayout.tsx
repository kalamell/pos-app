import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '@/lib/i18n'
import { useAuthStore } from '@/stores/authStore'
import { useShopStore } from '@/stores/shopStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { LayoutDashboard, ShoppingCart, UtensilsCrossed, GitBranch, ClipboardList, BarChart3, Settings, LogOut, Menu, ChevronDown, Shield } from 'lucide-react'

export default function DashboardLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { shops, branches, currentShop, currentBranch, setCurrentShop, setCurrentBranch } = useShopStore()
  const { language, setLanguage, sidebarOpen, setSidebarOpen } = useSettingsStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const isAdmin = user?.email === 'sankhumpha84@gmail.com'

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/pos', icon: ShoppingCart, label: t('nav.pos') },
    { path: '/menu-manage', icon: UtensilsCrossed, label: t('nav.menu') },
    { path: '/branches', icon: GitBranch, label: t('nav.branches') },
    { path: '/orders', icon: ClipboardList, label: t('nav.orders') },
    { path: '/reports', icon: BarChart3, label: t('nav.reports') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: t('nav.admin') }] : []),
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - desktop */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">P</div>
            {sidebarOpen && <span className="font-bold text-lg">POS</span>}
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg lg:block hidden"><Menu className="w-5 h-5" /></button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"><Menu className="w-5 h-5" /></button>

          {/* Shop selector */}
          {shops.length > 0 && (
            <select value={currentShop?.id || ''} onChange={(e) => { const s = shops.find((s) => s.id === e.target.value); if (s) setCurrentShop(s) }} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}

          {/* Branch selector */}
          {branches.length > 0 && (
            <select value={currentBranch?.id || ''} onChange={(e) => { const b = branches.find((b) => b.id === e.target.value); if (b) setCurrentBranch(b) }} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}

          <div className="flex-1" />

          {/* Language toggle */}
          <button onClick={() => setLanguage(language === 'th' ? 'en' : 'th')} className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50">
            {language === 'th' ? 'EN' : 'TH'}
          </button>

          {/* User menu */}
          <div className="relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm">
              <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                {user?.email?.[0].toUpperCase()}
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48 z-50">
                <div className="px-3 py-2 text-xs text-gray-500 border-b">{user?.email}</div>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100">{t('nav.logout')}</button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40">
        {navItems.slice(0, 5).map((item) => (
          <Link key={item.path} to={item.path} className={`flex-1 flex flex-col items-center py-2 text-xs ${location.pathname === item.path ? 'text-primary-600' : 'text-gray-500'}`}>
            <item.icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
