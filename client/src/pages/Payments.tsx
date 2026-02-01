import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { payments as paymentsApi, properties as propertiesApi } from '../api/client'
import type { Payment, Property } from '../api/types'
import PaymentForm from '../components/PaymentForm'
import DataTable, { type DataTableColumn } from '../components/DataTable'

const FETCH_LIMIT = 100

const METHOD_LABELS: Record<string, string> = {
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank transfer',
  UPI: 'UPI',
  CASH: 'Cash',
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString()
}

function formatNum(n: number) {
  return n.toLocaleString()
}

export default function Payments() {
  const [searchParams, setSearchParams] = useSearchParams()
  const propertyIdFromUrl = searchParams.get('propertyId') ?? ''
  const tenantIdFromUrl = searchParams.get('tenantId') ?? ''
  const [list, setList] = useState<Payment[]>([])
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterPropertyId, setFilterPropertyId] = useState(propertyIdFromUrl)
  const [filterTenantId, setFilterTenantId] = useState(tenantIdFromUrl)

  useEffect(() => {
    setFilterPropertyId(propertyIdFromUrl)
  }, [propertyIdFromUrl])
  useEffect(() => {
    setFilterTenantId(tenantIdFromUrl)
  }, [tenantIdFromUrl])

  const load = () => {
    setLoading(true)
    paymentsApi.list({ page: 1, limit: FETCH_LIMIT })
      .then((r) => setList(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { propertiesApi.list({ limit: 100 }).then((r) => setPropertiesList(r.data.data)) }, [])

  const filteredList = list.filter(
    (p) => (!filterPropertyId || p.propertyId === filterPropertyId) && (!filterTenantId || p.tenantId === filterTenantId)
  )

  const columns: DataTableColumn<Payment>[] = [
    {
      key: 'date',
      label: 'Date',
      sortKey: 'date',
      render: (p) => <span className="text-slate-700">{formatDate(p.date)}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortKey: 'amount',
      getSortValue: (p) => Number(p.amount),
      align: 'right',
      render: (p) => <span className="font-semibold text-slate-800">{formatNum(Number(p.amount))}</span>,
    },
    {
      key: 'method',
      label: 'Method',
      sortKey: 'method',
      render: (p) => <span className="badge badge-neutral">{METHOD_LABELS[p.method] ?? p.method}</span>,
    },
    {
      key: 'propertyUnit',
      label: 'Property / Unit',
      searchable: true,
      getSearchValue: (p) => `${p.property?.name ?? ''} ${p.unit?.unitNo ?? ''}`.trim(),
      render: (p) => (
        <span className="text-slate-600">
          {p.propertyId ? (
            <Link to={`/properties/${p.propertyId}`} className="text-indigo-600 hover:underline">{p.property?.name ?? 'Property'}</Link>
          ) : (
            p.property?.name ?? '–'
          )}
          {' / '}{p.unit?.unitNo ?? '–'}
        </span>
      ),
    },
    {
      key: 'tenant',
      label: 'Tenant',
      searchable: true,
      getSearchValue: (p) => p.tenant?.name ?? '',
      render: (p) =>
        p.tenant?.name && p.tenantId ? (
          <Link to={`/tenants/${p.tenantId}`} className="text-indigo-600 hover:underline">{p.tenant.name}</Link>
        ) : (
          p.tenant?.name ?? '–'
        ),
    },
    {
      key: 'reference',
      label: 'Reference',
      searchable: true,
      render: (p) => <span className="text-slate-500">{p.reference ?? '–'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (p) =>
        p.leaseId ? (
          <Link to={`/leases/${p.leaseId}`} className="text-sm font-medium text-indigo-600 hover:underline">View lease</Link>
        ) : null,
    },
  ]

  const extraToolbar = (
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
      aria-label="Filter by property"
      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
    >
      <option value="">All properties</option>
      {propertiesList.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  )

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
        <DataTable<Payment>
          data={filteredList}
          columns={columns}
          idKey="id"
          searchPlaceholder="Search by reference or tenant..."
          extraToolbar={extraToolbar}
          emptyMessage="No payments yet."
        />
      )}
    </div>
  )
}
