/** True if the lease end date is before today (date-only comparison). */
export function isLeaseExpired(endDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  return end < today
}
