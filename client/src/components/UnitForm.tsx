import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { units } from '../api/client'
import type { Unit } from '../api/types'
import type { UnitStatus } from '../api/types'

function getApiMessage(err: unknown): string {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : (err as Error)?.message ?? 'Something went wrong'
}

const schema = z.object({
  unitNo: z.string().min(1),
  bedrooms: z.coerce.number().min(0).optional(),
  status: z.enum(['VACANT', 'OCCUPIED']),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function UnitForm({
  propertyId,
  unit,
  onSaved,
  onCancel,
}: {
  propertyId: string
  unit?: Unit
  onSaved: () => void
  onCancel: () => void
}) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: unit
      ? { unitNo: unit.unitNo, bedrooms: unit.bedrooms ?? undefined, status: unit.status as UnitStatus, notes: unit.notes ?? '' }
      : { status: 'VACANT' },
  })

  const onSubmit = async (data: FormData) => {
    setApiError(null)
    setSubmitting(true)
    try {
      if (unit) {
        await units.update(unit.id, data)
      } else {
        await units.create(propertyId, data)
      }
      onSaved()
    } catch (err) {
      setApiError(getApiMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card mb-6 max-w-md p-6">
      <h3 className="mb-5 text-lg font-bold text-slate-800">{unit ? 'Edit unit' : 'New unit'}</h3>
      {apiError && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{apiError}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unit number *</label>
          <input {...register('unitNo')} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="e.g. 101" />
          {errors.unitNo && <p className="text-red-600 text-sm mt-1">{errors.unitNo.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bedrooms</label>
          <input type="number" {...register('bedrooms')} min={0} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select {...register('status')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="VACANT">Vacant</option>
            <option value="OCCUPIED">Occupied</option>
          </select>
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
