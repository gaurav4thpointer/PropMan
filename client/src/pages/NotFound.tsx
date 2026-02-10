import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-indigo-100">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-800">Page not found</h1>
        <p className="mt-2 text-slate-600">
          The link you followed may be broken or the page doesn’t exist.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
        >
          Go to home
        </Link>
      </div>
    </div>
  )
}
