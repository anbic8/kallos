from datetime import datetime, date, time
from typing import Optional
from pydantic import BaseModel, EmailStr
from .models import (
    UserRolle, Guertel, Geschlecht, GKGeschlecht, Altersklasse, TechnikKategorie,
    VeranstaltungsTyp, KampfRunde, Sieger, Abschluss, EreignisTyp, KaempferFarbe,
)


# ---------- Auth ----------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- User ----------

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    rolle: UserRolle = UserRolle.athlet


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    rolle: Optional[UserRolle] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    rolle: UserRolle
    created_at: datetime
    model_config = {"from_attributes": True}


# ---------- Verein ----------

class VereinCreate(BaseModel):
    name: str
    ort: Optional[str] = None
    verband: Optional[str] = None
    logo_url: Optional[str] = None


class VereinUpdate(BaseModel):
    name: Optional[str] = None
    ort: Optional[str] = None
    verband: Optional[str] = None
    logo_url: Optional[str] = None


class VereinResponse(BaseModel):
    id: int
    name: str
    ort: Optional[str] = None
    verband: Optional[str] = None
    logo_url: Optional[str] = None
    model_config = {"from_attributes": True}


# ---------- Kaempfer ----------

class KaempferCreate(BaseModel):
    vorname: str
    nachname: str
    verein_id: Optional[int] = None
    user_id: Optional[int] = None
    geburtsjahr: Optional[int] = None
    geschlecht: Optional[Geschlecht] = None
    aktueller_guertel: Optional[Guertel] = None
    notizen: Optional[str] = None


class KaempferUpdate(BaseModel):
    vorname: Optional[str] = None
    nachname: Optional[str] = None
    verein_id: Optional[int] = None
    user_id: Optional[int] = None
    geburtsjahr: Optional[int] = None
    geschlecht: Optional[Geschlecht] = None
    aktueller_guertel: Optional[Guertel] = None
    notizen: Optional[str] = None


class KaempferKurzResponse(BaseModel):
    id: int
    vorname: str
    nachname: str
    verein_id: Optional[int] = None
    foto_url: Optional[str] = None
    aktueller_guertel: Optional[Guertel] = None
    verein: Optional[VereinResponse] = None
    model_config = {"from_attributes": True}


class KaempferResponse(BaseModel):
    id: int
    vorname: str
    nachname: str
    verein_id: Optional[int] = None
    user_id: Optional[int] = None
    geburtsjahr: Optional[int] = None
    geschlecht: Optional[Geschlecht] = None
    aktueller_guertel: Optional[Guertel] = None
    foto_url: Optional[str] = None
    notizen: Optional[str] = None
    verein: Optional[VereinResponse] = None
    model_config = {"from_attributes": True}


# ---------- Gewichtsklasse ----------

class GewichtsklasseCreate(BaseModel):
    bezeichnung: str
    max_kg: Optional[float] = None
    geschlecht: Optional[GKGeschlecht] = None
    altersklasse: Optional[Altersklasse] = None


class GewichtsklasseResponse(BaseModel):
    id: int
    bezeichnung: str
    max_kg: Optional[float] = None
    geschlecht: Optional[GKGeschlecht] = None
    altersklasse: Optional[Altersklasse] = None
    model_config = {"from_attributes": True}


class GewichtsklasseKurzResponse(BaseModel):
    id: int
    bezeichnung: str
    model_config = {"from_attributes": True}


# ---------- Technik ----------

class TechnikCreate(BaseModel):
    name: str
    kategorie: Optional[TechnikKategorie] = None


class TechnikResponse(BaseModel):
    id: int
    name: str
    kategorie: Optional[TechnikKategorie] = None
    model_config = {"from_attributes": True}


