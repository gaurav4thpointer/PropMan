import { useEffect, useState } from 'react'
import { cheques as chequesApi, properties } from '../api/client'
import type { Cheque, Property } from '../api/types'
import ChequeForm from '../components/ChequeForm'
import ChequeStatusUpdate from '../components/ChequeStatusUpdate'

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'badge-neutral',
  DEPOSITED: 'bg-indigo-100 text-indigo-800',
  CLEARED: 'badge-success',
  BOUNCED: 'badge-danger',
  REPLACED: 'badge-warning',
}

export default function Cheques() {
  const [list, setList] = useState<Cheque[]>([])
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPropertyId, setFilterPropertyId] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [statusModal, setStatusModal] = useState<Cheque | null>(null)

  const load = () => {
    setLoading(true)
    const params: { page: number; limit: number; propertyId?: string; status?: string } = { page, limit: 20 }
    if (filterPropertyId) params.propertyId = filterPropertyId
    if (filterStatus) params.status = filterStatus
    chequesApi.list(params)
      .then((r) => {
        setList(r.data.data)
        setTotalPages(r.data.meta.totalPages)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filterStatus, filterPropertyId])
  useEffect(() => { properties.list({ limit: 100 }).then((r) => setPropertiesList(r.data.data)) }, [])

  const handleSaved = () => { setShowForm(false); load() }
  const handleStatusSaved = () => { setStatusModal(null); load() }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cheques (PDC)</h1>
          <p className="text-slate-500">Track post-dated cheques and status</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary shrink-0">
          + Add cheque
        </button>
      </div>

      {showForm && <ChequeForm onSaved={handleSaved} onCancel={() => setShowForm(false)} />}
      {statusModal && (
        <ChequeStatusUpdate
          cheque={statusModal}
          onSaved={handleStatusSaved}
          onCancel={() => setStatusModal(null)}
        />
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={filterPropertyId}
          onChange={(e) => setFilterPropertyId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
        >
          <option value="">All properties</option>
          {propertiesList.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
        >
          <option value="">All statuses</option>
          <option value="RECEIVED">Received</option>
          <option value="DEPOSITED">Deposited</option>
          <option value="CLEARED">Cleared</option>
          <option value="BOUNCED">Bounced</option>
          <option value="REPLACED">Replaced</option>
        </select>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Cheque no</th>
                <th>Bank</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Covers</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold text-slate-800">{c.chequeNumber}</td>
                  <td className="text-slate-600">{c.bankName}</td>
                  <td className="text-slate-600">{formatDate(c.chequeDate)}</td>
                  <td className="font-medium">{formatNum(Number(c.amount))}</td>
                  <td className="text-slate-600">{c.coversPeriod}</td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[c.status] ?? 'badge-neutral'}`}>{c.status}</span>
                  </td>
                  <td className="text-right">
                    {['RECEIVED', 'DEPOSITED', 'BOUNCED'].includes(c.status) && (
                      <button type="button" onClick={() => setStatusModal(c)} className="text-sm font-medium text-indigo-600 hover:underline">Update status</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="px-5 py-12 text-center text-slate-500">No cheques match filters.</p>}
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
