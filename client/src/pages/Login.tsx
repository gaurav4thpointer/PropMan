import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'

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
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const user = await login(data.email, data.password)
      navigate(user?.role === 'SUPER_ADMIN' ? '/admin' : from, { replace: true })
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-8 flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl text-white shadow-lg">
              ₿
            </span>
          </div>
          <h1 className="text-center text-2xl font-bold text-slate-800">Welcome back</h1>
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl"
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
          <p className="mt-2 text-center text-xs text-slate-500">
            Super admin? Use the same form — you’ll be redirected to the admin panel.
          </p>
        </div>
      </div>
    </div>
  )
}
