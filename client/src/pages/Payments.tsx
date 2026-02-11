import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { payments as paymentsApi, properties as propertiesApi } from '../api/client'
import type { Payment, Property } from '../api/types'
import PaymentForm from '../components/PaymentForm'
import DataTable, { type DataTableColumn } from '../components/DataTable'

const FETCH_LIMIT = 100

const METHOD_CONFIG: Record<string, { label: string; className: string }> = {
  CHEQUE: { label: 'Cheque', className: 'bg-violet-100 text-violet-800' },
  BANK_TRANSFER: { label: 'Bank transfer', className: 'bg-sky-100 text-sky-800' },
  UPI: { label: 'UPI', className: 'bg-emerald-100 text-emerald-800' },
  CASH: { label: 'Cash', className: 'bg-amber-100 text-amber-800' },
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatNum(n: number) {
  return n.toLocaleString()
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function isThisQuarter(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  if (d.getFullYear() !== now.getFullYear()) return false
  return Math.floor(d.getMonth() / 3) === Math.floor(now.getMonth() / 3)
}

export default function Payments() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'new'
  const propertyIdFromUrl = searchParams.get('propertyId') ?? ''
  const tenantIdFromUrl = searchParams.get('tenantId') ?? ''
  const methodFromUrl = searchParams.get('method') ?? ''
  const [list, setList] = useState<Payment[]>([])
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterPropertyId, setFilterPropertyId] = useState(propertyIdFromUrl)
  const [filterTenantId, setFilterTenantId] = useState(tenantIdFromUrl)
  const [filterMethod, setFilterMethod] = useState(methodFromUrl)

  useEffect(() => { setFilterPropertyId(propertyIdFromUrl) }, [propertyIdFromUrl])
  useEffect(() => { setFilterTenantId(tenantIdFromUrl) }, [tenantIdFromUrl])
  useEffect(() => { setFilterMethod(methodFromUrl) }, [methodFromUrl])

  const load = () => {
    setLoading(true)
    paymentsApi.list({ page: 1, limit: FETCH_LIMIT })
      .then((r) => setList(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { propertiesApi.list({ limit: 100 }).then((r) => setPropertiesList(r.data.data)) }, [])

  useEffect(() => {
    if (searchParams.get('onboarding') === 'new') {
      setShowForm(true)
    }
  }, [searchParams])

  const filteredList = list.filter(
    (p) =>
      (!filterPropertyId || p.propertyId === filterPropertyId) &&
      (!filterTenantId || p.tenantId === filterTenantId) &&
      (!filterMethod || p.method === filterMethod)
  )

  const setUrlParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  // Summary stats
  const totalAmount = list.reduce((sum, p) => sum + Number(p.amount), 0)
  const thisMonthPayments = list.filter((p) => isThisMonth(p.date))
  const thisMonthAmount = thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const thisQuarterPayments = list.filter((p) => isThisQuarter(p.date))
  const thisQuarterAmount = thisQuarterPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  // Filter context
  const filterPropertyName = filterPropertyId
    ? propertiesList.find((p) => p.id === filterPropertyId)?.name ?? 'Property'
    : ''
  const filterTenantName = filterTenantId
    ? (() => {
        const t = list.find((p) => p.tenantId === filterTenantId)?.tenant
        return t?.name ?? 'Tenant'
      })()
    : ''

  const columns: DataTableColumn<Payment>[] = [
    {
      key: 'date',
      label: 'Date',
      sortKey: 'date',
      render: (p) => (
        <div>
          <span className="font-medium text-slate-700">{formatDate(p.date)}</span>
          {isThisMonth(p.date) && (
            <span className="ml-1.5 inline-flex rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
              This month
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortKey: 'amount',
      getSortValue: (p) => Number(p.amount),
      align: 'right',
      render: (p) => (
        <span className="text-base font-semibold text-slate-800">
          {formatNum(Number(p.amount))}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Method',
      sortKey: 'method',
      render: (p) => {
        const config = METHOD_CONFIG[p.method] ?? { label: p.method, className: 'bg-slate-100 text-slate-700' }
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'propertyTenant',
      label: 'Property / Tenant',
      searchable: true,
      getSearchValue: (p) => `${p.property?.name ?? ''} ${p.property?.unitNo ?? ''} ${p.tenant?.name ?? ''}`.trim(),
      render: (p) => (
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5">
            {p.propertyId ? (
              <Link to={`/properties/${p.propertyId}`} className="truncate text-sm text-indigo-600 hover:underline">
                {p.property?.name ?? 'Property'}
              </Link>
            ) : (
              <span className="text-sm text-slate-600">{p.property?.name ?? '–'}</span>
            )}
            {p.property?.unitNo && (
              <span className="text-xs text-slate-400">/ {p.property.unitNo}</span>
            )}
          </div>
          {p.tenant?.name && p.tenantId && (
            <Link
              to={`/tenants/${p.tenantId}`}
              className="block truncate text-xs text-slate-500 hover:text-indigo-600 hover:underline"
            >
              {p.tenant.name}
            </Link>
          )}
        </div>
      ),
    },
    {
      key: 'reference',
      label: 'Reference',
      searchable: true,
      render: (p) => <span className="text-sm text-slate-500">{p.reference ?? '–'}</span>,
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (p) =>
        p.leaseId ? (
          <Link
            to={`/leases/${p.leaseId}`}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
          >
            View lease
          </Link>
        ) : null,
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
        value={filterTenantId}
        onChange={(e) => {
          setFilterTenantId(e.target.value)
          setUrlParam('tenantId', e.target.value)
        }}
        aria-label="Filter by tenant"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <option value="">All tenants</option>
        {Array.from(new Map(list.filter((p) => p.tenant).map((p) => [p.tenant!.id, p.tenant!])).values()).map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <select
        value={filterMethod}
        onChange={(e) => {
          setFilterMethod(e.target.value)
          setUrlParam('method', e.target.value)
        }}
        aria-label="Filter by method"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <option value="">All methods</option>
        <option value="CHEQUE">Cheque</option>
        <option value="BANK_TRANSFER">Bank transfer</option>
        <option value="UPI">UPI</option>
        <option value="CASH">Cash</option>
      </select>
    </>
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-slate-500">Record, track and match payments to rent schedules</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary shrink-0">
          + Add payment
        </button>
      </div>

      {showForm && <PaymentForm onSaved={() => { isOnboarding ? navigate(-1) : (setShowForm(false), load()) }} onCancel={() => { isOnboarding ? navigate(-1) : setShowForm(false) }} />}

      {/* Filter context banner */}
      {(filterPropertyName || filterTenantName) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm">
          <span className="text-indigo-600">Showing payments for:</span>
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
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">All-Time Total</p>
            <p className="mt-1 text-xl font-bold text-slate-800">{formatNum(totalAmount)}</p>
            <p className="text-xs text-slate-400">{list.length} payments</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 px-4 py-3.5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">This Month</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{formatNum(thisMonthAmount)}</p>
            <p className="text-xs text-emerald-500">{thisMonthPayments.length} payments</p>
          </div>
          <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/30 px-4 py-3.5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">This Quarter</p>
            <p className="mt-1 text-xl font-bold text-indigo-700">{formatNum(thisQuarterAmount)}</p>
            <p className="text-xs text-indigo-500">{thisQuarterPayments.length} payments</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Methods Used</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {Object.entries(
                list.reduce<Record<string, number>>((acc, p) => {
                  acc[p.method] = (acc[p.method] ?? 0) + 1
                  return acc
                }, {})
              ).map(([method, count]) => {
                const config = METHOD_CONFIG[method] ?? { label: method, className: 'bg-slate-100 text-slate-700' }
                return (
                  <span key={method} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${config.className}`}>
                    {config.label}: {count}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : (
        <DataTable<Payment>
          data={filteredList}
          columns={columns}
          idKey="id"
          searchPlaceholder="Search by reference, tenant or property..."
          extraToolbar={extraToolbar}
          emptyMessage="No payments match your filters. Use &quot;+ Add payment&quot; once you receive rent."
        />
      )}
    </div>
  )
}
