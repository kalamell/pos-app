import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import ContactPage from '@/pages/ContactPage'
import Dashboard from '@/pages/Dashboard'
import POSPage from '@/pages/POSPage'
import MenuPage from '@/pages/MenuPage'
import BranchPage from '@/pages/BranchPage'
import OrdersPage from '@/pages/OrdersPage'
import MenuPublicPage from '@/pages/MenuPublicPage'
import AdminPage from '@/pages/AdminPage'

function HomeRedirect() {
  const { user, loading } = useAuthStore()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <LandingPage />
}

export default function App() {
  const { initialize } = useAuthStore()
  useEffect(() => { initialize() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/menu/:shopSlug/:branchId" element={<MenuPublicPage />} />
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/menu-manage" element={<MenuPage />} />
          <Route path="/branches" element={<BranchPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/reports" element={<div className="text-center text-gray-500 py-20">Reports - Coming Soon</div>} />
          <Route path="/settings" element={<div className="text-center text-gray-500 py-20">Settings - Coming Soon</div>} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
