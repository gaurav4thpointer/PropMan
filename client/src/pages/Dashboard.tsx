import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { reports, properties as propertiesApi } from '../api/client'
import type { DashboardData, Property } from '../api/types'

const CHART_COLORS = {
  expected: '#6366f1',
  received: '#10b981',
  overdue: '#ef4444',
}

const statCards = [
  { key: 'monthExpected', label: 'This month – Expected', color: 'from-indigo-500 to-violet-600', bg: 'bg-indigo-50', text: 'text-indigo-800', icon: '↑' },
  { key: 'monthReceived', label: 'This month – Received', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-800', icon: '✓' },
  { key: 'quarter', label: 'This quarter', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-800', icon: '◷' },
  { key: 'overdue', label: 'Overdue amount', color: 'from-rose-500 to-red-600', bg: 'bg-rose-50', text: 'text-rose-800', icon: '!' },
]

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
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Failed to load dashboard. Check your connection and try again.
      </div>
    )
  }

  const monthReceivedVal = data.month.received
  const quarterVal = `${formatNum(data.quarter.expected)} / ${formatNum(data.quarter.received)}`

  const monthChartData = [
    { label: 'Expected', expected: data.month.expected, received: 0 },
    { label: 'Received', expected: 0, received: data.month.received },
  ]
  const quarterChartData = [
    { label: 'Expected', expected: data.quarter.expected, received: 0 },
    { label: 'Received', expected: 0, received: data.quarter.received },
  ]
  const incomePieData = [
    { name: 'Received', value: data.month.received + data.quarter.received, fill: CHART_COLORS.received },
    { name: 'Overdue', value: data.overdueAmount, fill: CHART_COLORS.overdue },
  ].filter((d) => d.value > 0)

  const formatTooltip = (value: number | undefined) => (value != null ? formatNum(value) : '–')

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-slate-800">Dashboard</h1>
      <p className="mb-4 text-slate-500">Overview of your rental income and activity</p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-700">Filter by property</label>
        <select
          value={filterPropertyId}
          onChange={(e) => setFilterPropertyId(e.target.value)}
          className="max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
        >
          <option value="">All properties</option>
          {propertiesList.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card overflow-hidden p-0">
          <div className={`bg-gradient-to-br ${statCards[0].color} px-5 py-4 text-white`}>
            <p className="text-sm font-medium opacity-90">This month – Expected</p>
            <p className="mt-1 text-2xl font-bold">{formatNum(data.month.expected)}</p>
          </div>
        </div>
        <div className="card overflow-hidden p-0">
          <div className={`bg-gradient-to-br ${statCards[1].color} px-5 py-4 text-white`}>
            <p className="text-sm font-medium opacity-90">This month – Received</p>
            <p className="mt-1 text-2xl font-bold">{formatNum(monthReceivedVal)}</p>
          </div>
        </div>
        <div className="card overflow-hidden p-0">
          <div className={`bg-gradient-to-br ${statCards[2].color} px-5 py-4 text-white`}>
            <p className="text-sm font-medium opacity-90">Quarter – Expected / Received</p>
            <p className="mt-1 text-xl font-bold">{quarterVal}</p>
          </div>
        </div>
        <div className="card overflow-hidden p-0">
          <div className={`bg-gradient-to-br ${statCards[3].color} px-5 py-4 text-white`}>
            <p className="text-sm font-medium opacity-90">Overdue amount</p>
            <p className="mt-1 text-2xl font-bold">{formatNum(data.overdueAmount)}</p>
          </div>
        </div>
      </div>

      {/* Unit occupancy */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="card overflow-hidden p-0">
          <div className="bg-gradient-to-br from-slate-500 to-slate-700 px-5 py-4 text-white">
            <p className="text-sm font-medium opacity-90">Vacant units</p>
            <p className="mt-1 text-2xl font-bold">{data.unitStats?.vacant ?? 0}</p>
          </div>
        </div>
        <div className="card overflow-hidden p-0">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-4 text-white">
            <p className="text-sm font-medium opacity-90">Occupied units</p>
            <p className="mt-1 text-2xl font-bold">{data.unitStats?.occupied ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Money tracked in PropMan */}
      <div className="mt-8">
        <h2 className="mb-2 text-lg font-semibold text-slate-800">Money tracked in PropMan</h2>
        <p className="mb-4 text-sm text-slate-500">Total value of rent, payments, cheques and security deposits you track</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card overflow-hidden p-0">
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 px-5 py-4 text-white">
              <p className="text-sm font-medium opacity-90">Total rent expected (all time)</p>
              <p className="mt-1 text-xl font-bold">{formatNum(data.totalTrackedExpected ?? 0)}</p>
            </div>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-5 py-4 text-white">
              <p className="text-sm font-medium opacity-90">Total received (all time)</p>
              <p className="mt-1 text-xl font-bold">{formatNum(data.totalTrackedReceived ?? 0)}</p>
            </div>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-4 text-white">
              <p className="text-sm font-medium opacity-90">Cheque value tracked</p>
              <p className="mt-1 text-xl font-bold">{formatNum(data.totalChequeValueTracked ?? 0)}</p>
            </div>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="bg-gradient-to-br from-slate-600 to-slate-800 px-5 py-4 text-white">
              <p className="text-sm font-medium opacity-90">Security deposits tracked</p>
              <p className="mt-1 text-xl font-bold">{formatNum(data.totalSecurityDepositsTracked ?? 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden p-0">
          <h2 className="card-header border-b border-slate-100">This month – Expected vs Received</h2>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatTooltip(v)} />
                <Tooltip
                  formatter={(v) => [formatTooltip(v as number), 'Amount']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="expected" name="Expected" fill={CHART_COLORS.expected} radius={[6, 6, 0, 0]} />
                <Bar dataKey="received" name="Received" fill={CHART_COLORS.received} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card overflow-hidden p-0">
          <h2 className="card-header border-b border-slate-100">This quarter – Expected vs Received</h2>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={quarterChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatTooltip(v)} />
                <Tooltip
                  formatter={(v) => [formatTooltip(v as number), 'Amount']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="expected" name="Expected" fill={CHART_COLORS.expected} radius={[6, 6, 0, 0]} />
                <Bar dataKey="received" name="Received" fill={CHART_COLORS.received} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card overflow-hidden p-0">
          <h2 className="card-header border-b border-slate-100">Income overview</h2>
          <div className="p-4">
            {incomePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={incomePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    isAnimationActive={true}
                  >
                    {incomePieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatTooltip(v as number)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">No data to show</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <h2 className="card-header flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">📋</span>
            Upcoming cheques (90 days)
          </h2>
          <ul className="divide-y divide-slate-100">
            {data.upcomingCheques.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-slate-500">No upcoming cheques</li>
            ) : (
              data.upcomingCheques.slice(0, 10).map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50/50">
                  <Link to="/cheques" className="font-medium text-indigo-600 hover:underline">{c.coversPeriod}</Link>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {formatDate(c.chequeDate)}
                  </span>
                </li>
              ))
            )}
          </ul>
          <Link
            to="/cheques"
            className="block border-t border-slate-100 px-5 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50/50 hover:text-indigo-700"
          >
            View all cheques →
          </Link>
        </div>

        <div className="card overflow-hidden">
          <h2 className="card-header flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">⏰</span>
            Overdue schedules
          </h2>
          <ul className="divide-y divide-slate-100">
            {data.overdueSchedules.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-slate-500">All clear</li>
            ) : (
              data.overdueSchedules.slice(0, 10).map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50/50">
                  <span className="text-slate-700">
                    {s.lease?.id ? (
                      <Link to={`/leases/${s.lease.id}`} className="text-indigo-600 hover:underline">
                        {s.lease?.property?.name} – {s.lease?.unit?.unitNo}
                      </Link>
                    ) : (
                      `${s.lease?.property?.name} – ${s.lease?.unit?.unitNo}`
                    )}
                  </span>
                  <span className="font-semibold text-rose-600">{formatNum(Number(s.expectedAmount))}</span>
                </li>
              ))
            )}
          </ul>
          <Link
            to="/reports"
            className="block border-t border-slate-100 px-5 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50/50 hover:text-indigo-700"
          >
            View reports →
          </Link>
        </div>
      </div>

      {/* Leases expiring (90 days) */}
      <div className="mt-8">
        <div className="card overflow-hidden">
          <h2 className="card-header flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">📅</span>
            Leases expiring (next 90 days)
          </h2>
          <ul className="divide-y divide-slate-100">
            {(data.expiringLeases?.length ?? 0) === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-slate-500">No leases expiring in the next 90 days</li>
            ) : (
              (data.expiringLeases ?? []).slice(0, 10).map((lease) => (
                <li key={lease.id} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50/50">
                  <span className="text-slate-700">
                    <Link to={`/leases/${lease.id}`} className="text-indigo-600 hover:underline">
                      {lease.property?.name} – {lease.unit?.unitNo}
                      {lease.tenant?.name && <span className="text-slate-500"> · {lease.tenant.name}</span>}
                    </Link>
                  </span>
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                    {formatDate(lease.endDate)}
                  </span>
                </li>
              ))
            )}
          </ul>
          <Link
            to="/leases"
            className="block border-t border-slate-100 px-5 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50/50 hover:text-indigo-700"
          >
            View all leases →
          </Link>
        </div>
      </div>

      {data.bouncedCount > 0 && (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="font-semibold text-amber-800">⚠️ Bounced cheques: {data.bouncedCount}</p>
          <Link to="/cheques?status=BOUNCED" className="text-sm font-semibold text-amber-700 hover:underline">
            View →
          </Link>
        </div>
      )}
    </div>
  )
}

function formatNum(n: number): string {
  if (n >= 1e7) return (n / 1e7).toFixed(1) + ' Cr'
  if (n >= 1e5) return (n / 1e5).toFixed(1) + ' L'
  return n.toLocaleString()
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString()
}
