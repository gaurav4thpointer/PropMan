import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cheques as chequesApi, properties as propertiesApi } from '../api/client'
import type { Cheque, Property } from '../api/types'
import ChequeForm from '../components/ChequeForm'
import ChequeStatusUpdate from '../components/ChequeStatusUpdate'
import DataTable, { type DataTableColumn } from '../components/DataTable'

const FETCH_LIMIT = 100

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: 'badge-neutral',
  DEPOSITED: 'bg-indigo-100 text-indigo-800',
  CLEARED: 'badge-success',
  BOUNCED: 'badge-danger',
  REPLACED: 'badge-warning',
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString()
}

function formatNum(n: number) {
  return n.toLocaleString()
}

export default function Cheques() {
  const [searchParams, setSearchParams] = useSearchParams()
  const propertyIdFromUrl = searchParams.get('propertyId') ?? ''
  const tenantIdFromUrl = searchParams.get('tenantId') ?? ''
  const [list, setList] = useState<Cheque[]>([])
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPropertyId, setFilterPropertyId] = useState<string>(propertyIdFromUrl)
  const [filterTenantId, setFilterTenantId] = useState<string>(tenantIdFromUrl)
  const [showForm, setShowForm] = useState(false)
  const [statusModal, setStatusModal] = useState<Cheque | null>(null)

  useEffect(() => {
    if (propertyIdFromUrl !== filterPropertyId) setFilterPropertyId(propertyIdFromUrl)
  }, [propertyIdFromUrl])
  useEffect(() => {
    if (tenantIdFromUrl !== filterTenantId) setFilterTenantId(tenantIdFromUrl)
  }, [tenantIdFromUrl])

  const load = () => {
    setLoading(true)
    chequesApi.list({ page: 1, limit: FETCH_LIMIT })
      .then((r) => setList(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { propertiesApi.list({ limit: 100 }).then((r) => setPropertiesList(r.data.data)) }, [])

  const filteredList = list.filter(
    (c) =>
      (!filterPropertyId || c.propertyId === filterPropertyId) &&
      (!filterTenantId || c.tenantId === filterTenantId) &&
      (!filterStatus || c.status === filterStatus)
  )

  const handleSaved = () => { setShowForm(false); load() }
  const handleStatusSaved = () => { setStatusModal(null); load() }

  const columns: DataTableColumn<Cheque>[] = [
    {
      key: 'chequeNumber',
      label: 'Cheque no',
      searchable: true,
      render: (c) => (
        <Link to={`/cheques/${c.id}`} className="font-semibold text-indigo-600 hover:underline">
          {c.chequeNumber}
        </Link>
      ),
    },
    {
      key: 'bankName',
      label: 'Bank',
      searchable: true,
      render: (c) => <span className="text-slate-600">{c.bankName}</span>,
    },
    {
      key: 'chequeDate',
      label: 'Date',
      sortKey: 'chequeDate',
      render: (c) => <span className="text-slate-600">{formatDate(c.chequeDate)}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortKey: 'amount',
      getSortValue: (c) => Number(c.amount),
      align: 'right',
      render: (c) => <span className="font-medium">{formatNum(Number(c.amount))}</span>,
    },
    {
      key: 'coversPeriod',
      label: 'Covers',
      searchable: true,
      render: (c) => <span className="text-slate-600">{c.coversPeriod}</span>,
    },
    {
      key: 'propertyTenant',
      label: 'Property / Tenant',
      searchable: true,
      getSearchValue: (c) => `${c.property?.name ?? ''} ${c.tenant?.name ?? ''}`.trim(),
      render: (c) => (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-600">
          {c.propertyId ? (
            <Link to={`/properties/${c.propertyId}`} className="text-indigo-600 hover:underline">{c.property?.name ?? 'Property'}</Link>
          ) : (
            <span>{c.property?.name ?? '–'}</span>
          )}
          {c.tenant?.name && c.tenantId && (
            <>
              <span className="text-slate-400">·</span>
              <Link to={`/tenants/${c.tenantId}`} className="text-indigo-600 hover:underline">{c.tenant.name}</Link>
            </>
          )}
          {c.leaseId && (
            <>
              <span className="text-slate-400">·</span>
              <Link to={`/leases/${c.leaseId}`} className="text-sm text-indigo-600 hover:underline">Lease</Link>
            </>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortKey: 'status',
      searchable: true,
      render: (c) => <span className={`badge ${STATUS_COLORS[c.status] ?? 'badge-neutral'}`}>{c.status}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (c) =>
        ['RECEIVED', 'DEPOSITED', 'BOUNCED'].includes(c.status) ? (
          <button type="button" onClick={() => setStatusModal(c)} className="text-sm font-medium text-indigo-600 hover:underline">Update status</button>
        ) : null,
    },
  ]

  const extraToolbar = (
    <>
      <select
        value={filterPropertyId}
        onChange={(e) => {
          const v = e.target.value
          setFilterPropertyId(v)
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            if (v) next.set('propertyId', v)
            else next.delete('propertyId')
            return next
          })
        }}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <option value="">All properties</option>
        {propertiesList.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <option value="">All statuses</option>
        <option value="RECEIVED">Received</option>
        <option value="DEPOSITED">Deposited</option>
        <option value="CLEARED">Cleared</option>
        <option value="BOUNCED">Bounced</option>
        <option value="REPLACED">Replaced</option>
      </select>
    </>
  )

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

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : (
        <DataTable<Cheque>
          data={filteredList}
          columns={columns}
          idKey="id"
          searchPlaceholder="Search cheque no, bank or covers..."
          extraToolbar={extraToolbar}
          emptyMessage="No cheques match filters."
        />
      )}
    </div>
  )
}
