import { useEffect, useState } from 'react'
import { admin } from '../../api/client'
import type { AdminUser } from '../../api/client'
import DataTable, { type DataTableColumn } from '../../components/DataTable'

const FETCH_LIMIT = 100

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    admin
      .users({ page: 1, limit: FETCH_LIMIT })
      .then((r) => setUsers(r.data.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (s: string) => new Date(s).toLocaleDateString(undefined, { dateStyle: 'medium' })

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
    </div>
  )
}
