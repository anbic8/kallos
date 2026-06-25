import axios from 'axios'
import type {
  Kaempfer, TokenResponse, User, Verein, Gewichtsklasse, Technik,
  Veranstaltung, Kampf, KampfEreignis, KaempferStatistik, KampfMedien, Erfolg,
  Mannschaftskampf, Einzelkampf, LigaTabelle, IKKZEintrag, Leistungstest,
} from './types'

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

// ---------- Auth ----------

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

// ---------- Vereine ----------

export const fetchVereine = async (): Promise<Verein[]> => {
  const { data } = await api.get<Verein[]>('/vereine')
  return data
}

export const fetchHeimverein = async (): Promise<Verein> => {
  const { data } = await api.get<Verein>('/vereine/heimverein')
  return data
}

export const createVerein = async (payload: Omit<Verein, 'id'>): Promise<Verein> => {
  const { data } = await api.post<Verein>('/vereine', payload)
  return data
}

// ---------- Kaempfer ----------

export const fetchKaempfer = async (intern?: boolean, gruppeId?: number): Promise<Kaempfer[]> => {
  const params: Record<string, unknown> = {}
  if (intern != null) params.intern = intern
  if (gruppeId != null) params.gruppe_id = gruppeId
  const { data } = await api.get<Kaempfer[]>('/kaempfer', { params })
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

export const fetchKaempferStatistik = async (id: number): Promise<KaempferStatistik> => {
  const { data } = await api.get<KaempferStatistik>(`/kaempfer/${id}/statistik`)
  return data
}

// ---------- Stammdaten ----------

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

// ---------- Veranstaltungen ----------

export const fetchVeranstaltungen = async (): Promise<Veranstaltung[]> => {
  const { data } = await api.get<Veranstaltung[]>('/veranstaltungen')
  return data
}

export const fetchVeranstaltungById = async (id: number): Promise<Veranstaltung> => {
  const { data } = await api.get<Veranstaltung>(`/veranstaltungen/${id}`)
  return data
}

export const createVeranstaltung = async (payload: Omit<Veranstaltung, 'id'>): Promise<Veranstaltung> => {
  const { data } = await api.post<Veranstaltung>('/veranstaltungen', payload)
  return data
}

export const updateVeranstaltung = async (id: number, payload: Partial<Veranstaltung>): Promise<Veranstaltung> => {
  const { data } = await api.patch<Veranstaltung>(`/veranstaltungen/${id}`, payload)
  return data
}

export const deleteVeranstaltung = async (id: number): Promise<void> => {
  await api.delete(`/veranstaltungen/${id}`)
}

// ---------- Kaempfe ----------

export const fetchKaempfe = async (params?: { veranstaltung_id?: number; kaempfer_id?: number; is_scouting?: boolean }): Promise<Kampf[]> => {
  const { data } = await api.get<Kampf[]>('/kaempfe', { params })
  return data
}

export const fetchKampfById = async (id: number): Promise<Kampf> => {
  const { data } = await api.get<Kampf>(`/kaempfe/${id}`)
  return data
}

export const createKampf = async (payload: object): Promise<Kampf> => {
  const { data } = await api.post<Kampf>('/kaempfe', payload)
  return data
}

export const updateKampf = async (id: number, payload: object): Promise<Kampf> => {
  const { data } = await api.patch<Kampf>(`/kaempfe/${id}`, payload)
  return data
}

export const deleteKampf = async (id: number): Promise<void> => {
  await api.delete(`/kaempfe/${id}`)
}

export const createKampfEreignis = async (kampfId: number, payload: object): Promise<KampfEreignis> => {
  const { data } = await api.post<KampfEreignis>(`/kaempfe/${kampfId}/ereignisse`, payload)
  return data
}

export const updateKampfEreignis = async (kampfId: number, ereignisId: number, payload: object): Promise<KampfEreignis> => {
  const { data } = await api.patch<KampfEreignis>(`/kaempfe/${kampfId}/ereignisse/${ereignisId}`, payload)
  return data
}

export const deleteKampfEreignis = async (kampfId: number, ereignisId: number): Promise<void> => {
  await api.delete(`/kaempfe/${kampfId}/ereignisse/${ereignisId}`)
}

// ---------- IKKZ ----------

export const fetchIKKZ = async (kaempferId: number): Promise<IKKZEintrag[]> => {
  const { data } = await api.get<IKKZEintrag[]>('/ikkz', { params: { kaempfer_id: kaempferId } })
  return data
}

export const createIKKZ = async (kaempferId: number, payload: object): Promise<IKKZEintrag> => {
  const { data } = await api.post<IKKZEintrag>('/ikkz', payload, { params: { kaempfer_id: kaempferId } })
  return data
}

export const deleteIKKZ = async (id: number): Promise<void> => {
  await api.delete(`/ikkz/${id}`)
}

// ---------- Leistungstests ----------

export const fetchLeistungstests = async (kaempferId: number, testtyp?: string): Promise<Leistungstest[]> => {
  const { data } = await api.get<Leistungstest[]>('/leistungstests', {
    params: { kaempfer_id: kaempferId, ...(testtyp ? { testtyp } : {}) }
  })
  return data
}

export const createLeistungstest = async (kaempferId: number, payload: object): Promise<Leistungstest> => {
  const { data } = await api.post<Leistungstest>('/leistungstests', payload, { params: { kaempfer_id: kaempferId } })
  return data
}

export const deleteLeistungstest = async (id: number): Promise<void> => {
  await api.delete(`/leistungstests/${id}`)
}

// ---------- Mannschaft ----------

export const fetchMannschaftskaempfe = async (veranstaltungId: number): Promise<Mannschaftskampf[]> => {
  const { data } = await api.get<Mannschaftskampf[]>('/mannschaftskaempfe', { params: { veranstaltung_id: veranstaltungId } })
  return data
}

export const fetchMannschaftskampfById = async (id: number): Promise<Mannschaftskampf> => {
  const { data } = await api.get<Mannschaftskampf>(`/mannschaftskaempfe/${id}`)
  return data
}

export const createMannschaftskampf = async (payload: object): Promise<Mannschaftskampf> => {
  const { data } = await api.post<Mannschaftskampf>('/mannschaftskaempfe', payload)
  return data
}

export const updateMannschaftskampf = async (id: number, payload: object): Promise<Mannschaftskampf> => {
  const { data } = await api.patch<Mannschaftskampf>(`/mannschaftskaempfe/${id}`, payload)
  return data
}

export const deleteMannschaftskampf = async (id: number): Promise<void> => {
  await api.delete(`/mannschaftskaempfe/${id}`)
}

export const addEinzelkampf = async (mkId: number, payload: object): Promise<Einzelkampf> => {
  const { data } = await api.post<Einzelkampf>(`/mannschaftskaempfe/${mkId}/einzelkaempfe`, payload)
  return data
}

export const deleteEinzelkampf = async (mkId: number, ekId: number): Promise<void> => {
  await api.delete(`/mannschaftskaempfe/${mkId}/einzelkaempfe/${ekId}`)
}

export const fetchLigaTabelle = async (ligaId: number): Promise<LigaTabelle> => {
  const { data } = await api.get<LigaTabelle>(`/veranstaltungen/${ligaId}/ligatabelle`)
  return data
}

export const fetchKampftage = async (ligaId: number): Promise<Veranstaltung[]> => {
  const { data } = await api.get<Veranstaltung[]>(`/veranstaltungen/${ligaId}/kampftage`)
  return data
}

export const fetchRangliste = async (kriterium = 'siege', minKaempfe = 0, gruppeId?: number): Promise<any[]> => {
  const { data } = await api.get('/rangliste', { params: { kriterium, min_kaempfe: minKaempfe, ...(gruppeId ? { gruppe_id: gruppeId } : {}) } })
  return data
}

// ---------- Gruppen ----------

export const fetchGruppen = async (): Promise<import('./types').Gruppe[]> => {
  const { data } = await api.get('/gruppen')
  return data
}

export const createGruppe = async (payload: { name: string; beschreibung?: string }): Promise<import('./types').Gruppe> => {
  const { data } = await api.post('/gruppen', payload)
  return data
}

export const updateGruppe = async (id: number, payload: Partial<{ name: string; beschreibung: string }>): Promise<import('./types').Gruppe> => {
  const { data } = await api.patch(`/gruppen/${id}`, payload)
  return data
}

export const deleteGruppe = async (id: number): Promise<void> => {
  await api.delete(`/gruppen/${id}`)
}

export const addMitglied = async (gruppeId: number, kaempferId: number): Promise<void> => {
  await api.post(`/gruppen/${gruppeId}/mitglieder/${kaempferId}`)
}

export const removeMitglied = async (gruppeId: number, kaempferId: number): Promise<void> => {
  await api.delete(`/gruppen/${gruppeId}/mitglieder/${kaempferId}`)
}

// ---------- Medien ----------

export const addKampfMedien = async (kampfId: number, formData: FormData): Promise<KampfMedien> => {
  const { data } = await api.post<KampfMedien>(`/kaempfe/${kampfId}/medien`, formData)
  return data
}

export const deleteKampfMedien = async (kampfId: number, medienId: number): Promise<void> => {
  await api.delete(`/kaempfe/${kampfId}/medien/${medienId}`)
}

// ---------- Erfolge ----------

export const fetchErfolge = async (kaempferId: number): Promise<Erfolg[]> => {
  const { data } = await api.get<Erfolg[]>('/erfolge', { params: { kaempfer_id: kaempferId } })
  return data
}

export const createErfolg = async (payload: object): Promise<Erfolg> => {
  const { data } = await api.post<Erfolg>('/erfolge', payload)
  return data
}

export const updateErfolg = async (id: number, payload: object): Promise<Erfolg> => {
  const { data } = await api.patch<Erfolg>(`/erfolge/${id}`, payload)
  return data
}

export const deleteErfolg = async (id: number): Promise<void> => {
  await api.delete(`/erfolge/${id}`)
}

export const uploadErfolgFoto = async (id: number, file: File): Promise<Erfolg> => {
  const form = new FormData()
  form.append('foto', file)
  const { data } = await api.post<Erfolg>(`/erfolge/${id}/foto`, form)
  return data
}

export default api
