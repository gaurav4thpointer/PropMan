/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { tenants, leases, payments, cheques } from '../api/client'
import type { Tenant, Lease, Payment, Cheque } from '../api/types'
import TenantForm from '../components/TenantForm'
import { isLeaseExpired } from '../utils/lease'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatNum(n: number) {
  return n.toLocaleString()
}

const METHOD_LABELS: Record<string, string> = {
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank transfer',
  UPI: 'UPI',
  CASH: 'Cash',
}

const CHEQUE_STATUS_CLASS: Record<string, string> = {
  RECEIVED: 'badge-neutral',
  DEPOSITED: 'bg-indigo-100 text-indigo-800',
  CLEARED: 'badge-success',
  BOUNCED: 'badge-danger',
  REPLACED: 'badge-warning',
}

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [tenantLeases, setTenantLeases] = useState<Lease[]>([])
  const [tenantPayments, setTenantPayments] = useState<Payment[]>([])
  const [tenantCheques, setTenantCheques] = useState<Cheque[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('Invalid tenant')
      return
    }
    setError(null)
    setLoading(true)
    tenants
      .get(id)
      .then((r) => {
        setTenant(r.data)
        setError(null)
      })
      .catch(() => {
        setTenant(null)
        setError('Tenant not found')
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    Promise.all([
      leases.list({ page: 1, limit: 100 }).then((r) => r.data?.data ?? []),
      payments.list({ page: 1, limit: 100 }).then((r) => r.data?.data ?? []),
      cheques.list({ page: 1, limit: 100 }).then((r) => r.data?.data ?? []),
    ])
      .then(([allLeases, allPayments, allCheques]) => {
        setTenantLeases(Array.isArray(allLeases) ? allLeases.filter((l) => l.tenantId === id) : [])
        setTenantPayments(Array.isArray(allPayments) ? allPayments.filter((p) => p.tenantId === id) : [])
        setTenantCheques(Array.isArray(allCheques) ? allCheques.filter((c) => c.tenantId === id) : [])
      })
      .catch(() => {
        setTenantLeases([])
        setTenantPayments([])
        setTenantCheques([])
      })
  }, [id])

  const refresh = () => {
    if (!id) return
    tenants.get(id).then((r) => setTenant(r.data)).catch(() => setTenant(null))
    leases.list({ page: 1, limit: 100 }).then((r) => setTenantLeases((r.data?.data ?? []).filter((l) => l.tenantId === id))).catch(() => setTenantLeases([]))
    payments.list({ page: 1, limit: 100 }).then((r) => setTenantPayments((r.data?.data ?? []).filter((p) => p.tenantId === id))).catch(() => setTenantPayments([]))
    cheques.list({ page: 1, limit: 100 }).then((r) => setTenantCheques((r.data?.data ?? []).filter((c) => c.tenantId === id))).catch(() => setTenantCheques([]))
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="font-medium">{error ?? 'Tenant not found'}</p>
        <Link to="/tenants" className="mt-2 inline-block text-sm font-semibold text-rose-800 hover:underline">← Back to tenants</Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/tenants" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">← Tenants</Link>

      <div className="card mb-8 overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50/50 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{tenant.name}</h1>
              {tenant.phone && <p className="mt-1 text-slate-600">Phone: {tenant.phone}</p>}
              {tenant.email && <p className="mt-0.5 text-slate-600">Email: {tenant.email}</p>}
              {tenant.idNumber && <p className="mt-0.5 text-slate-600">ID: {tenant.idNumber}</p>}
              {tenant.notes && <p className="mt-2 text-slate-600">{tenant.notes}</p>}
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="btn-primary shrink-0 text-sm"
            >
              Edit tenant
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <TenantForm
          tenant={tenant}
          onSaved={() => { setShowForm(false); refresh() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Leases */}
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800">Leases</h2>
          <Link to={`/leases?tenantId=${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
            View all leases →
          </Link>
        </div>
        <div className="table-wrapper">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Property / Unit</th>
                <th>Period</th>
                <th>Rent</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenantLeases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    No leases for this tenant
                  </td>
                </tr>
              ) : (
                tenantLeases.map((l) => {
                  const expired = isLeaseExpired(l.endDate)
                  return (
                    <tr key={l.id}>
                      <td>
                        {l.propertyId ? (
                          <Link to={`/properties/${l.propertyId}`} className="font-semibold text-indigo-600 hover:underline">
                            {l.property?.name ?? 'Property'}
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-800">{l.property?.name ?? '–'}</span>
                        )}
                        <span className="text-slate-500"> / {l.property?.unitNo ?? '–'}</span>
                      </td>
                      <td className="text-slate-600">
                        {formatDate(l.startDate)} – {formatDate(l.endDate)}
                        {expired && <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">Expired</span>}
                      </td>
                      <td className="font-medium">{formatNum(Number(l.installmentAmount))} / {l.rentFrequency}</td>
                      <td className="text-right">
                        <Link to={`/leases/${l.id}`} className="text-sm font-medium text-indigo-600 hover:underline">View lease</Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments */}
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800">Payments</h2>
          <Link to={`/payments?tenantId=${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
            View all payments →
          </Link>
        </div>
        <div className="table-wrapper">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Property</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenantPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No payments for this tenant
                  </td>
                </tr>
              ) : (
                tenantPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="text-slate-700">{formatDate(p.date)}</td>
                    <td className="font-semibold">{formatNum(Number(p.amount))}</td>
                    <td><span className="badge badge-neutral">{METHOD_LABELS[p.method] ?? p.method}</span></td>
                    <td>
                      {p.propertyId ? (
                        <Link to={`/properties/${p.propertyId}`} className="text-indigo-600 hover:underline">{p.property?.name ?? '–'}</Link>
                      ) : (
                        <span className="text-slate-600">{p.property?.name ?? '–'}</span>
                      )}
                    </td>
                    <td className="text-right">
                      {p.leaseId && <Link to={`/leases/${p.leaseId}`} className="text-sm font-medium text-indigo-600 hover:underline">View lease</Link>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cheques */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800">Cheques (PDC)</h2>
          <Link to={`/cheques?tenantId=${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
            View all cheques →
          </Link>
        </div>
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
              {tenantCheques.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No cheques for this tenant
                  </td>
                </tr>
              ) : (
                tenantCheques.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/cheques/${c.id}`} className="font-semibold text-indigo-600 hover:underline">{c.chequeNumber}</Link>
                    </td>
                    <td className="text-slate-600">{c.bankName}</td>
                    <td className="text-slate-600">{formatDate(c.chequeDate)}</td>
                    <td className="font-medium">{formatNum(Number(c.amount))}</td>
                    <td className="text-slate-600">{c.coversPeriod}</td>
                    <td><span className={`badge ${CHEQUE_STATUS_CLASS[c.status] ?? 'badge-neutral'}`}>{c.status}</span></td>
                    <td className="text-right">
                      <span className="flex flex-wrap items-center justify-end gap-2">
                        <Link to={`/cheques/${c.id}`} className="text-sm font-medium text-indigo-600 hover:underline">View cheque</Link>
                        {c.leaseId && <Link to={`/leases/${c.leaseId}`} className="text-sm font-medium text-slate-600 hover:underline">View lease</Link>}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
