import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { admin } from '../../api/client'
import type { AdminStats } from '../../api/client'

const countStatCards: { key: keyof AdminStats; label: string; color: string; link?: string }[] = [
  { key: 'totalUsers', label: 'Total users', color: 'from-violet-500 to-purple-600', link: '/admin/users' },
  { key: 'totalProperties', label: 'Properties', color: 'from-blue-500 to-cyan-500' },
  { key: 'totalUnits', label: 'Units', color: 'from-emerald-500 to-teal-600' },
  { key: 'totalLeases', label: 'Leases', color: 'from-amber-500 to-orange-500' },
  { key: 'totalTenants', label: 'Tenants', color: 'from-rose-500 to-pink-500' },
  { key: 'totalCheques', label: 'Cheques', color: 'from-indigo-500 to-blue-600' },
  { key: 'totalPayments', label: 'Payments', color: 'from-lime-500 to-green-600' },
]

function formatMoney(n: number, currency?: string): string {
  if (n >= 1e7) return (currency === 'AED' ? 'AED ' : '₹ ') + (n / 1e7).toFixed(1) + ' Cr'
  if (n >= 1e5) return (currency === 'AED' ? 'AED ' : '₹ ') + (n / 1e5).toFixed(1) + ' L'
  return (currency === 'AED' ? 'AED ' : '₹ ') + n.toLocaleString()
}

const PIE_COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6']

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    admin
      .stats()
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
          <p className="text-sm font-medium text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
        Failed to load admin stats. Check your connection.
      </div>
    )
  }

  const statCards = countStatCards
  const rolePieData = Object.entries(stats.usersByRole || {}).map(([name, value], i) => ({
    name: name === 'SUPER_ADMIN' ? 'Super Admin' : name,
    value,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }))
  const countryPieData = Object.entries(stats.propertiesByCountry || {}).map(([name, value], i) => ({
    name: name === 'IN' ? 'India' : name === 'AE' ? 'UAE' : name,
    value,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }))

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Admin Overview</h1>
      <p className="mb-8 text-slate-400">Platform-wide statistics</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, color, link }) => {
          const value = stats[key]
          const num = typeof value === 'number' ? value : 0
          const content = (
            <div className={`rounded-2xl border border-slate-700/80 bg-gradient-to-br ${color} p-5 text-white shadow-lg`}>
              <p className="text-sm font-medium opacity-90">{label}</p>
              <p className="mt-1 text-2xl font-bold">{num.toLocaleString()}</p>
            </div>
          )
          return link ? (
            <Link key={key} to={link} className="block transition-transform hover:scale-[1.02]">
              {content}
            </Link>
          ) : (
            <div key={key}>{content}</div>
          )
        })}
      </div>

      {/* Money tracked */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">Money tracked on the platform</h2>
        <p className="mb-4 text-sm text-slate-400">Total value of rent, payments, cheques and security deposits tracked in PropMan</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-sky-500 to-blue-600 p-5 text-white shadow-lg">
            <p className="text-sm font-medium opacity-90">Total rent expected (all time)</p>
            <p className="mt-1 text-xl font-bold">{formatMoney(stats.totalRentExpectedAllTime ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-green-500 to-emerald-600 p-5 text-white shadow-lg">
            <p className="text-sm font-medium opacity-90">Total rent received (all time)</p>
            <p className="mt-1 text-xl font-bold">{formatMoney(stats.totalRentReceivedAllTime ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg">
            <p className="text-sm font-medium opacity-90">Cheque value tracked</p>
            <p className="mt-1 text-xl font-bold">{formatMoney(stats.totalChequeValueTracked ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-500 to-slate-700 p-5 text-white shadow-lg">
            <p className="text-sm font-medium opacity-90">Security deposits tracked</p>
            <p className="mt-1 text-xl font-bold">{formatMoney(stats.totalSecurityDepositsTracked ?? 0)}</p>
          </div>
        </div>
        {(stats.rentExpectedByCurrency && Object.keys(stats.rentExpectedByCurrency).length > 0) ||
        (stats.rentReceivedByCurrency && Object.keys(stats.rentReceivedByCurrency).length > 0) ? (
          <div className="mt-4 rounded-2xl border border-slate-700/80 bg-slate-800/50 p-4">
            <p className="mb-2 text-sm font-medium text-slate-300">By currency</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {Object.entries(stats.rentExpectedByCurrency ?? {}).map(([curr, val]) => (
                <span key={`exp-${curr}`} className="text-slate-400">
                  Expected ({curr}): <span className="font-semibold text-white">{formatMoney(val, curr)}</span>
                </span>
              ))}
              {Object.entries(stats.rentReceivedByCurrency ?? {}).map(([curr, val]) => (
                <span key={`rec-${curr}`} className="text-slate-400">
                  Received ({curr}): <span className="font-semibold text-emerald-400">{formatMoney(val, curr)}</span>
                </span>
              ))}
              {Object.entries(stats.chequeValueByCurrency ?? {}).map(([curr, val]) => (
                <span key={`chq-${curr}`} className="text-slate-400">
                  Cheques ({curr}): <span className="font-semibold text-amber-400">{formatMoney(val, curr)}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Users by role</h2>
          {rolePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={rolePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {rolePieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f1f5f9' }}
                  formatter={(v: number | undefined) => [v ?? 0, 'Count']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-500">No role data</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Properties by country</h2>
          {countryPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={countryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {countryPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f1f5f9' }}
                  formatter={(v: number | undefined) => [v ?? 0, 'Properties']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-500">No country data</p>
          )}
        </div>
      </div>
    </div>
  )
}
