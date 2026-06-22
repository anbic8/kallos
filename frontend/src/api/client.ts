import axios from 'axios'
import type { Kaempfer, TokenResponse, User, Verein, Gewichtsklasse, Technik } from './types'

const api = axios.create({ baseURL: '/api' })

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

// --- Auth ---
export const login = async (email: string, password: string): Promise<TokenResponse> => {
  const form = new FormData()
  form.append('username', email)
  form.append('password', password)
  const { data } = await api.post<TokenResponse>('/auth/login', form)
  return data
}

export const fetchMe = async (): Promise<User> => {
  const { data } = await api.get<User>('/auth/me')
  return data
}

export const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get<User[]>('/auth/users')
  return data
}

export const createUser = async (payload: { email: string; password: string; rolle: string }): Promise<User> => {
  const { data } = await api.post<User>('/auth/users', payload)
  return data
}

export const updateUser = async (id: number, payload: Partial<{ email: string; password: string; rolle: string }>): Promise<User> => {
  const { data } = await api.patch<User>(`/auth/users/${id}`, payload)
  return data
}

// --- Vereine ---
export const fetchVereine = async (): Promise<Verein[]> => {
  const { data } = await api.get<Verein[]>('/vereine')
  return data
}

export const createVerein = async (payload: Omit<Verein, 'id'>): Promise<Verein> => {
  const { data } = await api.post<Verein>('/vereine', payload)
  return data
}

// --- Kaempfer ---
export const fetchKaempfer = async (intern = true): Promise<Kaempfer[]> => {
  const { data } = await api.get<Kaempfer[]>('/kaempfer', { params: { intern } })
  return data
}

export const fetchKaempferById = async (id: number): Promise<Kaempfer> => {
  const { data } = await api.get<Kaempfer>(`/kaempfer/${id}`)
  return data
}

export const createKaempfer = async (payload: Partial<Kaempfer>): Promise<Kaempfer> => {
  const { data } = await api.post<Kaempfer>('/kaempfer', payload)
  return data
}

export const updateKaempfer = async (id: number, payload: Partial<Kaempfer>): Promise<Kaempfer> => {
  const { data } = await api.patch<Kaempfer>(`/kaempfer/${id}`, payload)
  return data
}

export const deleteKaempfer = async (id: number): Promise<void> => {
  await api.delete(`/kaempfer/${id}`)
}

export const uploadFoto = async (id: number, file: File): Promise<Kaempfer> => {
  const form = new FormData()
  form.append('foto', file)
  const { data } = await api.post<Kaempfer>(`/kaempfer/${id}/foto`, form)
  return data
}

// --- Stammdaten ---
export const fetchGewichtsklassen = async (): Promise<Gewichtsklasse[]> => {
  const { data } = await api.get<Gewichtsklasse[]>('/gewichtsklassen')
  return data
}

export const fetchTechniken = async (): Promise<Technik[]> => {
  const { data } = await api.get<Technik[]>('/techniken')
  return data
}

export const createTechnik = async (payload: { name: string; kategorie?: string }): Promise<Technik> => {
  const { data } = await api.post<Technik>('/techniken', payload)
  return data
}

export default api
