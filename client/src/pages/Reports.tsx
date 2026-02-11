import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reports, properties } from '../api/client'
import type { DashboardData, Property } from '../api/types'
import { getDaysOverdue } from '../utils/lease'

export default function Reports() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [propertyId, setPropertyId] = useState<string>('')
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    reports.dashboard(propertyId || undefined).then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false))
  }, [propertyId])

  useEffect(() => {
    properties.list({ limit: 100 }).then((r) => setPropertiesList(r.data.data))
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
            <option key={p.id} value={p.id}>{p.name}</option>
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

function formatNum(n: number): string {
  return n.toLocaleString()
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString()
}
