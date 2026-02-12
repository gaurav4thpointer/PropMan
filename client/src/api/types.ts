export type Country = 'IN' | 'AE' | 'US' | 'GB' | 'SG' | 'SA'
export type Currency = 'INR' | 'AED' | 'USD' | 'GBP' | 'SGD' | 'SAR'
export type UnitStatus = 'VACANT' | 'OCCUPIED'
export type RentFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
export type ScheduleStatus = 'DUE' | 'OVERDUE' | 'PAID' | 'PARTIAL'
export type ChequeStatus = 'RECEIVED' | 'DEPOSITED' | 'CLEARED' | 'BOUNCED' | 'REPLACED'
export type PaymentMethod = 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CASH'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'

export type UserRole = 'USER' | 'PROPERTY_MANAGER' | 'SUPER_ADMIN'

export interface User {
  id: string
  email: string
  name?: string | null
  mobile?: string | null
  gender?: Gender | null
  role?: UserRole
}

export interface Property {
  id: string
  name: string
  address?: string
  country: Country
  emirateOrState?: string
  currency: Currency
  unitNo?: string | null
  bedrooms?: number | null
  status?: UnitStatus | null
  notes?: string
  archivedAt?: string | null
  ownerId?: string
}

export interface CreatePropertyPayload {
  ownerId?: string
  name: string
  address?: string
  country: Country
  emirateOrState?: string
  currency: Currency
  unitNo?: string
  bedrooms?: number
  status?: UnitStatus
  notes?: string
}

export interface Tenant {
  id: string
  name: string
  phone?: string
  email?: string
  idNumber?: string
  notes?: string
  archivedAt?: string | null
}

export interface Lease {
  id: string
  startDate: string
  endDate: string
  terminationDate?: string | null
  rentFrequency: RentFrequency
  installmentAmount: number | string
  dueDay: number
  securityDeposit?: number | string
  notes?: string
  archivedAt?: string | null
  propertyId: string
  tenantId: string
  property?: Property
  tenant?: Tenant
  rentSchedules?: RentSchedule[]
}

export interface LeaseDocument {
  id: string
  leaseId: string
  displayName?: string | null
  originalFileName: string
  storedPath: string
  mimeType?: string | null
  size?: number | null
  createdAt: string
}

export interface RentSchedule {
  id: string
  dueDate: string
  expectedAmount: number | string
  paidAmount?: number | string
  status: ScheduleStatus
  leaseId: string
}

export interface Cheque {
  id: string
  chequeNumber: string
  bankName: string
  chequeDate: string
  amount: number | string
  coversPeriod: string
  status: ChequeStatus
  depositDate?: string
  clearedOrBounceDate?: string
  bounceReason?: string
  notes?: string
  archivedAt?: string | null
  createdAt?: string
  updatedAt?: string
  leaseId: string
  tenantId: string
  propertyId: string
  replacedByChequeId?: string | null
  lease?: Lease
  tenant?: Tenant
  property?: Property
  replacedBy?: Cheque | null
  replacesCheque?: Cheque | null
}

export interface Payment {
  id: string
  date: string
  amount: number | string
  method: PaymentMethod
  reference?: string
  notes?: string
  archivedAt?: string | null
  leaseId: string
  tenantId: string
  propertyId: string
  lease?: Lease
  tenant?: Tenant
  property?: Property
  scheduleMatches?: { amount: number | string; rentSchedule: RentSchedule }[]
}

export interface CascadeInfo {
  leases?: number
  cheques?: number
  payments?: number
  schedules?: number
  documents?: number
}

export interface Paginated<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface Owner {
  id: string
  email: string
  name?: string | null
  mobile?: string | null
  role: string
  createdAt: string
  propertyCount?: number
}

export interface OwnerWithProperties extends Owner {
  properties: Property[]
}

export interface Manager {
  id: string
  email: string
  name?: string | null
}

export interface DashboardData {
  month: { expected: number; received: number }
  quarter: { expected: number; received: number }
  overdueAmount: number
  overdueSchedules: (RentSchedule & { lease?: Lease })[]
  upcomingCheques: Cheque[]
  bouncedCount: number
  unitStats: { vacant: number; occupied: number }
  expiringLeases: (Lease & { property?: Property; tenant?: Tenant })[]
  totalTrackedExpected?: number
  totalTrackedReceived?: number
  totalChequeValueTracked?: number
  totalSecurityDepositsTracked?: number
}

export interface ManagerPortfolioOwner {
  owner: { id: string; name: string | null; email: string }
  propertyCount: number
  month: { expected: number; received: number }
  quarter: { expected: number; received: number }
  overdueAmount: number
  overdueCount: number
  bouncedCount: number
  vacantCount: number
  occupiedCount: number
  expiringLeasesCount: number
  needsAttention: boolean
}

export interface ManagerPortfolioReport {
  owners: ManagerPortfolioOwner[]
}
