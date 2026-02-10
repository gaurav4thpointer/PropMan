import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { leases as leasesApi, properties as propertiesApi } from '../api/client'
import type { Lease, Property } from '../api/types'
import LeaseForm from '../components/LeaseForm'
import DataTable, { type DataTableColumn } from '../components/DataTable'
import { isLeaseExpired, isLeaseTerminated } from '../utils/lease'

const FETCH_LIMIT = 100

function formatDate(s: string) {
  return new Date(s).toLocaleDateString()
}

function formatNum(n: number) {
  return n.toLocaleString()
}

export default function Leases() {
  const [searchParams, setSearchParams] = useSearchParams()
  const propertyIdFromUrl = searchParams.get('propertyId') ?? ''
  const tenantIdFromUrl = searchParams.get('tenantId') ?? ''
  const [list, setList] = useState<Lease[]>([])
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
    leasesApi.list({ page: 1, limit: FETCH_LIMIT })
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
    (l) => (!filterPropertyId || l.propertyId === filterPropertyId) && (!filterTenantId || l.tenantId === filterTenantId)
  )

  const columns: DataTableColumn<Lease>[] = [
    {
      key: 'propertyUnit',
      label: 'Property / Unit',
      searchable: true,
      getSearchValue: (l) => `${l.property?.name ?? ''} ${l.property?.unitNo ?? ''}`.trim(),
      sortKey: 'property.name',
      render: (l) => (
        <>
          {l.propertyId ? (
            <Link to={`/properties/${l.propertyId}`} className="font-semibold text-indigo-600 hover:underline">{l.property?.name ?? 'Property'}</Link>
          ) : (
            <span className="font-semibold text-slate-800">{l.property?.name ?? '–'}</span>
          )}
          <span className="text-slate-500"> / {l.property?.unitNo ?? '–'}</span>
        </>
      ),
    },
    {
      key: 'tenant',
      label: 'Tenant',
      searchable: true,
      getSearchValue: (l) => l.tenant?.name ?? '',
      sortKey: 'tenant.name',
      render: (l) => (
        l.tenant?.name && l.tenantId ? (
          <Link to={`/tenants/${l.tenantId}`} className="text-indigo-600 hover:underline">{l.tenant.name}</Link>
        ) : (
          l.tenant?.name ?? '–'
        )
      ),
    },
    {
      key: 'period',
      label: 'Period',
      sortKey: 'endDate',
      render: (l) => {
        const expired = isLeaseExpired(l.endDate)
        const terminated = isLeaseTerminated(l)
        return (
          <span className="text-slate-600">
            {formatDate(l.startDate)} – {formatDate(l.endDate)}
            {expired && (
              <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">Expired</span>
            )}
            {terminated && !expired && (
              <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Terminated early</span>
            )}
          </span>
        )
      },
    },
    {
      key: 'rent',
      label: 'Rent',
      sortKey: 'installmentAmount',
      getSortValue: (l) => Number(l.installmentAmount),
      render: (l) => <span className="font-medium">{formatNum(Number(l.installmentAmount))} / {l.rentFrequency}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (l) => (
        <Link to={`/leases/${l.id}`} className="text-sm font-medium text-indigo-600 hover:underline">View lease</Link>
      ),
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
          const v = e.target.value
          setFilterTenantId(v)
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            if (v) next.set('tenantId', v)
            else next.delete('tenantId')
            return next
          })
        }}
        aria-label="Filter by tenant"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <option value="">All tenants</option>
        {Array.from(new Map(list.filter((l) => l.tenant).map((l) => [l.tenant!.id, l.tenant!])).values()).map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </>
  )

  return (
    <div>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leases</h1>
          <p className="text-slate-500">Rent schedules and lease terms</p>
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
            next.delete('onboarding')
            next.delete('next')
            return next
          })
          load()
        }}
          onCancel={() => {
          setShowForm(false)
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.delete('onboarding')
            next.delete('next')
            return next
          })
        }}
        />
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
          searchPlaceholder="Search by property or tenant..."
          extraToolbar={extraToolbar}
          emptyMessage="No leases yet. Click “+ Create lease” to generate a rent schedule."
        />
      )}
    </div>
  )
}
