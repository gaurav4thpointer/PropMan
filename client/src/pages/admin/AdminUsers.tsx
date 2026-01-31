import { useEffect, useState } from 'react'
import { admin } from '../../api/client'
import type { AdminUser } from '../../api/client'

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    admin
      .users({ page, limit: 20 })
      .then((r) => {
        setUsers(r.data.data)
        setMeta(r.data.meta)
      })
      .catch(() => {
        setUsers([])
        setMeta(null)
      })
      .finally(() => setLoading(false))
  }, [page])

  const formatDate = (s: string) => new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })

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
      <p className="mb-8 text-slate-400">All registered users on the platform</p>

      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/80">
                <th className="px-5 py-4 font-semibold text-slate-300">Email</th>
                <th className="px-5 py-4 font-semibold text-slate-300">Name</th>
                <th className="px-5 py-4 font-semibold text-slate-300">Role</th>
                <th className="px-5 py-4 font-semibold text-slate-300">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-700/50 transition-colors hover:bg-slate-700/30">
                    <td className="px-5 py-3 text-slate-200">{u.email}</td>
                    <td className="px-5 py-3 text-slate-300">{u.name ?? '–'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-600/50 text-slate-300'
                        }`}
                      >
                        {u.role === 'SUPER_ADMIN' ? 'Super Admin' : u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-700 px-5 py-3">
            <p className="text-sm text-slate-400">
              Page {meta.page} of {meta.totalPages} · {meta.total} total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 disabled:opacity-50 hover:bg-slate-600 hover:text-white"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 disabled:opacity-50 hover:bg-slate-600 hover:text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
