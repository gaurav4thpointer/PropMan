import { Link } from 'react-router-dom'

interface OnboardingDashboardProps {
  onDismiss?: () => void
}

export default function OnboardingDashboard({ onDismiss }: OnboardingDashboardProps) {
  const steps = [
    {
      id: 1,
      title: 'Add your first property',
      description: 'Start by adding at least one property so we know where your rent is coming from.',
      actionLabel: 'Add property',
      to: '/properties?onboarding=new&next=tenant',
    },
    {
      id: 2,
      title: 'Add a tenant',
      description: 'Create a tenant record so you can attach leases and payments to real people.',
      actionLabel: 'Add tenant',
      to: '/tenants?onboarding=new&next=lease',
    },
    {
      id: 3,
      title: 'Create a lease',
      description: 'Connect a property and tenant, set rent, and we will track schedules and overdue rent for you.',
      actionLabel: 'Create lease',
      to: '/leases?onboarding=new',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 px-5 py-6 sm:px-7 sm:py-7">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-500">
              Getting started
            </p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Set up your rental portfolio in a few steps
            </h1>
            <p className="max-w-2xl text-xs text-slate-600 sm:text-sm">
              Add your first property, tenant, and lease so PropMan can start tracking rent, payments, and overdue amounts for you.
            </p>

            <div className="mt-3 flex flex-wrap gap-2.5">
              <Link
                to="/properties"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                + Add your first property
              </Link>
              <Link
                to="/reports"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-indigo-200 hover:text-indigo-700 sm:px-4 sm:py-2.5 sm:text-sm"
              >
                See what PropMan can track →
              </Link>
            </div>
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-full border border-transparent px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:bg-white/70 hover:text-slate-700"
            >
              Skip for now
            </button>
          )}
        </div>
      </section>

      {/* Checklist */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">
          Get set up in 3 steps
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
                  {step.id}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-600 sm:text-sm">{step.description}</p>
              </div>
              <div className="mt-4">
                <Link
                  to={step.to}
                  className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline sm:text-sm"
                >
                  {step.actionLabel} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Helpful tips */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 sm:p-5">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Tips for getting started</h2>
        <ul className="space-y-1 text-xs text-slate-600 sm:text-sm">
          <li>• Start with one real property and one lease – you can always add old history later.</li>
          <li>• Use descriptive property names (e.g. &quot;Sunrise Apartments – 2BHK #201&quot;).</li>
          <li>• Once leases are in, the dashboard will show expected vs. received rent automatically.</li>
        </ul>
      </section>
    </div>
  )
}
