export type UserRolle = 'admin' | 'trainer' | 'athlet'
export type Guertel = 'weiss' | 'gelb' | 'orange' | 'gruen' | 'blau' | 'braun' | 'schwarz' | 'dan2' | 'dan3' | 'dan4' | 'dan5'
export type Geschlecht = 'm' | 'w' | 'd'
export type GKGeschlecht = 'm' | 'w'
export type Altersklasse = 'U9' | 'U11' | 'U13' | 'U15' | 'U18' | 'U21' | 'Senior'
export type TechnikKategorie = 'nage_waza' | 'katame_waza' | 'atemi_waza' | 'sonstiges'
export type VeranstaltungsTyp = 'liga' | 'turnier' | 'meisterschaft' | 'kampftag' | 'pokal' | 'sonstiges'
export type KampfRunde = 'vorrunde' | 'viertelfinale' | 'halbfinale' | 'finale' | 'gruppenphase' | 'direktkampf' | 'sonstiges'
export type Sieger = 'weiss' | 'blau' | 'unentschieden'
export type Abschluss = 'ippon' | 'waza_ari' | 'yusei_gachi' | 'shido' | 'hansoku_make' | 'aufgabe' | 'sonstiges'
export type EreignisTyp = 'ippon' | 'waza_ari' | 'yuko' | 'shido' | 'hansoku_make' | 'golden_score' | 'medizin' | 'sonstiges'
export type KaempferFarbe = 'weiss' | 'blau'

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
  gruppen?: { id: number; name: string }[]
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

export interface Veranstaltung {
  id: number
  name: string
  typ: VeranstaltungsTyp
  datum?: string
  ort?: string
  veranstalter?: string
  notizen?: string
  parent_liga_id?: number
}

export interface KaempferKurz {
  id: number
  vorname: string
  nachname: string
  verein_id?: number
  foto_url?: string
  aktueller_guertel?: Guertel
  verein?: Verein
}

export interface KampfEreignis {
  id: number
  kampf_id: number
  zeitpunkt_sek?: number
  typ: EreignisTyp
  farbe: KaempferFarbe
  technik_id?: number
  technik_frei?: string
  notiz?: string
  video_timestamp_sek?: number
  technik?: { id: number; name: string }
}

export interface Kampf {
  id: number
  veranstaltung_id: number
  kaempfer_weiss_id: number
  kaempfer_blau_id: number
  gewichtsklasse_id?: number
  runde?: KampfRunde
  uhrzeit?: string
  sieger: Sieger
  abschluss: Abschluss
  sieger_technik_id?: number
  sieger_technik_frei?: string
  kampfzeit_sek?: number
  is_scouting: boolean
  notizen?: string
  veranstaltung?: Veranstaltung
  kaempfer_weiss?: KaempferKurz
  kaempfer_blau?: KaempferKurz
  gewichtsklasse?: { id: number; bezeichnung: string }
  sieger_technik?: { id: number; name: string }
  ereignisse: KampfEreignis[]
  medien: KampfMedien[]
}

export type MedienTyp = 'foto' | 'video'
export type ErfolgKategorie = 'einzel' | 'mannschaft'

export interface KampfMedien {
  id: number
  kampf_id: number
  typ: MedienTyp
  datei_pfad?: string
  externe_url?: string
  timestamp_sek?: number
  beschriftung?: string
}

export interface Erfolg {
  id: number
  kaempfer_id: number
  veranstaltung_id: number
  gewichtsklasse_id?: number
  platz: number
  kategorie: ErfolgKategorie
  foto_url?: string
  notizen?: string
  veranstaltung?: Veranstaltung
  gewichtsklasse?: { id: number; bezeichnung: string }
}

export type IKKZRichtung = 'links' | 'rechts' | 'beide'
export type IKKZSituation = 'angriff' | 'konter' | 'aufsetzer' | 'ne_waza_einstieg' | 'sonstiges'
export type HauptwaffePosition = 'erst' | 'zweit'

export interface IKKZEintrag {
  id: number
  kaempfer_id: number
  technik_id?: number
  technik_frei?: string
  richtung: IKKZRichtung
  situation: IKKZSituation
  prioritaet: number
  kombinations_technik_id?: number
  kombinations_technik_frei?: string
  hauptwaffe_position?: HauptwaffePosition
  notizen?: string
  datum?: string
  technik?: { id: number; name: string }
  kombinations_technik?: { id: number; name: string }
}

export interface Leistungstest {
  id: number
  kaempfer_id: number
  datum: string
  testtyp: string
  messwert_zahl?: number
  messwert_text?: string
  einheit?: string
  notizen?: string
}

