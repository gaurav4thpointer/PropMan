import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { leases as leasesApi, properties as propertiesApi } from '../api/client'
import type { Lease, Property } from '../api/types'
import LeaseForm from '../components/LeaseForm'
import DataTable, { type DataTableColumn } from '../components/DataTable'
import { isLeaseExpired, isLeaseTerminated, isLeaseFuture } from '../utils/lease'
import { formatLeaseCode } from '../utils/ids'
import { ArchivedBadge, ArchiveToggle } from '../components/ArchiveDeleteMenu'

const FETCH_LIMIT = 100

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: 'mo',
  QUARTERLY: 'qtr',
  YEARLY: 'yr',
  CUSTOM: 'custom',
}

type LeaseDisplayStatus = 'active' | 'expiring' | 'future' | 'expired' | 'terminated'

function getLeaseDisplayStatus(l: Lease): LeaseDisplayStatus {
  if (isLeaseExpired(l.endDate)) return 'expired'
  if (isLeaseTerminated(l)) return 'terminated'
  if (isLeaseFuture(l.startDate)) return 'future'
  // Check if expiring within 30 days
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(l.endDate)
  end.setHours(0, 0, 0, 0)
  const diffDays = Math.round((end.getTime() - today.getTime()) / 86400000)
  if (diffDays <= 30) return 'expiring'
  return 'active'
}

const STATUS_CONFIG: Record<LeaseDisplayStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-800' },
  expiring: { label: 'Expiring soon', className: 'bg-amber-100 text-amber-800' },
  future: { label: 'Future', className: 'bg-sky-100 text-sky-800' },
  expired: { label: 'Expired', className: 'bg-rose-100 text-rose-800' },
  terminated: { label: 'Terminated', className: 'bg-slate-200 text-slate-700' },
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function formatNum(n: number) {
  return n.toLocaleString()
}

function getDaysRemaining(endDate: string): number {
  const today = new Date()
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const end = new Date(endDate)
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.max(0, Math.round((endUtc - todayUtc) / 86400000))
}

