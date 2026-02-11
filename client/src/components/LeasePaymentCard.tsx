import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Lease, Payment, RentSchedule } from '../api/types'
import { formatLeaseCode } from '../utils/ids'
import { isLeaseExpired, isLeaseTerminated, isLeaseFuture, getDaysOverdue, isDueDatePast } from '../utils/lease'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatNum(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: 'mo',
  QUARTERLY: 'qtr',
  YEARLY: 'yr',
  CUSTOM: 'custom',
}

interface LeasePaymentCardProps {
  lease: Lease
  schedules: RentSchedule[]
  payments?: Payment[]
  showTenant?: boolean
  defaultExpanded?: boolean
}

export default function LeasePaymentCard({
  lease,
  schedules,
  payments,
  showTenant = true,
  defaultExpanded = false,
}: LeasePaymentCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const expired = isLeaseExpired(lease.endDate)
  const terminated = isLeaseTerminated(lease)
  const future = isLeaseFuture(lease.startDate)
  const active = !expired && !terminated && !future

  const effectiveSchedules = terminated && lease.terminationDate
    ? schedules.filter((s) => new Date(s.dueDate) <= new Date(lease.terminationDate!))
    : schedules

  const totalExpected = effectiveSchedules.reduce((sum, s) => sum + Number(s.expectedAmount), 0)
  const totalReceived = payments
    ? payments.reduce((sum, p) => sum + Number(p.amount), 0)
    : effectiveSchedules.reduce((sum, s) => sum + Number(s.paidAmount ?? 0), 0)
  const pendingAmount = effectiveSchedules
    .filter((s) => s.status !== 'PAID' && !isDueDatePast(s.dueDate))
    .reduce((sum, s) => sum + Number(s.expectedAmount) - Number(s.paidAmount ?? 0), 0)
  const overdueAmount = effectiveSchedules
    .filter((s) => s.status !== 'PAID' && isDueDatePast(s.dueDate))
    .reduce((sum, s) => sum + Number(s.expectedAmount) - Number(s.paidAmount ?? 0), 0)

  const statusBadge = expired ? (
    <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">Expired</span>
  ) : terminated ? (
    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Terminated</span>
  ) : future ? (
    <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">Future</span>
  ) : (
    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Active</span>
  )

  const pctReceived = totalExpected > 0 ? Math.min((totalReceived / totalExpected) * 100, 100) : 0

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            to={`/leases/${lease.id}`}
            className="font-mono text-xs font-semibold text-indigo-600 hover:underline"
          >
            {formatLeaseCode(lease.id)}
          </Link>

          {statusBadge}

          {showTenant ? (
            lease.tenant?.name ? (
              <Link to={`/tenants/${lease.tenantId}`} className="text-sm text-indigo-600 hover:underline">
                {lease.tenant.name}
              </Link>
            ) : null
          ) : (
            lease.property?.name ? (
              <Link to={`/properties/${lease.propertyId}`} className="text-sm text-indigo-600 hover:underline">
                {lease.property.name}
                {lease.property.unitNo ? ` / ${lease.property.unitNo}` : ''}
              </Link>
            ) : null
          )}

          <span className="text-sm text-slate-500">
            {formatDate(lease.startDate)} &ndash; {formatDate(lease.endDate)}
          </span>

          <span className="text-sm font-medium text-slate-700">
            {formatNum(Number(lease.installmentAmount))} / {FREQ_LABELS[lease.rentFrequency] ?? lease.rentFrequency}
          </span>
        </div>

        {effectiveSchedules.length > 0 && (
          <div className="mt-3">
            <div className="mb-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${
                  overdueAmount > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-emerald-500'
                }`}
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
                <p className="text-sm font-bold text-emerald-700">{formatNum(totalReceived)}</p>
              </div>
              <div className="rounded-lg bg-amber-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-amber-500">Pending</p>
                <p className="text-sm font-bold text-amber-700">{formatNum(pendingAmount)}</p>
              </div>
              <div className={`rounded-lg px-3 py-2 ${overdueAmount > 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
                <p className={`text-[11px] font-medium uppercase tracking-wide ${overdueAmount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                  Overdue
                </p>
                <p className={`text-sm font-bold ${overdueAmount > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                  {formatNum(overdueAmount)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {schedules.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? 'Hide' : 'Show'} rent schedule ({schedules.length} installment{schedules.length !== 1 ? 's' : ''})
          </button>

          {expanded && (
            <div className="border-t border-slate-100">
              <div className="overflow-x-auto">
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
                      const isCancelled = terminated && lease.terminationDate && new Date(s.dueDate) > new Date(lease.terminationDate)
                      const isOverdue = !isCancelled && s.status !== 'PAID' && isDueDatePast(s.dueDate)
                      const overdueDays = isOverdue ? getDaysOverdue(s.dueDate) : 0
                      return (
                        <tr key={s.id} className={isCancelled ? 'opacity-40' : active && isOverdue ? 'bg-rose-50/40' : ''}>
                          <td className="px-4 py-2 text-slate-600 sm:px-5">{formatDate(s.dueDate)}</td>
                          <td className="px-4 py-2 text-slate-700 sm:px-5">{formatNum(Number(s.expectedAmount))}</td>
                          <td className="px-4 py-2 text-slate-700 sm:px-5">{formatNum(Number(s.paidAmount ?? 0))}</td>
                          <td className="px-4 py-2 sm:px-5">
                            {isCancelled ? (
                              <span className="text-xs text-slate-400">Cancelled</span>
                            ) : s.status === 'PAID' ? (
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
            </div>
          )}
        </>
      )}
    </div>
  )
}
