import axios from 'axios'
import type { Property, Unit, Tenant, Lease, RentSchedule, Cheque, Payment, DashboardData, Paginated, ChequeStatus } from './types'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const auth = {
  login: (email: string, password: string) =>
    api.post<{ user: { id: string; email: string }; access_token: string }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post<{ user: { id: string; email: string; name?: string | null }; access_token: string }>('/auth/register', { name, email, password }),
}

export const users = {
  me: () => api.get<{ id: string; email: string; name?: string | null; mobile?: string | null; gender?: string | null; createdAt?: string }>('/users/me'),
  updateProfile: (data: { email?: string; name?: string; mobile?: string; gender?: string | null }) =>
    api.patch<{ id: string; email: string; name?: string | null; mobile?: string | null; gender?: string | null }>('/users/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch<{ message: string }>('/users/me/password', data),
}

export const properties = {
  list: (params?: { page?: number; limit?: number }) => api.get<Paginated<Property>>('/properties', { params }),
  get: (id: string) => api.get<Property>(`/properties/${id}`),
  create: (data: Partial<Property>) => api.post<Property>('/properties', data),
  update: (id: string, data: Partial<Property>) => api.patch<Property>(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
}

export const units = {
  list: (propertyId: string, params?: { page?: number; limit?: number }) =>
    api.get<Paginated<Unit>>(`/properties/${propertyId}/units`, { params }),
  get: (id: string) => api.get<Unit>(`/units/${id}`),
  create: (propertyId: string, data: Partial<Unit>) => api.post<Unit>(`/properties/${propertyId}/units`, data),
  update: (id: string, data: Partial<Unit>) => api.patch<Unit>(`/units/${id}`, data),
  delete: (id: string) => api.delete(`/units/${id}`),
}

export const tenants = {
  list: (params?: { page?: number; limit?: number }) => api.get<Paginated<Tenant>>('/tenants', { params }),
  get: (id: string) => api.get<Tenant>(`/tenants/${id}`),
  create: (data: Partial<Tenant>) => api.post<Tenant>('/tenants', data),
  update: (id: string, data: Partial<Tenant>) => api.patch<Tenant>(`/tenants/${id}`, data),
  delete: (id: string) => api.delete(`/tenants/${id}`),
}

export const leases = {
  list: (params?: { page?: number; limit?: number }) => api.get<Paginated<Lease>>('/leases', { params }),
  get: (id: string) => api.get<Lease>(`/leases/${id}`),
  create: (data: Record<string, unknown>) => api.post<Lease>('/leases', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<Lease>(`/leases/${id}`, data),
  delete: (id: string) => api.delete(`/leases/${id}`),
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
  list: (params?: { page?: number; limit?: number; propertyId?: string; status?: string }) =>
    api.get<Paginated<Cheque>>('/cheques', { params }),
  upcoming: (days?: number, propertyId?: string) =>
    api.get<Cheque[]>('/cheques/upcoming', { params: { days: days ?? 30, propertyId } }),
  get: (id: string) => api.get<Cheque>(`/cheques/${id}`),
  create: (data: Record<string, unknown>) => api.post<Cheque>('/cheques', data),
  update: (id: string, data: Record<string, unknown>) => api.patch<Cheque>(`/cheques/${id}`, data),
  updateStatus: (id: string, data: { status: ChequeStatus; depositDate?: string; clearedOrBounceDate?: string; bounceReason?: string; replacedByChequeId?: string }) =>
    api.patch<Cheque>(`/cheques/${id}/status`, data),
  delete: (id: string) => api.delete(`/cheques/${id}`),
}

export const payments = {
  list: (params?: { page?: number; limit?: number; leaseId?: string }) =>
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
