import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { properties } from '../api/client'
import type { Property, CreatePropertyPayload, Country, Currency } from '../api/types'

function getApiMessage(err: unknown): string {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : (err as Error)?.message ?? 'Something went wrong'
}

const schema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  country: z.enum(['IN', 'AE']),
  emirateOrState: z.string().optional(),
  currency: z.enum(['INR', 'AED']),
  notes: z.string().optional(),
  createFirstUnit: z.boolean().optional(),
  unitNo: z.string().optional(),
  unitBedrooms: z.number().int().min(0).optional(),
  unitStatus: z.enum(['VACANT', 'OCCUPIED']).optional(),
}).refine(
  (data) => !data.createFirstUnit || (data.unitNo && data.unitNo.trim().length > 0),
  { message: 'Unit number is required when creating first unit', path: ['unitNo'] },
)

type FormData = z.infer<typeof schema>

export default function PropertyForm({
  property,
  onSaved,
  onCancel,
}: {
  property?: Property
  onSaved: () => void
  onCancel: () => void
}) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: property
      ? {
          name: property.name,
          address: property.address ?? '',
          country: property.country as Country,
          emirateOrState: property.emirateOrState ?? '',
          currency: property.currency as Currency,
          notes: property.notes ?? '',
        }
      : { createFirstUnit: true, unitStatus: 'VACANT' },
  })

  const createFirstUnit = watch('createFirstUnit')

  const onSubmit = async (data: FormData) => {
    setApiError(null)
    setSubmitting(true)
    try {
      if (property) {
        await properties.update(property.id, {
          name: data.name,
          address: data.address,
          country: data.country,
          emirateOrState: data.emirateOrState,
          currency: data.currency,
          notes: data.notes,
        })
      } else {
        const payload: CreatePropertyPayload = {
          name: data.name,
          address: data.address,
          country: data.country,
          emirateOrState: data.emirateOrState,
          currency: data.currency,
          notes: data.notes,
        }
        if (data.createFirstUnit && data.unitNo?.trim()) {
          const bedrooms = data.unitBedrooms
          const bedroomsFinal = bedrooms != null && Number.isInteger(bedrooms) && bedrooms >= 0 ? bedrooms : undefined
          payload.firstUnit = {
            unitNo: data.unitNo.trim(),
            bedrooms: bedroomsFinal,
            status: data.unitStatus ?? 'VACANT',
          }
        }
        await properties.create(payload)
      }
      onSaved()
    } catch (err) {
      setApiError(getApiMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card mb-8 p-6">
      <h2 className="mb-5 text-lg font-bold text-slate-800">{property ? 'Edit property' : 'New property'}</h2>
      {apiError && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{apiError}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Name *</label>
          <input {...register('name')} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none transition-all duration-200" placeholder="Property name" />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
          <input {...register('address')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
            <select {...register('country')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="IN">India</option>
              <option value="AE">UAE</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
            <select {...register('currency')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="INR">INR</option>
              <option value="AED">AED</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">State / Emirate</label>
          <input {...register('emirateOrState')} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="e.g. Maharashtra or Dubai" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <textarea {...register('notes')} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>

        {!property && (
          <>
            <div className="border-t border-slate-200 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('createFirstUnit')} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-semibold text-slate-700">Create first unit</span>
              </label>
              <p className="mt-1 text-xs text-slate-500">Add one unit now (e.g. 101, A-1). You can add more later.</p>
            </div>
            {createFirstUnit && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Unit number *</label>
                  <input {...register('unitNo')} placeholder="e.g. 101, A-1" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                  {errors.unitNo && <p className="mt-1 text-sm text-red-600">{errors.unitNo.message}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Bedrooms</label>
                  <input type="number" min={0} step={1} {...register('unitBedrooms', { setValueAs: (v) => (v === '' || v === undefined ? undefined : Number(v)) })} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="0" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                  <select {...register('unitStatus')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="VACANT">Vacant</option>
                    <option value="OCCUPIED">Occupied</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={submitting}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
