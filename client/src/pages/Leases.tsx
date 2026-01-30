import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { leases as leasesApi } from '../api/client'
import type { Lease } from '../api/types'
import LeaseForm from '../components/LeaseForm'
import { isLeaseExpired } from '../utils/lease'

export default function Leases() {
  const [list, setList] = useState<Lease[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    setLoading(true)
    leasesApi.list({ page, limit: 20 })
      .then((r) => {
        setList(r.data.data)
        setTotalPages(r.data.meta.totalPages)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page])

  return (
    <div>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leases</h1>
          <p className="text-slate-500">Rent schedules and lease terms</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary shrink-0">
          + Create lease
        </button>
      </div>

      {showForm && (
        <LeaseForm
          onSaved={() => { setShowForm(false); load() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Property / Unit</th>
                <th>Tenant</th>
                <th>Period</th>
                <th>Rent</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => {
                const expired = isLeaseExpired(l.endDate)
                return (
                  <tr key={l.id} className={expired ? 'bg-rose-50/50' : undefined}>
                    <td>
                      <span className="font-semibold text-slate-800">{l.property?.name ?? '–'}</span>
                      <span className="text-slate-500"> / {l.unit?.unitNo ?? '–'}</span>
                    </td>
                    <td className="text-slate-700">{l.tenant?.name ?? '–'}</td>
                    <td className="text-slate-600">
                      {formatDate(l.startDate)} – {formatDate(l.endDate)}
                      {expired && (
                        <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                          Expired
                        </span>
                      )}
                    </td>
                    <td className="font-medium">{formatNum(Number(l.installmentAmount))} / {l.rentFrequency}</td>
                    <td className="text-right">
                      <Link to={`/leases/${l.id}`} className="text-sm font-medium text-indigo-600 hover:underline">View</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {list.length === 0 && <p className="px-5 py-12 text-center text-slate-500">No leases yet. Create one to generate rent schedule.</p>}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-sm disabled:opacity-50">Previous</button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString()
}

function formatNum(n: number) {
  return n.toLocaleString()
}
