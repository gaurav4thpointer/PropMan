import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Properties & units',
    description: "Track every property and unit in one place. See what's vacant or occupied at a glance.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    title: 'Leases & rent schedules',
    description: 'Create leases, auto-generate rent schedules, and attach documents. Early termination and due-day tracking.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: 'Post-dated cheques',
    description: 'Record PDCs, track status from received to deposited, cleared or bounced. Link replacement cheques.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    title: 'Dashboard & reports',
    description: 'Expected vs received rent, overdue amounts, expiring leases. Multiple currencies and rent frequencies supported.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.5px,transparent_0.5px),linear-gradient(to_bottom,#e2e8f0_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#fff_70%,transparent_110%)] opacity-60"
        aria-hidden
      />

      <header className="relative z-10 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-lg font-semibold text-slate-800 transition hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              ₿
            </span>
            <span>PropMan</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-20 pb-24 sm:px-6 sm:pt-28 sm:pb-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-indigo-600">
              Rental property management
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              One place for your{' '}
              <span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
                portfolio
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
              Properties, tenants, leases, post-dated cheques and payments. Track expected vs received rent, PDC status and documents — no more spreadsheets or scattered notes.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
              >
                Create free account
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>

        {/* Problem / Why */}
        <section className="border-t border-slate-200 bg-slate-50/80 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Stop juggling spreadsheets and sticky notes
              </h2>
              <p className="mt-4 text-slate-600">
                Most landlords track units, leases and cheques in different places. That means missed follow-ups, unclear cash flow, and no single view of what's due, paid or overdue. PropMan gives you one place to see it all.
              </p>
            </div>
            <ul className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
              {[
                'See which units are vacant or occupied at a glance',
                'Know exactly what rent is expected vs received each month',
                'Track every post-dated cheque from received to cleared or bounced',
                'Store lease documents and agreements in one place',
                'Spot overdue rent and expiring leases before they become problems',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  <span className="text-sm text-slate-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-200 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Everything you need to manage rentals
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              From vacancy status to cheque bounce tracking — all in one dashboard.
            </p>
            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ title, description, icon }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    {icon}
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-slate-200 bg-slate-50/80 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Get from signup to a clear view of your portfolio in a few steps.
            </p>
            <div className="mt-14 grid gap-8 sm:grid-cols-3">
              {[
                { step: '1', title: 'Add your properties', text: 'Create properties (one per rentable unit). Set unit number, bedrooms, status, currency and location so everything stays consistent.' },
                { step: '2', title: 'Add tenants and leases', text: 'Create tenants and leases with start and end dates, rent amount and due day. Rent schedules are generated automatically.' },
                { step: '3', title: 'Track cheques and payments', text: "Record post-dated cheques and update status as they're deposited or cleared. Log payments and match them to rent due." },
              ].map(({ step, title, text }) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                    {step}
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="border-t border-slate-200 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Built for landlords who want clarity
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Whether you own one property or several, PropMan keeps your rental income and obligations in one place.
            </p>
            <div className="mt-12 flex flex-wrap justify-center gap-6">
              {[
                { label: 'Individual landlords', desc: 'One account, one portfolio' },
                { label: 'Multiple properties', desc: 'Units and leases in one view' },
                { label: 'PDC-heavy workflows', desc: 'Track every cheque to cleared or bounced' },
                { label: 'Document storage', desc: 'Lease agreements and IDs attached to leases' },
              ].map(({ label, desc }) => (
                <div
                  key={label}
                  className="min-w-[200px] rounded-xl border border-slate-200 bg-white px-5 py-4 text-center shadow-sm"
                >
                  <p className="font-medium text-slate-900">{label}</p>
                  <p className="mt-1 text-sm text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-200 bg-slate-50/80 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Ready to simplify your rental tracking?
            </h2>
            <p className="mt-3 text-slate-600">
              Create an account and add your first property in minutes.
            </p>
            <div className="mt-8">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
              >
                Get started free
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <p className="text-sm text-slate-500">
                PropMan — rental property management for landlords.
              </p>
              <div className="flex gap-6">
<Link to="/login" className="text-sm text-indigo-600 transition hover:text-indigo-700">
                Log in
              </Link>
              <Link to="/register" className="text-sm text-indigo-600 transition hover:text-indigo-700">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
