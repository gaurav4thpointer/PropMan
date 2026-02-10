import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { properties, config } from '../api/client'
import type { Property, CreatePropertyPayload, Country, Currency } from '../api/types'

function getApiMessage(err: unknown): string {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : (err as Error)?.message ?? 'Something went wrong'
}

const schema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  country: z.enum(['IN', 'AE', 'US', 'GB', 'SG', 'SA']),
  emirateOrState: z.string().optional(),
  currency: z.enum(['INR', 'AED', 'USD', 'GBP', 'SGD', 'SAR']),
  unitNo: z.string().optional(),
  bedrooms: z.number().int().min(0).optional(),
  status: z.enum(['VACANT', 'OCCUPIED']).optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const DEFAULT_CURRENCY_BY_COUNTRY: Record<Country, Currency> = {
  IN: 'INR',
  AE: 'AED',
  US: 'USD',
  GB: 'GBP',
  SG: 'SGD',
  SA: 'SAR',
}

export default function PropertyForm({
  property,
  onSaved,
  onCancel,
  onSavedWithNew,
}: {
  property?: Property
  onSaved: () => void
  onCancel: () => void
  onSavedWithNew?: (property: Property) => void
}) {
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [availableCountries, setAvailableCountries] = useState<Country[]>(['IN', 'AE'])
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(['INR', 'AED'])

  useEffect(() => {
    config
      .getCountries()
      .then((r) => {
        const data = r.data
        const enabledCountries = (data.enabledCountries ?? []) as Country[]
        const enabledCurrencies = (data.enabledCurrencies ?? []) as Currency[]
        if (enabledCountries.length) setAvailableCountries(enabledCountries)
        if (enabledCurrencies.length) setAvailableCurrencies(enabledCurrencies)
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {})
  }, [])

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: property
      ? {
          name: property.name,
          address: property.address ?? '',
          country: property.country as Country,
          emirateOrState: property.emirateOrState ?? '',
          currency: property.currency as Currency,
          unitNo: property.unitNo ?? '',
          bedrooms: property.bedrooms ?? undefined,
          status: (property.status ?? 'VACANT') as 'VACANT' | 'OCCUPIED',
          notes: property.notes ?? '',
        }
      : { status: 'VACANT' },
  })

  // When country changes, default the currency to the typical one for that country (if enabled).
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name !== 'country') return
      const country = value.country as Country | undefined
      if (!country) return
      const defaultCurrency = DEFAULT_CURRENCY_BY_COUNTRY[country]
      if (!defaultCurrency) return
      if (!availableCurrencies.includes(defaultCurrency)) return
      setValue('currency', defaultCurrency)
    })
    return () => subscription.unsubscribe()
  }, [watch, setValue, availableCurrencies])

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
          unitNo: data.unitNo || undefined,
          bedrooms: data.bedrooms,
          status: data.status,
          notes: data.notes,
        })
      } else {
        const payload: CreatePropertyPayload = {
          name: data.name,
          address: data.address,
          country: data.country,
          emirateOrState: data.emirateOrState,
          currency: data.currency,
          unitNo: data.unitNo?.trim() || undefined,
          bedrooms: data.bedrooms,
          status: data.status,
          notes: data.notes,
        }
        const { data: created } = await properties.create(payload)
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
    <div className="card mb-8 p-6">
      <h2 className="mb-5 text-lg font-bold text-slate-800">{property ? 'Edit property' : 'New property'}</h2>
      {apiError && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{apiError}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Name *</label>
          <input {...register('name')} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none transition-all duration-200" placeholder="Property name" />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Unit number</label>
            <input {...register('unitNo')} placeholder="e.g. 101, A-1" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Bedrooms</label>
            <input type="number" min={0} step={1} {...register('bedrooms', { setValueAs: (v) => (v === '' || v === undefined ? undefined : Number(v)) })} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="0" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
            <select {...register('status')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="VACANT">Vacant</option>
              <option value="OCCUPIED">Occupied</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
          <input {...register('address')} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
            <select {...register('country')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {c === 'IN'
                    ? 'India'
                    : c === 'AE'
                    ? 'UAE'
                    : c === 'US'
                    ? 'United States'
                    : c === 'GB'
                    ? 'United Kingdom'
                    : c === 'SG'
                    ? 'Singapore'
                    : c === 'SA'
                    ? 'Saudi Arabia'
                    : c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
            <select {...register('currency')} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              {availableCurrencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={submitting}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
