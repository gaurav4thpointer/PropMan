import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AdminRoute from './components/AdminRoute'
import HomeOrApp from './components/HomeOrApp'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Alerts from './pages/Alerts'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import Tenants from './pages/Tenants'
import TenantDetail from './pages/TenantDetail'
import Leases from './pages/Leases'
import LeaseDetail from './pages/LeaseDetail'
import Cheques from './pages/Cheques'
import ChequeDetail from './pages/ChequeDetail'
import Payments from './pages/Payments'
import Reports from './pages/Reports'
import Owners from './pages/Owners'
import OwnerDetail from './pages/OwnerDetail'
import Account from './pages/Account'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminActivity from './pages/admin/AdminActivity'
import AdminCountries from './pages/admin/AdminCountries'
import NotFound from './pages/NotFound'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<HomeOrApp />}>
            <Route index element={<Dashboard />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="properties" element={<Properties />} />
            <Route path="properties/:id" element={<PropertyDetail />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="tenants/:id" element={<TenantDetail />} />
            <Route path="leases" element={<Leases />} />
            <Route path="leases/:id" element={<LeaseDetail />} />
            <Route path="cheques" element={<Cheques />} />
            <Route path="cheques/:id" element={<ChequeDetail />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="owners" element={<Owners />} />
            <Route path="owners/:id" element={<OwnerDetail />} />
            <Route path="account" element={<Account />} />
          </Route>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="countries" element={<AdminCountries />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
