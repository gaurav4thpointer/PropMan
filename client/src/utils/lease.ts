/** True if the lease end date is before today (date-only comparison). */
export function isLeaseExpired(endDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  return end < today
}

/** True if the lease was terminated early (terminationDate is set). */
export function isLeaseTerminated(lease: { terminationDate?: string | null }): boolean {
  return Boolean(lease.terminationDate)
}

/** True if the lease start date is after today (hasn't started yet). */
export function isLeaseFuture(startDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  return start > today
}

/** True if the due date is strictly before today (date-only comparison). */
export function isDueDatePast(dueDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return due < today
}

/** Days overdue from due date (0 if not overdue). Uses UTC to avoid DST errors. */
export function getDaysOverdue(dueDate: string): number {
  const today = new Date()
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const due = new Date(dueDate)
  const dueUtc = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())
  if (dueUtc >= todayUtc) return 0
  return Math.round((todayUtc - dueUtc) / 86400000)
}
