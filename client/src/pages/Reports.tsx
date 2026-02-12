import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reports, properties, owners as ownersApi } from '../api/client'
import type { DashboardData, Property, ManagerPortfolioReport, Owner } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { getDaysOverdue } from '../utils/lease'

const isManager = (role: string | undefined) =>
  role === 'PROPERTY_MANAGER' || role === 'SUPER_ADMIN'

function fmt(n: number): string {
  if (n >= 1e7) return (n / 1e7).toFixed(1) + ' Cr'
  if (n >= 1e5) return (n / 1e5).toFixed(1) + ' L'
  return n.toLocaleString('en-IN')
}

function formatNum(n: number): string {
  return n.toLocaleString()
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString()
}

function collectionRate(expected: number, received: number): number {
  if (expected === 0) return 0
  return Math.min(Math.round((received / expected) * 100), 100)
}

const Icons = {
  trending: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  ),
  alert: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
  users: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  building: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  arrowRight: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  ),
  download: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  check: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  ),
}

/** Manager-centric reports: portfolio by owner, action items, owner-specific exports */
function ManagerReports() {
  const [portfolio, setPortfolio] = useState<ManagerPortfolioReport | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [ownersList, setOwnersList] = useState<(Owner & { propertyCount?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [exportOwnerId, setExportOwnerId] = useState<string>('')
  const [exportFrom, setExportFrom] = useState('')
  const [exportTo, setExportTo] = useState('')
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      reports.managerPortfolio().then((r) => r.data).catch(() => null),
      reports.dashboard().then((r) => r.data).catch(() => null),
      ownersApi.list({ page: 1, limit: 100 }).then((r) => r.data?.data ?? []),
    ])
      .then(([p, d, owners]) => {
        setPortfolio(p ?? null)
        setDashboard(d ?? null)
        setOwnersList(owners)
      })
      .catch(() => {
        setPortfolio(null)
        setDashboard(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleExportCheques = () => {
    setExporting('cheques')
    reports
      .exportCheques({
        ...(exportOwnerId ? { ownerId: exportOwnerId } : {}),
        ...(exportFrom ? { from: exportFrom } : {}),
        ...(exportTo ? { to: exportTo } : {}),
      })
      .finally(() => setExporting(null))
  }

  const handleExportRentSchedule = () => {
    setExporting('schedule')
    reports
      .exportRentSchedule({
        ...(exportOwnerId ? { ownerId: exportOwnerId } : {}),
        ...(exportFrom ? { from: exportFrom } : {}),
        ...(exportTo ? { to: exportTo } : {}),
      })
      .finally(() => setExporting(null))
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }

  const owners = portfolio?.owners ?? []
  const needsAttention = owners.filter((o) => o.needsAttention)
  const allClear = owners.length > 0 && needsAttention.length === 0

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Portfolio reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Collection performance by owner • Action items • Owner-specific exports for communications
        </p>
      </div>

      {/* Portfolio by owner */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">Portfolio by owner</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Collection rate and key metrics per owner for monthly reporting
          </p>
        </div>
        {owners.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              {Icons.users}
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">No owners in your portfolio</p>
            <p className="mt-1 text-xs text-slate-500">Onboard owners to see their reports here</p>
            <Link to="/owners" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
              View owners {Icons.arrowRight}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {owners.map((item) => {
              const monthRate = collectionRate(item.month.expected, item.month.received)
              const quarterRate = collectionRate(item.quarter.expected, item.quarter.received)
              const totalUnits = item.vacantCount + item.occupiedCount
              const occupancyRate = totalUnits > 0 ? Math.round((item.occupiedCount / totalUnits) * 100) : 0
              return (
                <Link
                  key={item.owner.id}
                  to={`/owners/${item.owner.id}`}
                  className={`flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between ${item.needsAttention ? 'bg-amber-50/30' : ''}`}
                >
                  <div className="flex flex-1 items-center gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        item.needsAttention ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {(item.owner.name || item.owner.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{item.owner.name || item.owner.email}</p>
                      <p className="truncate text-xs text-slate-500">{item.owner.email}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.propertyCount} propert{item.propertyCount !== 1 ? 'ies' : 'y'} • {item.occupiedCount}/{totalUnits} occupied ({occupancyRate}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">This month</p>
                      <p className="font-semibold text-slate-800">{fmt(item.month.received)} / {fmt(item.month.expected)}</p>
                      <span
                        className={`inline-block text-xs font-medium ${
                          monthRate >= 80 ? 'text-emerald-600' : monthRate >= 50 ? 'text-amber-600' : 'text-rose-600'
                        }`}
                      >
                        {monthRate}%
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">This quarter</p>
                      <p className="font-semibold text-slate-800">{fmt(item.quarter.received)} / {fmt(item.quarter.expected)}</p>
                      <span
                        className={`inline-block text-xs font-medium ${
                          quarterRate >= 80 ? 'text-emerald-600' : quarterRate >= 50 ? 'text-amber-600' : 'text-rose-600'
                        }`}
                      >
                        {quarterRate}%
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Overdue</p>
                      <p className={`font-semibold ${item.overdueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {item.overdueAmount > 0 ? fmt(item.overdueAmount) : '—'}
                      </p>
                      {item.bouncedCount > 0 && (
                        <p className="text-xs font-medium text-amber-700">{item.bouncedCount} bounced</p>
                      )}
                    </div>
                    {item.needsAttention && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                        {Icons.alert} Needs attention
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Needs attention summary */}
      {needsAttention.length > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5">
          <h2 className="text-sm font-semibold text-amber-900">Owners needing attention</h2>
          <p className="mt-0.5 text-xs text-amber-700">
            {needsAttention.length} owner{needsAttention.length !== 1 ? 's' : ''} with overdue payments, bounced cheques, or expiring leases
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {needsAttention.map((o) => (
              <Link
                key={o.owner.id}
                to={`/owners/${o.owner.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-800 shadow-sm transition-colors hover:bg-amber-100"
              >
                {o.owner.name || o.owner.email}
                {o.overdueCount > 0 && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                    {o.overdueCount} overdue
                  </span>
                )}
                {o.bouncedCount > 0 && (
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {o.bouncedCount} bounced
                  </span>
                )}
                {o.expiringLeasesCount > 0 && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                    {o.expiringLeasesCount} expiring
                  </span>
                )}
                {Icons.arrowRight}
              </Link>
            ))}
          </div>
        </div>
      )}

      {allClear && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            {Icons.check}
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">All portfolios in good shape</p>
            <p className="text-xs text-emerald-600">No overdue payments, bounced cheques, or expiring leases across your owners.</p>
          </div>
        </div>
      )}

      {/* Overdue schedules (from dashboard) */}
      {dashboard && dashboard.overdueSchedules.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Overdue schedules</h2>
            <p className="mt-0.5 text-xs text-slate-500">Across all properties</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {dashboard.overdueSchedules.slice(0, 10).map((s) => {
              const days = getDaysOverdue(s.dueDate)
              const severity = days > 30 ? 'bg-rose-100 text-rose-700' : days > 7 ? 'bg-amber-100 text-amber-700' : 'bg-yellow-100 text-yellow-700'
              return (
                <li key={s.id}>
                  <Link
                    to={`/leases/${s.lease?.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-slate-50/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {s.lease?.property?.name} {s.lease?.property?.unitNo && `#${s.lease.property.unitNo}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.lease?.tenant?.name} · Due {formatDate(s.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${severity}`}>{days}d</span>
                      <span className="font-semibold text-rose-600">{fmt(Number(s.expectedAmount))}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-slate-100 px-5 py-3 text-center">
            <Link to="/alerts" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all overdue and bounced →
            </Link>
          </div>
        </div>
      )}

      {/* Export for owner communications */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">Export for owner communications</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Generate cheques or rent schedule CSV for a specific owner or the full portfolio. Use date range to scope exports.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4 p-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Owner</label>
            <select
              value={exportOwnerId}
              onChange={(e) => setExportOwnerId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            >
              <option value="">All owners</option>
              {ownersList.map((o) => (
                <option key={o.id} value={o.id}>{o.name || o.email}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">From</label>
            <input
              type="date"
              value={exportFrom}
              onChange={(e) => setExportFrom(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">To</label>
            <input
              type="date"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportCheques}
              disabled={!!exporting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {Icons.download}
              {exporting === 'cheques' ? 'Exporting…' : 'Export cheques'}
            </button>
            <button
              type="button"
              onClick={handleExportRentSchedule}
              disabled={!!exporting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {Icons.download}
              {exporting === 'schedule' ? 'Exporting…' : 'Export rent schedule'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/owners" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          Owners
        </Link>
        <Link to="/leases" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          Leases
        </Link>
        <Link to="/cheques" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          Cheques
        </Link>
        <Link to="/payments" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          Payments
        </Link>
      </div>
    </div>
  )
}

/** Owner-centric reports: expected vs received, overdue, exports */
function OwnerReports() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [propertyId, setPropertyId] = useState<string>('')
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    reports.dashboard(propertyId || undefined).then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false))
  }, [propertyId])

  useEffect(() => {
    properties.list({ limit: 100 }).then((r) => setPropertiesList(r.data?.data ?? []))
  }, [])

  const handleExportCheques = () => {
    setExporting('cheques')
    reports.exportCheques(propertyId ? { propertyId } : undefined).finally(() => setExporting(null))
  }

  const handleExportRentSchedule = () => {
    setExporting('schedule')
    reports.exportRentSchedule(propertyId ? { propertyId } : undefined).finally(() => setExporting(null))
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }
  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        Failed to load reports.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">← Dashboard</Link>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="mt-1 text-slate-500">Overview of rent collection, overdue schedules and CSV exports</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/leases" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900">Leases</Link>
          <Link to="/cheques" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900">Cheques</Link>
          <Link to="/payments" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900">Payments</Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-700">Filter by property</label>
        <select
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
        >
          <option value="">All properties</option>
          {propertiesList.map((p) => (
            <option key={p.id} value={p.id}>{p.name}{p.unitNo ? ` – ${p.unitNo}` : ''}</option>
          ))}
        </select>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Month – Expected / Received</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{formatNum(data.month.expected)} / {formatNum(data.month.received)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Quarter – Expected / Received</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{formatNum(data.quarter.expected)} / {formatNum(data.quarter.received)}</p>
        </div>
        <div className="card border-rose-200 bg-rose-50/50 p-5">
          <p className="text-sm text-rose-600">Overdue amount</p>
          <p className="mt-1 text-xl font-bold text-rose-700">{formatNum(data.overdueAmount)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Bounced cheques</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{data.bouncedCount}</p>
        </div>
      </div>

      <div className="card mb-6 overflow-hidden">
        <h2 className="card-header">Overdue schedules</h2>
        <ul className="divide-y divide-slate-100">
          {data.overdueSchedules.length === 0 ? (
            <li className="px-5 py-6 text-center text-sm text-slate-500">None</li>
          ) : (
            data.overdueSchedules.map((s) => {
              const days = getDaysOverdue(s.dueDate)
              const overdueLabel = days === 1 ? '1 day overdue' : `${days} days overdue`
              const isOrange = days <= 7
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-slate-50/50">
                  <span className="text-slate-700">
                    {s.lease?.id ? (
                      <>
                        {s.lease?.propertyId ? (
                          <Link to={`/properties/${s.lease.propertyId}`} className="text-indigo-600 hover:underline">{s.lease?.property?.name}</Link>
                        ) : (
                          <span>{s.lease?.property?.name}</span>
                        )}
                        <span className="text-slate-500"> – {s.lease?.property?.unitNo}</span>
                        {s.lease?.tenantId && s.lease?.tenant?.name && (
                          <> · <Link to={`/tenants/${s.lease.tenantId}`} className="text-slate-600 hover:underline">{s.lease.tenant.name}</Link></>
                        )}
                        {' · '}{formatDate(s.dueDate)}
                        <Link to={`/leases/${s.lease.id}`} className="ml-2 text-xs font-medium text-indigo-600 hover:underline">View lease</Link>
                      </>
                    ) : (
                      `${s.lease?.property?.name} – ${s.lease?.property?.unitNo ?? ''} · ${formatDate(s.dueDate)}`
                    )}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${isOrange ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                      {overdueLabel}
                    </span>
                    <span className="font-semibold text-rose-600">{formatNum(Number(s.expectedAmount))}</span>
                  </span>
                </li>
              )
            })
          )}
        </ul>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-bold text-slate-800">Export CSV</h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportCheques}
            disabled={!!exporting}
            className="btn-primary disabled:opacity-50"
          >
            {exporting === 'cheques' ? 'Exporting...' : 'Export cheques'}
          </button>
          <button
            type="button"
            onClick={handleExportRentSchedule}
            disabled={!!exporting}
            className="btn-primary disabled:opacity-50"
          >
            {exporting === 'schedule' ? 'Exporting...' : 'Export rent schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const { user } = useAuth()
  return isManager(user?.role) ? <ManagerReports /> : <OwnerReports />
}