export interface KampfstrukturAnalyse {
  scoring: { frueh: number; mitte: number; spaet: number; golden_score: number }
  shido_erhalten: number
  golden_score_siege: number
  golden_score_niederlagen: number
}

export const IKKZ_RICHTUNG_LABEL: Record<IKKZRichtung, string> = {
  links: 'Links',
  rechts: 'Rechts',
  beide: 'Beide',
}

export const IKKZ_SITUATION_LABEL: Record<IKKZSituation, string> = {
  angriff: 'Angriff',
  konter: 'Konter',
  aufsetzer: 'Falltechnik (Aufsetzer)',
  ne_waza_einstieg: 'Ne-waza-Einstieg',
  sonstiges: 'Sonstiges',
}

export const IKKZ_PRIORITAET_LABEL: Record<number, string> = {
  1: 'Tokui-waza (Hauptwaffe)',
  2: 'Kombinationspartner',
  3: 'Variante',
}

export interface Gruppe {
  id: number
  name: string
  beschreibung?: string
  mitglieder_anzahl: number
}

export type KampflosSeite = 'heim' | 'gast'

export interface Einzelkampf {
  id: number
  mannschaftskampf_id: number
  gewichtsklasse_id?: number
  kampf_id?: number
  kampflos_sieger?: KampflosSeite
  gewichtsklasse?: { id: number; bezeichnung: string }
  kampf?: Kampf
}

export interface Mannschaftskampf {
  id: number
  veranstaltung_id: number
  verein_heim_id: number
  verein_gast_id: number
  siege_heim: number
  siege_gast: number
  siege_heim_direkt?: number
  siege_gast_direkt?: number
  ergebnis_modus: 'berechnet' | 'direkt'
  verein_heim?: Verein
  verein_gast?: Verein
  einzelkaempfe: Einzelkampf[]
}

export interface LigaTabelleneintrag {
  verein_id: number
  verein_name: string
  spiele: number
  siege: number
  niederlagen: number
  unentschieden: number
  punkte: number
}

export interface LigaTabelle {
  liga_id: number
  eintraege: LigaTabelleneintrag[]
}

export interface KaempferStatistik {
  kaempfer_id: number
  total: number
  siege: number
  niederlagen: number
  unentschieden: number
  techniken: { name: string; anzahl: number }[]
  abschluesse_siege: { typ: string; anzahl: number }[]
  abschluesse_niederlagen: { typ: string; anzahl: number }[]
  kampfstruktur: KampfstrukturAnalyse
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

// ---------- Label-Maps ----------

export const GUERTEL_LABEL: Record<Guertel, string> = {
  weiss: 'Weiss',
  gelb: 'Gelb',
  orange: 'Orange',
  gruen: 'Grün',
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

export const VERANSTALTUNGSTYP_LABEL: Record<VeranstaltungsTyp, string> = {
  liga: 'Liga',
  turnier: 'Turnier',
  meisterschaft: 'Meisterschaft',
  kampftag: 'Kampftag',
  pokal: 'Pokal',
  sonstiges: 'Sonstiges',
}

export const KAMPFRUNDE_LABEL: Record<KampfRunde, string> = {
  vorrunde: 'Vorrunde',
  viertelfinale: 'Viertelfinale',
  halbfinale: 'Halbfinale',
  finale: 'Finale',
  gruppenphase: 'Gruppenphase',
  direktkampf: 'Direktkampf',
  sonstiges: 'Sonstiges',
}

export const ABSCHLUSS_LABEL: Record<Abschluss, string> = {
  ippon: 'Ippon',
  waza_ari: 'Waza-ari',
  yusei_gachi: 'Yusei-gachi',
  shido: 'Shido (3)',
  hansoku_make: 'Hansoku-make',
  aufgabe: 'Aufgabe',
  sonstiges: 'Sonstiges',
}

export const EREIGNISTYP_LABEL: Record<EreignisTyp, string> = {
  ippon: 'Ippon',
  waza_ari: 'Waza-ari',
  yuko: 'Yuko',
  shido: 'Shido',
  hansoku_make: 'Hansoku-make',
  golden_score: 'Golden Score',
  medizin: 'Medizin',
  sonstiges: 'Sonstiges',
}

export const formatKampfzeit = (sek: number): string => {
  const m = Math.floor(sek / 60)
  const s = sek % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const formatZeitpunkt = (sek?: number): string => {
  if (sek == null) return ''
  const m = Math.floor(sek / 60)
  const s = sek % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
