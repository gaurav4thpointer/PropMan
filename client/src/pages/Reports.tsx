import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reports, properties } from '../api/client'
import type { DashboardData, Property } from '../api/types'

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
        <p className="text-slate-500">Export and filter by property</p>
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
            data.overdueSchedules.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/50">
                <span className="text-slate-700">
                  {s.lease?.id ? (
                    <Link to={`/leases/${s.lease.id}`} className="text-indigo-600 hover:underline">
                      {s.lease?.property?.name} – {s.lease?.unit?.unitNo}
                    </Link>
                  ) : (
                    `${s.lease?.property?.name} – ${s.lease?.unit?.unitNo}`
                  )}
                  {' · '}{formatDate(s.dueDate)}
                </span>
                <span className="font-semibold text-rose-600">{formatNum(Number(s.expectedAmount))}</span>
              </li>
            ))
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
