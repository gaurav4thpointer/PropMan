/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { reports, properties as propertiesApi, owners as ownersApi } from '../api/client'
import type { DashboardData, Property, Owner } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { getDaysOverdue } from '../utils/lease'

function fmt(n: number): string {
  if (n >= 1e7) return (n / 1e7).toFixed(1) + ' Cr'
  if (n >= 1e5) return (n / 1e5).toFixed(1) + ' L'
  return n.toLocaleString('en-IN')
}

function fmtShort(n: number): string {
  if (n >= 1e7) return (n / 1e7).toFixed(1) + 'Cr'
  if (n >= 1e5) return (n / 1e5).toFixed(0) + 'L'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return n.toLocaleString('en-IN')
}

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function fmtDateFull(s: string): string {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
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
  cheque: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  ),
  calendar: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
    </svg>
  ),
  check: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  ),
  arrowRight: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  ),
  add: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
}

export default function ManagerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [ownersList, setOwnersList] = useState<Owner[]>([])
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPropertyId, setFilterPropertyId] = useState('')

  useEffect(() => {
    setLoading(true)
    reports.dashboard(filterPropertyId || undefined)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [filterPropertyId])

  useEffect(() => {
    Promise.all([
      ownersApi.list({ page: 1, limit: 50 }).then((r) => r.data?.data ?? []),
      propertiesApi.list({ limit: 100 }).then((r) => r.data?.data ?? []),
    ])
      .then(([owners, properties]) => {
        setOwnersList(owners)
        setPropertiesList(properties)
      })
      .catch(() => {
        setOwnersList([])
        setPropertiesList([])
      })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-slate-400">Loading dashboard…</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          {Icons.alert}
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Couldn't load dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Check your connection and try refreshing the page.</p>
      </div>
    )
  }

  const monthRate = collectionRate(data.month.expected, data.month.received)
  const quarterRate = collectionRate(data.quarter.expected, data.quarter.received)
  const totalUnits = (data.unitStats?.vacant ?? 0) + (data.unitStats?.occupied ?? 0)
  const occupancyRate = totalUnits > 0 ? Math.round(((data.unitStats?.occupied ?? 0) / totalUnits) * 100) : 0
  const overdueCount = data.overdueSchedules.length
  const chequeCount = data.upcomingCheques.length
  const leaseCount = data.expiringLeases?.length ?? 0
  const totalAlerts = overdueCount + data.bouncedCount + leaseCount

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your portfolio across all owners
          </p>
        </div>
        <select
          value={filterPropertyId}
          onChange={(e) => setFilterPropertyId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none sm:w-auto"
          aria-label="Filter by property"
        >
          <option value="">All properties</option>
          {propertiesList.map((p) => (
            <option key={p.id} value={p.id}>{p.name}{p.unitNo ? ` – ${p.unitNo}` : ''}</option>
          ))}
        </select>
      </div>

      {/* Portfolio overview - Manager specific */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              {Icons.users}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Owners</p>
              <p className="text-xl font-bold text-slate-900">{ownersList.length}</p>
            </div>
          </div>
          <Link to="/owners" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            View all {Icons.arrowRight}
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              {Icons.building}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Properties</p>
              <p className="text-xl font-bold text-slate-900">{propertiesList.length}</p>
            </div>
          </div>
          <Link to="/properties" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            View all {Icons.arrowRight}
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              {Icons.trending}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Occupancy</p>
              <p className="text-xl font-bold text-slate-900">
                {data.unitStats?.occupied ?? 0}<span className="text-sm font-medium text-slate-400">/{totalUnits}</span>
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">{data.unitStats?.vacant ?? 0} vacant</span>
            <span className="font-semibold text-emerald-600">{occupancyRate}%</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${data.overdueAmount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {data.overdueAmount > 0 ? Icons.alert : Icons.check}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Overdue</p>
              <p className={`text-xl font-bold ${data.overdueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {data.overdueAmount > 0 ? fmt(data.overdueAmount) : 'All clear'}
              </p>
            </div>
          </div>
          {overdueCount > 0 && (
            <p className="mt-2 text-xs text-slate-500">{overdueCount} installment{overdueCount !== 1 ? 's' : ''} past due</p>
          )}
          {data.bouncedCount > 0 && (
            <Link to="/cheques?status=BOUNCED" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800">
              {data.bouncedCount} bounced {Icons.arrowRight}
            </Link>
          )}
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              {Icons.trending}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">This month</p>
              <p className="text-xl font-bold text-slate-900">{fmt(data.month.received)}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">of {fmt(data.month.expected)} expected</span>
              <span className={`font-semibold ${monthRate >= 80 ? 'text-emerald-600' : monthRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                {monthRate}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${monthRate >= 80 ? 'bg-emerald-500' : monthRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${monthRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              {Icons.calendar}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">This quarter</p>
              <p className="text-xl font-bold text-slate-900">{fmt(data.quarter.received)}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">of {fmt(data.quarter.expected)} expected</span>
              <span className={`font-semibold ${quarterRate >= 80 ? 'text-emerald-600' : quarterRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                {quarterRate}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${quarterRate >= 80 ? 'bg-emerald-500' : quarterRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${quarterRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Needs Attention */}
      {totalAlerts > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Needs attention</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {overdueCount} overdue · {chequeCount} upcoming cheques · {leaseCount} expiring leases
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {data.overdueSchedules.slice(0, 5).map((s) => {
              const days = getDaysOverdue(s.dueDate)
              const severity = days > 30 ? 'bg-rose-100 text-rose-700' : days > 7 ? 'bg-amber-100 text-amber-700' : 'bg-yellow-100 text-yellow-700'
              return (
                <Link
                  key={s.id}
                  to={`/leases/${s.lease?.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/50"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${severity}`}>
                    {days}d
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800">
                      {s.lease?.property?.name} {s.lease?.property?.unitNo && `#${s.lease.property.unitNo}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {s.lease?.tenant?.name} · Due {fmtDate(s.dueDate)}
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-rose-600">{fmt(Number(s.expectedAmount))}</p>
                </Link>
              )
            })}
            {data.upcomingCheques.slice(0, 3).map((c) => (
              <Link
                key={c.id}
                to={`/cheques/${c.id}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                  {Icons.cheque}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-800">{c.coversPeriod}</div>
                  <div className="text-xs text-slate-500">{c.property?.name} · {fmtDateFull(c.chequeDate)}</div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-slate-800">{fmt(Number(c.amount))}</p>
              </Link>
            ))}
            {(data.expiringLeases ?? []).slice(0, 3).map((lease) => {
              const daysUntil = Math.max(0, Math.ceil((new Date(lease.endDate).getTime() - Date.now()) / 86400000))
              const urgency = daysUntil <= 14 ? 'bg-rose-100 text-rose-700' : 'bg-violet-100 text-violet-700'
              return (
                <Link
                  key={lease.id}
                  to={`/leases/${lease.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/50"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${urgency}`}>
                    {daysUntil}d
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800">
                      {lease.property?.name} {lease.property?.unitNo && `#${lease.property.unitNo}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {lease.tenant?.name} · Expires {fmtDateFull(lease.endDate)}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-indigo-600">Review</span>
                </Link>
              )
            })}
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-center">
            <Link to="/alerts" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all alerts →
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            {Icons.check}
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">All clear</p>
            <p className="text-xs text-emerald-600">No overdue payments, upcoming cheques, or expiring leases right now.</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Expected vs Received</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" /> Expected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> Received
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[
              { period: 'This month', expected: data.month.expected, received: data.month.received },
              { period: 'This quarter', expected: data.quarter.expected, received: data.quarter.received },
            ]}
            margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtShort} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v: number | undefined) => (v == null ? '' : fmt(v))}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }}
            />
            <Bar dataKey="expected" name="Expected" fill="#6366f1" radius={[6, 6, 0, 0]} />
            <Bar dataKey="received" name="Received" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Owners quick links */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Recent owners</h2>
          <Link to="/owners" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View all
          </Link>
        </div>
        {ownersList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">No owners yet</p>
            <p className="mt-1 text-xs text-slate-500">Onboard your first owner to get started</p>
            <Link to="/owners" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
              {Icons.add} Onboard owner
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ownersList.slice(0, 6).map((o) => (
              <Link
                key={o.id}
                to={`/owners/${o.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">
                  {(o.name || o.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{o.name || o.email}</p>
                  <p className="truncate text-xs text-slate-500">{o.email}</p>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {(o as Owner & { propertyCount?: number }).propertyCount ?? 0} props
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions - Manager specific */}
      <div className="flex flex-wrap gap-2">
        <Link
          to="/owners"
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 shadow-sm transition-all hover:bg-indigo-100"
        >
          {Icons.add} Onboard owner
        </Link>
        <Link
          to="/properties?onboarding=new"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
        >
          Add property
        </Link>
        <Link
          to="/payments"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
        >
          Record payment
        </Link>
        <Link
          to="/leases"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
        >
          New lease
        </Link>
        <Link
          to="/reports"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
        >
          View reports
        </Link>
      </div>
    </div>
  )
}
