import { useEffect, useState } from 'react'
import { admin } from '../../api/client'
import type { AdminUser } from '../../api/client'

interface ActivityData {
  recentLeases: Array<{
    id: string
    startDate: string
    endDate: string
    property?: { name: string; country: string }
    unit?: { unitNo: string }
    tenant?: { name: string }
  }>
  recentPayments: Array<{
    id: string
    date: string
    amount: string | number
    property?: { name: string }
    tenant?: { name: string }
  }>
  recentUsers: AdminUser[]
}

export default function AdminActivity() {
  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    admin
      .activity(15)
      .then((r) => setData(r.data as ActivityData))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (s: string) => new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })
  const formatNum = (n: number | string) => (typeof n === 'string' ? parseFloat(n) : n).toLocaleString()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
          <p className="text-sm font-medium text-slate-400">Loading activity...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
        Failed to load activity.
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Recent Activity</h1>
      <p className="mb-8 text-slate-400">Latest leases, payments, and user signups</p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/50 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">📋</span>
            Recent leases
          </h2>
          <ul className="space-y-2">
            {data.recentLeases?.length === 0 ? (
              <li className="text-sm text-slate-500">No leases</li>
            ) : (
              (data.recentLeases || []).slice(0, 8).map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700/50 bg-slate-800/30 px-3 py-2 text-sm"
                >
                  <span className="text-slate-300">
                    {l.property?.name} – {l.unit?.unitNo}
                    {l.tenant?.name && <span className="text-slate-500"> · {l.tenant.name}</span>}
                  </span>
                  <span className="text-slate-400">{formatDate(l.endDate)}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/50 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">💰</span>
            Recent payments
          </h2>
          <ul className="space-y-2">
            {data.recentPayments?.length === 0 ? (
              <li className="text-sm text-slate-500">No payments</li>
            ) : (
              (data.recentPayments || []).slice(0, 8).map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700/50 bg-slate-800/30 px-3 py-2 text-sm"
                >
                  <span className="text-slate-300">
                    {p.property?.name}
                    {p.tenant?.name && <span className="text-slate-500"> · {p.tenant.name}</span>}
                  </span>
                  <span className="font-medium text-emerald-400">{formatNum(p.amount)}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-800/50 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">👤</span>
            New users
          </h2>
          <ul className="space-y-2">
            {data.recentUsers?.length === 0 ? (
              <li className="text-sm text-slate-500">No users</li>
            ) : (
              (data.recentUsers || []).slice(0, 8).map((u) => (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700/50 bg-slate-800/30 px-3 py-2 text-sm"
                >
                  <span className="text-slate-300">{u.email}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      u.role === 'SUPER_ADMIN' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600/50 text-slate-400'
                    }`}
                  >
                    {u.role === 'SUPER_ADMIN' ? 'Admin' : u.role}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
