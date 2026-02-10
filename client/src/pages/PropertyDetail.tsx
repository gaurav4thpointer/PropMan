/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { properties } from '../api/client'
import type { Property } from '../api/types'
import { useAuth } from '../context/AuthContext'

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoadError(null)
    properties.get(id)
      .then((r) => {
        setProperty(r.data)
      })
      .catch((err) => {
        setProperty(null)
        const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
        setLoadError(Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Failed to load property')
      })
      .finally(() => setLoading(false))
  }, [id, user?.id])

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
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50/50 px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-slate-800">{property.name}</h1>
          <p className="mt-1 text-slate-600">{property.address ?? '–'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge badge-neutral">{property.country}</span>
            <span className="badge badge-neutral">{property.currency}</span>
            {property.emirateOrState && <span className="badge badge-neutral">{property.emirateOrState}</span>}
            {property.unitNo && <span className="badge badge-neutral">Unit {property.unitNo}</span>}
            {property.bedrooms != null && <span className="badge badge-neutral">{property.bedrooms} BHK</span>}
            {property.status && (
              <span className={property.status === 'OCCUPIED' ? 'badge badge-success' : 'badge badge-neutral'}>
                {property.status}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {id && (
          <>
            <Link to={`/leases?propertyId=${id}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900">
              View leases
            </Link>
            <Link to={`/cheques?propertyId=${id}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900">
              View cheques
            </Link>
            <Link to={`/payments?propertyId=${id}`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900">
              View payments
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
