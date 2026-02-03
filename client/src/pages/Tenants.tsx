import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { tenants as tenantsApi } from '../api/client'
import type { Tenant } from '../api/types'
import TenantForm from '../components/TenantForm'
import DataTable, { type DataTableColumn } from '../components/DataTable'

const FETCH_LIMIT = 100

export default function Tenants() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [list, setList] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Tenant | null>(null)

  const load = () => {
    setLoading(true)
    tenantsApi.list({ page: 1, limit: FETCH_LIMIT })
      .then((r) => setList(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (searchParams.get('onboarding') === 'new') {
      setEditing(null)
      setShowForm(true)
    }
  }, [searchParams])

  const handleSaved = () => {
    const next = searchParams.get('next')
    setShowForm(false)
    setEditing(null)

    if (next === 'lease') {
      navigate('/leases?onboarding=new')
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

  const columns: DataTableColumn<Tenant>[] = [
    {
      key: 'name',
      label: 'Name',
      searchable: true,
      render: (t) => (
        <Link to={`/tenants/${t.id}`} className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
          {t.name}
        </Link>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      searchable: true,
      render: (t) => <span className="text-slate-600">{t.phone ?? '–'}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      searchable: true,
      render: (t) => <span className="text-slate-600">{t.email ?? '–'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (t) => (
        <span className="flex items-center justify-end gap-2">
          <Link to={`/tenants/${t.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
            View
          </Link>
          <button type="button" onClick={() => { setEditing(t); setShowForm(true) }} className="text-sm font-medium text-slate-600 hover:underline">
            Edit
          </button>
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tenants</h1>
          <p className="text-slate-500">Manage tenant contacts</p>
        </div>
        <button type="button" onClick={() => { setEditing(null); setShowForm(true) }} className="btn-primary shrink-0">
          + Add tenant
        </button>
      </div>

      {showForm && (
        <TenantForm
          tenant={editing ?? undefined}
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
        <DataTable<Tenant>
          data={list}
          columns={columns}
          idKey="id"
          searchPlaceholder="Search by name, email or phone..."
          emptyMessage="No tenants yet. Click “+ Add tenant” to add your first tenant."
        />
      )}
    </div>
  )
}