export default function Leases() {
  const [searchParams, setSearchParams] = useSearchParams()
  const propertyIdFromUrl = searchParams.get('propertyId') ?? ''
  const tenantIdFromUrl = searchParams.get('tenantId') ?? ''
  const statusFromUrl = searchParams.get('status') ?? ''
  const [list, setList] = useState<Lease[]>([])
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterPropertyId, setFilterPropertyId] = useState(propertyIdFromUrl)
  const [filterTenantId, setFilterTenantId] = useState(tenantIdFromUrl)
  const [filterStatus, setFilterStatus] = useState(statusFromUrl)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => { setFilterPropertyId(propertyIdFromUrl) }, [propertyIdFromUrl])
  useEffect(() => { setFilterTenantId(tenantIdFromUrl) }, [tenantIdFromUrl])
  useEffect(() => { setFilterStatus(statusFromUrl) }, [statusFromUrl])

  const load = () => {
    setLoading(true)
    leasesApi.list({ page: 1, limit: FETCH_LIMIT, includeArchived: showArchived || undefined })
      .then((r) => setList(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [showArchived])
  useEffect(() => { propertiesApi.list({ limit: 100 }).then((r) => setPropertiesList(r.data.data)) }, [])

  const handleArchiveLease = async (id: string) => {
    try { await leasesApi.archive(id); load() } catch { /* */ }
  }
  const handleRestoreLease = async (id: string) => {
    try { await leasesApi.restore(id); load() } catch { /* */ }
  }

  const setUrlParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  const filteredList = list.filter((l) => {
    if (filterPropertyId && l.propertyId !== filterPropertyId) return false
    if (filterTenantId && l.tenantId !== filterTenantId) return false
    if (filterStatus) {
      const status = getLeaseDisplayStatus(l)
      if (filterStatus === 'active' && status !== 'active' && status !== 'expiring') return false
      if (filterStatus === 'expiring' && status !== 'expiring') return false
      if (filterStatus === 'expired' && status !== 'expired') return false
      if (filterStatus === 'terminated' && status !== 'terminated') return false
      if (filterStatus === 'future' && status !== 'future') return false
    }
    return true
  })

  // Summary stats (computed from full list, not filtered)
  const activeCount = list.filter((l) => {
    const s = getLeaseDisplayStatus(l)
    return s === 'active' || s === 'expiring'
  }).length
  const expiringCount = list.filter((l) => getLeaseDisplayStatus(l) === 'expiring').length
  const expiredCount = list.filter((l) => getLeaseDisplayStatus(l) === 'expired').length
  const terminatedCount = list.filter((l) => getLeaseDisplayStatus(l) === 'terminated').length

  // Filter context: show selected property/tenant name
  const filterPropertyName = filterPropertyId
    ? propertiesList.find((p) => p.id === filterPropertyId)?.name ?? 'Property'
    : ''
  const filterTenantName = filterTenantId
    ? (() => {
        const t = list.find((l) => l.tenantId === filterTenantId)?.tenant
        return t?.name ?? 'Tenant'
      })()
    : ''

  const columns: DataTableColumn<Lease>[] = [
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      getSortValue: (l) => {
        if (l.archivedAt) return 5
        const order: Record<LeaseDisplayStatus, number> = { active: 0, expiring: 1, future: 2, terminated: 3, expired: 4 }
        return order[getLeaseDisplayStatus(l)]
      },
      render: (l) => {
        if (l.archivedAt) {
          return <ArchivedBadge />
        }
        const status = getLeaseDisplayStatus(l)
        const config = STATUS_CONFIG[status]
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
      getSearchValue: (l) => `${l.property?.name ?? ''} ${l.property?.unitNo ?? ''} ${l.tenant?.name ?? ''} ${formatLeaseCode(l.id)}`.trim(),
      render: (l) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {l.propertyId ? (
              <Link to={`/properties/${l.propertyId}`} className="font-medium text-indigo-600 hover:underline">
                {l.property?.name ?? 'Property'}
              </Link>
            ) : (
              <span className="text-slate-800">{l.property?.name ?? '–'}</span>
            )}
            {l.property?.unitNo && (
              <span className="text-xs text-slate-400">/ {l.property.unitNo}</span>
            )}
          </div>
          {l.tenant?.name && l.tenantId && (
            <Link
              to={`/tenants/${l.tenantId}`}
              className="mt-0.5 block text-sm text-slate-600 hover:text-indigo-600 hover:underline"
            >
              {l.tenant.name}
            </Link>
          )}
          <p className="mt-0.5 font-mono text-[11px] text-slate-400" title={l.id}>
            {formatLeaseCode(l.id)}
          </p>
        </div>
      ),
    },
    {
      key: 'period',
      label: 'Period',
      sortKey: 'startDate',
      render: (l) => {
        const status = getLeaseDisplayStatus(l)
        const daysRem = (status === 'active' || status === 'expiring') ? getDaysRemaining(l.endDate) : null
        return (
          <div>
            <p className="text-sm text-slate-700">
              {formatDate(l.startDate)} &ndash; {formatDate(l.endDate)}
            </p>
            {daysRem != null && (
              <p className={`mt-0.5 text-xs font-medium ${daysRem <= 30 ? 'text-amber-600' : 'text-slate-400'}`}>
                {daysRem} day{daysRem !== 1 ? 's' : ''} remaining
              </p>
            )}
            {l.terminationDate && (
              <p className="mt-0.5 text-xs text-slate-400">
                Terminated: {formatDate(l.terminationDate)}
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: 'rent',
      label: 'Rent',
      sortKey: 'installmentAmount',
      getSortValue: (l) => Number(l.installmentAmount),
      align: 'right',
      render: (l) => (
        <div className="text-right">
          <p className="font-semibold text-slate-800">{formatNum(Number(l.installmentAmount))}</p>
          <p className="text-xs text-slate-400">/ {FREQ_LABELS[l.rentFrequency] ?? l.rentFrequency}</p>
        </div>
      ),
    },
    {
      key: 'related',
      label: 'Navigate to',
      sortable: false,
      render: (l) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs">
            <Link
              to={`/leases/${l.id}`}
              className="rounded-lg bg-indigo-50 px-2 py-1 font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
            >
              Schedule
            </Link>
            <Link
              to={`/payments?propertyId=${l.propertyId}&tenantId=${l.tenantId}`}
              className="rounded-lg bg-slate-50 px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              Payments
            </Link>
            <Link
              to={`/cheques?propertyId=${l.propertyId}`}
              className="rounded-lg bg-slate-50 px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              Cheques
            </Link>
            {l.archivedAt ? (
              <button
                type="button"
                onClick={() => handleRestoreLease(l.id)}
                className="rounded-lg bg-emerald-50 px-2 py-1 font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
              >
                Restore
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleArchiveLease(l.id)}
                className="rounded-lg bg-amber-50 px-2 py-1 font-medium text-amber-600 transition-colors hover:bg-amber-100"
              >
                Archive
              </button>
            )}
          </div>
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
        value={filterTenantId}
        onChange={(e) => {
          setFilterTenantId(e.target.value)
          setUrlParam('tenantId', e.target.value)
        }}
        aria-label="Filter by tenant"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <option value="">All tenants</option>
        {Array.from(new Map(list.filter((l) => l.tenant).map((l) => [l.tenant!.id, l.tenant!])).values()).map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
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
        <option value="active">Active</option>
        <option value="expiring">Expiring soon</option>
        <option value="future">Future</option>
        <option value="expired">Expired</option>
        <option value="terminated">Terminated</option>
      </select>
      <ArchiveToggle showArchived={showArchived} onChange={setShowArchived} />
    </>
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leases</h1>
          <p className="text-slate-500">Rent schedules, terms and lease management</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary shrink-0">
          + Create lease
        </button>
      </div>

      {showForm && (
        <LeaseForm
          onSaved={() => {
            setShowForm(false)
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              return next
            })
            load()
          }}
          onCancel={() => {
            setShowForm(false)
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              return next
            })
          }}
        />
      )}

      {/* Filter context banner */}
      {(filterPropertyName || filterTenantName) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm">
          <span className="text-indigo-600">Showing leases for:</span>
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
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{list.length}</p>
          </div>
          <button
            type="button"
            onClick={() => { setFilterStatus('active'); setUrlParam('status', 'active') }}
            className={`rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-colors ${
              filterStatus === 'active' ? 'border-emerald-400 bg-emerald-50' : 'border-emerald-200/80 bg-emerald-50/30'
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Active</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{activeCount}</p>
          </button>
          <button
            type="button"
            onClick={() => { setFilterStatus('expiring'); setUrlParam('status', 'expiring') }}
            className={`rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-colors ${
              filterStatus === 'expiring' ? 'border-amber-400 bg-amber-50' : 'border-amber-200/80 bg-amber-50/30'
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Expiring Soon</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{expiringCount}</p>
          </button>
          <button
            type="button"
            onClick={() => { setFilterStatus('expired'); setUrlParam('status', 'expired') }}
            className={`rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-colors ${
              filterStatus === 'expired' ? 'border-rose-400 bg-rose-50' : 'border-rose-200/80 bg-rose-50/30'
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-rose-600">Expired</p>
            <p className="mt-1 text-2xl font-bold text-rose-700">{expiredCount}</p>
          </button>
          <button
            type="button"
            onClick={() => { setFilterStatus('terminated'); setUrlParam('status', 'terminated') }}
            className={`rounded-2xl border px-4 py-3.5 text-left shadow-sm transition-colors ${
              filterStatus === 'terminated' ? 'border-slate-400 bg-slate-100' : 'border-slate-200/80 bg-white'
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Terminated</p>
            <p className="mt-1 text-2xl font-bold text-slate-600">{terminatedCount}</p>
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : (
        <DataTable<Lease>
          data={filteredList}
          columns={columns}
          idKey="id"
          searchPlaceholder="Search by property, tenant or lease code..."
          extraToolbar={extraToolbar}
          emptyMessage="No leases match your filters. Click &quot;+ Create lease&quot; to generate a rent schedule."
        />
      )}
    </div>
  )
}