class TechnikKurzResponse(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


# ---------- Veranstaltung ----------

class VeranstaltungCreate(BaseModel):
    name: str
    typ: VeranstaltungsTyp
    datum: Optional[date] = None
    ort: Optional[str] = None
    veranstalter: Optional[str] = None
    notizen: Optional[str] = None
    parent_liga_id: Optional[int] = None


class VeranstaltungUpdate(BaseModel):
    name: Optional[str] = None
    typ: Optional[VeranstaltungsTyp] = None
    datum: Optional[date] = None
    ort: Optional[str] = None
    veranstalter: Optional[str] = None
    notizen: Optional[str] = None
    parent_liga_id: Optional[int] = None


class VeranstaltungKurzResponse(BaseModel):
    id: int
    name: str
    typ: VeranstaltungsTyp
    datum: Optional[date] = None
    ort: Optional[str] = None
    model_config = {"from_attributes": True}


class VeranstaltungResponse(BaseModel):
    id: int
    name: str
    typ: VeranstaltungsTyp
    datum: Optional[date] = None
    ort: Optional[str] = None
    veranstalter: Optional[str] = None
    notizen: Optional[str] = None
    parent_liga_id: Optional[int] = None
    model_config = {"from_attributes": True}


# ---------- Kampf ----------

class KampfEreignisCreate(BaseModel):
    zeitpunkt_sek: Optional[int] = None
    typ: EreignisTyp
    farbe: KaempferFarbe
    technik_id: Optional[int] = None
    technik_frei: Optional[str] = None
    notiz: Optional[str] = None


class KampfEreignisResponse(BaseModel):
    id: int
    kampf_id: int
    zeitpunkt_sek: Optional[int] = None
    typ: EreignisTyp
    farbe: KaempferFarbe
    technik_id: Optional[int] = None
    technik_frei: Optional[str] = None
    notiz: Optional[str] = None
    technik: Optional[TechnikKurzResponse] = None
    model_config = {"from_attributes": True}


class KampfCreate(BaseModel):
    veranstaltung_id: int
    kaempfer_weiss_id: int
    kaempfer_blau_id: int
    gewichtsklasse_id: Optional[int] = None
    runde: Optional[KampfRunde] = None
    uhrzeit: Optional[time] = None
    sieger: Sieger
    abschluss: Abschluss
    sieger_technik_id: Optional[int] = None
    sieger_technik_frei: Optional[str] = None
    kampfzeit_sek: Optional[int] = None
    is_scouting: bool = False
    notizen: Optional[str] = None


class KampfUpdate(BaseModel):
    veranstaltung_id: Optional[int] = None
    kaempfer_weiss_id: Optional[int] = None
    kaempfer_blau_id: Optional[int] = None
    gewichtsklasse_id: Optional[int] = None
    runde: Optional[KampfRunde] = None
    uhrzeit: Optional[time] = None
    sieger: Optional[Sieger] = None
    abschluss: Optional[Abschluss] = None
    sieger_technik_id: Optional[int] = None
    sieger_technik_frei: Optional[str] = None
    kampfzeit_sek: Optional[int] = None
    is_scouting: Optional[bool] = None
    notizen: Optional[str] = None


class KampfResponse(BaseModel):
    id: int
    veranstaltung_id: int
    kaempfer_weiss_id: int
    kaempfer_blau_id: int
    gewichtsklasse_id: Optional[int] = None
    runde: Optional[KampfRunde] = None
    uhrzeit: Optional[time] = None
    sieger: Sieger
    abschluss: Abschluss
    sieger_technik_id: Optional[int] = None
    sieger_technik_frei: Optional[str] = None
    kampfzeit_sek: Optional[int] = None
    is_scouting: bool
    notizen: Optional[str] = None
    veranstaltung: Optional[VeranstaltungKurzResponse] = None
    kaempfer_weiss: Optional[KaempferKurzResponse] = None
    kaempfer_blau: Optional[KaempferKurzResponse] = None
    gewichtsklasse: Optional[GewichtsklasseKurzResponse] = None
    sieger_technik: Optional[TechnikKurzResponse] = None
    ereignisse: list[KampfEreignisResponse] = []
    model_config = {"from_attributes": True}


# ---------- Statistik ----------

class TechnikStatistik(BaseModel):
    name: str
    anzahl: int


class AbschlussStatistik(BaseModel):
    typ: str
    anzahl: int


class KaempferStatistik(BaseModel):
    kaempfer_id: int
    total: int
    siege: int
    niederlagen: int
    unentschieden: int
    techniken: list[TechnikStatistik]
    abschluesse: list[AbschlussStatistik]
