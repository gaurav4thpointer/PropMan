/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { properties, leases, payments, cheques } from '../api/client'
import type { Property, Lease, Payment, Cheque } from '../api/types'
import PropertyForm from '../components/PropertyForm'
import { useAuth } from '../context/AuthContext'
import { formatPropertyCode, formatLeaseCode } from '../utils/ids'
import { isLeaseExpired, isLeaseTerminated, isLeaseFuture } from '../utils/lease'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatNum(n: number) {
  return n.toLocaleString()
}

const COUNTRY_LABELS: Record<string, string> = {
  IN: 'India',
  AE: 'UAE',
  US: 'United States',
  GB: 'United Kingdom',
  SG: 'Singapore',
  SA: 'Saudi Arabia',
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

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [propertyLeases, setPropertyLeases] = useState<Lease[]>([])
  const [propertyPayments, setPropertyPayments] = useState<Payment[]>([])
  const [propertyCheques, setPropertyCheques] = useState<Cheque[]>([])
  const [relatedLoading, setRelatedLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoadError(null)
    setLoading(true)
    properties.get(id)
      .then((r) => setProperty(r.data))
      .catch((err) => {
        setProperty(null)
        const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
        setLoadError(Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Failed to load property')
      })
      .finally(() => setLoading(false))
  }, [id, user?.id])

  useEffect(() => {
    if (!id) return
    setRelatedLoading(true)
    Promise.all([
      leases.list({ page: 1, limit: 100, propertyId: id }).then((r) => r.data?.data ?? []),
      payments.list({ page: 1, limit: 100, propertyId: id }).then((r) => r.data?.data ?? []),
      cheques.list({ page: 1, limit: 100, propertyId: id }).then((r) => r.data?.data ?? []),
    ])
      .then(([l, p, c]) => {
        setPropertyLeases(l)
        setPropertyPayments(p)
        setPropertyCheques(c)
      })
      .catch(() => {
        setPropertyLeases([])
        setPropertyPayments([])
        setPropertyCheques([])
      })
      .finally(() => setRelatedLoading(false))
  }, [id])

  const refresh = () => {
    if (!id) return
    properties.get(id).then((r) => setProperty(r.data)).catch(() => {})
    setRelatedLoading(true)
    Promise.all([
      leases.list({ page: 1, limit: 100, propertyId: id }).then((r) => r.data?.data ?? []),
      payments.list({ page: 1, limit: 100, propertyId: id }).then((r) => r.data?.data ?? []),
      cheques.list({ page: 1, limit: 100, propertyId: id }).then((r) => r.data?.data ?? []),
    ])
      .then(([l, p, c]) => {
        setPropertyLeases(l)
        setPropertyPayments(p)
        setPropertyCheques(c)
      })
      .catch(() => {
        setPropertyLeases([])
        setPropertyPayments([])
        setPropertyCheques([])
      })
      .finally(() => setRelatedLoading(false))
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading property...</p>
        </div>
      </div>
    )
  }
  if (loadError || !property) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="font-medium">{loadError ?? 'Property not found'}</p>
        <Link to="/properties" className="mt-2 inline-block text-sm font-semibold text-rose-800 hover:underline">← Back to properties</Link>
      </div>
    )
  }

  const activeLeases = propertyLeases.filter((l) => !isLeaseExpired(l.endDate) && !isLeaseTerminated(l) && !isLeaseFuture(l.startDate))
  const totalPaymentsReceived = propertyPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  const infoItems = [
    { label: 'Country', value: COUNTRY_LABELS[property.country] ?? property.country },
    { label: 'Currency', value: property.currency },
    { label: 'State / Emirate', value: property.emirateOrState || null },
    { label: 'Unit no', value: property.unitNo || null },
    { label: 'Bedrooms', value: property.bedrooms != null ? `${property.bedrooms} BHK` : null },
    { label: 'Property code', value: formatPropertyCode(property.id), mono: true },
  ].filter((d) => d.value != null)

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link to="/properties" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">← Properties</Link>

      {/* Hero card */}
      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50/50 px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800">{property.name}</h1>
                {property.status && (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    property.status === 'OCCUPIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {property.status}
                  </span>
                )}
              </div>
              {property.address && (
                <p className="mt-1.5 text-slate-600">{property.address}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="btn-primary shrink-0 text-sm"
            >
              Edit property
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-3 lg:grid-cols-6">
          {infoItems.map(({ label, value, mono }) => (
            <div key={label} className="bg-white px-4 py-3.5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
              <p className={`mt-0.5 text-sm font-semibold text-slate-800 ${mono ? 'text-xs' : ''}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {property.notes?.trim() && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{property.notes}</p>
        </div>
      )}

      {/* Edit form */}
      {showForm && (
        <PropertyForm
          property={property}
          onSaved={() => { setShowForm(false); refresh() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Summary cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">At a glance</h2>
        {relatedLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div className="h-3 w-20 rounded bg-slate-200" />
                <div className="mt-3 h-6 w-12 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Active leases</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{activeLeases.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Total leases</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{propertyLeases.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Payments received</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">{formatNum(totalPaymentsReceived)}</p>
              <p className="text-xs text-slate-400">{propertyPayments.length} payment{propertyPayments.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Cheques tracked</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{propertyCheques.length}</p>
              {propertyCheques.filter((c) => c.status === 'BOUNCED').length > 0 && (
                <p className="text-xs font-medium text-rose-600">
                  {propertyCheques.filter((c) => c.status === 'BOUNCED').length} bounced
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Leases */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800">Leases</h2>
          <Link to={`/leases?propertyId=${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
            View all leases →
          </Link>
        </div>
        <div className="table-wrapper">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Lease</th>
                <th>Tenant</th>
                <th>Period</th>
                <th>Rent</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {relatedLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                  </td>
                </tr>
              ) : propertyLeases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No leases for this property.{' '}
                    <Link to="/leases" className="text-indigo-600 hover:underline">Create one →</Link>
                  </td>
                </tr>
              ) : (
                propertyLeases.map((l) => {
                  const expired = isLeaseExpired(l.endDate)
                  const terminated = isLeaseTerminated(l)
                  const future = isLeaseFuture(l.startDate)
                  return (
                    <tr key={l.id}>
                      <td>
                        <Link to={`/leases/${l.id}`} className="font-mono text-xs text-indigo-600 hover:underline">{formatLeaseCode(l.id)}</Link>
                      </td>
                      <td>
                        {l.tenantId && l.tenant?.name ? (
                          <Link to={`/tenants/${l.tenantId}`} className="text-indigo-600 hover:underline">
                            {l.tenant.name}
                          </Link>
                        ) : (
                          <span className="text-slate-600">–</span>
                        )}
                      </td>
                      <td className="text-slate-600">
                        {formatDate(l.startDate)} – {formatDate(l.endDate)}
                      </td>
                      <td className="text-slate-700">{formatNum(Number(l.installmentAmount))} / {l.rentFrequency}</td>
                      <td>
                        {expired ? (
                          <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">Expired</span>
                        ) : terminated ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Terminated</span>
                        ) : future ? (
                          <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">Future</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Active</span>
                        )}
                      </td>
                      <td className="text-right">
                        <Link to={`/leases/${l.id}`} className="text-sm text-indigo-600 hover:underline">View lease</Link>
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
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800">Payments</h2>
          <Link to={`/payments?propertyId=${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
            View all payments →
          </Link>
        </div>
        <div className="table-wrapper">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Lease</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Tenant</th>
              </tr>
            </thead>
            <tbody>
              {relatedLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                  </td>
                </tr>
              ) : propertyPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No payments recorded for this property
                  </td>
                </tr>
              ) : (
                propertyPayments.slice(0, 10).map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.leaseId ? (
                        <Link to={`/leases/${p.leaseId}`} className="font-mono text-xs text-indigo-600 hover:underline">{formatLeaseCode(p.leaseId)}</Link>
                      ) : (
                        <span className="text-slate-400">–</span>
                      )}
                    </td>
                    <td className="text-slate-700">{formatDate(p.date)}</td>
                    <td className="text-slate-700">{formatNum(Number(p.amount))}</td>
                    <td><span className="badge badge-neutral">{METHOD_LABELS[p.method] ?? p.method}</span></td>
                    <td>
                      {p.tenantId && p.tenant?.name ? (
                        <Link to={`/tenants/${p.tenantId}`} className="text-indigo-600 hover:underline">{p.tenant.name}</Link>
                      ) : (
                        <span className="text-slate-600">–</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {propertyPayments.length > 10 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <Link to={`/payments?propertyId=${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                View all {propertyPayments.length} payments →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Cheques */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800">Cheques (PDC)</h2>
          <Link to={`/cheques?propertyId=${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
            View all cheques →
          </Link>
        </div>
        <div className="table-wrapper">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Lease</th>
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
              {relatedLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                  </td>
                </tr>
              ) : propertyCheques.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    No cheques recorded for this property
                  </td>
                </tr>
              ) : (
                propertyCheques.slice(0, 10).map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.leaseId ? (
                        <Link to={`/leases/${c.leaseId}`} className="font-mono text-xs text-indigo-600 hover:underline">{formatLeaseCode(c.leaseId)}</Link>
                      ) : (
                        <span className="text-slate-400">–</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/cheques/${c.id}`} className="text-indigo-600 hover:underline">{c.chequeNumber}</Link>
                    </td>
                    <td className="text-slate-600">{c.bankName}</td>
                    <td className="text-slate-600">{formatDate(c.chequeDate)}</td>
                    <td className="text-slate-700">{formatNum(Number(c.amount))}</td>
                    <td className="text-slate-600">{c.coversPeriod}</td>
                    <td><span className={`badge ${CHEQUE_STATUS_CLASS[c.status] ?? 'badge-neutral'}`}>{c.status}</span></td>
                    <td className="text-right">
                      <Link to={`/cheques/${c.id}`} className="text-sm text-indigo-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {propertyCheques.length > 10 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <Link to={`/cheques?propertyId=${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                View all {propertyCheques.length} cheques →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
