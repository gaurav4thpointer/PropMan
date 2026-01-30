import { useEffect, useState } from 'react'
import { tenants as tenantsApi } from '../api/client'
import type { Tenant } from '../api/types'
import TenantForm from '../components/TenantForm'

export default function Tenants() {
  const [list, setList] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Tenant | null>(null)

  const load = () => {
    setLoading(true)
    tenantsApi.list({ page, limit: 20 })
      .then((r) => {
        setList(r.data.data)
        setTotalPages(r.data.meta.totalPages)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page])

  const handleSaved = () => {
    setShowForm(false)
    setEditing(null)
    load()
  }

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
          onCancel={() => { setShowForm(false); setEditing(null) }}
        />
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td className="font-semibold text-slate-800">{t.name}</td>
                  <td className="text-slate-600">{t.phone ?? '–'}</td>
                  <td className="text-slate-600">{t.email ?? '–'}</td>
                  <td className="text-right">
                    <button type="button" onClick={() => { setEditing(t); setShowForm(true) }} className="text-sm font-medium text-indigo-600 hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="px-5 py-12 text-center text-slate-500">No tenants yet.</p>}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-sm disabled:opacity-50">Previous</button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
