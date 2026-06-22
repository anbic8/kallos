export type UserRolle = 'admin' | 'trainer' | 'athlet'
export type Guertel = 'weiss' | 'gelb' | 'orange' | 'gruen' | 'blau' | 'braun' | 'schwarz' | 'dan2' | 'dan3' | 'dan4' | 'dan5'
export type Geschlecht = 'm' | 'w' | 'd'
export type GKGeschlecht = 'm' | 'w'
export type Altersklasse = 'U15' | 'U18' | 'U21' | 'Senior'
export type TechnikKategorie = 'nage-waza' | 'katame-waza' | 'atemi-waza' | 'sonstiges'

export interface User {
  id: number
  email: string
  rolle: UserRolle
  created_at: string
}

export interface Verein {
  id: number
  name: string
  ort?: string
  verband?: string
  logo_url?: string
}

export interface Kaempfer {
  id: number
  vorname: string
  nachname: string
  verein_id?: number
  user_id?: number
  geburtsjahr?: number
  geschlecht?: Geschlecht
  aktueller_guertel?: Guertel
  foto_url?: string
  notizen?: string
  verein?: Verein
}

export interface Gewichtsklasse {
  id: number
  bezeichnung: string
  max_kg?: number
  geschlecht?: GKGeschlecht
  altersklasse?: Altersklasse
}

export interface Technik {
  id: number
  name: string
  kategorie?: TechnikKategorie
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export const GUERTEL_LABEL: Record<Guertel, string> = {
  weiss: 'Weiss',
  gelb: 'Gelb',
  orange: 'Orange',
  gruen: 'Gruen',
  blau: 'Blau',
  braun: 'Braun',
  schwarz: 'Schwarz (1. Dan)',
  dan2: '2. Dan',
  dan3: '3. Dan',
  dan4: '4. Dan',
  dan5: '5. Dan',
}

export const GUERTEL_COLOR: Record<Guertel, string> = {
  weiss: 'bg-white border border-gray-300 text-gray-700',
  gelb: 'bg-yellow-400 text-yellow-900',
  orange: 'bg-orange-400 text-white',
  gruen: 'bg-green-600 text-white',
  blau: 'bg-blue-600 text-white',
  braun: 'bg-amber-800 text-white',
  schwarz: 'bg-gray-900 text-white',
  dan2: 'bg-gray-900 text-white',
  dan3: 'bg-gray-900 text-white',
  dan4: 'bg-gray-900 text-white',
  dan5: 'bg-gray-900 text-white',
}
