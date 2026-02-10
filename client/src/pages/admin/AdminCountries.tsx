import { useEffect, useState } from 'react'
import { admin } from '../../api/client'

type CountryRow = {
  code: string
  label: string
}

type CurrencyRow = {
  code: string
  label: string
}

const COUNTRY_LABELS: Record<string, string> = {
  IN: 'India',
  AE: 'United Arab Emirates',
  US: 'United States',
  GB: 'United Kingdom',
  SG: 'Singapore',
  SA: 'Saudi Arabia',
}

const CURRENCY_LABELS: Record<string, string> = {
  INR: 'Indian Rupee (₹)',
  AED: 'UAE Dirham (AED)',
  USD: 'US Dollar ($)',
  GBP: 'British Pound (£)',
  SGD: 'Singapore Dollar (S$)',
  SAR: 'Saudi Riyal (SAR)',
}

export default function AdminCountries() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enabledCountries, setEnabledCountries] = useState<string[]>([])
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>([])
  const [allCountries, setAllCountries] = useState<CountryRow[]>([])
  const [allCurrencies, setAllCurrencies] = useState<CurrencyRow[]>([])

  useEffect(() => {
    setLoading(true)
    admin
      .getCountries()
      .then((r) => {
        const data = r.data
        setEnabledCountries(data.enabledCountries ?? [])
        setEnabledCurrencies(data.enabledCurrencies ?? [])
        setAllCountries(
          (data.allCountries ?? []).map((code: string) => ({
            code,
            label: COUNTRY_LABELS[code] ?? code,
          })),
        )
        setAllCurrencies(
          (data.allCurrencies ?? []).map((code: string) => ({
            code,
            label: CURRENCY_LABELS[code] ?? code,
          })),
        )
      })
      .catch((err: { response?: { data?: { message?: string | string[] } } }) => {
        const m = err.response?.data?.message
        const msg = Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : 'Failed to load country configuration'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleCountry = (code: string) => {
    setEnabledCountries((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  const toggleCurrency = (code: string) => {
    setEnabledCurrencies((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  }

  const handleSave = () => {
    setSaving(true)
    setError(null)
    admin
      .updateCountries(enabledCountries, enabledCurrencies)
      .then(() => {
        // no-op, state already reflects saved values
      })
      .catch((err: { response?: { data?: { message?: string | string[] } } }) => {
        const m = err.response?.data?.message
        const msg = Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : 'Failed to save configuration'
        setError(msg)
      })
      .finally(() => setSaving(false))
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
          <p className="text-sm font-medium text-slate-400">Loading country configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Countries & currencies</h1>
      <p className="mb-4 text-slate-400">Choose which countries and currencies are available across the platform.</p>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/40 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">Countries</h2>
          <p className="mb-3 text-sm text-slate-400">Enabled countries will be available when creating properties and viewing reports.</p>
          <div className="space-y-2">
            {allCountries.map((c) => (
              <label key={c.code} className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-200">
                <div>
                  <span className="font-medium">{c.label}</span>
                  <span className="ml-2 text-xs text-slate-400">({c.code})</span>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                  checked={enabledCountries.includes(c.code)}
                  onChange={() => toggleCountry(c.code)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/40 p-5">
          <h2 className="mb-3 text-lg font-semibold text-white">Currencies</h2>
          <p className="mb-3 text-sm text-slate-400">Enabled currencies will be used for rent, cheques and payments.</p>
          <div className="space-y-2">
            {allCurrencies.map((c) => (
              <label key={c.code} className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-sm text-slate-200">
                <div>
                  <span className="font-medium">{c.label}</span>
                  <span className="ml-2 text-xs text-slate-400">({c.code})</span>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                  checked={enabledCurrencies.includes(c.code)}
                  onChange={() => toggleCurrency(c.code)}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

