/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { properties as propertiesApi } from '../api/client'
import type { Property } from '../api/types'
import PropertyForm from '../components/PropertyForm'
import DataTable, { type DataTableColumn } from '../components/DataTable'
import { formatPropertyCode } from '../utils/ids'
import { ArchivedBadge, ArchiveToggle } from '../components/ArchiveDeleteMenu'

const FETCH_LIMIT = 100

const COUNTRY_LABELS: Record<string, string> = {
  IN: 'India',
  AE: 'UAE',
  US: 'United States',
  GB: 'United Kingdom',
  SG: 'Singapore',
  SA: 'Saudi Arabia',
}

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams()
  const countryFromUrl = searchParams.get('country') ?? ''
  const currencyFromUrl = searchParams.get('currency') ?? ''
  const statusFromUrl = searchParams.get('status') ?? ''
  const [list, setList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Property | null>(null)
  const [filterCountry, setFilterCountry] = useState(countryFromUrl)
  const [filterCurrency, setFilterCurrency] = useState(currencyFromUrl)
  const [filterStatus, setFilterStatus] = useState(statusFromUrl)
  const [showArchived, setShowArchived] = useState(false)

  const load = () => {
    setLoading(true)
    propertiesApi.list({ page: 1, limit: FETCH_LIMIT, includeArchived: showArchived || undefined })
      .then((r) => setList(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [showArchived])
  useEffect(() => {
    setFilterCountry(countryFromUrl)
    setFilterCurrency(currencyFromUrl)
    setFilterStatus(statusFromUrl)
  }, [countryFromUrl, currencyFromUrl, statusFromUrl])

  const ownerIdFromUrl = searchParams.get('ownerId') ?? ''

  const filteredList = list.filter(
    (p) =>
      (!filterCountry || p.country === filterCountry) &&
      (!filterCurrency || p.currency === filterCurrency) &&
      (!filterStatus || p.status === filterStatus)
  )

  // Summary stats
  const totalCount = filteredList.length
  const occupiedCount = filteredList.filter((p) => p.status === 'OCCUPIED').length
  const vacantCount = filteredList.filter((p) => p.status === 'VACANT').length
  const countries = [...new Set(filteredList.map((p) => p.country))]

  const handleSaved = () => {
    setShowForm(false)
    setEditing(null)
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev)
      nextParams.delete('ownerId')
      return nextParams
    })
    load()
  }

  const handleEdit = (p: Property) => {
    setEditing(p)
    setShowForm(true)
  }

  const handleArchive = async (id: string) => {
    try {
      await propertiesApi.archive(id)
      load()
    } catch { /* handled by reload */ }
  }

  const handleRestore = async (id: string) => {
    try {
      await propertiesApi.restore(id)
      load()
    } catch { /* handled by reload */ }
  }

  const setUrlParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  const columns: DataTableColumn<Property>[] = [
    {
      key: 'name',
      label: 'Property',
      searchable: true,
      getSearchValue: (p) => `${p.name} ${p.address ?? ''} ${formatPropertyCode(p.id)}`.trim(),
      render: (p) => (
        <div className={`min-w-0 ${p.archivedAt ? 'opacity-60' : ''}`}>
          <div className="flex items-center">
            <Link
              to={`/properties/${p.id}`}
              className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              {p.name}
            </Link>
            {p.archivedAt && <ArchivedBadge />}
          </div>
          {p.address && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{p.address}</p>
          )}
          <p className="mt-0.5 font-mono text-[11px] text-slate-400" title={p.id}>
            {formatPropertyCode(p.id)}
          </p>
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      searchable: true,
      getSearchValue: (p) => `${p.country} ${COUNTRY_LABELS[p.country] ?? ''} ${p.currency}`.trim(),
      render: (p) => (
        <div className="flex items-center gap-2">
          <span className="badge badge-neutral">{p.country}</span>
          <span className="text-xs text-slate-500">{p.currency}</span>
        </div>
      ),
    },
    {
      key: 'unitNo',
      label: 'Unit',
      sortable: true,
      getSortValue: (p) => (p.unitNo ?? '').toString(),
      render: (p) => (
        <div>
          <span className="font-medium text-slate-700">{p.unitNo ?? '–'}</span>
          {p.bedrooms != null && (
            <span className="ml-1.5 text-xs text-slate-400">{p.bedrooms} BHK</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      getSortValue: (p) => p.status ?? '',
      render: (p) =>
        p.status ? (
          <span
            className={`badge ${
              p.status === 'OCCUPIED' ? 'badge-success' : 'badge-warning'
            }`}
          >
            {p.status === 'OCCUPIED' ? 'Occupied' : 'Vacant'}
          </span>
        ) : (
          <span className="text-xs text-slate-400">–</span>
        ),
    },
    {
      key: 'related',
      label: 'Navigate to',
      sortable: false,
      render: (p) => (
        <div className="flex items-center gap-2 text-xs">
          <Link
            to={`/leases?propertyId=${p.id}`}
            className="rounded-lg bg-indigo-50 px-2 py-1 font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
          >
            Leases
          </Link>
          <Link
            to={`/cheques?propertyId=${p.id}`}
            className="rounded-lg bg-slate-50 px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Cheques
          </Link>
          <Link
            to={`/payments?propertyId=${p.id}`}
            className="rounded-lg bg-slate-50 px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Payments
          </Link>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          {!p.archivedAt && (
            <button
              type="button"
              onClick={() => handleEdit(p)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              Edit
            </button>
          )}
          {p.archivedAt ? (
            <button
              type="button"
              onClick={() => handleRestore(p.id)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleArchive(p.id)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50"
              title="Archive"
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
        value={filterCountry}
        onChange={(e) => {
          setFilterCountry(e.target.value)
          setUrlParam('country', e.target.value)
        }}
        aria-label="Filter by country"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <option value="">All countries</option>
        {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>
      <select
        value={filterCurrency}
        onChange={(e) => {
          setFilterCurrency(e.target.value)
          setUrlParam('currency', e.target.value)
        }}
        aria-label="Filter by currency"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <option value="">All currencies</option>
        <option value="INR">INR</option>
        <option value="AED">AED</option>
        <option value="USD">USD</option>
        <option value="GBP">GBP</option>
        <option value="SGD">SGD</option>
        <option value="SAR">SAR</option>
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
        <option value="OCCUPIED">Occupied</option>
        <option value="VACANT">Vacant</option>
      </select>
      <ArchiveToggle showArchived={showArchived} onChange={setShowArchived} />
    </>
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Properties</h1>
          <p className="text-slate-500">Manage your rental properties and units</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="btn-primary shrink-0"
        >
          + Add property
        </button>
      </div>

      {showForm && (
        <PropertyForm
          property={editing ?? undefined}
          initialOwnerId={!editing && ownerIdFromUrl ? ownerIdFromUrl : undefined}
          onSaved={handleSaved}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              next.delete('ownerId')
              return next
            })
          }}
        />
      )}

      {/* Summary stats */}
      {!loading && list.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{totalCount}</p>
            {countries.length > 1 && (
              <p className="mt-0.5 text-xs text-slate-400">
                {countries.length} {countries.length === 1 ? 'country' : 'countries'}
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 px-4 py-3.5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Occupied</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{occupiedCount}</p>
            {totalCount > 0 && (
              <p className="mt-0.5 text-xs text-emerald-500">
                {totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0}% of total
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 px-4 py-3.5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Vacant</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{vacantCount}</p>
            {vacantCount > 0 && (
              <p className="mt-0.5 text-xs text-amber-500">Available for lease</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Unset Status</p>
            <p className="mt-1 text-2xl font-bold text-slate-400">
              {totalCount - occupiedCount - vacantCount}
            </p>
            {totalCount - occupiedCount - vacantCount > 0 && (
              <p className="mt-0.5 text-xs text-slate-400">Update via property detail</p>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : (
        <DataTable<Property>
          data={filteredList}
          columns={columns}
          idKey="id"
          searchPlaceholder="Search by name, address or code..."
          extraToolbar={extraToolbar}
          emptyMessage="No properties match your filters. Click &quot;+ Add property&quot; to create your first one."
        />
      )}
    </div>
  )
}
