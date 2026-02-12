import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { owners } from '../api/client'
import type { OwnerWithProperties, Property } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { formatPropertyCode } from '../utils/ids'

const COUNTRY_LABELS: Record<string, string> = {
  IN: 'India',
  AE: 'UAE',
  US: 'United States',
  GB: 'United Kingdom',
  SG: 'Singapore',
  SA: 'Saudi Arabia',
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export default function OwnerDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [owner, setOwner] = useState<OwnerWithProperties | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoadError(null)
    setLoading(true)
    owners
      .get(id)
      .then((r) => setOwner(r.data))
      .catch((err) => {
        setOwner(null)
        const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
        setLoadError(Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Failed to load owner')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (user?.role !== 'PROPERTY_MANAGER') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <p className="font-medium">Only property managers can access this page.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading owner...</p>
        </div>
      </div>
    )
  }

  if (loadError || !owner) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="font-medium">{loadError ?? 'Owner not found'}</p>
        <Link to="/owners" className="mt-2 inline-block text-sm font-semibold text-rose-800 hover:underline">
          ← Back to owners
        </Link>
      </div>
    )
  }

  const displayName = owner.name || owner.email
  const properties = owner.properties ?? []

  return (
    <div className="space-y-8">
      <Link to="/owners" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
        ← Owners
      </Link>

      {/* Owner info card */}
      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-violet-50/50 px-5 py-6 sm:px-7">
          <h1 className="text-2xl font-bold text-slate-800">{displayName}</h1>
          <p className="mt-1 text-slate-600">{owner.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-3 lg:grid-cols-4">
          <div className="bg-white px-4 py-3.5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{owner.email}</p>
          </div>
          <div className="bg-white px-4 py-3.5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Mobile</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{owner.mobile || '—'}</p>
          </div>
          <div className="bg-white px-4 py-3.5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Onboarded</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{formatDate(owner.createdAt)}</p>
          </div>
          <div className="bg-white px-4 py-3.5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Properties</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{properties.length}</p>
          </div>
        </div>
      </div>

      {/* Properties list */}
      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-800">Properties</h2>
          <p className="mt-1 text-sm text-slate-500">Properties managed for this owner</p>
        </div>
        {properties.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            <p className="font-medium">No properties yet</p>
            <p className="mt-1 text-sm">Add a property from the Properties page and assign it to this owner.</p>
            <Link to={`/properties?onboarding=new&ownerId=${owner.id}`} className="mt-4 inline-block btn-primary">
              Add property
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 sm:px-6">Property</th>
                  <th className="px-4 py-3 sm:px-6">Country</th>
                  <th className="px-4 py-3 sm:px-6">Currency</th>
                  <th className="px-4 py-3 sm:px-6">Status</th>
                  <th className="px-4 py-3 sm:px-6">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((p: Property) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-800 sm:px-6">
                      <Link
                        to={`/properties/${p.id}`}
                        className="text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        {p.name}
                      </Link>
                      {p.address && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">{p.address}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 sm:px-6">{COUNTRY_LABELS[p.country] ?? p.country}</td>
                    <td className="px-4 py-3 text-slate-600 sm:px-6">{p.currency}</td>
                    <td className="px-4 py-3 sm:px-6">
                      {p.status ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            p.status === 'OCCUPIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 sm:px-6">
                      {formatPropertyCode(p.id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
