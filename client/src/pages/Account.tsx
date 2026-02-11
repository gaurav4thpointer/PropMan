import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import { users } from '../api/client'

const genderOptions = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const
const profileSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional().or(z.literal('')),
  mobile: z.string().max(30).optional().or(z.literal('')),
  gender: z.enum(genderOptions).optional().or(z.literal('')),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

function getApiMessage(err: unknown): string {
  const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : (err as Error)?.message ?? 'Something went wrong'
}

export default function Account() {
  const { user, refreshUser } = useAuth()
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileFormData>,
    defaultValues: {
      email: user?.email ?? '',
      name: user?.name ?? '',
      mobile: user?.mobile ?? '',
      gender: '' as ProfileFormData['gender'],
    },
  })
  useEffect(() => {
    if (user) {
      const genderVal = user.gender && genderOptions.includes(user.gender as typeof genderOptions[number]) ? user.gender : ''
      profileForm.reset({
        email: user.email,
        name: user.name ?? '',
        mobile: user.mobile ?? '',
        gender: genderVal as ProfileFormData['gender'],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when user changes (e.g. after profile update)
  }, [user?.id, user?.email, user?.name, user?.mobile, user?.gender])

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema) as Resolver<PasswordFormData>,
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onUpdateProfile = async (data: ProfileFormData) => {
    setProfileError('')
    setProfileSuccess('')
    setUpdatingProfile(true)
    try {
      await users.updateProfile({
        email: data.email,
        name: data.name?.trim() ? data.name.trim() : undefined,
        mobile: data.mobile?.trim() ? data.mobile.trim() : undefined,
        gender: data.gender?.trim() ? (data.gender.trim() as ProfileFormData['gender']) : undefined,
      })
      await refreshUser()
      setProfileSuccess('Profile updated.')
    } catch (err) {
      setProfileError(getApiMessage(err))
    } finally {
      setUpdatingProfile(false)
    }
  }

  const onChangePassword = async (data: PasswordFormData) => {
    setPasswordError('')
    setPasswordSuccess('')
    setChangingPassword(true)
    try {
      await users.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword })
      setPasswordSuccess('Password updated.')
      passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordError(getApiMessage(err))
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div>
      <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">← Dashboard</Link>
      <h1 className="mb-2 text-2xl font-bold text-slate-800">Account</h1>
      <p className="mb-8 text-slate-500">Manage your profile and password</p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Profile</h2>
          <p className="mb-4 text-sm text-slate-600">Your email is used to sign in. Add your name, mobile and gender below.</p>
          {profileSuccess && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {profileError}
            </div>
          )}
          <form onSubmit={profileForm.handleSubmit((data) => onUpdateProfile(data as ProfileFormData))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                {...profileForm.register('email')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none"
                placeholder="you@example.com"
              />
              {profileForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                {...profileForm.register('name')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none"
                placeholder="Your name"
              />
              {profileForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
              <input
                type="tel"
                {...profileForm.register('mobile')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none"
                placeholder="+91 98765 43210"
              />
              {profileForm.formState.errors.mobile && (
                <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.mobile.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select {...profileForm.register('gender')} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none">
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={updatingProfile}>
              {updatingProfile ? 'Updating…' : 'Update profile'}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Change password</h2>
          <p className="mb-4 text-sm text-slate-600">Enter your current password and choose a new one.</p>
          {passwordSuccess && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {passwordError}
            </div>
          )}
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current password</label>
              <input
                type="password"
                {...passwordForm.register('currentPassword')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none"
                autoComplete="current-password"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
              <input
                type="password"
                {...passwordForm.register('newPassword')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none"
                autoComplete="new-password"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
              <input
                type="password"
                {...passwordForm.register('confirmPassword')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:outline-none"
                autoComplete="new-password"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <button type="submit" className="btn-primary" disabled={changingPassword}>
              {changingPassword ? 'Updating…' : 'Change password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
