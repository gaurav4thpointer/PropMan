import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-extrabold tracking-tight text-indigo-600/20">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">Page not found</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          The link you followed may be broken or the page doesn't exist.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
          >
            Go to dashboard
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}
