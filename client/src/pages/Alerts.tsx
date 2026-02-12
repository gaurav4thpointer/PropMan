import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reports, properties as propertiesApi, cheques as chequesApi } from '../api/client'
import type { DashboardData, Property, Cheque, Lease, Tenant, RentSchedule } from '../api/types'
import { getDaysOverdue } from '../utils/lease'

function fmt(n: number): string {
  if (n >= 1e7) return (n / 1e7).toFixed(1) + ' Cr'
  if (n >= 1e5) return (n / 1e5).toFixed(1) + ' L'
  return n.toLocaleString('en-IN')
}

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function fmtDateFull(s: string): string {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const Icons = {
  alert: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
}

export default function Alerts() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [bouncedCheques, setBouncedCheques] = useState<Cheque[]>([])
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [filterPropertyId, setFilterPropertyId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      reports.dashboard(filterPropertyId || undefined).then((r) => r.data).catch(() => null),
      chequesApi
        .list({ status: 'BOUNCED', propertyId: filterPropertyId || undefined, page: 1, limit: 100 })
        .then((r) => r.data?.data ?? [])
        .catch(() => []),
    ])
      .then(([dashboard, bounced]) => {
        setData(dashboard)
        setBouncedCheques(bounced)
      })
      .finally(() => setLoading(false))
  }, [filterPropertyId])

  useEffect(() => {
    propertiesApi
      .list({ limit: 100 })
      .then((r) => setPropertiesList(r.data?.data ?? []))
      .catch(() => setPropertiesList([]))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-slate-400">Loading alerts…</p>
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
        <h2 className="text-lg font-semibold text-slate-800">Couldn't load alerts</h2>
        <p className="mt-1 text-sm text-slate-500">Check your connection and try refreshing the page.</p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  const overdueCount = data.overdueSchedules.length
  const expiringCount = data.expiringLeases?.length ?? 0
  const bouncedCount = bouncedCheques.length

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/"
            className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Alerts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overdue rent schedules, bounced cheques, and expiring leases in one place.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <select
            value={filterPropertyId}
            onChange={(e) => setFilterPropertyId(e.target.value)}
            className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none"
          >
            <option value="">All properties</option>
            {propertiesList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.unitNo ? ` – ${p.unitNo}` : ''}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
              {overdueCount} overdue
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
              {bouncedCount} bounced cheques
            </span>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700">
              {expiringCount} expiring leases
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Overdue schedules</h2>
            <p className="mt-0.5 text-xs text-slate-500">Installments that are already past due.</p>
          </div>
          <OverdueList items={data.overdueSchedules} />
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Bounced cheques</h2>
            <p className="mt-0.5 text-xs text-slate-500">Cheques marked as bounced that may need action.</p>
          </div>
          <BouncedChequeList items={bouncedCheques} />
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Expiring leases</h2>
            <p className="mt-0.5 text-xs text-slate-500">Leases that are close to their end date.</p>
          </div>
          <LeaseList items={data.expiringLeases ?? []} />
        </div>
      </div>
    </div>
  )
}

function OverdueList({ items }: { items: (RentSchedule & { lease?: Lease & { property?: Property; tenant?: Tenant } })[] }) {
  if (items.length === 0) {
    return <EmptyState message="No overdue payments 🎉" />
  }

  return (
    <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
      {items.map((s) => {
        const days = getDaysOverdue(s.dueDate)
        const severity =
          days > 30 ? 'bg-rose-100 text-rose-700' : days > 7 ? 'bg-amber-100 text-amber-700' : 'bg-yellow-100 text-yellow-700'
        return (
          <li key={s.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${severity}`}>
              {days}d
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm">
                {s.lease?.property && (
                  <Link
                    to={`/properties/${s.lease.propertyId}`}
                    className="truncate font-medium text-slate-800 hover:text-indigo-600"
                  >
                    {s.lease.property.name}
                  </Link>
                )}
                {s.lease?.property?.unitNo && <span className="text-slate-400">#{s.lease.property.unitNo}</span>}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {s.lease?.tenant?.name && (
                  <Link to={`/tenants/${s.lease.tenantId}`} className="hover:text-indigo-600">
                    {s.lease.tenant.name}
                  </Link>
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

function BouncedChequeList({ items }: { items: Cheque[] }) {
  if (items.length === 0) {
    return <EmptyState message="No bounced cheques 🎉" />
  }

  return (
    <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
      {items.map((c) => (
        <li key={c.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50/50">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-[11px] font-bold text-amber-700">
            BNC
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm">
              <Link to={`/cheques/${c.id}`} className="truncate font-medium text-slate-800 hover:text-indigo-600">
                {c.chequeNumber ? `#${c.chequeNumber}` : 'Cheque'} · {c.coversPeriod}
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {c.property?.name && <span>{c.property.name}</span>}
              <span>·</span>
              <span>{fmtDateFull(c.chequeDate)}</span>
              {c.bounceReason && (
                <>
                  <span>·</span>
                  <span className="text-amber-700">Reason: {c.bounceReason}</span>
                </>
              )}
            </div>
          </div>
          <p className="shrink-0 text-sm font-semibold text-slate-800">{fmt(Number(c.amount))}</p>
        </li>
      ))}
    </ul>
  )
}

function LeaseList({ items }: { items: (Lease & { property?: Property; tenant?: Tenant })[] }) {
  if (items.length === 0) {
    return <EmptyState message="No leases expiring soon 📄" />
  }

  return (
    <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
      {items.map((lease) => {
        const daysUntil = Math.max(0, Math.ceil((new Date(lease.endDate).getTime() - Date.now()) / 86400000))
        const urgency =
          daysUntil <= 14
            ? 'bg-rose-100 text-rose-700'
            : daysUntil <= 30
              ? 'bg-amber-100 text-amber-700'
              : 'bg-violet-100 text-violet-600'
        return (
          <li key={lease.id} className="flex items-center gap-4 px-5 py-3.5">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${urgency}`}>
              {daysUntil}d
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm">
                {lease.property && (
                  <Link
                    to={`/properties/${lease.propertyId}`}
                    className="truncate font-medium text-slate-800 hover:text-indigo-600"
                  >
                    {lease.property.name}
                  </Link>
                )}
                {lease.property?.unitNo && <span className="text-slate-400">#{lease.property.unitNo}</span>}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {lease.tenant?.name && (
                  <Link to={`/tenants/${lease.tenantId}`} className="hover:text-indigo-600">
                    {lease.tenant.name}
                  </Link>
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-5 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  )
}

