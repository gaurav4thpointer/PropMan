import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { leases } from '../api/client'
import type { Lease } from '../api/types'
import { isLeaseExpired } from '../utils/lease'

export default function LeaseDetail() {
  const { id } = useParams<{ id: string }>()
  const [lease, setLease] = useState<Lease | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setError(null)
    leases.get(id)
      .then((r) => setLease(r.data))
      .catch(() => setError('Lease not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }
  if (error || !lease) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="font-medium">{error ?? 'Lease not found'}</p>
        <Link to="/leases" className="mt-2 inline-block text-sm font-semibold text-rose-800 hover:underline">← Back to leases</Link>
      </div>
    )
  }

  const schedules = lease.rentSchedules ?? []
  const expired = isLeaseExpired(lease.endDate)

  return (
    <div>
      <Link to="/leases" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">← Leases</Link>
      {expired && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          This lease has expired (end date: {formatDate(lease.endDate)}).
        </div>
      )}
      <div className="card mb-8 overflow-hidden p-0">
        <div className={`border-b border-slate-100 px-4 py-5 sm:px-6 ${expired ? 'bg-rose-50/50' : 'bg-gradient-to-r from-violet-50 to-indigo-50/50'}`}>
          <h1 className="text-2xl font-bold text-slate-800">Lease details</h1>
          <p className="mt-1 text-slate-600">
            {lease.propertyId ? (
              <Link to={`/properties/${lease.propertyId}`} className="text-indigo-600 hover:underline">{lease.property?.name ?? 'Property'}</Link>
            ) : (
              lease.property?.name ?? '–'
            )}
            {' · Unit '}{lease.unit?.unitNo ?? '–'}
          </p>
          <p className="mt-1 text-slate-600">
            Tenant:{' '}
            {lease.tenant?.name && lease.tenantId ? (
              <Link to={`/tenants/${lease.tenantId}`} className="text-indigo-600 hover:underline">{lease.tenant.name}</Link>
            ) : (
              lease.tenant?.name ?? '–'
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge badge-neutral">{formatDate(lease.startDate)} – {formatDate(lease.endDate)}</span>
            {expired && (
              <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                Expired
              </span>
            )}
            <span className="badge badge-neutral">{formatNum(Number(lease.installmentAmount))} / {lease.rentFrequency}</span>
            <span className="badge badge-neutral">Due day {lease.dueDay}</span>
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-bold text-slate-800">Rent schedule</h2>
      <div className="table-wrapper">
        <table className="min-w-full">
          <thead>
            <tr>
              <th>Due date</th>
              <th>Expected</th>
              <th>Paid</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id}>
                <td className="text-slate-700">{formatDate(s.dueDate)}</td>
                <td className="font-medium">{formatNum(Number(s.expectedAmount))}</td>
                <td className="text-slate-600">{s.paidAmount ? formatNum(Number(s.paidAmount)) : '–'}</td>
                <td>
                  <span className={`badge ${
                    s.status === 'PAID' ? 'badge-success' :
                    s.status === 'PARTIAL' ? 'badge-warning' :
                    s.status === 'OVERDUE' ? 'badge-danger' : 'badge-neutral'
                  }`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {schedules.length === 0 && <p className="px-5 py-12 text-center text-slate-500">No schedule entries.</p>}
      </div>
    </div>
  )
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString()
}

function formatNum(n: number) {
  return n.toLocaleString()
}
