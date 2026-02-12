/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cheques as chequesApi, properties as propertiesApi } from '../api/client'
import type { Cheque, Property } from '../api/types'
import ChequeForm from '../components/ChequeForm'
import ChequeStatusUpdate from '../components/ChequeStatusUpdate'
import DataTable, { type DataTableColumn } from '../components/DataTable'
import { ArchivedBadge, ArchiveToggle } from '../components/ArchiveDeleteMenu'

const FETCH_LIMIT = 100

const STATUS_BADGE: Record<string, string> = {
  RECEIVED: 'bg-slate-100 text-slate-700',
  DEPOSITED: 'bg-indigo-100 text-indigo-800',
  CLEARED: 'bg-emerald-100 text-emerald-800',
  BOUNCED: 'bg-rose-100 text-rose-800',
  REPLACED: 'bg-amber-100 text-amber-800',
}

const STATUS_LABELS: Record<string, string> = {
  RECEIVED: 'Received',
  DEPOSITED: 'Deposited',
  CLEARED: 'Cleared',
  BOUNCED: 'Bounced',
  REPLACED: 'Replaced',
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatNum(n: number) {
  return n.toLocaleString()
}

export default function Cheques() {
  const [searchParams, setSearchParams] = useSearchParams()
  const propertyIdFromUrl = searchParams.get('propertyId') ?? ''
  const tenantIdFromUrl = searchParams.get('tenantId') ?? ''
  const statusFromUrl = searchParams.get('status') ?? ''
  const [list, setList] = useState<Cheque[]>([])
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>(statusFromUrl)
  const [filterPropertyId, setFilterPropertyId] = useState<string>(propertyIdFromUrl)
  const [filterTenantId, setFilterTenantId] = useState<string>(tenantIdFromUrl)
  const [showForm, setShowForm] = useState(false)
  const [statusModal, setStatusModal] = useState<Cheque | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    if (propertyIdFromUrl !== filterPropertyId) setFilterPropertyId(propertyIdFromUrl)
  }, [propertyIdFromUrl])
  useEffect(() => {
    if (tenantIdFromUrl !== filterTenantId) setFilterTenantId(tenantIdFromUrl)
  }, [tenantIdFromUrl])
  useEffect(() => {
    setFilterStatus(statusFromUrl)
  }, [statusFromUrl])

  const load = () => {
    setLoading(true)
    chequesApi.list({ page: 1, limit: FETCH_LIMIT, includeArchived: showArchived || undefined })
      .then((r) => setList(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [showArchived])
  useEffect(() => { propertiesApi.list({ limit: 100 }).then((r) => setPropertiesList(r.data.data)) }, [])

  const filteredList = list.filter(
    (c) =>
      (!filterPropertyId || c.propertyId === filterPropertyId) &&
      (!filterTenantId || c.tenantId === filterTenantId) &&
      (!filterStatus || c.status === filterStatus)
  )

  const handleSaved = () => { setShowForm(false); load() }
  const handleStatusSaved = () => { setStatusModal(null); load() }

  const handleArchiveCheque = async (id: string) => {
    try { await chequesApi.archive(id); load() } catch { /* */ }
  }
  const handleRestoreCheque = async (id: string) => {
    try { await chequesApi.restore(id); load() } catch { /* */ }
  }

  const setUrlParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  // Summary stats by status
  const statusCounts = {
    RECEIVED: list.filter((c) => c.status === 'RECEIVED').length,
    DEPOSITED: list.filter((c) => c.status === 'DEPOSITED').length,
    CLEARED: list.filter((c) => c.status === 'CLEARED').length,
    BOUNCED: list.filter((c) => c.status === 'BOUNCED').length,
    REPLACED: list.filter((c) => c.status === 'REPLACED').length,
  }
  const totalAmount = list.reduce((sum, c) => sum + Number(c.amount), 0)
  const clearedAmount = list
    .filter((c) => c.status === 'CLEARED')
    .reduce((sum, c) => sum + Number(c.amount), 0)

  // Filter context
  const filterPropertyName = filterPropertyId
    ? propertiesList.find((p) => p.id === filterPropertyId)?.name ?? 'Property'
    : ''
  const filterTenantName = filterTenantId
    ? (() => {
        const t = list.find((c) => c.tenantId === filterTenantId)?.tenant
        return t?.name ?? 'Tenant'
      })()
    : ''

  const columns: DataTableColumn<Cheque>[] = [
    {
      key: 'chequeNumber',
      label: 'Cheque',
      searchable: true,
      getSearchValue: (c) => `${c.chequeNumber} ${c.bankName}`.trim(),
      render: (c) => (
        <div className={c.archivedAt ? 'opacity-60' : ''}>
          <div className="flex items-center">
            <Link to={`/cheques/${c.id}`} className="font-medium text-indigo-600 hover:underline">
              {c.chequeNumber}
            </Link>
            {c.archivedAt && <ArchivedBadge />}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{c.bankName}</p>
        </div>
      ),
    },
    {
      key: 'chequeDate',
      label: 'Date',
      sortKey: 'chequeDate',
      render: (c) => <span className="text-sm text-slate-600">{formatDate(c.chequeDate)}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortKey: 'amount',
      getSortValue: (c) => Number(c.amount),
      align: 'right',
      render: (c) => (
        <span className="font-semibold text-slate-800">{formatNum(Number(c.amount))}</span>
      ),
    },
    {
      key: 'coversPeriod',
      label: 'Covers',
      searchable: true,
      render: (c) => <span className="text-sm text-slate-600">{c.coversPeriod}</span>,
    },
    {
      key: 'propertyTenant',
      label: 'Property / Tenant',
      searchable: true,
      getSearchValue: (c) => `${c.property?.name ?? ''} ${c.tenant?.name ?? ''}`.trim(),
      render: (c) => (
        <div className="min-w-0 space-y-0.5">
          {c.propertyId && (
            <Link
              to={`/properties/${c.propertyId}`}
              className="block truncate text-sm text-indigo-600 hover:underline"
            >
              {c.property?.name ?? 'Property'}
            </Link>
          )}
          {c.tenant?.name && c.tenantId && (
            <Link
              to={`/tenants/${c.tenantId}`}
              className="block truncate text-xs text-slate-500 hover:text-indigo-600 hover:underline"
            >
              {c.tenant.name}
            </Link>
          )}
          {c.leaseId && (
            <Link
              to={`/leases/${c.leaseId}`}
              className="inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50"
            >
              View lease
            </Link>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortKey: 'status',
      render: (c) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[c.status] ?? 'bg-slate-100 text-slate-700'}`}>
          {STATUS_LABELS[c.status] ?? c.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          {!c.archivedAt && ['RECEIVED', 'DEPOSITED', 'BOUNCED'].includes(c.status) && (
            <button
              type="button"
              onClick={() => setStatusModal(c)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              Update status
            </button>
          )}
          {c.archivedAt ? (
            <button
              type="button"
              onClick={() => handleRestoreCheque(c.id)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleArchiveCheque(c.id)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50"
            >
              Archive
            </button>
          )}
        </div>
      ),
    },
  ]

  const extraToolbar = (
    <>
      <select
        value={filterPropertyId}
        onChange={(e) => {
          setFilterPropertyId(e.target.value)
          setUrlParam('propertyId', e.target.value)
        }}
        aria-label="Filter by property"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <option value="">All properties</option>
        {propertiesList.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <select
        value={filterStatus}
        onChange={(e) => {
          setFilterStatus(e.target.value)
          setUrlParam('status', e.target.value)
        }}
        aria-label="Filter by status"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <option value="">All statuses</option>
        <option value="RECEIVED">Received</option>
        <option value="DEPOSITED">Deposited</option>
        <option value="CLEARED">Cleared</option>
        <option value="BOUNCED">Bounced</option>
        <option value="REPLACED">Replaced</option>
      </select>
      <ArchiveToggle showArchived={showArchived} onChange={setShowArchived} />
    </>
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cheques (PDC)</h1>
          <p className="text-slate-500">Track post-dated cheques, deposits and clearances</p>
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

      {/* Filter context banner */}
      {(filterPropertyName || filterTenantName) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm">
          <span className="text-indigo-600">Showing cheques for:</span>
          {filterPropertyName && (
            <span className="rounded-lg bg-white px-2.5 py-0.5 font-medium text-indigo-800 shadow-sm">
              {filterPropertyName}
            </span>
          )}
          {filterTenantName && (
            <span className="rounded-lg bg-white px-2.5 py-0.5 font-medium text-indigo-800 shadow-sm">
              {filterTenantName}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setFilterPropertyId('')
              setFilterTenantId('')
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev)
                next.delete('propertyId')
                next.delete('tenantId')
                return next
              })
            }}
            className="ml-auto text-xs font-medium text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Summary stats */}
      {!loading && list.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Value</p>
              <p className="mt-1 text-xl font-bold text-slate-800">{formatNum(totalAmount)}</p>
              <p className="text-xs text-slate-400">{list.length} cheques</p>
            </div>
            <button
              type="button"
              onClick={() => { setFilterStatus(filterStatus === 'RECEIVED' ? '' : 'RECEIVED'); setUrlParam('status', filterStatus === 'RECEIVED' ? '' : 'RECEIVED') }}
              className={`rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-colors ${
                filterStatus === 'RECEIVED' ? 'border-slate-400 bg-slate-100' : 'border-slate-200/80 bg-white'
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Received</p>
              <p className="mt-1 text-xl font-bold text-slate-700">{statusCounts.RECEIVED}</p>
            </button>
            <button
              type="button"
              onClick={() => { setFilterStatus(filterStatus === 'DEPOSITED' ? '' : 'DEPOSITED'); setUrlParam('status', filterStatus === 'DEPOSITED' ? '' : 'DEPOSITED') }}
              className={`rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-colors ${
                filterStatus === 'DEPOSITED' ? 'border-indigo-400 bg-indigo-50' : 'border-indigo-200/80 bg-indigo-50/30'
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Deposited</p>
              <p className="mt-1 text-xl font-bold text-indigo-700">{statusCounts.DEPOSITED}</p>
            </button>
            <button
              type="button"
              onClick={() => { setFilterStatus(filterStatus === 'CLEARED' ? '' : 'CLEARED'); setUrlParam('status', filterStatus === 'CLEARED' ? '' : 'CLEARED') }}
              className={`rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-colors ${
                filterStatus === 'CLEARED' ? 'border-emerald-400 bg-emerald-50' : 'border-emerald-200/80 bg-emerald-50/30'
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Cleared</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">{statusCounts.CLEARED}</p>
              {clearedAmount > 0 && (
                <p className="text-xs text-emerald-500">{formatNum(clearedAmount)}</p>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setFilterStatus(filterStatus === 'BOUNCED' ? '' : 'BOUNCED'); setUrlParam('status', filterStatus === 'BOUNCED' ? '' : 'BOUNCED') }}
              className={`rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-colors ${
                filterStatus === 'BOUNCED' ? 'border-rose-400 bg-rose-50' : statusCounts.BOUNCED > 0 ? 'border-rose-200/80 bg-rose-50/30' : 'border-slate-200/80 bg-white'
              }`}
            >
              <p className={`text-xs font-medium uppercase tracking-wide ${statusCounts.BOUNCED > 0 ? 'text-rose-600' : 'text-slate-500'}`}>Bounced</p>
              <p className={`mt-1 text-xl font-bold ${statusCounts.BOUNCED > 0 ? 'text-rose-700' : 'text-slate-400'}`}>{statusCounts.BOUNCED}</p>
            </button>
            <button
              type="button"
              onClick={() => { setFilterStatus(filterStatus === 'REPLACED' ? '' : 'REPLACED'); setUrlParam('status', filterStatus === 'REPLACED' ? '' : 'REPLACED') }}
              className={`rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-colors ${
                filterStatus === 'REPLACED' ? 'border-amber-400 bg-amber-50' : 'border-slate-200/80 bg-white'
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Replaced</p>
              <p className="mt-1 text-xl font-bold text-slate-600">{statusCounts.REPLACED}</p>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : (
        <DataTable<Cheque>
          data={filteredList}
          columns={columns}
          idKey="id"
          searchPlaceholder="Search cheque no, bank, covers or property..."
          extraToolbar={extraToolbar}
          emptyMessage="No cheques match your filters."
        />
      )}
    </div>
  )
}
