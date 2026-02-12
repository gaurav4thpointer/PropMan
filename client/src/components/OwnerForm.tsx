import { useState } from 'react'
import { owners } from '../api/client'
import type { Owner } from '../api/types'

function getApiMessage(err: unknown): string {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : (err as Error)?.message ?? 'Something went wrong'
}

export default function OwnerForm({
  onSaved,
  onCancel,
  onSavedWithNew,
  inline,
}: {
  onSaved: () => void
  onCancel: () => void
  onSavedWithNew?: (owner: Owner) => void
  inline?: boolean
}) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    setSubmitting(true)
    try {
      const { data } = await owners.create({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        mobile: form.mobile.trim() || undefined,
      })
      setForm({ name: '', email: '', password: '', mobile: '' })
      onSavedWithNew?.(data)
      onSaved()
    } catch (err) {
      setApiError(getApiMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={inline ? 'rounded-xl border border-slate-200 bg-slate-50/80 p-4' : 'space-y-4'}>
      <h2 className="mb-4 text-sm font-semibold text-slate-800">Create owner</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {apiError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {apiError}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Owner name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="owner@example.com"
          />
          <p className="mt-1 text-xs text-slate-500">If email exists, you will be linked to that owner.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password *</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={8}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Mobile</label>
          <input
            type="text"
            value={form.mobile}
            onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Optional"
          />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create owner'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
