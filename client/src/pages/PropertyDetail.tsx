import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { properties, units } from '../api/client'
import type { Property, Unit } from '../api/types'
import UnitForm from '../components/UnitForm'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const [property, setProperty] = useState<Property | null>(null)
  const [unitsList, setUnitsList] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showUnitForm, setShowUnitForm] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

  useEffect(() => {
    if (!id) return
    setLoadError(null)
    Promise.all([
      properties.get(id).then((r) => r.data),
      units.list(id).then((r) => r.data.data),
    ])
      .then(([p, u]) => {
        setProperty(p)
        setUnitsList(u ?? [])
      })
      .catch((err) => {
        setProperty(null)
        setUnitsList([])
        setLoadError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load property')
      })
      .finally(() => setLoading(false))
  }, [id])

  const refreshUnits = () => {
    if (!id) return
    units.list(id!).then((r) => setUnitsList(r.data.data))
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }
  if (loadError || !property) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="font-medium">{loadError ?? 'Property not found'}</p>
        <Link to="/properties" className="mt-2 inline-block text-sm font-semibold text-rose-800 hover:underline">← Back to properties</Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/properties" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">← Properties</Link>
      <div className="card mb-8 overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50/50 px-6 py-5">
          <h1 className="text-2xl font-bold text-slate-800">{property.name}</h1>
          <p className="mt-1 text-slate-600">{property.address ?? '–'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge badge-neutral">{property.country}</span>
            <span className="badge badge-neutral">{property.currency}</span>
            {property.emirateOrState && <span className="badge badge-neutral">{property.emirateOrState}</span>}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Units</h2>
        <button type="button" onClick={() => { setEditingUnit(null); setShowUnitForm(true) }} className="btn-primary text-sm">
          + Add unit
        </button>
      </div>
      {showUnitForm && id && (
        <UnitForm
          propertyId={id}
          unit={editingUnit ?? undefined}
          onSaved={() => { setShowUnitForm(false); setEditingUnit(null); refreshUnits() }}
          onCancel={() => { setShowUnitForm(false); setEditingUnit(null) }}
        />
      )}
      <div className="table-wrapper">
        <table className="min-w-full">
          <thead>
            <tr>
              <th>Unit no</th>
              <th>Bedrooms</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {unitsList.map((u) => (
              <tr key={u.id}>
                <td className="font-semibold text-slate-800">{u.unitNo}</td>
                <td className="text-slate-600">{u.bedrooms ?? '–'}</td>
                <td>
                  <span className={u.status === 'OCCUPIED' ? 'badge badge-success' : 'badge badge-neutral'}>
                    {u.status}
                  </span>
                </td>
                <td className="text-right">
                  <button type="button" onClick={() => { setEditingUnit(u); setShowUnitForm(true) }} className="text-sm font-medium text-indigo-600 hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {unitsList.length === 0 && <p className="px-5 py-12 text-center text-slate-500">No units. Add one above.</p>}
      </div>
    </div>
  )
}
