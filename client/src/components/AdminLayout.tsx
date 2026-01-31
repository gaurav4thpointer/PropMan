import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const adminNavLinks = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/activity', label: 'Activity' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="sticky top-0 z-40 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link
              to="/admin"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                ⚡
              </span>
              <span className="hidden sm:inline">PropMan Admin</span>
            </Link>
            <div className="flex flex-1 min-w-0 items-center justify-center gap-1 overflow-x-auto py-2 scrollbar-hide sm:justify-center">
              {adminNavLinks.map(({ to, label }) => {
                const isActive = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to))
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-slate-400">{user?.email}</span>
              <Link
                to="/"
                className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 shadow-sm transition-colors hover:bg-slate-700 hover:text-white"
              >
                App
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 shadow-sm transition-colors hover:bg-amber-500/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
