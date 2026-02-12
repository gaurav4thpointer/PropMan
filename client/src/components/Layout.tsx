import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Menu by feature: Setup → Operations → Analytics
  const baseNavLinks = [
    { to: '/properties', label: 'Properties' },
    { to: '/tenants', label: 'Tenants' },
    { to: '/leases', label: 'Leases' },
    { to: '/cheques', label: 'Cheques' },
    { to: '/payments', label: 'Payments' },
    { to: '/reports', label: 'Reports' },
  ]
  const navLinks = user?.role === 'PROPERTY_MANAGER'
    ? [
        { to: '/properties', label: 'Properties' },
        { to: '/owners', label: 'Owners' },
        { to: '/tenants', label: 'Tenants' },
        { to: '/leases', label: 'Leases' },
        { to: '/cheques', label: 'Cheques' },
        { to: '/payments', label: 'Payments' },
        { to: '/reports', label: 'Reports' },
      ]
    : baseNavLinks

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    setAccountOpen(false)
    logout()
    navigate('/login')
  }

  const isAccountActive = location.pathname === '/account'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-800"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                ₿
              </span>
              <span className="hidden sm:inline">PropMan</span>
            </Link>
            <div className="flex flex-1 min-w-0 flex-wrap items-center justify-center gap-1 py-2 sm:justify-center">
              {navLinks.map(({ to, label }) => {
                const isActive = location.pathname === to || location.pathname.startsWith(to + '/')
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {user?.role === 'SUPER_ADMIN' && (
                <Link
                  to="/admin"
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm transition-colors hover:bg-amber-100"
                >
                  Admin
                </Link>
              )}
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
                    isAccountActive
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  Account
                </button>
                {accountOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                    <Link
                      to="/account"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl overflow-x-hidden px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
