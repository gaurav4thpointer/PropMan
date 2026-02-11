import { useState, useRef, useEffect } from 'react'
import type { CascadeInfo } from '../api/types'

interface ArchiveDeleteMenuProps {
  /** Current entity name for display (e.g. "Property", "Tenant") */
  entityType: string
  /** Display name of the item (e.g. property name) */
  entityName: string
  /** Whether the entity is currently archived */
  isArchived: boolean
  /** Fetch cascade info (called when user opens delete/archive confirmation) */
  onFetchCascadeInfo?: () => Promise<CascadeInfo>
  /** Called when user confirms archive */
  onArchive: () => Promise<void>
  /** Called when user confirms restore */
  onRestore: () => Promise<void>
  /** Called when user confirms permanent delete */
  onDelete: () => Promise<void>
  /** Optional: hide the permanent delete button */
  hideDelete?: boolean
}

function CascadeWarning({ info, action }: { info: CascadeInfo | null; action: 'archive' | 'delete' }) {
  if (!info) return null
  const items: string[] = []
  if (info.leases && info.leases > 0) items.push(`${info.leases} lease${info.leases > 1 ? 's' : ''}`)
  if (info.cheques && info.cheques > 0) items.push(`${info.cheques} cheque${info.cheques > 1 ? 's' : ''}`)
  if (info.payments && info.payments > 0) items.push(`${info.payments} payment${info.payments > 1 ? 's' : ''}`)
  if (info.schedules && info.schedules > 0) items.push(`${info.schedules} rent schedule${info.schedules > 1 ? 's' : ''}`)
  if (info.documents && info.documents > 0) items.push(`${info.documents} document${info.documents > 1 ? 's' : ''}`)
  if (items.length === 0) return null
  const verb = action === 'archive' ? 'archived' : 'permanently deleted'
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <p className="font-medium">Cascade effect</p>
      <p className="mt-1">
        The following related records will also be {verb}: {items.join(', ')}.
      </p>
    </div>
  )
}

export default function ArchiveDeleteMenu({
  entityType,
  entityName,
  isArchived,
  onFetchCascadeInfo,
  onArchive,
  onRestore,
  onDelete,
  hideDelete,
}: ArchiveDeleteMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<'archive' | 'delete' | null>(null)
  const [cascadeInfo, setCascadeInfo] = useState<CascadeInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openModal = async (type: 'archive' | 'delete') => {
    setMenuOpen(false)
    setModal(type)
    setError(null)
    setCascadeInfo(null)
    if (onFetchCascadeInfo) {
      setLoading(true)
      try {
        const info = await onFetchCascadeInfo()
        setCascadeInfo(info)
      } catch {
        // Non-critical, proceed without cascade info
      } finally {
        setLoading(false)
      }
    }
  }

  const handleConfirm = async () => {
    setError(null)
    setActionLoading(true)
    try {
      if (modal === 'archive') {
        await onArchive()
      } else if (modal === 'delete') {
        await onDelete()
      }
      setModal(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : `Failed to ${modal} ${entityType.toLowerCase()}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRestore = async () => {
    setMenuOpen(false)
    setError(null)
    setActionLoading(true)
    try {
      await onRestore()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : `Failed to restore ${entityType.toLowerCase()}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800"
          aria-label="More actions"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
          Actions
        </button>

        {menuOpen && (
          <div className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {isArchived ? (
              <>
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={actionLoading}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                  </svg>
                  Restore
                </button>
                {!hideDelete && (
                  <button
                    type="button"
                    onClick={() => openModal('delete')}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete permanently
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openModal('archive')}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Archive
                </button>
                {!hideDelete && (
                  <button
                    type="button"
                    onClick={() => openModal('delete')}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete permanently
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Error toast */}
      {error && !modal && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-lg">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-3 font-medium underline">Dismiss</button>
        </div>
      )}

      {/* Confirmation modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !actionLoading && setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {modal === 'archive' ? (
              <>
                <div className="mb-1 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Archive {entityType.toLowerCase()}?</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  &quot;{entityName}&quot; will be hidden from all lists and reports. You can restore it later from the archived items view.
                </p>
              </>
            ) : (
              <>
                <div className="mb-1 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                    <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Permanently delete {entityType.toLowerCase()}?</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  &quot;{entityName}&quot; and all related data will be permanently deleted. <span className="font-semibold text-rose-700">This action cannot be undone.</span>
                </p>
              </>
            )}

            {loading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
                Loading related records...
              </div>
            ) : (
              <CascadeWarning info={cascadeInfo} action={modal} />
            )}

            {error && (
              <p className="mt-3 text-sm text-rose-600">{error}</p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {modal === 'archive' ? (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Archiving...' : 'Archive'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Deleting...' : 'Delete permanently'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setModal(null)}
                disabled={actionLoading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/** Inline archive badge shown next to archived item names */
export function ArchivedBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
      Archived
    </span>
  )
}

/** Toggle button for showing/hiding archived items in list pages */
export function ArchiveToggle({
  showArchived,
  onChange,
}: {
  showArchived: boolean
  onChange: (show: boolean) => void
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <span className={`font-medium ${showArchived ? 'text-amber-700' : 'text-slate-500'}`}>
        Show archived
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={showArchived}
        onClick={() => onChange(!showArchived)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          showArchived ? 'bg-amber-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            showArchived ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    </label>
  )
}
