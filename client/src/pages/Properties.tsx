import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { properties as propertiesApi } from '../api/client'
import type { Property } from '../api/types'
import PropertyForm from '../components/PropertyForm'

export default function Properties() {
  const [list, setList] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Property | null>(null)

  const load = () => {
    setLoading(true)
    propertiesApi.list({ page, limit: 20 })
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

  const handleEdit = (p: Property) => {
    setEditing(p)
    setShowForm(true)
  }

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
                <th>Address</th>
                <th>Country</th>
                <th>Currency</th>
                <th>Units</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/properties/${p.id}`} className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="text-slate-600">{p.address ?? '–'}</td>
                  <td><span className="badge badge-neutral">{p.country}</span></td>
                  <td className="font-medium">{p.currency}</td>
                  <td>{p.units?.length ?? 0}</td>
                  <td className="text-right">
                    <button type="button" onClick={() => handleEdit(p)} className="text-sm font-medium text-indigo-600 hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className="px-5 py-12 text-center text-slate-500">No properties yet. Add one to get started.</p>
          )}
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
