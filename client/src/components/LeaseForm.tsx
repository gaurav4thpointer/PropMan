import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { leases, properties, tenants, units } from '../api/client'
import type { Property, Tenant } from '../api/types'
import PropertyForm from './PropertyForm'
import TenantForm from './TenantForm'
import UnitForm from './UnitForm'

const schema = z
  .object({
    propertyId: z.string().uuid(),
    unitId: z.string().uuid(),
    tenantId: z.string().uuid(),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    rentFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
    installmentAmount: z.coerce.number().min(0),
    dueDay: z.coerce.number().min(1).max(28),
    securityDeposit: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || new Date(data.endDate) >= new Date(data.startDate), {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })

type FormData = z.infer<typeof schema>

function getApiErrorMessage(err: unknown): string {
  const res = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  if (Array.isArray(res)) return res.join('. ')
  if (typeof res === 'string') return res
  return (err as Error)?.message ?? 'Something went wrong'
}

export default function LeaseForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [propertiesList, setPropertiesList] = useState<Property[]>([])
  const [tenantsList, setTenantsList] = useState<Tenant[]>([])
  const [unitsForProperty, setUnitsForProperty] = useState<{ id: string; unitNo: string }[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [showAddUnit, setShowAddUnit] = useState(false)
  const [showAddTenant, setShowAddTenant] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { rentFrequency: 'MONTHLY', dueDay: 5 },
  })

  const propertyId = watch('propertyId')

  useEffect(() => {
    properties.list({ limit: 100 }).then((r) => setPropertiesList(r.data.data))
    tenants.list({ limit: 100 }).then((r) => setTenantsList(r.data.data))
  }, [])

  useEffect(() => {
    if (!propertyId) {
      setUnitsForProperty([])
      setValue('unitId', '')
      return
    }
    units.list(propertyId, { limit: 100 }).then((r) => {
      setUnitsForProperty(r.data.data.map((u) => ({ id: u.id, unitNo: u.unitNo })))
      setValue('unitId', '')
    })
  }, [propertyId, setValue])

  const onSubmit = async (data: FormData) => {
    setApiError(null)
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        propertyId: data.propertyId,
        unitId: data.unitId,
        tenantId: data.tenantId,
        startDate: data.startDate,
        endDate: data.endDate,
        rentFrequency: data.rentFrequency,
        installmentAmount: Number(data.installmentAmount),
        dueDay: Number(data.dueDay),
      }
      const sd = data.securityDeposit
      if (sd != null && String(sd).trim() !== '' && !Number.isNaN(Number(sd))) {
        const n = Number(sd)
        if (n > 0) payload.securityDeposit = n
      }
      if (data.notes?.trim()) payload.notes = data.notes.trim()
      await leases.create(payload)
      onSaved()
    } catch (err) {
      setApiError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6 shadow-sm max-w-2xl">
      <h2 className="text-lg font-medium text-slate-800 mb-4">New lease</h2>
      {apiError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {apiError}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">Property *</label>
            <button
              type="button"
              onClick={() => setShowAddProperty(true)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              + Add new property
            </button>
          </div>
          <select {...register('propertyId')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select property</option>
            {propertiesList.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.propertyId && <p className="text-red-600 text-sm mt-1">{errors.propertyId.message}</p>}
          {showAddProperty && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <PropertyForm
                onSaved={() => setShowAddProperty(false)}
                onCancel={() => setShowAddProperty(false)}
                onSavedWithNew={(p) => {
                  setPropertiesList((prev) => [...prev, p])
                  setValue('propertyId', p.id)
                  setShowAddProperty(false)
                }}
              />
            </div>
          )}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">Unit *</label>
            {propertyId && (
              <button
                type="button"
                onClick={() => setShowAddUnit(true)}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                + Add new unit
              </button>
            )}
          </div>
          <select {...register('unitId')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select unit</option>
            {unitsForProperty.map((u) => (
              <option key={u.id} value={u.id}>{u.unitNo}</option>
            ))}
          </select>
          {errors.unitId && <p className="text-red-600 text-sm mt-1">{errors.unitId.message}</p>}
          {showAddUnit && propertyId && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <UnitForm
                propertyId={propertyId}
                onSaved={() => setShowAddUnit(false)}
                onCancel={() => setShowAddUnit(false)}
                onSavedWithNew={(u) => {
                  setUnitsForProperty((prev) => [...prev, { id: u.id, unitNo: u.unitNo }])
                  setValue('unitId', u.id)
                  setShowAddUnit(false)
                }}
              />
            </div>
          )}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">Tenant *</label>
            <button
              type="button"
              onClick={() => setShowAddTenant(true)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              + Add new tenant
            </button>
          </div>
          <select {...register('tenantId')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select tenant</option>
            {tenantsList.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {errors.tenantId && <p className="text-red-600 text-sm mt-1">{errors.tenantId.message}</p>}
          {showAddTenant && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <TenantForm
                onSaved={() => setShowAddTenant(false)}
                onCancel={() => setShowAddTenant(false)}
                onSavedWithNew={(t) => {
                  setTenantsList((prev) => [...prev, t])
                  setValue('tenantId', t.id)
                  setShowAddTenant(false)
                }}
              />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start date *</label>
            <input type="date" {...register('startDate')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End date *</label>
            <input type="date" {...register('endDate')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.endDate && <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rent frequency</label>
            <select {...register('rentFrequency')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Due day (1–28)</label>
            <input type="number" {...register('dueDay')} min={1} max={28} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.dueDay && <p className="text-red-600 text-sm mt-1">{errors.dueDay.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Installment amount *</label>
            <input type="number" step="0.01" {...register('installmentAmount')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.installmentAmount && <p className="text-red-600 text-sm mt-1">{errors.installmentAmount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Security deposit</label>
            <input type="number" step="0.01" {...register('securityDeposit')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create lease'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={submitting}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

