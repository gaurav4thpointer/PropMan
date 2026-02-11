export function formatPropertyCode(id: string | undefined | null): string {
  if (!id) return '-'
  const clean = id.replace(/-/g, '')
  const tail = clean.slice(-4) || clean
  const num = Number.parseInt(tail, 16)
  if (Number.isNaN(num)) return `PROP-${id.slice(0, 4)}`
  const n = num % 10000
  return `PROP${n.toString().padStart(4, '0')}`
}

export function formatLeaseCode(id: string | undefined | null): string {
  if (!id) return '-'
  const clean = id.replace(/-/g, '')
  const tail = clean.slice(-4) || clean
  const num = Number.parseInt(tail, 16)
  if (Number.isNaN(num)) return `LEASE-${id.slice(0, 4)}`
  const n = num % 10000
  return `LEASE${n.toString().padStart(4, '0')}`
}

