import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { tenants } from '../api/client'
import type { Tenant } from '../api/types'

function getApiMessage(err: unknown): string {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : (err as Error)?.message ?? 'Something went wrong'
}

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  idNumber: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function TenantForm({
  tenant,
  onSaved,
  onCancel,
  onSavedWithNew,
}: {
  tenant?: Tenant
  onSaved: () => void
  onCancel: () => void
  onSavedWithNew?: (tenant: Tenant) => void
}) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: tenant
      ? { name: tenant.name, phone: tenant.phone ?? '', email: tenant.email ?? '', idNumber: tenant.idNumber ?? '', notes: tenant.notes ?? '' }
      : undefined,
  })

  const onSubmit = async (data: FormData) => {
    setApiError(null)
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = { ...data, email: data.email || undefined }
      if (tenant) {
        await tenants.update(tenant.id, payload)
      } else {
        const { data: created } = await tenants.create(payload as Partial<Tenant>)
        onSavedWithNew?.(created)
      }
      onSaved()
    } catch (err) {
      setApiError(getApiMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6 shadow-sm max-w-xl">
      <h2 className="text-lg font-medium text-slate-800 mb-4">{tenant ? 'Edit tenant' : 'New tenant'}</h2>
      {apiError && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{apiError}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
          <input {...register('name')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input {...register('phone')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" {...register('email')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ID number (Aadhaar / Emirates ID)</label>
          <input {...register('idNumber')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={submitting}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
