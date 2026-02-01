import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { reports, properties as propertiesApi } from '../api/client'
import type { DashboardData, Property } from '../api/types'

function formatNum(n: number): string {
  if (n >= 1e7) return (n / 1e7).toFixed(1) + ' Cr'
  if (n >= 1e5) return (n / 1e5).toFixed(1) + ' L'
  return n.toLocaleString()
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString(undefined, { dateStyle: 'short' })
}

const CHART_COLORS = { expected: '#6366f1', received: '#10b981', overdue: '#ef4444' }

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPropertyId, setFilterPropertyId] = useState('')

  useEffect(() => {
    reports.dashboard(filterPropertyId || undefined)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [filterPropertyId])

  useEffect(() => {
    propertiesApi.list({ limit: 100 }).then((r) => setPropertiesList(r.data.data))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        Failed to load dashboard. Check your connection and try again.
      </div>
    )
  }

  const monthChartData = [
    { label: 'Expected', expected: data.month.expected, received: 0 },
    { label: 'Received', expected: 0, received: data.month.received },
  ]
  const incomePieData = [
    { name: 'Received', value: data.month.received + data.quarter.received, fill: CHART_COLORS.received },
    { name: 'Overdue', value: data.overdueAmount, fill: CHART_COLORS.overdue },
  ].filter((d) => d.value > 0)

  const quickLinks = [
    { to: '/properties', label: 'Properties', icon: '🏠' },
    { to: '/tenants', label: 'Tenants', icon: '👤' },
    { to: '/leases', label: 'Leases', icon: '📄' },
    { to: '/payments', label: 'Payments', icon: '💰' },
    { to: '/cheques', label: 'Cheques', icon: '📋' },
    { to: '/reports', label: 'Reports', icon: '📊' },
  ]

  return (
    <div className="space-y-8">
      {/* Header + filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="mt-1 text-slate-500">Overview of your rental income and activity</p>
        </div>
        <div className="flex flex-nowrap items-center gap-3">
          <label className="text-sm font-medium text-slate-600">Property</label>
          <select
            value={filterPropertyId}
            onChange={(e) => setFilterPropertyId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none"
            aria-label="Filter by property"
          >
            <option value="">All properties</option>
            {propertiesList.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        {quickLinks.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
          >
            <span aria-hidden>{icon}</span>
            {label}
          </Link>
        ))}
      </div>

      {/* At a glance – 6 stat cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">At a glance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-white shadow-sm">
            <p className="text-xs font-medium opacity-90">Month – Expected</p>
            <p className="mt-1 text-xl font-bold">{formatNum(data.month.expected)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-sm">
            <p className="text-xs font-medium opacity-90">Month – Received</p>
            <p className="mt-1 text-xl font-bold">{formatNum(data.month.received)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-amber-500 to-orange-500 p-4 text-white shadow-sm">
            <p className="text-xs font-medium opacity-90">Quarter</p>
            <p className="mt-1 text-lg font-bold">{formatNum(data.quarter.expected)} / {formatNum(data.quarter.received)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-rose-500 to-red-600 p-4 text-white shadow-sm">
            <p className="text-xs font-medium opacity-90">Overdue</p>
            <p className="mt-1 text-xl font-bold">{formatNum(data.overdueAmount)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-100 p-4 text-slate-800">
            <p className="text-xs font-medium text-slate-600">Units</p>
            <p className="mt-1 text-lg font-bold">{data.unitStats?.vacant ?? 0} vacant · {data.unitStats?.occupied ?? 0} occupied</p>
          </div>
          {data.bouncedCount > 0 ? (
            <Link
              to="/cheques?status=BOUNCED"
              className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 shadow-sm transition-colors hover:bg-amber-100"
            >
              <p className="text-xs font-medium">Bounced cheques</p>
              <p className="mt-1 text-xl font-bold">{data.bouncedCount}</p>
              <p className="mt-1 text-xs font-medium text-amber-600">View →</p>
            </Link>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-slate-600 shadow-sm">
              <p className="text-xs font-medium">Bounced</p>
              <p className="mt-1 text-xl font-bold">0</p>
            </div>
          )}
        </div>
      </div>

      {/* Money tracked */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Money tracked in PropMan</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total rent expected (all time)</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{formatNum(data.totalTrackedExpected ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Total received (all time)</p>
            <p className="mt-1 text-lg font-bold text-emerald-700">{formatNum(data.totalTrackedReceived ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Cheque value tracked</p>
            <p className="mt-1 text-lg font-bold text-amber-700">{formatNum(data.totalChequeValueTracked ?? 0)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Security deposits</p>
            <p className="mt-1 text-lg font-bold text-slate-800">{formatNum(data.totalSecurityDepositsTracked ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Action lists – 3 columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Overdue schedules */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Overdue schedules</h2>
            <p className="text-xs text-slate-500">Rent due and not yet paid</p>
          </div>
          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {data.overdueSchedules.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-slate-500">All clear</li>
            ) : (
              data.overdueSchedules.slice(0, 10).map((s) => (
                <li key={s.id} className="px-4 py-3 transition-colors hover:bg-slate-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 text-sm text-slate-700">
                      {s.lease?.id ? (
                        <>
                          {s.lease?.propertyId && (
                            <Link to={`/properties/${s.lease.propertyId}`} className="text-indigo-600 hover:underline truncate block">
                              {s.lease?.property?.name}
                            </Link>
                          )}
                          <span className="text-slate-500"> {s.lease?.unit?.unitNo}</span>
                          {s.lease?.tenantId && s.lease?.tenant?.name && (
                            <Link to={`/tenants/${s.lease.tenantId}`} className="ml-1 text-slate-600 hover:underline">· {s.lease.tenant.name}</Link>
                          )}
                        </>
                      ) : (
                        `${s.lease?.property?.name} – ${s.lease?.unit?.unitNo}`
                      )}
                    </span>
                    <span className="shrink-0 font-semibold text-rose-600 text-sm">{formatNum(Number(s.expectedAmount))}</span>
                  </div>
                  {s.lease?.id && (
                    <Link to={`/leases/${s.lease.id}`} className="mt-1 inline-block text-xs font-medium text-indigo-600 hover:underline">View lease →</Link>
                  )}
                </li>
              ))
            )}
          </ul>
          <Link to="/reports" className="block border-t border-slate-100 px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50/50">
            View reports →
          </Link>
        </div>

        {/* Upcoming cheques */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Upcoming cheques (90 days)</h2>
            <p className="text-xs text-slate-500">Post-dated cheques due soon</p>
          </div>
          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {data.upcomingCheques.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-slate-500">No upcoming cheques</li>
            ) : (
              data.upcomingCheques.slice(0, 10).map((c) => (
                <li key={c.id} className="px-4 py-3 transition-colors hover:bg-slate-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 text-sm">
                      <Link to="/cheques" className="font-medium text-indigo-600 hover:underline truncate block">{c.coversPeriod}</Link>
                      {c.propertyId && (
                        <Link to={`/cheques?propertyId=${c.propertyId}`} className="text-xs text-slate-500 hover:underline">{c.property?.name}</Link>
                      )}
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{formatDate(c.chequeDate)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
          <Link to="/cheques" className="block border-t border-slate-100 px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50/50">
            View all cheques →
          </Link>
        </div>

        {/* Expiring leases */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Leases expiring (90 days)</h2>
            <p className="text-xs text-slate-500">Renew or vacate</p>
          </div>
          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {(data.expiringLeases?.length ?? 0) === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-slate-500">None in next 90 days</li>
            ) : (
              (data.expiringLeases ?? []).slice(0, 10).map((lease) => (
                <li key={lease.id} className="px-4 py-3 transition-colors hover:bg-slate-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 text-sm text-slate-700">
                      {lease.propertyId && (
                        <Link to={`/properties/${lease.propertyId}`} className="text-indigo-600 hover:underline">{lease.property?.name}</Link>
                      )}
                      <span className="text-slate-500"> {lease.unit?.unitNo}</span>
                      {lease.tenantId && lease.tenant?.name && (
                        <Link to={`/tenants/${lease.tenantId}`} className="ml-1 text-slate-600 hover:underline">· {lease.tenant.name}</Link>
                      )}
                    </span>
                    <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">{formatDate(lease.endDate)}</span>
                  </div>
                  <Link to={`/leases/${lease.id}`} className="mt-1 inline-block text-xs font-medium text-indigo-600 hover:underline">View lease →</Link>
                </li>
              ))
            )}
          </ul>
          <Link to="/leases" className="block border-t border-slate-100 px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50/50">
            View all leases →
          </Link>
        </div>
      </div>

      {/* Charts – compact row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">This month – Expected vs Received</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatNum(v)} />
              <Tooltip formatter={(v) => formatNum(Number(v) || 0)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="expected" name="Expected" fill={CHART_COLORS.expected} radius={[6, 6, 0, 0]} />
              <Bar dataKey="received" name="Received" fill={CHART_COLORS.received} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Income overview</h2>
          {incomePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={incomePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {incomePieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatNum(Number(v) || 0)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-slate-500">No data</div>
          )}
        </div>
      </div>
    </div>
  )
}
