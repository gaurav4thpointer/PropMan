import { useEffect, useState } from 'react'
import { admin } from '../../api/client'
import type { AdminUser } from '../../api/client'
import DataTable, { type DataTableColumn } from '../../components/DataTable'

const FETCH_LIMIT = 100

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [resetUser, setResetUser] = useState<AdminUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [sampleDataUser, setSampleDataUser] = useState<AdminUser | null>(null)
  const [addingSample, setAddingSample] = useState(false)
  const [sampleError, setSampleError] = useState<string | null>(null)

  const loadUsers = () => {
    setLoading(true)
    admin
      .users({ page: 1, limit: FETCH_LIMIT })
      .then((r) => setUsers(r.data.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const formatDate = (s: string) => new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })

  const handleOpenReset = (u: AdminUser) => {
    setResetUser(u)
    setNewPassword('')
    setConfirmPassword('')
    setResetError(null)
  }

  const handleCloseReset = () => {
    setResetUser(null)
    setNewPassword('')
    setConfirmPassword('')
    setResetError(null)
  }

  const handleSubmitReset = () => {
    if (!resetUser) return
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match')
      return
    }
    setResetError(null)
    setResetting(true)
    admin
      .resetPassword(resetUser.id, newPassword)
      .then(() => {
        handleCloseReset()
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        setResetError(err.response?.data?.message ?? 'Failed to reset password')
      })
      .finally(() => setResetting(false))
  }

  const handleOpenSampleData = (u: AdminUser) => {
    setSampleDataUser(u)
    setSampleError(null)
  }

  const handleCloseSampleData = () => {
    setSampleDataUser(null)
    setSampleError(null)
  }

  const handleConfirmSampleData = () => {
    if (!sampleDataUser) return
    setSampleError(null)
    setAddingSample(true)
    admin
      .addSampleData(sampleDataUser.id)
      .then((r) => {
        handleCloseSampleData()
        if (r.data?.message) {
          const details = [
            r.data.properties != null && `${r.data.properties} properties`,
            r.data.units != null && `${r.data.units} units`,
            r.data.tenants != null && `${r.data.tenants} tenants`,
            r.data.leases != null && `${r.data.leases} leases`,
            r.data.cheques != null && `${r.data.cheques} cheques`,
            r.data.payments != null && `${r.data.payments} payments`,
          ].filter(Boolean).join(', ')
          alert(details ? `${r.data.message}: ${details}` : r.data.message)
        }
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        setSampleError(err.response?.data?.message ?? 'Failed to add sample data')
      })
      .finally(() => setAddingSample(false))
  }

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: 'email',
      label: 'Email',
      searchable: true,
      render: (u) => <span className="text-slate-200">{u.email}</span>,
    },
    {
      key: 'name',
      label: 'Name',
      searchable: true,
      render: (u) => <span className="text-slate-300">{u.name ?? '–'}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      sortKey: 'role',
      searchable: true,
      render: (u) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            u.role === 'SUPER_ADMIN' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-600/50 text-slate-300'
          }`}
        >
          {u.role === 'SUPER_ADMIN' ? 'Super Admin' : u.role}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortKey: 'createdAt',
      render: (u) => <span className="text-slate-400">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (u) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleOpenSampleData(u)}
            className="rounded-lg border border-slate-500/50 bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-slate-600/50 hover:text-emerald-300"
          >
            Add sample data
          </button>
          <button
            type="button"
            onClick={() => handleOpenReset(u)}
            className="rounded-lg border border-slate-500/50 bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-slate-600/50 hover:text-amber-300"
          >
            Reset password
          </button>
        </div>
      ),
    },
  ]

  if (loading && users.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
          <p className="text-sm font-medium text-slate-400">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-white">Users</h1>
      <p className="mb-4 text-slate-400">All registered users on the platform</p>

      <DataTable<AdminUser>
        data={users}
        columns={columns}
        idKey="id"
        searchPlaceholder="Search by email or name..."
        emptyMessage="No users found."
        variant="dark"
      />

      {sampleDataUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sample-data-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-800 p-6 shadow-xl">
            <h2 id="sample-data-title" className="text-lg font-semibold text-white">Add sample data</h2>
            <p className="mt-2 text-sm text-slate-400">
              Add random sample data for <span className="font-medium text-slate-300">{sampleDataUser.email}</span>
              {sampleDataUser.name && ` (${sampleDataUser.name})`}? This will create random properties, units, tenants, leases, cheques, and payments.
            </p>
            {sampleError && <p className="mt-2 text-sm text-rose-400">{sampleError}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleConfirmSampleData}
                disabled={addingSample}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {addingSample ? 'Adding…' : 'Yes, add sample data'}
              </button>
              <button
                type="button"
                onClick={handleCloseSampleData}
                disabled={addingSample}
                className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {resetUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-800 p-6 shadow-xl">
            <h2 id="reset-password-title" className="text-lg font-semibold text-white">Reset password</h2>
            <p className="mt-1 text-sm text-slate-400">
              Set a new password for <span className="font-medium text-slate-300">{resetUser.email}</span>
              {resetUser.name && ` (${resetUser.name})`}.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm text-slate-400">New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  autoComplete="new-password"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-400">Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  autoComplete="new-password"
                />
              </label>
            </div>
            {resetError && <p className="mt-2 text-sm text-rose-400">{resetError}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSubmitReset}
                disabled={resetting || newPassword.length < 8 || newPassword !== confirmPassword}
                className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-500 disabled:opacity-50"
              >
                {resetting ? 'Resetting…' : 'Reset password'}
              </button>
              <button
                type="button"
                onClick={handleCloseReset}
                disabled={resetting}
                className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
