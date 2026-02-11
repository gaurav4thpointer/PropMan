/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { properties, leases, cheques, payments, rentSchedule } from '../api/client'
import type { Property, Lease, Cheque, Payment, RentSchedule } from '../api/types'
import PropertyForm from '../components/PropertyForm'
import LeasePaymentCard from '../components/LeasePaymentCard'
import { useAuth } from '../context/AuthContext'
import { formatPropertyCode, formatLeaseCode } from '../utils/ids'
import { isLeaseExpired, isLeaseTerminated, isLeaseFuture, getDaysOverdue, isDueDatePast } from '../utils/lease'

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

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [propertyLeases, setPropertyLeases] = useState<Lease[]>([])
  const [propertyCheques, setPropertyCheques] = useState<Cheque[]>([])
  const [propertyPayments, setPropertyPayments] = useState<Payment[]>([])
  const [scheduleMap, setScheduleMap] = useState<Record<string, RentSchedule[]>>({})
  const [relatedLoading, setRelatedLoading] = useState(true)
  const [showOtherLeases, setShowOtherLeases] = useState(false)

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
      cheques.list({ page: 1, limit: 100, propertyId: id }).then((r) => r.data?.data ?? []),
      payments.list({ page: 1, limit: 100, propertyId: id }).then((r) => r.data?.data ?? []),
    ])
      .then(async ([l, c, p]) => {
        setPropertyLeases(l)
        setPropertyCheques(c)
        setPropertyPayments(p)
        // Fetch rent schedules for each lease
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
        setPropertyLeases([])
        setPropertyCheques([])
        setPropertyPayments([])
        setScheduleMap({})
      })
      .finally(() => setRelatedLoading(false))
  }, [id])

  const refresh = () => {
    if (!id) return
    properties.get(id).then((r) => setProperty(r.data)).catch(() => {})
    setRelatedLoading(true)
    Promise.all([
      leases.list({ page: 1, limit: 100, propertyId: id }).then((r) => r.data?.data ?? []),
      cheques.list({ page: 1, limit: 100, propertyId: id }).then((r) => r.data?.data ?? []),
      payments.list({ page: 1, limit: 100, propertyId: id }).then((r) => r.data?.data ?? []),
    ])
      .then(async ([l, c, p]) => {
        setPropertyLeases(l)
        setPropertyCheques(c)
        setPropertyPayments(p)
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
        setPropertyLeases([])
        setPropertyCheques([])
        setPropertyPayments([])
        setScheduleMap({})
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
        <Link to="/properties" className="mt-2 inline-block text-sm font-semibold text-rose-800 hover:underline">&larr; Back to properties</Link>
      </div>
    )
  }

  // Categorise leases
  const currentLeases = propertyLeases.filter((l) => !isLeaseExpired(l.endDate) && !isLeaseTerminated(l) && !isLeaseFuture(l.startDate))
  const pastLeases = propertyLeases.filter((l) => isLeaseExpired(l.endDate) || isLeaseTerminated(l))
  const futureLeases = propertyLeases.filter((l) => isLeaseFuture(l.startDate) && !isLeaseTerminated(l))
  const otherLeases = [...futureLeases, ...pastLeases]
  const currentLease = currentLeases[0] ?? null

  // Cheques & payments for the current lease
  const currentLeaseCheques = currentLease ? propertyCheques.filter((c) => c.leaseId === currentLease.id) : []
  const currentLeasePayments = currentLease ? propertyPayments.filter((p) => p.leaseId === currentLease.id) : []

  // Current lease schedules & payment stats
  const currentSchedules = currentLease ? (scheduleMap[currentLease.id] ?? []) : []
  const clTotalExpected = currentSchedules.reduce((sum, s) => sum + Number(s.expectedAmount), 0)
  const clTotalReceived = currentLeasePayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const clPending = currentSchedules
    .filter((s) => s.status !== 'PAID' && !isDueDatePast(s.dueDate))
    .reduce((sum, s) => sum + Number(s.expectedAmount) - Number(s.paidAmount ?? 0), 0)
  const clOverdue = currentSchedules
    .filter((s) => s.status !== 'PAID' && isDueDatePast(s.dueDate))
    .reduce((sum, s) => sum + Number(s.expectedAmount) - Number(s.paidAmount ?? 0), 0)
  const clPctReceived = clTotalExpected > 0 ? Math.min((clTotalReceived / clTotalExpected) * 100, 100) : 0

  // Aggregate payment stats across all schedules (for At a glance)
  // Exclude post-termination schedules from terminated leases
  const allSchedules = propertyLeases.flatMap((l) => {
    const scheds = scheduleMap[l.id] ?? []
    if (isLeaseTerminated(l) && l.terminationDate) {
      return scheds.filter((s) => new Date(s.dueDate) <= new Date(l.terminationDate!))
    }
    return scheds
  })
  const totalReceived = propertyPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalPending = allSchedules
    .filter((s) => s.status !== 'PAID' && !isDueDatePast(s.dueDate))
    .reduce((sum, s) => sum + Number(s.expectedAmount) - Number(s.paidAmount ?? 0), 0)
  const totalOverdue = allSchedules
    .filter((s) => s.status !== 'PAID' && isDueDatePast(s.dueDate))
    .reduce((sum, s) => sum + Number(s.expectedAmount) - Number(s.paidAmount ?? 0), 0)

  const infoItems = [
    { label: 'Country', value: COUNTRY_LABELS[property.country] ?? property.country },
    { label: 'Currency', value: property.currency },
    { label: 'State / Emirate', value: property.emirateOrState || null },
    { label: 'Unit no', value: property.unitNo || null },
    { label: 'Bedrooms', value: property.bedrooms != null ? `${property.bedrooms} BHK` : null },
    { label: 'Property code', value: formatPropertyCode(property.id), mono: true },
  ].filter((d) => d.value != null)

  // Days remaining on current lease (UTC to avoid DST errors)
  const daysRemaining = currentLease ? (() => {
    const today = new Date()
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    const end = new Date(currentLease.endDate)
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
    return Math.max(0, Math.round((endUtc - todayUtc) / 86400000))
  })() : 0

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link to="/properties" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">&larr; Properties</Link>

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div className="h-3 w-20 rounded bg-slate-200" />
                <div className="mt-3 h-6 w-12 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Active leases</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{currentLeases.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Total leases</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{propertyLeases.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Received</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">{formatNum(totalReceived)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Pending</p>
              <p className="mt-1 text-xl font-bold text-amber-700">{formatNum(totalPending)}</p>
            </div>
            <div className={`rounded-2xl border bg-white p-4 shadow-sm ${totalOverdue > 0 ? 'border-rose-200' : 'border-slate-200/80'}`}>
              <p className="text-xs font-medium text-slate-500">Overdue</p>
              <p className={`mt-1 text-xl font-bold ${totalOverdue > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{formatNum(totalOverdue)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Cheques</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{propertyCheques.length}</p>
              {propertyCheques.filter((c) => c.status === 'BOUNCED').length > 0 && (
                <p className="text-xs font-medium text-rose-600">
                  {propertyCheques.filter((c) => c.status === 'BOUNCED').length} bounced
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Payments</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{propertyPayments.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Current lease – prominent section */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800">Current lease</h2>
          <Link to={`/leases?propertyId=${id}`} className="text-sm font-medium text-indigo-600 hover:underline">
            View all leases &rarr;
          </Link>
        </div>

        {relatedLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
          </div>
        ) : !currentLease ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">No active lease on this property</p>
            <Link to={`/leases?onboarding=new&propertyId=${id}`} className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline">
              Create a lease &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            {/* Lease header */}
            <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">Active</span>
                  <Link
                    to={`/leases/${currentLease.id}`}
                    className="font-mono text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    {formatLeaseCode(currentLease.id)}
                  </Link>
                  {currentLease.tenant?.name && (
                    <Link to={`/tenants/${currentLease.tenantId}`} className="text-sm font-medium text-slate-700 hover:text-indigo-600 hover:underline">
                      {currentLease.tenant.name}
                    </Link>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to={`/payments?onboarding=new&leaseId=${currentLease.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    + Add payment
                  </Link>
                  <Link
                    to={`/cheques?onboarding=new&leaseId=${currentLease.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100"
                  >
                    + Add cheque
                  </Link>
                  <Link
                    to={`/leases/${currentLease.id}`}
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    View lease details &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* Key lease details grid */}
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
                <p className={`mt-0.5 text-sm font-semibold ${daysRemaining <= 30 ? 'text-amber-700' : 'text-slate-700'}`}>
                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Payment progress */}
            {currentSchedules.length > 0 && (
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">Collection progress</p>
                  <p className="text-xs font-semibold text-slate-600">{Math.round(clPctReceived)}%</p>
                </div>
                <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      clOverdue > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${clPctReceived}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Expected</p>
                    <p className="text-sm font-bold text-slate-700">{formatNum(clTotalExpected)}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-500">Received</p>
                    <p className="text-sm font-bold text-emerald-700">{formatNum(clTotalReceived)}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 px-3 py-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-amber-500">Pending</p>
                    <p className="text-sm font-bold text-amber-700">{formatNum(clPending)}</p>
                  </div>
                  <div className={`rounded-lg px-3 py-2 ${clOverdue > 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
                    <p className={`text-[11px] font-medium uppercase tracking-wide ${clOverdue > 0 ? 'text-rose-500' : 'text-slate-400'}`}>Overdue</p>
                    <p className={`text-sm font-bold ${clOverdue > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{formatNum(clOverdue)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rent schedule table – always visible */}
            {currentSchedules.length > 0 && (
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
                    {currentSchedules.map((s) => {
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
            {currentLeasePayments.length > 0 && (
              <div className="border-b border-slate-100 overflow-x-auto">
                <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:px-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Payments ({currentLeasePayments.length})
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
                    {currentLeasePayments.map((p) => (
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
            )}

            {/* Cheques (PDC) for this lease */}
            {currentLeaseCheques.length > 0 && (
              <div className="overflow-x-auto">
                <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:px-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Cheques / PDC ({currentLeaseCheques.length})
                  </p>
                  <Link to={`/cheques?propertyId=${id}`} className="text-xs font-medium text-indigo-600 hover:underline">
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
                    {currentLeaseCheques.map((c) => (
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
            )}
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
                  payments={propertyPayments.filter((p) => p.leaseId === l.id)}
                  showTenant={true}
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
