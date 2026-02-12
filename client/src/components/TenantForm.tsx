import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { tenants, owners } from '../api/client'
import type { Tenant, Owner } from '../api/types'
import { useAuth } from '../context/AuthContext'
import OwnerForm from './OwnerForm'

function getApiMessage(err: unknown): string {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : (err as Error)?.message ?? 'Something went wrong'
}

const schema = z.object({
  ownerId: z.string().optional(),
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
  inline,
}: {
  tenant?: Tenant
  onSaved: () => void
  onCancel: () => void
  onSavedWithNew?: (tenant: Tenant) => void
  inline?: boolean
}) {
  const { user } = useAuth()
  const isManager = user?.role === 'PROPERTY_MANAGER'
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [managedOwners, setManagedOwners] = useState<Owner[]>([])
  const [showAddOwner, setShowAddOwner] = useState(false)

  useEffect(() => {
    if (isManager && !tenant) {
      owners.list({ page: 1, limit: 100 }).then((r) => {
        setManagedOwners(r.data?.data ?? [])
      }).catch(() => {})
    }
  }, [isManager, tenant])

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
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
        if (isManager) {
          if (!data.ownerId) {
            setApiError('Please select or create an owner')
            setSubmitting(false)
            return
          }
          payload.ownerId = data.ownerId
        }
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
      {(() => {
        const Wrapper = inline ? 'div' : 'form'
        const wrapperProps = inline ? {} : { onSubmit: handleSubmit(onSubmit) }
        return (
          <Wrapper {...(wrapperProps as React.HTMLAttributes<HTMLElement>)} className="space-y-4">
            {isManager && !tenant && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Owner *</label>
                  <button
                    type="button"
                    onClick={() => setShowAddOwner(true)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    + Add new owner
                  </button>
                </div>
                <select {...register('ownerId', { required: true })} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="">Select owner</option>
                  {managedOwners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name || o.email} ({o.email})
                    </option>
                  ))}
                </select>
                {errors.ownerId && <p className="text-red-600 text-sm mt-1">Owner is required</p>}
                {showAddOwner && (
                  <div className="mt-3">
                    <OwnerForm
                      inline
                      onSaved={() => setShowAddOwner(false)}
                      onCancel={() => setShowAddOwner(false)}
                      onSavedWithNew={(owner) => {
                        setManagedOwners((prev) => [...prev, owner])
                        setValue('ownerId', owner.id)
                        setShowAddOwner(false)
                      }}
                    />
                  </div>
                )}
              </div>
            )}
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
              <button
                type={inline ? 'button' : 'submit'}
                onClick={inline ? handleSubmit(onSubmit) : undefined}
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={onCancel} className="btn-secondary" disabled={submitting}>Cancel</button>
            </div>
          </Wrapper>
        )
      })()}
    </div>
  )
}
