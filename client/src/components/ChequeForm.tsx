import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cheques, leases } from '../api/client'
import type { Lease } from '../api/types'
import { isLeaseExpired } from '../utils/lease'

const schema = z.object({
  leaseId: z.string().uuid(),
  chequeNumber: z.string().min(1),
  bankName: z.string().min(1),
  chequeDate: z.string().min(1),
  amount: z.coerce.number().min(0),
  coversPeriod: z.string().min(1),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function ChequeForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [leasesList, setLeasesList] = useState<Lease[]>([])
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null)
  const [leasesLoading, setLeasesLoading] = useState(true)
  const [leasesError, setLeasesError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  })

  const leaseId = watch('leaseId')

  useEffect(() => {
    setLeasesLoading(true)
    setLeasesError(null)
    leases
      .list({ page: 1, limit: 100 })
      .then((r) => {
        const list = r.data?.data ?? r.data
        setLeasesList(Array.isArray(list) ? list : [])
      })
      .catch((err) => {
        setLeasesList([])
        setLeasesError(err.response?.data?.message ?? err.message ?? 'Failed to load leases')
      })
      .finally(() => setLeasesLoading(false))
  }, [])

  useEffect(() => {
    if (!leaseId) {
      setSelectedLease(null)
      return
    }
    const l = leasesList.find((x) => x.id === leaseId)
    setSelectedLease(l ?? null)
  }, [leaseId, leasesList])

  const onSubmit = async (data: FormData): Promise<void> => {
    if (!selectedLease) return
    setApiError(null)
    setSubmitting(true)
    try {
      await cheques.create({
        ...data,
        tenantId: selectedLease.tenantId,
        propertyId: selectedLease.propertyId,
      })
      onSaved()
    } catch (err) {
      const res = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      setApiError(Array.isArray(res) ? res.join('. ') : typeof res === 'string' ? res : (err as Error)?.message ?? 'Failed to save cheque')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card mb-8 max-w-xl p-6">
      <h2 className="mb-5 text-lg font-bold text-slate-800">New cheque (PDC)</h2>
      {apiError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{apiError}</div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Lease *</label>
          <select {...register('leaseId')} className="w-full rounded-lg border border-slate-300 px-3 py-2" disabled={leasesLoading}>
            <option value="">{leasesLoading ? 'Loading leases...' : 'Select lease'}</option>
            {leasesList.map((l) => (
              <option key={l.id} value={l.id}>
                {[l.property?.name, l.property?.unitNo, l.tenant?.name].filter(Boolean).join(' / ') || l.id}
                {isLeaseExpired(l.endDate) ? ' (Expired)' : ''}
              </option>
            ))}
          </select>
          {leasesError && <p className="text-amber-600 text-sm mt-1">{leasesError}</p>}
          {!leasesError && leasesList.length === 0 && !leasesLoading && (
            <p className="text-slate-500 text-sm mt-1">No leases found. Create a lease first.</p>
          )}
          {errors.leaseId && <p className="text-red-600 text-sm mt-1">{errors.leaseId.message}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cheque number *</label>
            <input {...register('chequeNumber')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.chequeNumber && <p className="text-red-600 text-sm mt-1">{errors.chequeNumber.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bank name *</label>
            <input {...register('bankName')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.bankName && <p className="text-red-600 text-sm mt-1">{errors.bankName.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cheque date *</label>
            <input type="date" {...register('chequeDate')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.chequeDate && <p className="text-red-600 text-sm mt-1">{errors.chequeDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
            <input type="number" step="0.01" {...register('amount')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
            {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Covers period *</label>
          <input {...register('coversPeriod')} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="e.g. Feb 2026 Rent" />
          {errors.coversPeriod && <p className="text-red-600 text-sm mt-1">{errors.coversPeriod.message}</p>}
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
