import axios from 'axios'
import type { Property, Tenant, Lease, LeaseDocument, RentSchedule, Cheque, Payment, DashboardData, Paginated, ChequeStatus, CreatePropertyPayload, CascadeInfo, Owner, OwnerWithProperties, Manager } from './types'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const LOGIN_RETURN_URL_KEY = 'loginReturnUrl'

export function getLoginReturnUrl(): string | null {
  try {
    const url = sessionStorage.getItem(LOGIN_RETURN_URL_KEY)
    if (url) sessionStorage.removeItem(LOGIN_RETURN_URL_KEY)
    return url
  } catch {
    return null
  }
}

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      try {
        const path = window.location.pathname + window.location.search
        if (path && path !== '/' && path !== '/login' && path !== '/register') {
          sessionStorage.setItem(LOGIN_RETURN_URL_KEY, path)
        }
      } catch {
        /* ignore */
      }
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const auth = {
  login: (email: string, password: string) =>
    api.post<{ user: { id: string; email: string; name?: string | null; role?: string }; access_token: string }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, role?: 'USER' | 'PROPERTY_MANAGER') =>
    api.post<{ user: { id: string; email: string; name?: string | null; role?: string }; access_token: string }>('/auth/register', { name, email, password, role }),
}

export const users = {
  me: () => api.get<{ id: string; email: string; name?: string | null; mobile?: string | null; gender?: string | null; role?: string; createdAt?: string }>('/users/me'),
  updateProfile: (data: { email?: string; name?: string; mobile?: string; gender?: string | null }) =>
    api.patch<{ id: string; email: string; name?: string | null; mobile?: string | null; gender?: string | null }>('/users/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch<{ message: string }>('/users/me/password', data),
}

export const properties = {
  list: (params?: { page?: number; limit?: number; search?: string; country?: string; currency?: string; includeArchived?: boolean }) =>
    api.get<Paginated<Property>>('/properties', { params }),
  get: (id: string) => api.get<Property>(`/properties/${id}`),
  create: (data: CreatePropertyPayload) => api.post<Property>('/properties', data),
  update: (id: string, data: Partial<Property>) => api.patch<Property>(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
  archive: (id: string) => api.patch<Property>(`/properties/${id}/archive`),
  restore: (id: string) => api.patch<Property>(`/properties/${id}/restore`),
  cascadeInfo: (id: string) => api.get<CascadeInfo>(`/properties/${id}/cascade-info`),
}

export const tenants = {
  list: (params?: { page?: number; limit?: number; search?: string; includeArchived?: boolean }) => api.get<Paginated<Tenant>>('/tenants', { params }),
  get: (id: string) => api.get<Tenant>(`/tenants/${id}`),
  create: (data: Partial<Tenant>) => api.post<Tenant>('/tenants', data),
  update: (id: string, data: Partial<Tenant>) => api.patch<Tenant>(`/tenants/${id}`, data),
  delete: (id: string) => api.delete(`/tenants/${id}`),
  archive: (id: string) => api.patch<Tenant>(`/tenants/${id}/archive`),
  restore: (id: string) => api.patch<Tenant>(`/tenants/${id}/restore`),
  cascadeInfo: (id: string) => api.get<CascadeInfo>(`/tenants/${id}/cascade-info`),
}

export const leases = {
  list: (params?: { page?: number; limit?: number; propertyId?: string; tenantId?: string; search?: string; includeArchived?: boolean }) => api.get<Paginated<Lease>>('/leases', { params }),
  get: (id: string) => api.get<Lease>(`/leases/${id}`),
  create: (data: Record<string, unknown>) => api.post<Lease>('/leases', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<Lease>(`/leases/${id}`, data),
  terminate: (id: string, data: { terminationDate: string }) => api.patch<Lease>(`/leases/${id}/terminate`, data),
  delete: (id: string) => api.delete(`/leases/${id}`),
  archive: (id: string) => api.patch<Lease>(`/leases/${id}/archive`),
  restore: (id: string) => api.patch<Lease>(`/leases/${id}/restore`),
  cascadeInfo: (id: string) => api.get<CascadeInfo>(`/leases/${id}/cascade-info`),
}

export const leaseDocuments = {
  list: (leaseId: string) => api.get<LeaseDocument[]>(`/leases/${leaseId}/documents`),
  upload: (leaseId: string, file: File, name?: string | null) => {
    const form = new FormData()
    form.append('file', file)
    if (name != null && name.trim()) form.append('name', name.trim())
    return api.post<LeaseDocument>(`/leases/${leaseId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  download: async (leaseId: string, docId: string) => {
    const r = await api.get<Blob>(`/leases/${leaseId}/documents/${docId}/download`, { responseType: 'blob' })
    const disp = r.headers['content-disposition']
    const match = disp && /filename="?([^"]+)"?/.exec(disp)
    const filename = match ? match[1] : 'document'
    return { blob: r.data, filename }
  },
  update: (leaseId: string, docId: string, data: { displayName?: string | null }) =>
    api.patch<LeaseDocument>(`/leases/${leaseId}/documents/${docId}`, data),
  delete: (leaseId: string, docId: string) => api.delete(`/leases/${leaseId}/documents/${docId}`),
}

export const rentSchedule = {
  byLease: (leaseId: string, params?: { page?: number; limit?: number }) =>
    api.get<Paginated<RentSchedule>>(`/rent-schedule/lease/${leaseId}`, { params }),
  overdue: (params?: { propertyId?: string; page?: number; limit?: number }) =>
    api.get<Paginated<RentSchedule & { lease?: Lease }>>('/rent-schedule/overdue', { params }),
  outstanding: (params?: { propertyId?: string; from?: string; to?: string }) =>
    api.get<(RentSchedule & { lease?: Lease })[]>('/rent-schedule/outstanding', { params }),
}

export const cheques = {
  list: (params?: { page?: number; limit?: number; propertyId?: string; tenantId?: string; status?: string; search?: string; includeArchived?: boolean }) =>
    api.get<Paginated<Cheque>>('/cheques', { params }),
  upcoming: (days?: number, propertyId?: string) =>
    api.get<Cheque[]>('/cheques/upcoming', { params: { days: days ?? 30, propertyId } }),
  get: (id: string) => api.get<Cheque>(`/cheques/${id}`),
  create: (data: Record<string, unknown>) => api.post<Cheque>('/cheques', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<Cheque>(`/cheques/${id}`, data),
  updateStatus: (id: string, data: { status: ChequeStatus; depositDate?: string; clearedOrBounceDate?: string; bounceReason?: string; replacedByChequeId?: string }) =>
    api.patch<Cheque>(`/cheques/${id}/status`, data),
  delete: (id: string) => api.delete(`/cheques/${id}`),
  archive: (id: string) => api.patch<Cheque>(`/cheques/${id}/archive`),
  restore: (id: string) => api.patch<Cheque>(`/cheques/${id}/restore`),
}

export const payments = {
  list: (params?: { page?: number; limit?: number; leaseId?: string; propertyId?: string; tenantId?: string; search?: string }) =>
    api.get<Paginated<Payment>>('/payments', { params }),
  get: (id: string) => api.get<Payment>(`/payments/${id}`),
  create: (data: Record<string, unknown>) => api.post<Payment>('/payments', data),
  match: (id: string, matches: { rentScheduleId: string; amount: number }[]) =>
    api.post<Payment>(`/payments/${id}/match`, { matches }),
  delete: (id: string) => api.delete(`/payments/${id}`),
}

export const reports = {
  dashboard: (propertyId?: string) => api.get<DashboardData>('/reports/dashboard', { params: { propertyId } }),
  exportCheques: (params?: { propertyId?: string; from?: string; to?: string }) =>
    api.get('/reports/export/cheques', { params, responseType: 'blob' }).then((r) => {
      const url = URL.createObjectURL(r.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cheques.csv'
      a.click()
      URL.revokeObjectURL(url)
    }),
  exportRentSchedule: (params?: { propertyId?: string; from?: string; to?: string }) =>
    api.get('/reports/export/rent-schedule', { params, responseType: 'blob' }).then((r) => {
      const url = URL.createObjectURL(r.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'rent-schedule.csv'
      a.click()
      URL.revokeObjectURL(url)
    }),
}

export interface AdminStats {
  totalUsers: number
  totalProperties: number
  totalLeases: number
  totalTenants: number
  totalCheques: number
  totalPayments: number
  usersByRole: Record<string, number>
  propertiesByCountry: Record<string, number>
  totalRentExpectedAllTime: number
  totalRentReceivedAllTime: number
  totalChequeValueTracked: number
  totalSecurityDepositsTracked: number
  rentExpectedByCurrency?: Record<string, number>
  rentReceivedByCurrency?: Record<string, number>
  chequeValueByCurrency?: Record<string, number>
}

export interface AdminUser {
  id: string
  email: string
  name?: string | null
  mobile?: string | null
  role: string
  createdAt: string
}

export interface CountryConfig {
  allCountries: string[]
  allCurrencies: string[]
  enabledCountries: string[]
  enabledCurrencies: string[]
}

export const admin = {
  stats: () => api.get<AdminStats>('/admin/stats'),
  activity: (limit?: number) => api.get<{ recentLeases: unknown[]; recentPayments: unknown[]; recentUsers: AdminUser[] }>('/admin/activity', { params: { limit } }),
  users: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<{ data: AdminUser[]; meta: { total: number; page: number; limit: number; totalPages: number } }>('/admin/users', { params }),
  resetPassword: (userId: string, newPassword: string) =>
    api.patch<{ message: string }>(`/admin/users/${userId}/reset-password`, { newPassword }),
  addSampleData: (userId: string) =>
    api.post<{ message: string; properties: number; tenants: number; leases: number; cheques: number; payments: number }>(`/admin/users/${userId}/sample-data`),
  getCountries: () => api.get<CountryConfig>('/admin/countries'),
  updateCountries: (enabledCountries: string[], enabledCurrencies: string[]) =>
    api.patch<{ enabledCountries: string[]; enabledCurrencies: string[] }>('/admin/countries', {
      enabledCountries,
      enabledCurrencies,
    }),
}

export const config = {
  getCountries: () => api.get<CountryConfig>('/config/countries'),
}

export const owners = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get<Paginated<Owner>>('/owners', { params }),
  get: (id: string) => api.get<OwnerWithProperties>(`/owners/${id}`),
  create: (data: { name: string; email: string; password: string; mobile?: string }) =>
    api.post<Owner>('/owners', data),
  getMyManagers: () => api.get<{ data: Manager[] }>('/owners/me/managers'),
  revokeManager: (managerId: string) => api.delete(`/owners/managers/${managerId}`),
}

export const propertyManagers = {
  assign: (propertyId: string, managerId: string) =>
    api.post<{ assigned: boolean }>(`/properties/${propertyId}/managers`, { managerId }),
  revoke: (propertyId: string, managerId: string) =>
    api.delete(`/properties/${propertyId}/managers/${managerId}`),
  list: (propertyId: string) => api.get<{ data: Manager[] }>(`/properties/${propertyId}/managers`),
}
