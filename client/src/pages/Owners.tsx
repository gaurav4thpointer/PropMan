import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { owners } from '../api/client'
import type { Owner } from '../api/types'
import { useAuth } from '../context/AuthContext'

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

function getInitials(owner: Owner): string {
  if (owner.name?.trim()) {
    const parts = owner.name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return owner.name.slice(0, 2).toUpperCase()
  }
  return owner.email.slice(0, 2).toUpperCase()
}

function getApiMessage(err: unknown): string {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : (err as Error)?.message ?? 'Something went wrong'
}

export default function Owners() {
  const { user } = useAuth()
  const [list, setList] = useState<Owner[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', mobile: '' })

  const load = useCallback((page = 1) => {
    setLoading(true)
    owners
      .list({ page, limit: 20, search: search.trim() || undefined })
      .then((r) => {
        setList(r.data?.data ?? [])
        setMeta(r.data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 0 })
      })
      .catch(() => {
        setList([])
        setMeta({ total: 0, page: 1, limit: 20, totalPages: 0 })
      })
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => {
    load(1)
  }, [load])

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    setAddSubmitting(true)
    try {
      await owners.create({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        mobile: addForm.mobile.trim() || undefined,
      })
      setAddForm({ name: '', email: '', password: '', mobile: '' })
      setShowAddForm(false)
      load(meta.page)
    } catch (err) {
      setAddError(getApiMessage(err))
    } finally {
      setAddSubmitting(false)
    }
  }

  if (user?.role !== 'PROPERTY_MANAGER') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <p className="font-medium">Only property managers can access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Owners</h1>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="btn-primary shrink-0"
        >
          Onboard owner
        </button>
      </div>

      {showAddForm && (
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Onboard new owner</h2>
          <form onSubmit={handleAddOwner} className="space-y-4 max-w-md">
            {addError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {addError}
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                placeholder="Owner name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                placeholder="owner@example.com"
              />
              <p className="mt-1 text-xs text-slate-500">If email exists, you will be linked to that owner.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password *</label>
              <input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mobile</label>
              <input
                type="text"
                value={addForm.mobile}
                onChange={(e) => setAddForm((f) => ({ ...f, mobile: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={addSubmitting}>
                {addSubmitting ? 'Creating…' : 'Create owner'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setAddError('') }}
                className="btn-secondary"
                disabled={addSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-6">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search owners..."
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 sm:max-w-xs"
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : list.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            {search ? 'No owners match your search.' : 'No owners yet. Onboard an owner to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 sm:px-6">Owner</th>
                  <th className="px-4 py-3 sm:px-6">Contact</th>
                  <th className="px-4 py-3 sm:px-6">Properties</th>
                  <th className="px-4 py-3 sm:px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getInitialColor(o.name || o.email)}`}
                        >
                          {getInitials(o)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/owners/${o.id}`}
                            className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                          >
                            {o.name || o.email}
                          </Link>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{o.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 sm:px-6">
                      <div className="space-y-0.5">
                        {o.mobile && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span>{o.mobile}</span>
                          </div>
                        )}
                        {!o.mobile && <span className="text-xs text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {(o as Owner & { propertyCount?: number }).propertyCount ?? 0} properties
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <Link
                        to={`/owners/${o.id}`}
                        className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-6">
            <p className="text-sm text-slate-500">
              Page {meta.page} of {meta.totalPages} ({meta.total} owners)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => load(meta.page - 1)}
                disabled={meta.page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => load(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
