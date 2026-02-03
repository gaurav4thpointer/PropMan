import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import { getLoginReturnUrl } from '../api/client'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Required'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const stateFrom = (location.state as { from?: { pathname: string } })?.from?.pathname
  const storedReturnUrl = getLoginReturnUrl()
  const from = stateFrom || storedReturnUrl || '/'

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const user = await login(data.email, data.password)
      navigate(user?.role === 'SUPER_ADMIN' ? '/admin' : from, { replace: true })
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.5px,transparent_0.5px),linear-gradient(to_bottom,#e2e8f0_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] opacity-50" aria-hidden />
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
              to="/register"
              state={{ from: location.state?.from ?? location }}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="mb-6 flex justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
                ₿
              </span>
            </div>
            <h1 className="text-center text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-center text-sm text-slate-500">Sign in to your portfolio</p>
            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  {...register('password')}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700"
              >
                Sign in
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-600">
              No account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
