import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { payments, leases } from '../api/client'
import type { Lease } from '../api/types'
import { isLeaseExpired } from '../utils/lease'

const schema = z.object({
  leaseId: z.string().min(1, 'Please select a lease').uuid('Please select a lease'),
  date: z.string().min(1),
  amount: z.coerce.number().min(0),
  method: z.enum(['CHEQUE', 'BANK_TRANSFER', 'UPI', 'CASH']),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function PaymentForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [leasesList, setLeasesList] = useState<Lease[]>([])
  const [leasesError, setLeasesError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { method: 'BANK_TRANSFER' },
  })

  const leaseId = watch('leaseId')

  useEffect(() => {
    leases.list({ limit: 100 })
      .then((r) => { setLeasesList(r.data.data); setLeasesError(null) })
      .catch(() => { setLeasesList([]); setLeasesError('Failed to load leases') })
  }, [])

  const selectedLease = leaseId ? leasesList.find((l) => l.id === leaseId) : null

  const onSubmit = async (data: FormData) => {
    if (!selectedLease) return
    setApiError(null)
    setSubmitting(true)
    try {
      await payments.create({
        ...data,
        tenantId: selectedLease.tenantId,
        propertyId: selectedLease.propertyId,
        unitId: selectedLease.unitId,
        reference: data.reference || undefined,
        notes: data.notes || undefined,
      })
      onSaved()
    } catch (err) {
      const res = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      setApiError(Array.isArray(res) ? res.join('. ') : typeof res === 'string' ? res : (err as Error)?.message ?? 'Failed to save payment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card mb-8 max-w-xl p-6">
      <h2 className="mb-5 text-lg font-bold text-slate-800">New payment</h2>
      {apiError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{apiError}</div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Lease *</label>
          <select {...register('leaseId')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select lease</option>
            {leasesList.map((l) => (
              <option key={l.id} value={l.id}>
                {l.property?.name} / {l.unit?.unitNo} – {l.tenant?.name}
                {isLeaseExpired(l.endDate) ? ' (Expired)' : ''}
              </option>
            ))}
          </select>
          {leasesError && <p className="text-amber-600 text-sm mt-1">{leasesError}</p>}
          {errors.leaseId && <p className="text-red-600 text-sm mt-1">{errors.leaseId.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
            <input type="date" {...register('date')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
            <input type="number" step="0.01" {...register('amount')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Method *</label>
          <select {...register('method')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="CHEQUE">Cheque</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reference</label>
          <input {...register('reference')} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Bank ref, UPI ref, etc." />
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
