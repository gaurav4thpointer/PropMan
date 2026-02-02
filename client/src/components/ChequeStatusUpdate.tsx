import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { cheques } from '../api/client'
import type { Cheque, ChequeStatus } from '../api/types'

const schema = z.object({
  status: z.enum(['DEPOSITED', 'CLEARED', 'BOUNCED', 'REPLACED']),
  depositDate: z.string().optional(),
  clearedOrBounceDate: z.string().optional(),
  bounceReason: z.string().optional(),
  replacedByChequeId: z.string().uuid().optional(),
})

type FormData = z.infer<typeof schema>

const NEXT_STATUS: Record<string, ChequeStatus[]> = {
  RECEIVED: ['DEPOSITED'],
  DEPOSITED: ['CLEARED', 'BOUNCED'],
  BOUNCED: ['REPLACED'],
}

export default function ChequeStatusUpdate({ cheque, onSaved, onCancel }: { cheque: Cheque; onSaved: () => void; onCancel: () => void }) {
  const [error, setError] = useState('')
  const options = NEXT_STATUS[cheque.status] ?? []

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: options[0] as FormData['status'] },
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await cheques.updateStatus(cheque.id, {
        status: data.status as ChequeStatus,
        depositDate: data.depositDate || undefined,
        clearedOrBounceDate: data.clearedOrBounceDate || undefined,
        bounceReason: data.bounceReason || undefined,
        replacedByChequeId: data.replacedByChequeId || undefined,
      })
      onSaved()
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : 'Update failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-bold text-slate-800">Update cheque status</h2>
        <p className="text-slate-600 text-sm mb-4">Cheque {cheque.chequeNumber} · Current: {cheque.status}</p>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New status</label>
            <select {...register('status')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              {options.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.status && <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deposit date</label>
            <input type="date" {...register('depositDate')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cleared / Bounce date</label>
            <input type="date" {...register('clearedOrBounceDate')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bounce reason (if bounced)</label>
            <input {...register('bounceReason')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Update</button>
          </div>
        </form>
      </div>
    </div>
  )
}
