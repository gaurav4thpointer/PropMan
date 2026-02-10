/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { leases, leaseDocuments } from '../api/client'
import type { Lease, LeaseDocument } from '../api/types'
import { isLeaseExpired, isLeaseTerminated, getDaysOverdue } from '../utils/lease'

export default function LeaseDetail() {
  const { id } = useParams<{ id: string }>()
  const [lease, setLease] = useState<Lease | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTerminateModal, setShowTerminateModal] = useState(false)
  const [terminateDate, setTerminateDate] = useState('')
  const [terminating, setTerminating] = useState(false)
  const [terminateError, setTerminateError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<LeaseDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<LeaseDocument | null>(null)
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editingDocName, setEditingDocName] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingDocName, setPendingDocName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refresh = () => id && leases.get(id).then((r) => setLease(r.data))

  const loadDocuments = () => {
    if (!id) return
    setDocumentsLoading(true)
    leaseDocuments.list(id)
      .then((r) => setDocuments(r.data))
      .catch(() => setDocuments([]))
      .finally(() => setDocumentsLoading(false))
  }

  useEffect(() => {
    if (!id) return
    setError(null)
    leases.get(id)
      .then((r) => setLease(r.data))
      .catch(() => setError('Lease not found'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (id && lease) loadDocuments()
  }, [id, lease?.id])

  const handleTerminate = () => {
    if (!id || !terminateDate.trim()) return
    setTerminateError(null)
    setTerminating(true)
    leases
      .terminate(id, { terminationDate: terminateDate })
      .then(() => {
        setShowTerminateModal(false)
        setTerminateDate('')
        refresh()
      })
      .catch((err: { response?: { data?: { message?: string | string[] } } }) => {
        const m = err.response?.data?.message;
        setTerminateError(Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : 'Failed to terminate lease')
      })
      .finally(() => setTerminating(false))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setPendingFile(file)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    setPendingDocName(baseName)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = () => {
    if (!id || !pendingFile) return
    setUploadError(null)
    setUploading(true)
    leaseDocuments.upload(id, pendingFile, pendingDocName.trim() || null)
      .then(() => {
        loadDocuments()
        setPendingFile(null)
        setPendingDocName('')
      })
      .catch((err: { response?: { data?: { message?: string | string[] } } }) => {
        const m = err.response?.data?.message;
        setUploadError(Array.isArray(m) ? m.join('. ') : typeof m === 'string' ? m : 'Upload failed')
      })
      .finally(() => setUploading(false))
  }

  const handleCancelPending = () => {
    setPendingFile(null)
    setPendingDocName('')
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDownload = async (doc: LeaseDocument) => {
    if (!id) return
    try {
      const { blob, filename } = await leaseDocuments.download(id, doc.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || doc.displayName || doc.originalFileName
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    }
  }

  const handleRequestDeleteDoc = (doc: LeaseDocument) => {
    setDeleteConfirmDoc(doc)
  }

  const handleConfirmDeleteDoc = () => {
    if (!id || !deleteConfirmDoc) return
    setDeletingId(deleteConfirmDoc.id)
    leaseDocuments.delete(id, deleteConfirmDoc.id)
      .then(() => {
        loadDocuments()
        setDeleteConfirmDoc(null)
      })
      .finally(() => setDeletingId(null))
  }

  const handleCancelDeleteDoc = () => {
    setDeleteConfirmDoc(null)
  }

  const startEditDocName = (doc: LeaseDocument) => {
    setEditingDocId(doc.id)
    setEditingDocName(doc.displayName || doc.originalFileName)
  }

  const handleSaveDocName = () => {
    if (!id || !editingDocId || editingDocId === '') return
    const name = editingDocName.trim()
    leaseDocuments.update(id, editingDocId, { displayName: name || null })
      .then(() => {
        loadDocuments()
        setEditingDocId(null)
        setEditingDocName('')
      })
  }

  const handleCancelEditDocName = () => {
    setEditingDocId(null)
    setEditingDocName('')
  }

  const getDocIcon = (doc: LeaseDocument) => {
    const ext = (doc.originalFileName || '').split('.').pop()?.toLowerCase()
    const mime = (doc.mimeType || '').toLowerCase()
    if (mime.includes('pdf') || ext === 'pdf') return '📄'
    if (mime.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️'
    if (['doc', 'docx'].includes(ext || '') || mime.includes('word')) return '📝'
    return '📎'
  }

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }
  if (error || !lease) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="font-medium">{error ?? 'Lease not found'}</p>
        <Link to="/leases" className="mt-2 inline-block text-sm font-semibold text-rose-800 hover:underline">← Back to leases</Link>
      </div>
    )
  }

  const schedules = lease.rentSchedules ?? []
  const expired = isLeaseExpired(lease.endDate)
  const terminated = isLeaseTerminated(lease)
  const canTerminateEarly = !expired && !terminated

  return (
    <div>
      <Link to="/leases" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline">← Leases</Link>
      {expired && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          This lease has expired (end date: {formatDate(lease.endDate)}).
        </div>
      )}
      {terminated && lease.terminationDate && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          This lease was terminated early on {formatDate(lease.terminationDate)} (original end: {formatDate(lease.endDate)}).
        </div>
      )}
      <div className="card mb-8 overflow-hidden p-0">
        <div className={`border-b border-slate-100 px-4 py-5 sm:px-6 ${expired ? 'bg-rose-50/50' : 'bg-gradient-to-r from-violet-50 to-indigo-50/50'}`}>
          <h1 className="text-2xl font-bold text-slate-800">Lease details</h1>
          <p className="mt-1 text-slate-600">
            {lease.propertyId ? (
              <Link to={`/properties/${lease.propertyId}`} className="text-indigo-600 hover:underline">{lease.property?.name ?? 'Property'}</Link>
            ) : (
              lease.property?.name ?? '–'
            )}
            {' · '}{lease.property?.unitNo ? `Unit ${lease.property.unitNo}` : '–'}
          </p>
          <p className="mt-1 text-slate-600">
            Tenant:{' '}
            {lease.tenant?.name && lease.tenantId ? (
              <Link to={`/tenants/${lease.tenantId}`} className="text-indigo-600 hover:underline">{lease.tenant.name}</Link>
            ) : (
              lease.tenant?.name ?? '–'
            )}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {lease.propertyId && (
              <>
                <Link to={`/cheques?propertyId=${lease.propertyId}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900">
                  View cheques
                </Link>
                <Link to={`/payments?propertyId=${lease.propertyId}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900">
                  View payments
                </Link>
              </>
            )}
            <span className="badge badge-neutral">{formatDate(lease.startDate)} – {formatDate(lease.endDate)}</span>
            {expired && (
              <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                Expired
              </span>
            )}
            {terminated && (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Terminated early
              </span>
            )}
            <span className="badge badge-neutral">{formatNum(Number(lease.installmentAmount))} / {lease.rentFrequency}</span>
            <span className="badge badge-neutral">Due day {lease.dueDay}</span>
            {canTerminateEarly && (
              <button
                type="button"
                onClick={() => { setShowTerminateModal(true); setTerminateError(null); setTerminateDate(''); }}
                className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm transition-colors hover:bg-amber-100"
              >
                Terminate early
              </button>
            )}
          </div>
        </div>
      </div>

      {showTerminateModal && (
        <div className="card mb-8 p-5">
          <h3 className="text-lg font-semibold text-slate-800">Terminate lease early</h3>
          <p className="mt-1 text-sm text-slate-600">Set the date the tenant is moving out. The unit will be marked vacant from this date.</p>
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Termination date</label>
            <input
              type="date"
              value={terminateDate}
              onChange={(e) => setTerminateDate(e.target.value)}
              min={lease.startDate}
              max={lease.endDate}
              className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            />
          </div>
          {terminateError && <p className="mt-2 text-sm text-red-600">{terminateError}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleTerminate}
              disabled={terminating || !terminateDate.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {terminating ? 'Terminating…' : 'Confirm termination'}
            </button>
            <button
              type="button"
              onClick={() => { setShowTerminateModal(false); setTerminateError(null); }}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <h2 className="mb-3 text-lg font-bold text-slate-800">Rent schedule</h2>
      <div className="table-wrapper">
        <table className="min-w-full">
          <thead>
            <tr>
              <th>Due date</th>
              <th>Expected</th>
              <th>Paid</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => {
              const due = new Date(s.dueDate)
              const term = lease.terminationDate ? new Date(lease.terminationDate) : null
              const cancelled = term != null && due > term
              return (
                <tr key={s.id} className={cancelled ? 'bg-slate-50/80' : ''}>
                  <td className={cancelled ? 'text-slate-400' : 'text-slate-700'}>{formatDate(s.dueDate)}</td>
                  <td className={cancelled ? 'text-slate-400' : 'font-medium'}>{formatNum(Number(s.expectedAmount))}</td>
                  <td className="text-slate-600">{s.paidAmount ? formatNum(Number(s.paidAmount)) : '–'}</td>
                  <td>
                    {cancelled ? (
                      <span className="badge bg-slate-200 text-slate-600">Cancelled</span>
                    ) : s.status === 'OVERDUE' ? (
                      (() => {
                        const days = getDaysOverdue(s.dueDate)
                        const label = days === 1 ? '1 day overdue' : `${days} days overdue`
                        const isOrange = days <= 7
                        return (
                          <span className={`badge ${isOrange ? 'bg-amber-100 text-amber-800' : 'badge-danger'}`} title={label}>
                            {label}
                          </span>
                        )
                      })()
                    ) : (
                      <span className={`badge ${
                        s.status === 'PAID' ? 'badge-success' :
                        s.status === 'PARTIAL' ? 'badge-warning' : 'badge-neutral'
                      }`}>
                        {s.status}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {schedules.length === 0 && <p className="px-5 py-12 text-center text-slate-500">No schedule entries.</p>}
      </div>

      <h2 className="mb-3 text-lg font-bold text-slate-800">Documents</h2>
      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Choose file"
          />
          {!pendingFile ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary text-sm"
              >
                + Attach document
              </button>
              <span className="text-xs text-slate-500">PDF, Word, images, text. Max 10 MB.</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Selected: {pendingFile.name}</p>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-600">Document name (optional)</span>
                <input
                  type="text"
                  value={pendingDocName}
                  onChange={(e) => setPendingDocName(e.target.value)}
                  placeholder="e.g. Signed lease agreement"
                  className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelPending}
                  disabled={uploading}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        </div>
        {documentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : documents.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No documents attached. Use the button above to add one.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="flex min-h-[100px] flex-col items-center justify-center rounded-lg border border-slate-100 bg-slate-50/80 p-4 transition-colors hover:bg-indigo-50/50 hover:border-indigo-100"
                >
                  <span className="text-4xl" aria-hidden>{getDocIcon(doc)}</span>
                  <span className="mt-2 text-xs font-medium text-slate-500">
                    {doc.size != null ? `${(doc.size / 1024).toFixed(1)} KB` : ''}
                    {doc.createdAt ? ` · ${formatDate(doc.createdAt)}` : ''}
                  </span>
                </button>
                <div className="mt-3 min-w-0 flex-1">
                  {editingDocId === doc.id ? (
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={editingDocName}
                        onChange={(e) => setEditingDocName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveDocName()
                          if (e.key === 'Escape') handleCancelEditDocName()
                        }}
                        onBlur={handleSaveDocName}
                        className="w-full rounded-lg border border-indigo-300 px-2 py-1.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                        autoFocus
                        aria-label="Document name"
                      />
                      <div className="flex gap-1">
                        <button type="button" onClick={handleSaveDocName} className="text-xs font-medium text-indigo-600 hover:underline">Save</button>
                        <button type="button" onClick={handleCancelEditDocName} className="text-xs font-medium text-slate-500 hover:underline">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="truncate text-sm font-medium text-slate-800" title={doc.displayName || doc.originalFileName}>
                      {doc.displayName || doc.originalFileName}
                    </p>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {editingDocId !== doc.id && (
                    <button
                      type="button"
                      onClick={() => startEditDocName(doc)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      title="Edit name"
                      aria-label="Edit document name"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRequestDeleteDoc(doc)}
                    disabled={deletingId === doc.id}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    title="Remove"
                    aria-label="Remove document"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteConfirmDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-doc-title"
          onClick={() => { if (deletingId !== deleteConfirmDoc.id) handleCancelDeleteDoc() }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-doc-title" className="text-lg font-semibold text-slate-800">Remove document?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to remove &quot;{deleteConfirmDoc.displayName || deleteConfirmDoc.originalFileName}&quot;? This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleConfirmDeleteDoc}
                disabled={deletingId === deleteConfirmDoc.id}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {deletingId === deleteConfirmDoc.id ? 'Removing…' : 'Remove'}
              </button>
              <button
                type="button"
                onClick={handleCancelDeleteDoc}
                disabled={deletingId === deleteConfirmDoc.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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

function formatDate(s: string) {
  return new Date(s).toLocaleDateString()
}

function formatNum(n: number) {
  return n.toLocaleString()
}
