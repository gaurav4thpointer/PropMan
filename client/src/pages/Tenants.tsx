/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { tenants as tenantsApi } from '../api/client'
import type { Tenant } from '../api/types'
import TenantForm from '../components/TenantForm'
import DataTable, { type DataTableColumn } from '../components/DataTable'
import { ArchivedBadge, ArchiveToggle } from '../components/ArchiveDeleteMenu'

const FETCH_LIMIT = 100

const INITIAL_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-fuchsia-100 text-fuchsia-700',
]

function getInitialColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function Tenants() {
  const [list, setList] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Tenant | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const load = () => {
    setLoading(true)
    tenantsApi.list({ page: 1, limit: FETCH_LIMIT, includeArchived: showArchived || undefined })
      .then((r) => setList(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [showArchived])

  const handleSaved = () => {
    setShowForm(false)
    setEditing(null)
    load()
  }

  const columns: DataTableColumn<Tenant>[] = [
    {
      key: 'name',
      label: 'Tenant',
      searchable: true,
      getSearchValue: (t) => `${t.name} ${t.idNumber ?? ''}`.trim(),
      render: (t) => (
        <div className={`flex items-center gap-3 ${t.archivedAt ? 'opacity-60' : ''}`}>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getInitialColor(t.name)}`}
          >
            {getInitials(t.name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center">
              <Link
                to={`/tenants/${t.id}`}
                className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                {t.name}
              </Link>
              {t.archivedAt && <ArchivedBadge />}
            </div>
            {t.idNumber && (
              <p className="mt-0.5 truncate text-xs text-slate-400">ID: {t.idNumber}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      searchable: true,
      getSearchValue: (t) => `${t.phone ?? ''} ${t.email ?? ''}`.trim(),
      render: (t) => (
        <div className="space-y-0.5">
          {t.phone && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span>{t.phone}</span>
            </div>
          )}
          {t.email && (
            <div className="flex items-center gap-1.5 text-sm text-slate-600">
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="truncate">{t.email}</span>
            </div>
          )}
          {!t.phone && !t.email && (
            <span className="text-xs text-slate-400">No contact info</span>
          )}
        </div>
      ),
    },
    {
      key: 'related',
      label: 'Navigate to',
      sortable: false,
      render: (t) => (
        <div className="flex items-center gap-2 text-xs">
          <Link
            to={`/leases?tenantId=${t.id}`}
            className="rounded-lg bg-indigo-50 px-2 py-1 font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
          >
            Leases
          </Link>
          <Link
            to={`/payments?tenantId=${t.id}`}
            className="rounded-lg bg-slate-50 px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Payments
          </Link>
          <Link
            to={`/cheques?tenantId=${t.id}`}
            className="rounded-lg bg-slate-50 px-2 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Cheques
          </Link>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          {!t.archivedAt && (
            <button
              type="button"
              onClick={() => { setEditing(t); setShowForm(true) }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              Edit
            </button>
          )}
          {t.archivedAt ? (
            <button
              type="button"
              onClick={() => handleRestore(t.id)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleArchive(t.id)}
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

  const handleArchive = async (id: string) => {
    try { await tenantsApi.archive(id); load() } catch { /* */ }
  }
  const handleRestore = async (id: string) => {
    try { await tenantsApi.restore(id); load() } catch { /* */ }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tenants</h1>
          <p className="text-slate-500">Manage tenant contacts and relationships</p>
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
          }}
        />
      )}

      {/* Summary stats */}
      {!loading && list.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Tenants</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{list.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">With Phone</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {list.filter((t) => t.phone).length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">With Email</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {list.filter((t) => t.email).length}
            </p>
          </div>
        </div>
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
          searchPlaceholder="Search by name, phone, email or ID..."
          extraToolbar={<ArchiveToggle showArchived={showArchived} onChange={setShowArchived} />}
          emptyMessage="No tenants yet. Click &quot;+ Add tenant&quot; to add your first tenant."
        />
      )}
    </div>
  )
}
