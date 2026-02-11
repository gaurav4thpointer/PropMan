/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { tenants, leases, cheques, payments, rentSchedule } from '../api/client'
import type { Tenant, Lease, Cheque, Payment, RentSchedule } from '../api/types'
import TenantForm from '../components/TenantForm'
import LeasePaymentCard from '../components/LeasePaymentCard'
import { isLeaseExpired, isLeaseTerminated, isLeaseFuture, getDaysOverdue, isDueDatePast } from '../utils/lease'
import { formatLeaseCode } from '../utils/ids'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatNum(n: number) {
  return n.toLocaleString()
}

const CHEQUE_STATUS_CLASS: Record<string, string> = {
  RECEIVED: 'badge-neutral',
  DEPOSITED: 'bg-indigo-100 text-indigo-800',
  CLEARED: 'badge-success',
  BOUNCED: 'badge-danger',
  REPLACED: 'badge-warning',
}

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
  CUSTOM: 'Custom',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank transfer',
  UPI: 'UPI',
  CASH: 'Cash',
}

export default function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [tenantLeases, setTenantLeases] = useState<Lease[]>([])
  const [tenantCheques, setTenantCheques] = useState<Cheque[]>([])
  const [tenantPayments, setTenantPayments] = useState<Payment[]>([])
  const [scheduleMap, setScheduleMap] = useState<Record<string, RentSchedule[]>>({})
  const [loading, setLoading] = useState(true)
  const [relatedLoading, setRelatedLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showOtherLeases, setShowOtherLeases] = useState(false)

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
    setRelatedLoading(true)
    Promise.all([
      leases.list({ page: 1, limit: 100, tenantId: id }).then((r) => r.data?.data ?? []),
      cheques.list({ page: 1, limit: 100, tenantId: id }).then((r) => r.data?.data ?? []),
      payments.list({ page: 1, limit: 100, tenantId: id }).then((r) => r.data?.data ?? []),
    ])
      .then(async ([l, c, p]) => {
        setTenantLeases(l)
        setTenantCheques(c)
        setTenantPayments(p)
        const map: Record<string, RentSchedule[]> = {}
        await Promise.all(
          l.map((lease) =>
            rentSchedule.byLease(lease.id, { page: 1, limit: 100 })
              .then((r) => { map[lease.id] = r.data?.data ?? [] })
              .catch(() => { map[lease.id] = [] })
          )
        )
        setScheduleMap(map)
      })
      .catch(() => {
        setTenantLeases([])
        setTenantCheques([])
        setTenantPayments([])
        setScheduleMap({})
      })
      .finally(() => setRelatedLoading(false))
  }, [id])

  const refresh = () => {
    if (!id) return
    tenants.get(id).then((r) => setTenant(r.data)).catch(() => setTenant(null))
    setRelatedLoading(true)
    Promise.all([
      leases.list({ page: 1, limit: 100, tenantId: id }).then((r) => r.data?.data ?? []),
      cheques.list({ page: 1, limit: 100, tenantId: id }).then((r) => r.data?.data ?? []),
      payments.list({ page: 1, limit: 100, tenantId: id }).then((r) => r.data?.data ?? []),
    ])
      .then(async ([l, c, p]) => {
        setTenantLeases(l)
        setTenantCheques(c)
        setTenantPayments(p)
        const map: Record<string, RentSchedule[]> = {}
        await Promise.all(
          l.map((lease) =>
            rentSchedule.byLease(lease.id, { page: 1, limit: 100 })
              .then((r) => { map[lease.id] = r.data?.data ?? [] })
              .catch(() => { map[lease.id] = [] })
          )
        )
        setScheduleMap(map)
      })
      .catch(() => {
        setTenantLeases([])
        setTenantCheques([])
        setTenantPayments([])
        setScheduleMap({})
      })
      .finally(() => setRelatedLoading(false))
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
        <Link to="/tenants" className="mt-2 inline-block text-sm font-semibold text-rose-800 hover:underline">&larr; Back to tenants</Link>
      </div>
    )
  }

  // Categorise leases
  const currentLeases = tenantLeases.filter((l) => !isLeaseExpired(l.endDate) && !isLeaseTerminated(l) && !isLeaseFuture(l.startDate))
  const pastLeases = tenantLeases.filter((l) => isLeaseExpired(l.endDate) || isLeaseTerminated(l))
  const futureLeases = tenantLeases.filter((l) => isLeaseFuture(l.startDate) && !isLeaseTerminated(l))
  const otherLeases = [...futureLeases, ...pastLeases]

  return (
    <div className="space-y-8">
      <Link to="/tenants" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">&larr; Tenants</Link>

      <div className="card overflow-hidden p-0">
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

      {/* Current leases – prominent section */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800">Current lease{currentLeases.length > 1 ? 's' : ''}</h2>
          <Link to={`/leases?tenantId=${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
            View all leases &rarr;
          </Link>
        </div>

        {relatedLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          </div>
        ) : currentLeases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">No active leases for this tenant</p>
            <Link to="/leases" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline">
              Create a lease &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {currentLeases.map((currentLease) => {
              const schedules = scheduleMap[currentLease.id] ?? []
              const leasePayments = tenantPayments.filter((p) => p.leaseId === currentLease.id)
              const totalExpected = schedules.reduce((sum, s) => sum + Number(s.expectedAmount), 0)
              const totalRcvd = leasePayments.reduce((sum, p) => sum + Number(p.amount), 0)
              const pending = schedules.filter((s) => s.status !== 'PAID' && !isDueDatePast(s.dueDate)).reduce((sum, s) => sum + Number(s.expectedAmount) - Number(s.paidAmount ?? 0), 0)
              const overdue = schedules.filter((s) => s.status !== 'PAID' && isDueDatePast(s.dueDate)).reduce((sum, s) => sum + Number(s.expectedAmount) - Number(s.paidAmount ?? 0), 0)
              const pctReceived = totalExpected > 0 ? Math.min((totalRcvd / totalExpected) * 100, 100) : 0
              const todayD = new Date()
              const todayUtc = Date.UTC(todayD.getFullYear(), todayD.getMonth(), todayD.getDate())
              const endD = new Date(currentLease.endDate)
              const endUtc = Date.UTC(endD.getFullYear(), endD.getMonth(), endD.getDate())
              const daysRem = Math.max(0, Math.round((endUtc - todayUtc) / 86400000))

              return (
                <div key={currentLease.id} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  {/* Header */}
                  <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 px-5 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Active</span>
                        <Link to={`/leases/${currentLease.id}`} className="font-mono text-xs font-semibold text-indigo-600 hover:underline">
                          {formatLeaseCode(currentLease.id)}
                        </Link>
                        {currentLease.property?.name && (
                          <Link to={`/properties/${currentLease.propertyId}`} className="text-sm font-medium text-slate-700 hover:text-indigo-600 hover:underline">
                            {currentLease.property.name}
                            {currentLease.property.unitNo ? ` / ${currentLease.property.unitNo}` : ''}
                          </Link>
                        )}
                      </div>
                      <Link to={`/leases/${currentLease.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                        View lease details &rarr;
                      </Link>
                    </div>
                  </div>

                  {/* Key details grid */}
                  <div className="grid grid-cols-2 gap-px border-b border-slate-100 bg-slate-100 sm:grid-cols-4">
                    <div className="bg-white px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Period</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-700">
                        {formatDate(currentLease.startDate)} &ndash; {formatDate(currentLease.endDate)}
                      </p>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Rent</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-700">
                        {formatNum(Number(currentLease.installmentAmount))} / {FREQ_LABELS[currentLease.rentFrequency] ?? currentLease.rentFrequency}
                      </p>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Security deposit</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-700">
                        {currentLease.securityDeposit ? formatNum(Number(currentLease.securityDeposit)) : '\u2013'}
                      </p>
                    </div>
                    <div className="bg-white px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Days remaining</p>
                      <p className={`mt-0.5 text-sm font-semibold ${daysRem <= 30 ? 'text-amber-700' : 'text-slate-700'}`}>
                        {daysRem} day{daysRem !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Payment progress */}
                  {schedules.length > 0 && (
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-500">Collection progress</p>
                        <p className="text-xs font-semibold text-slate-600">{Math.round(pctReceived)}%</p>
                      </div>
                      <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${overdue > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-emerald-500'}`}
                          style={{ width: `${pctReceived}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Expected</p>
                          <p className="text-sm font-bold text-slate-700">{formatNum(totalExpected)}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 px-3 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-500">Received</p>
                          <p className="text-sm font-bold text-emerald-700">{formatNum(totalRcvd)}</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 px-3 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-amber-500">Pending</p>
                          <p className="text-sm font-bold text-amber-700">{formatNum(pending)}</p>
                        </div>
                        <div className={`rounded-lg px-3 py-2 ${overdue > 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
                          <p className={`text-[11px] font-medium uppercase tracking-wide ${overdue > 0 ? 'text-rose-500' : 'text-slate-400'}`}>Overdue</p>
                          <p className={`text-sm font-bold ${overdue > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{formatNum(overdue)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rent schedule table */}
                  {schedules.length > 0 && (
                    <div className="border-b border-slate-100 overflow-x-auto">
                      <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:px-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rent schedule</p>
                      </div>
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <th className="px-4 py-2 sm:px-5">Due date</th>
                            <th className="px-4 py-2 sm:px-5">Expected</th>
                            <th className="px-4 py-2 sm:px-5">Paid</th>
                            <th className="px-4 py-2 sm:px-5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {schedules.map((s) => {
                            const isOverdue = s.status !== 'PAID' && isDueDatePast(s.dueDate)
                            const overdueDays = isOverdue ? getDaysOverdue(s.dueDate) : 0
                            return (
                              <tr key={s.id} className={isOverdue ? 'bg-rose-50/40' : ''}>
                                <td className="px-4 py-2 text-slate-600 sm:px-5">{formatDate(s.dueDate)}</td>
                                <td className="px-4 py-2 text-slate-700 sm:px-5">{formatNum(Number(s.expectedAmount))}</td>
                                <td className="px-4 py-2 text-slate-700 sm:px-5">{formatNum(Number(s.paidAmount ?? 0))}</td>
                                <td className="px-4 py-2 sm:px-5">
                                  {s.status === 'PAID' ? (
                                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Paid</span>
                                  ) : isOverdue ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                                      Overdue{overdueDays > 0 && ` (${overdueDays}d)`}
                                    </span>
                                  ) : s.status === 'PARTIAL' ? (
                                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Partial</span>
                                  ) : (
                                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Due</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Payments for this lease */}
                  {(() => {
                    const leasePayments = tenantPayments.filter((p) => p.leaseId === currentLease.id)
                    return leasePayments.length > 0 ? (
                      <div className="border-b border-slate-100 overflow-x-auto">
                        <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:px-6">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Payments ({leasePayments.length})
                          </p>
                        </div>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                              <th className="px-4 py-2 sm:px-5">Date</th>
                              <th className="px-4 py-2 sm:px-5">Amount</th>
                              <th className="px-4 py-2 sm:px-5">Method</th>
                              <th className="px-4 py-2 sm:px-5">Reference</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {leasePayments.map((p) => (
                              <tr key={p.id}>
                                <td className="px-4 py-2 text-slate-600 sm:px-5">{formatDate(p.date)}</td>
                                <td className="px-4 py-2 font-medium text-emerald-700 sm:px-5">{formatNum(Number(p.amount))}</td>
                                <td className="px-4 py-2 text-slate-600 sm:px-5">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</td>
                                <td className="px-4 py-2 text-slate-500 sm:px-5">{p.reference || '\u2013'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null
                  })()}

                  {/* Cheques (PDC) for this lease */}
                  {(() => {
                    const leaseCheques = tenantCheques.filter((c) => c.leaseId === currentLease.id)
                    return leaseCheques.length > 0 ? (
                      <div className="overflow-x-auto">
                        <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:px-6">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Cheques / PDC ({leaseCheques.length})
                          </p>
                          <Link to={`/cheques?tenantId=${id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                            View all &rarr;
                          </Link>
                        </div>
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                              <th className="px-4 py-2 sm:px-5">Cheque no</th>
                              <th className="px-4 py-2 sm:px-5">Bank</th>
                              <th className="px-4 py-2 sm:px-5">Date</th>
                              <th className="px-4 py-2 sm:px-5">Amount</th>
                              <th className="px-4 py-2 sm:px-5">Covers</th>
                              <th className="px-4 py-2 sm:px-5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {leaseCheques.map((c) => (
                              <tr key={c.id} className={c.status === 'BOUNCED' ? 'bg-rose-50/40' : ''}>
                                <td className="px-4 py-2 sm:px-5">
                                  <Link to={`/cheques/${c.id}`} className="text-indigo-600 hover:underline">{c.chequeNumber}</Link>
                                </td>
                                <td className="px-4 py-2 text-slate-600 sm:px-5">{c.bankName}</td>
                                <td className="px-4 py-2 text-slate-600 sm:px-5">{formatDate(c.chequeDate)}</td>
                                <td className="px-4 py-2 text-slate-700 sm:px-5">{formatNum(Number(c.amount))}</td>
                                <td className="px-4 py-2 text-slate-600 sm:px-5">{c.coversPeriod}</td>
                                <td className="px-4 py-2 sm:px-5">
                                  <span className={`badge ${CHEQUE_STATUS_CLASS[c.status] ?? 'badge-neutral'}`}>{c.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null
                  })()}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Past & future leases */}
      {!relatedLoading && otherLeases.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowOtherLeases((v) => !v)}
            className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
          >
            <svg
              className={`h-4 w-4 transition-transform ${showOtherLeases ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Past &amp; future leases ({otherLeases.length})
          </button>
          {showOtherLeases && (
            <div className="space-y-3">
              {otherLeases.map((l) => (
                <LeasePaymentCard
                  key={l.id}
                  lease={l}
                  schedules={scheduleMap[l.id] ?? []}
                  payments={tenantPayments.filter((p) => p.leaseId === l.id)}
                  showTenant={false}
                  defaultExpanded={false}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
