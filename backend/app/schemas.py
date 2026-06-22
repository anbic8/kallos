from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from .models import UserRolle, Guertel, Geschlecht, GKGeschlecht, Altersklasse, TechnikKategorie


# --- Auth ---

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- User ---

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


# --- Verein ---

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


# --- Kaempfer ---

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


# --- Gewichtsklasse ---

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


# --- Technik ---

class TechnikCreate(BaseModel):
    name: str
    kategorie: Optional[TechnikKategorie] = None


class TechnikResponse(BaseModel):
    id: int
    name: str
    kategorie: Optional[TechnikKategorie] = None
    model_config = {"from_attributes": True}
