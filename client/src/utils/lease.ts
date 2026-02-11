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

/** Days overdue from due date (0 if not overdue). Date-only comparison with today. */
export function getDaysOverdue(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  if (due >= today) return 0
  return Math.floor((today.getTime() - due.getTime()) / 86400000)
}
