import { useEffect, useState } from 'react'
import { payments as paymentsApi } from '../api/client'
import type { Payment } from '../api/types'
import PaymentForm from '../components/PaymentForm'

const METHOD_LABELS: Record<string, string> = {
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank transfer',
  UPI: 'UPI',
  CASH: 'Cash',
}

export default function Payments() {
  const [list, setList] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    setLoading(true)
    paymentsApi.list({ page, limit: 20 })
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
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-slate-500">Record and match payments to rent</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary shrink-0">
          + Add payment
        </button>
      </div>

      {showForm && <PaymentForm onSaved={() => { setShowForm(false); load() }} onCancel={() => setShowForm(false)} />}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Property / Unit</th>
                <th>Tenant</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="text-slate-700">{formatDate(p.date)}</td>
                  <td className="font-semibold text-slate-800">{formatNum(Number(p.amount))}</td>
                  <td><span className="badge badge-neutral">{METHOD_LABELS[p.method] ?? p.method}</span></td>
                  <td className="text-slate-600">{p.property?.name ?? '–'} / {p.unit?.unitNo ?? '–'}</td>
                  <td className="text-slate-600">{p.tenant?.name ?? '–'}</td>
                  <td className="text-slate-500">{p.reference ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="px-5 py-12 text-center text-slate-500">No payments yet.</p>}
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
