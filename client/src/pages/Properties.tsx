/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { properties as propertiesApi } from '../api/client'
import type { Property } from '../api/types'
import PropertyForm from '../components/PropertyForm'
import DataTable, { type DataTableColumn } from '../components/DataTable'

const FETCH_LIMIT = 100

export default function Properties() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const countryFromUrl = searchParams.get('country') ?? ''
  const currencyFromUrl = searchParams.get('currency') ?? ''
  const [list, setList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Property | null>(null)
  const [filterCountry, setFilterCountry] = useState(countryFromUrl)
  const [filterCurrency, setFilterCurrency] = useState(currencyFromUrl)

  const load = () => {
    setLoading(true)
    propertiesApi.list({ page: 1, limit: FETCH_LIMIT })
      .then((r) => setList(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    setFilterCountry(countryFromUrl)
    setFilterCurrency(currencyFromUrl)
  }, [countryFromUrl, currencyFromUrl])

  useEffect(() => {
    if (searchParams.get('onboarding') === 'new') {
      setEditing(null)
      setShowForm(true)
    }
  }, [searchParams])

  const filteredList = list.filter(
    (p) => (!filterCountry || p.country === filterCountry) && (!filterCurrency || p.currency === filterCurrency)
  )

  const handleSaved = () => {
    const next = searchParams.get('next')
    setShowForm(false)
    setEditing(null)

    if (next === 'tenant') {
      navigate('/tenants?onboarding=new&next=lease')
      return
    }

    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev)
      nextParams.delete('onboarding')
      nextParams.delete('next')
      return nextParams
    })
    load()
  }

  const handleEdit = (p: Property) => {
    setEditing(p)
    setShowForm(true)
  }

  const columns: DataTableColumn<Property>[] = [
    {
      key: 'name',
      label: 'Name',
      searchable: true,
      render: (p) => (
        <Link to={`/properties/${p.id}`} className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
          {p.name}
        </Link>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      searchable: true,
      render: (p) => <span className="text-slate-600">{p.address ?? '–'}</span>,
    },
    {
      key: 'country',
      label: 'Country',
      searchable: true,
      render: (p) => <span className="badge badge-neutral">{p.country}</span>,
    },
    {
      key: 'currency',
      label: 'Currency',
      searchable: true,
      render: (p) => <span className="font-medium">{p.currency}</span>,
    },
    {
      key: 'unitNo',
      label: 'Unit no',
      sortable: true,
      getSortValue: (p) => (p.unitNo ?? '').toString(),
      render: (p) => <span className="text-slate-600">{p.unitNo ?? '–'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (p) => (
        <button type="button" onClick={() => handleEdit(p)} className="text-sm font-medium text-indigo-600 hover:underline">
          Edit
        </button>
      ),
    },
  ]

  const extraToolbar = (
    <>
      <select
        value={filterCountry}
        onChange={(e) => {
          const v = e.target.value
          setFilterCountry(v)
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            if (v) next.set('country', v)
            else next.delete('country')
            return next
          })
        }}
        aria-label="Filter by country"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <option value="">All countries</option>
        <option value="IN">India</option>
        <option value="AE">UAE</option>
      </select>
      <select
        value={filterCurrency}
        onChange={(e) => {
          const v = e.target.value
          setFilterCurrency(v)
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            if (v) next.set('currency', v)
            else next.delete('currency')
            return next
          })
        }}
        aria-label="Filter by currency"
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
      >
        <option value="">All currencies</option>
        <option value="INR">INR</option>
        <option value="AED">AED</option>
      </select>
    </>
  )

  return (
    <div>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Properties</h1>
          <p className="text-slate-500">Manage your properties and units</p>
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
          onSaved={handleSaved}
          onCancel={() => {
          setShowForm(false)
          setEditing(null)
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
        <DataTable<Property>
          data={filteredList}
          columns={columns}
          idKey="id"
          searchPlaceholder="Search by name or address..."
          extraToolbar={extraToolbar}
          emptyMessage="No properties yet. Click “+ Add property” to create your first one."
        />
      )}
    </div>
  )
}
