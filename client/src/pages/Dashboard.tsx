/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { reports, properties as propertiesApi } from '../api/client'
import type { DashboardData, Property, Cheque, Lease, Tenant, RentSchedule } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { getDaysOverdue } from '../utils/lease'
import OnboardingDashboard from './OnboardingDashboard'
import ManagerDashboard from './ManagerDashboard'

/* ── helpers ─────────────────────────────────────────────────────────── */

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

/* ── SVG icons (inline, no deps) ─────────────────────────────────────── */

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
  home: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  clock: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  cheque: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  ),
  document: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  wallet: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
  ),
  arrowRight: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  ),
  check: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  ),
  xMark: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  ),
  building: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  calendar: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
    </svg>
  ),
}

/* ── collection donut (custom) ───────────────────────────────────────── */

function CollectionDonut({ rate, size = 120 }: { rate: number; size?: number }) {
  const stroke = 10
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const filled = (rate / 100) * circ
  const color = rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700 ease-out"
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="text-xl font-bold" fill="#1e293b">
        {rate}%
      </text>
    </svg>
  )
}

/* ── attention tab types ─────────────────────────────────────────────── */

type AttentionTab = 'overdue' | 'cheques' | 'leases'

/* ── owner dashboard (for owners and super admins) ─────────────────────── */

function OwnerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [filterPropertyId, setFilterPropertyId] = useState('')
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)
  const [attentionTab, setAttentionTab] = useState<AttentionTab>('overdue')

  const onboardingKey = user ? `onboardingDismissed:${user.id}` : 'onboardingDismissed'

  useEffect(() => {
    const stored = localStorage.getItem(onboardingKey)
    setOnboardingDismissed(stored === 'true')
  }, [onboardingKey])

  const handleDismissOnboarding = () => {
    setOnboardingDismissed(true)
    localStorage.setItem(onboardingKey, 'true')
  }

  useEffect(() => {
    setLoading(true)
    reports.dashboard(filterPropertyId || undefined)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [filterPropertyId])

  useEffect(() => {
    setPropertiesLoading(true)
    propertiesApi
      .list({ limit: 100 })
      .then((r) => setPropertiesList(r.data.data))
      .finally(() => setPropertiesLoading(false))
  }, [])

  /* ── loading ─────────────────────────────────────────── */
  if (loading || propertiesLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-slate-400">Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  /* ── error ────────────────────────────────────────────── */
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

  /* ── derived values ────────────────────────────────────── */
  const monthRate = collectionRate(data.month.expected, data.month.received)
  const quarterRate = collectionRate(data.quarter.expected, data.quarter.received)
  const totalUnits = (data.unitStats?.vacant ?? 0) + (data.unitStats?.occupied ?? 0)
  const occupancyRate = totalUnits > 0 ? Math.round(((data.unitStats?.occupied ?? 0) / totalUnits) * 100) : 0

  const overdueCount = data.overdueSchedules.length
  const chequeCount = data.upcomingCheques.length
  const leaseCount = data.expiringLeases?.length ?? 0
  const totalAlerts = overdueCount + data.bouncedCount + leaseCount

  const incomeBreakdownData = [
    { name: 'Collected', value: data.month.received, fill: '#10b981' },
    { name: 'Overdue', value: data.overdueAmount, fill: '#ef4444' },
    { name: 'Pending', value: Math.max(0, data.month.expected - data.month.received - data.overdueAmount), fill: '#e2e8f0' },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-8 pb-8">
      {/* Onboarding */}
      {!onboardingDismissed && user?.role !== 'PROPERTY_MANAGER' && (
        <OnboardingDashboard onDismiss={handleDismissOnboarding} />
      )}

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here's how your rental portfolio is performing
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

      {/* ── Hero KPI strip ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Monthly collection */}
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

        {/* Overdue */}
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
            <p className="mt-3 text-xs text-slate-500">
              {overdueCount} installment{overdueCount !== 1 ? 's' : ''} past due
            </p>
          )}
          {data.bouncedCount > 0 && (
            <Link
              to="/cheques?status=BOUNCED"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800"
            >
              {data.bouncedCount} bounced cheque{data.bouncedCount !== 1 ? 's' : ''}
              {Icons.arrowRight}
            </Link>
          )}
        </div>

        {/* Portfolio / Units */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              {Icons.building}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Occupancy</p>
              <p className="text-xl font-bold text-slate-900">
                {data.unitStats?.occupied ?? 0}<span className="text-sm font-medium text-slate-400">/{totalUnits}</span>
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{data.unitStats?.vacant ?? 0} vacant</span>
              <span className="font-semibold text-violet-600">{occupancyRate}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-700 ease-out"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quarter */}
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

      {/* ── Needs Attention (tabbed) ────────────────────── */}
      {totalAlerts > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center gap-1 border-b border-slate-100 px-1 pt-1">
            <TabButton
              active={attentionTab === 'overdue'}
              onClick={() => setAttentionTab('overdue')}
              count={overdueCount}
              color="rose"
              label="Overdue"
            />
            <TabButton
              active={attentionTab === 'cheques'}
              onClick={() => setAttentionTab('cheques')}
              count={chequeCount}
              color="amber"
              label="Upcoming cheques"
            />
            <TabButton
              active={attentionTab === 'leases'}
              onClick={() => setAttentionTab('leases')}
              count={leaseCount}
              color="violet"
              label="Expiring leases"
            />
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-hide">
            {attentionTab === 'overdue' && (
              <OverdueList items={data.overdueSchedules} />
            )}
            {attentionTab === 'cheques' && (
              <ChequeList items={data.upcomingCheques} />
            )}
            {attentionTab === 'leases' && (
              <LeaseList items={data.expiringLeases ?? []} />
            )}
          </div>
        </div>
      )}

      {/* All clear banner (if no alerts) */}
      {totalAlerts === 0 && (
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

      {/* ── Charts ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Collection rate donut */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <p className="mb-4 text-sm font-semibold text-slate-700">Monthly collection rate</p>
          <CollectionDonut rate={monthRate} size={140} />
          <div className="mt-4 flex gap-6 text-center">
            <div>
              <p className="text-lg font-bold text-slate-900">{fmt(data.month.received)}</p>
              <p className="text-xs text-emerald-600 font-medium">Collected</p>
            </div>
            <div className="h-10 w-px bg-slate-100" />
            <div>
              <p className="text-lg font-bold text-slate-900">{fmt(data.month.expected)}</p>
              <p className="text-xs text-indigo-600 font-medium">Expected</p>
            </div>
          </div>
        </div>

        {/* Month vs Quarter bar chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-3">
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
          <ResponsiveContainer width="100%" height={220}>
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
      </div>

      {/* ── Income breakdown (pie) + Portfolio stats ──── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Pie chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="mb-4 text-sm font-semibold text-slate-700">Income breakdown</p>
          {incomeBreakdownData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={incomeBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    strokeWidth={0}
                  >
                    {incomeBreakdownData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number | undefined) => (v == null ? '' : fmt(v))}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1">
                {incomeBreakdownData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
              No income data yet
            </div>
          )}
        </div>

        {/* Portfolio summary */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-3">
          <PortfolioCard
            icon={Icons.wallet}
            iconBg="bg-emerald-50 text-emerald-600"
            label="Total received"
            value={fmt(data.totalTrackedReceived ?? 0)}
            sub="All time"
          />
          <PortfolioCard
            icon={Icons.document}
            iconBg="bg-indigo-50 text-indigo-600"
            label="Total expected"
            value={fmt(data.totalTrackedExpected ?? 0)}
            sub="All time"
          />
          <PortfolioCard
            icon={Icons.cheque}
            iconBg="bg-amber-50 text-amber-600"
            label="Cheque value"
            value={fmt(data.totalChequeValueTracked ?? 0)}
            sub="PDCs tracked"
          />
          <PortfolioCard
            icon={Icons.home}
            iconBg="bg-violet-50 text-violet-600"
            label="Security deposits"
            value={fmt(data.totalSecurityDepositsTracked ?? 0)}
            sub="Across leases"
          />
        </div>
      </div>

      {/* ── Quick actions ────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <QuickAction to="/payments" label="Record payment" icon={Icons.wallet} />
        <QuickAction to="/leases" label="New lease" icon={Icons.document} />
        <QuickAction to="/cheques" label="Add cheque" icon={Icons.cheque} />
        <QuickAction to="/reports" label="View reports" icon={Icons.trending} />
      </div>
    </div>
  )
}

/* ── main Dashboard (routes to Manager or Owner) ───────────────────────── */

export default function Dashboard() {
  const { user } = useAuth()
  if (user?.role === 'PROPERTY_MANAGER') {
    return <ManagerDashboard />
  }
  return <OwnerDashboard />
}

/* ── sub-components ──────────────────────────────────────────────────── */

function TabButton({ active, onClick, count, color, label }: {
  active: boolean
  onClick: () => void
  count: number
  color: 'rose' | 'amber' | 'violet'
  label: string
}) {
  const colorMap = {
    rose: { bg: 'bg-rose-100', text: 'text-rose-700' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-700' },
  }
  const c = colorMap[color]

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'border-b-2 border-indigo-600 bg-white text-slate-900'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${c.bg} ${c.text}`}>
          {count}
        </span>
      )}
    </button>
  )
}

function OverdueList({ items }: { items: (RentSchedule & { lease?: Lease & { property?: Property; tenant?: Tenant } })[] }) {
  if (items.length === 0) {
    return <EmptyTab message="No overdue payments" emoji="🎉" />
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.slice(0, 15).map((s) => {
        const days = getDaysOverdue(s.dueDate)
        const severity = days > 30 ? 'bg-rose-100 text-rose-700' : days > 7 ? 'bg-amber-100 text-amber-700' : 'bg-yellow-100 text-yellow-700'
        return (
          <li key={s.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/50">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${severity}`}>
              {days}d
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm">
                {s.lease?.property && (
                  <Link to={`/properties/${s.lease.propertyId}`} className="font-medium text-slate-800 hover:text-indigo-600 truncate">
                    {s.lease.property.name}
                  </Link>
                )}
                {s.lease?.property?.unitNo && (
                  <span className="text-slate-400">#{s.lease.property.unitNo}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {s.lease?.tenant?.name && (
                  <Link to={`/tenants/${s.lease.tenantId}`} className="hover:text-indigo-600">{s.lease.tenant.name}</Link>
                )}
                <span>·</span>
                <span>Due {fmtDate(s.dueDate)}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-rose-600">{fmt(Number(s.expectedAmount))}</p>
              {s.lease?.id && (
                <Link to={`/leases/${s.lease.id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                  View
                </Link>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ChequeList({ items }: { items: Cheque[] }) {
  if (items.length === 0) {
    return <EmptyTab message="No upcoming cheques" emoji="📋" />
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.slice(0, 15).map((c) => {
        const daysUntil = Math.max(0, Math.ceil((new Date(c.chequeDate).getTime() - Date.now()) / 86400000))
        const urgency = daysUntil <= 7 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
        return (
          <li key={c.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/50">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${urgency}`}>
              {daysUntil}d
            </div>
            <div className="min-w-0 flex-1">
              <Link to={`/cheques/${c.id}`} className="text-sm font-medium text-slate-800 hover:text-indigo-600 truncate block">
                {c.coversPeriod}
              </Link>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {c.property?.name && <span>{c.property.name}</span>}
                <span>·</span>
                <span>{fmtDateFull(c.chequeDate)}</span>
              </div>
            </div>
            <p className="shrink-0 text-sm font-semibold text-slate-800">{fmt(Number(c.amount))}</p>
          </li>
        )
      })}
    </ul>
  )
}

function LeaseList({ items }: { items: (Lease & { property?: Property; tenant?: Tenant })[] }) {
  if (items.length === 0) {
    return <EmptyTab message="No leases expiring soon" emoji="📄" />
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.slice(0, 15).map((lease) => {
        const daysUntil = Math.max(0, Math.ceil((new Date(lease.endDate).getTime() - Date.now()) / 86400000))
        const urgency = daysUntil <= 14 ? 'bg-rose-100 text-rose-700' : daysUntil <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-600'
        return (
          <li key={lease.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/50">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${urgency}`}>
              {daysUntil}d
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm">
                {lease.property && (
                  <Link to={`/properties/${lease.propertyId}`} className="font-medium text-slate-800 hover:text-indigo-600 truncate">
                    {lease.property.name}
                  </Link>
                )}
                {lease.property?.unitNo && (
                  <span className="text-slate-400">#{lease.property.unitNo}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {lease.tenant?.name && (
                  <Link to={`/tenants/${lease.tenantId}`} className="hover:text-indigo-600">{lease.tenant.name}</Link>
                )}
                <span>·</span>
                <span>Expires {fmtDateFull(lease.endDate)}</span>
              </div>
            </div>
            <Link
              to={`/leases/${lease.id}`}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              Review
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function EmptyTab({ message, emoji }: { message: string; emoji: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-3xl">{emoji}</span>
      <p className="mt-2 text-sm font-medium text-slate-500">{message}</p>
    </div>
  )
}

function PortfolioCard({ icon, iconBg, label, value, sub }: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  )
}

function QuickAction({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 hover:shadow"
    >
      <span className="text-slate-400">{icon}</span>
      {label}
    </Link>
  )
}
