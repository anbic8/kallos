import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class UserRolle(str, enum.Enum):
    admin = "admin"
    trainer = "trainer"
    athlet = "athlet"


class Guertel(str, enum.Enum):
    weiss = "weiss"
    gelb = "gelb"
    orange = "orange"
    gruen = "gruen"
    blau = "blau"
    braun = "braun"
    schwarz = "schwarz"
    dan2 = "dan2"
    dan3 = "dan3"
    dan4 = "dan4"
    dan5 = "dan5"


class Geschlecht(str, enum.Enum):
    m = "m"
    w = "w"
    d = "d"


class GKGeschlecht(str, enum.Enum):
    m = "m"
    w = "w"


class Altersklasse(str, enum.Enum):
    U15 = "U15"
    U18 = "U18"
    U21 = "U21"
    Senior = "Senior"


class TechnikKategorie(str, enum.Enum):
    nage_waza = "nage_waza"
    katame_waza = "katame_waza"
    atemi_waza = "atemi_waza"
    sonstiges = "sonstiges"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rolle: Mapped[UserRolle] = mapped_column(SAEnum(UserRolle), nullable=False, default=UserRolle.athlet)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    kaempfer: Mapped[Optional["Kaempfer"]] = relationship("Kaempfer", back_populates="user", uselist=False)


class Verein(Base):
    __tablename__ = "vereine"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    ort: Mapped[Optional[str]] = mapped_column(String(255))
    verband: Mapped[Optional[str]] = mapped_column(String(255))
    logo_url: Mapped[Optional[str]] = mapped_column(String(500))

    kaempfer: Mapped[list["Kaempfer"]] = relationship("Kaempfer", back_populates="verein")


class Kaempfer(Base):
    __tablename__ = "kaempfer"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    verein_id: Mapped[Optional[int]] = mapped_column(ForeignKey("vereine.id"), nullable=True)
    vorname: Mapped[str] = mapped_column(String(100), nullable=False)
    nachname: Mapped[str] = mapped_column(String(100), nullable=False)
    geburtsjahr: Mapped[Optional[int]] = mapped_column(Integer)
    geschlecht: Mapped[Optional[Geschlecht]] = mapped_column(SAEnum(Geschlecht))
    aktueller_guertel: Mapped[Optional[Guertel]] = mapped_column(SAEnum(Guertel))
    foto_url: Mapped[Optional[str]] = mapped_column(String(500))
    notizen: Mapped[Optional[str]] = mapped_column(Text)

    user: Mapped[Optional[User]] = relationship("User", back_populates="kaempfer")
    verein: Mapped[Optional[Verein]] = relationship("Verein", back_populates="kaempfer")


class Gewichtsklasse(Base):
    __tablename__ = "gewichtsklassen"

    id: Mapped[int] = mapped_column(primary_key=True)
    bezeichnung: Mapped[str] = mapped_column(String(50), nullable=False)
    max_kg: Mapped[Optional[float]] = mapped_column(Float)
    geschlecht: Mapped[Optional[GKGeschlecht]] = mapped_column(SAEnum(GKGeschlecht))
    altersklasse: Mapped[Optional[Altersklasse]] = mapped_column(SAEnum(Altersklasse))


class Technik(Base):
    __tablename__ = "techniken"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    kategorie: Mapped[Optional[TechnikKategorie]] = mapped_column(SAEnum(TechnikKategorie))
