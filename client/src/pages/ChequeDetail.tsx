/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cheques as chequesApi } from '../api/client'
import type { Cheque } from '../api/types'

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'badge-neutral',
  DEPOSITED: 'bg-indigo-100 text-indigo-800',
  CLEARED: 'badge-success',
  BOUNCED: 'badge-danger',
  REPLACED: 'badge-warning',
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatNum(n: number): string {
  return n.toLocaleString()
}

type TimelineEvent = { date: string; label: string; detail?: string; link?: string; linkLabel?: string; variant?: 'default' | 'success' | 'danger' | 'warning' }

function buildTimeline(c: Cheque): TimelineEvent[] {
  const events: TimelineEvent[] = []

  if (c.depositDate) {
    events.push({ date: c.depositDate, label: 'Deposited', detail: formatDate(c.depositDate), variant: 'default' })
  }
  if (c.clearedOrBounceDate) {
    if (c.status === 'CLEARED') {
      events.push({ date: c.clearedOrBounceDate, label: 'Cleared', detail: formatDate(c.clearedOrBounceDate), variant: 'success' })
    } else if (c.status === 'BOUNCED') {
      events.push({
        date: c.clearedOrBounceDate,
        label: 'Bounced',
        detail: c.bounceReason ? `${formatDate(c.clearedOrBounceDate)} · ${c.bounceReason}` : formatDate(c.clearedOrBounceDate),
        variant: 'danger',
      })
    } else {
      events.push({ date: c.clearedOrBounceDate, label: 'Cleared / Bounced', detail: formatDate(c.clearedOrBounceDate), variant: 'default' })
    }
  }
  if (c.status === 'REPLACED' && c.replacedBy) {
    events.push({
      date: c.updatedAt || c.createdAt || c.clearedOrBounceDate || c.chequeDate,
      label: 'Replaced by',
      link: `/cheques/${c.replacedBy.id}`,
      linkLabel: `Cheque ${c.replacedBy.chequeNumber}`,
      variant: 'warning',
    })
  }
  if (c.replacesCheque) {
    events.push({
      date: c.createdAt || c.chequeDate,
      label: 'Replaces',
      link: `/cheques/${c.replacesCheque.id}`,
      linkLabel: `Cheque ${c.replacesCheque.chequeNumber}`,
      variant: 'warning',
    })
  }

  const seen = new Set<string>()
  const unique = events.filter((e) => {
    const key = `${e.date}-${e.label}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return unique
}

export default function ChequeDetail() {
  const { id } = useParams<{ id: string }>()
  const [cheque, setCheque] = useState<Cheque | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setError(null)
    chequesApi
      .get(id)
      .then((r) => setCheque(r.data))
      .catch(() => setError('Cheque not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }
  if (error || !cheque) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error ?? 'Cheque not found.'}
        <Link to="/cheques" className="ml-2 font-medium underline">Back to cheques</Link>
      </div>
    )
  }

  const timeline = buildTimeline(cheque)

  return (
    <div>
      <Link to="/cheques" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">← Cheques</Link>

      <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Cheque {cheque.chequeNumber}</h1>
            <p className="mt-1 text-slate-600">{cheque.bankName}</p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{formatNum(Number(cheque.amount))}</p>
            <p className="mt-0.5 text-sm text-slate-500">{cheque.coversPeriod}</p>
          </div>
          <span className={`badge ${STATUS_COLORS[cheque.status] ?? 'badge-neutral'}`}>{cheque.status}</span>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          {cheque.propertyId && (
            <span>
              <span className="text-slate-500">Property</span>{' '}
              <Link to={`/properties/${cheque.propertyId}`} className="text-indigo-600 hover:underline">
                {cheque.property?.name ?? 'Property'}
              </Link>
            </span>
          )}
          {cheque.property?.unitNo && (
            <span>
              <span className="text-slate-500">Unit</span>{' '}
              <span className="text-slate-700">{cheque.property.unitNo}</span>
            </span>
          )}
          {cheque.tenantId && (
            <span>
              <span className="text-slate-500">Tenant</span>{' '}
              <Link to={`/tenants/${cheque.tenantId}`} className="text-indigo-600 hover:underline">
                {cheque.tenant?.name ?? 'Tenant'}
              </Link>
            </span>
          )}
          {cheque.leaseId && (
            <span>
              <span className="text-slate-500">Lease</span>{' '}
              <Link to={`/leases/${cheque.leaseId}`} className="text-indigo-600 hover:underline">
                View lease
              </Link>
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Cheque date</p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">{formatDate(cheque.chequeDate)}</p>
          </div>
          {cheque.depositDate && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Deposit date</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{formatDate(cheque.depositDate)}</p>
            </div>
          )}
          {cheque.clearedOrBounceDate && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {cheque.status === 'CLEARED' ? 'Cleared date' : cheque.status === 'BOUNCED' ? 'Bounced date' : 'Cleared / Bounced date'}
              </p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{formatDate(cheque.clearedOrBounceDate)}</p>
              {cheque.status === 'BOUNCED' && cheque.bounceReason && (
                <p className="mt-1 text-xs text-slate-500">{cheque.bounceReason}</p>
              )}
            </div>
          )}
        </div>

        {cheque.notes?.trim() && (
          <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm text-slate-600">
            {cheque.notes}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">Timeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">Key dates and status for this cheque</p>
        </div>
        <div className="px-5 py-6">
          <ul className="relative">
            {/* Vertical line */}
            {timeline.length > 1 && (
              <span
                className="absolute left-[15px] top-6 bottom-6 w-px bg-gradient-to-b from-indigo-200 via-slate-200 to-slate-200"
                aria-hidden
              />
            )}
            {timeline.map((event, i) => {
              const variant = event.variant ?? 'default'
              const nodeClass = {
                default: 'bg-indigo-500 ring-4 ring-indigo-100',
                success: 'bg-emerald-500 ring-4 ring-emerald-100',
                danger: 'bg-rose-500 ring-4 ring-rose-100',
                warning: 'bg-amber-500 ring-4 ring-amber-100',
              }[variant]
              return (
                <li key={i} className="relative flex gap-5 pb-8 last:pb-0">
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm">
                    <span className={`h-3 w-3 rounded-full ${nodeClass}`} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-slate-800">{event.label}</p>
                      {event.date && (
                        <time className="text-xs font-medium text-slate-500 tabular-nums">
                          {formatDate(event.date)}
                        </time>
                      )}
                    </div>
                    {event.detail && (
                      <p className="mt-1 text-sm text-slate-600">{event.detail}</p>
                    )}
                    {event.link && event.linkLabel && (
                      <Link
                        to={event.link}
                        className="mt-2 inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                      >
                        {event.linkLabel}
                        <span className="opacity-70">→</span>
                      </Link>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
