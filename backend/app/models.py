import enum
from datetime import datetime, date, time
from typing import Optional
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey, Enum as SAEnum, Boolean, Date, Time, Table, Column, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

# Assoziationstabelle Kaempfer <-> Gruppen (many-to-many)
kaempfer_gruppen = Table(
    "kaempfer_gruppen",
    Base.metadata,
    Column("kaempfer_id", Integer, ForeignKey("kaempfer.id"), primary_key=True),
    Column("gruppe_id", Integer, ForeignKey("gruppen.id"), primary_key=True),
)


# ---------- Enums ----------

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
    U9 = "U9"
    U11 = "U11"
    U13 = "U13"
    U15 = "U15"
    U18 = "U18"
    U21 = "U21"
    Senior = "Senior"


class TechnikKategorie(str, enum.Enum):
    nage_waza = "nage_waza"
    katame_waza = "katame_waza"
    atemi_waza = "atemi_waza"
    sonstiges = "sonstiges"


class VeranstaltungsTyp(str, enum.Enum):
    liga = "liga"
    turnier = "turnier"
    meisterschaft = "meisterschaft"
    kampftag = "kampftag"
    pokal = "pokal"
    sonstiges = "sonstiges"


class KampfRunde(str, enum.Enum):
    vorrunde = "vorrunde"
    viertelfinale = "viertelfinale"
    halbfinale = "halbfinale"
    finale = "finale"
    gruppenphase = "gruppenphase"
    direktkampf = "direktkampf"
    sonstiges = "sonstiges"


class Sieger(str, enum.Enum):
    weiss = "weiss"
    blau = "blau"
    unentschieden = "unentschieden"


class Abschluss(str, enum.Enum):
    ippon = "ippon"
    waza_ari = "waza_ari"
    yusei_gachi = "yusei_gachi"
    shido = "shido"
    hansoku_make = "hansoku_make"
    aufgabe = "aufgabe"
    sonstiges = "sonstiges"


class EreignisTyp(str, enum.Enum):
    ippon = "ippon"
    waza_ari = "waza_ari"
    yuko = "yuko"
    shido = "shido"
    hansoku_make = "hansoku_make"
    golden_score = "golden_score"
    medizin = "medizin"
    sonstiges = "sonstiges"


class KaempferFarbe(str, enum.Enum):
    weiss = "weiss"
    blau = "blau"


class HauptwaffePosition(str, enum.Enum):
    erst = "erst"
    zweit = "zweit"


class Wochentag(str, enum.Enum):
    montag = "montag"
    dienstag = "dienstag"
    mittwoch = "mittwoch"
    donnerstag = "donnerstag"
    freitag = "freitag"
    samstag = "samstag"
    sonntag = "sonntag"


class IKKZRichtung(str, enum.Enum):
    links = "links"
    rechts = "rechts"
    beide = "beide"


class IKKZSituation(str, enum.Enum):
    angriff = "angriff"
    konter = "konter"
    aufsetzer = "aufsetzer"
    ne_waza_einstieg = "ne_waza_einstieg"
    sonstiges = "sonstiges"


class KampflosSeite(str, enum.Enum):
    heim = "heim"
    gast = "gast"


class MedienTyp(str, enum.Enum):
    foto = "foto"
    video = "video"


class ErfolgKategorie(str, enum.Enum):
    einzel = "einzel"
    mannschaft = "mannschaft"


# ---------- Models ----------

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


class Gruppe(Base):
    __tablename__ = "gruppen"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    beschreibung: Mapped[Optional[str]] = mapped_column(String(500))

    mitglieder: Mapped[list["Kaempfer"]] = relationship(
        "Kaempfer", secondary="kaempfer_gruppen", back_populates="gruppen"
    )


class Trainingsgruppe(Base):
    __tablename__ = "trainingsgruppen"

    id: Mapped[int] = mapped_column(primary_key=True)
    gruppe_id: Mapped[int] = mapped_column(ForeignKey("gruppen.id"), nullable=False)
    wochentag: Mapped[Wochentag] = mapped_column(SAEnum(Wochentag), nullable=False)
    uhrzeit: Mapped[time] = mapped_column(Time, nullable=False)

    gruppe: Mapped["Gruppe"] = relationship("Gruppe")
    anwesenheiten: Mapped[list["TrainingsAnwesenheit"]] = relationship(
        "TrainingsAnwesenheit", cascade="all, delete-orphan"
    )


class TrainingsAnwesenheit(Base):
    __tablename__ = "trainings_anwesenheit"
    __table_args__ = (UniqueConstraint("trainingsgruppe_id", "kaempfer_id", "datum", name="uq_anwesenheit"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    trainingsgruppe_id: Mapped[int] = mapped_column(ForeignKey("trainingsgruppen.id"), nullable=False)
    kaempfer_id: Mapped[int] = mapped_column(ForeignKey("kaempfer.id"), nullable=False)
    datum: Mapped[date] = mapped_column(Date, nullable=False)
    anwesend: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    trainingsgruppe: Mapped["Trainingsgruppe"] = relationship("Trainingsgruppe", overlaps="anwesenheiten")
    kaempfer: Mapped["Kaempfer"] = relationship("Kaempfer")


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
    gruppen: Mapped[list["Gruppe"]] = relationship(
        "Gruppe", secondary="kaempfer_gruppen", back_populates="mitglieder"
    )


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


class Veranstaltung(Base):
    __tablename__ = "veranstaltungen"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    typ: Mapped[VeranstaltungsTyp] = mapped_column(SAEnum(VeranstaltungsTyp), nullable=False)
    datum: Mapped[Optional[date]] = mapped_column(Date)
    ort: Mapped[Optional[str]] = mapped_column(String(255))
    veranstalter: Mapped[Optional[str]] = mapped_column(String(255))
    notizen: Mapped[Optional[str]] = mapped_column(Text)
    parent_liga_id: Mapped[Optional[int]] = mapped_column(ForeignKey("veranstaltungen.id"), nullable=True)

    kaempfe: Mapped[list["Kampf"]] = relationship("Kampf", back_populates="veranstaltung", cascade="all, delete-orphan")


class Kampf(Base):
    __tablename__ = "kaempfe"

    id: Mapped[int] = mapped_column(primary_key=True)
    veranstaltung_id: Mapped[int] = mapped_column(ForeignKey("veranstaltungen.id"), nullable=False)
    kaempfer_weiss_id: Mapped[int] = mapped_column(ForeignKey("kaempfer.id"), nullable=False)
    kaempfer_blau_id: Mapped[int] = mapped_column(ForeignKey("kaempfer.id"), nullable=False)
    gewichtsklasse_id: Mapped[Optional[int]] = mapped_column(ForeignKey("gewichtsklassen.id"), nullable=True)
    runde: Mapped[Optional[KampfRunde]] = mapped_column(SAEnum(KampfRunde))
    uhrzeit: Mapped[Optional[time]] = mapped_column(Time)
    sieger: Mapped[Sieger] = mapped_column(SAEnum(Sieger), nullable=False)
    abschluss: Mapped[Abschluss] = mapped_column(SAEnum(Abschluss), nullable=False)
    sieger_technik_id: Mapped[Optional[int]] = mapped_column(ForeignKey("techniken.id"), nullable=True)
    sieger_technik_frei: Mapped[Optional[str]] = mapped_column(String(255))
    kampfzeit_sek: Mapped[Optional[int]] = mapped_column(Integer)
    is_scouting: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notizen: Mapped[Optional[str]] = mapped_column(Text)

    veranstaltung: Mapped["Veranstaltung"] = relationship("Veranstaltung", back_populates="kaempfe")
    kaempfer_weiss: Mapped["Kaempfer"] = relationship("Kaempfer", foreign_keys="[Kampf.kaempfer_weiss_id]")
    kaempfer_blau: Mapped["Kaempfer"] = relationship("Kaempfer", foreign_keys="[Kampf.kaempfer_blau_id]")
    gewichtsklasse: Mapped[Optional["Gewichtsklasse"]] = relationship("Gewichtsklasse")
    sieger_technik: Mapped[Optional["Technik"]] = relationship("Technik", foreign_keys="[Kampf.sieger_technik_id]")
    ereignisse: Mapped[list["KampfEreignis"]] = relationship(
        "KampfEreignis", back_populates="kampf", order_by="KampfEreignis.zeitpunkt_sek", cascade="all, delete-orphan"
    )
    medien: Mapped[list["KampfMedien"]] = relationship(
        "KampfMedien", back_populates="kampf", order_by="KampfMedien.id", cascade="all, delete-orphan"
    )


class KampfkonzeptEintrag(Base):
    __tablename__ = "kampfkonzept_eintraege"

    id: Mapped[int] = mapped_column(primary_key=True)
    kaempfer_id: Mapped[int] = mapped_column(ForeignKey("kaempfer.id"), nullable=False)
    technik_id: Mapped[Optional[int]] = mapped_column(ForeignKey("techniken.id"), nullable=True)
    technik_frei: Mapped[Optional[str]] = mapped_column(String(255))
    richtung: Mapped[IKKZRichtung] = mapped_column(SAEnum(IKKZRichtung), nullable=False)
    situation: Mapped[IKKZSituation] = mapped_column(SAEnum(IKKZSituation), nullable=False)
    prioritaet: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    kombinations_technik_id: Mapped[Optional[int]] = mapped_column(ForeignKey("techniken.id"), nullable=True)
    kombinations_technik_frei: Mapped[Optional[str]] = mapped_column(String(255))
    hauptwaffe_position: Mapped[Optional[HauptwaffePosition]] = mapped_column(SAEnum(HauptwaffePosition), nullable=True)
    notizen: Mapped[Optional[str]] = mapped_column(Text)
    erstellt_von: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    datum: Mapped[Optional[date]] = mapped_column(Date)

    kaempfer: Mapped["Kaempfer"] = relationship("Kaempfer")
    technik: Mapped[Optional["Technik"]] = relationship("Technik", foreign_keys="[KampfkonzeptEintrag.technik_id]")
    kombinations_technik: Mapped[Optional["Technik"]] = relationship("Technik", foreign_keys="[KampfkonzeptEintrag.kombinations_technik_id]")


class Leistungstest(Base):
    __tablename__ = "leistungstests"

    id: Mapped[int] = mapped_column(primary_key=True)
    kaempfer_id: Mapped[int] = mapped_column(ForeignKey("kaempfer.id"), nullable=False)
    datum: Mapped[date] = mapped_column(Date, nullable=False)
    testtyp: Mapped[str] = mapped_column(String(255), nullable=False)
    messwert_zahl: Mapped[Optional[float]] = mapped_column(Float)
    messwert_text: Mapped[Optional[str]] = mapped_column(String(255))
    einheit: Mapped[Optional[str]] = mapped_column(String(50))
    notizen: Mapped[Optional[str]] = mapped_column(Text)

    kaempfer: Mapped["Kaempfer"] = relationship("Kaempfer")


class KampfMedien(Base):
    __tablename__ = "kampf_medien"

    id: Mapped[int] = mapped_column(primary_key=True)
    kampf_id: Mapped[int] = mapped_column(ForeignKey("kaempfe.id"), nullable=False)
    typ: Mapped[MedienTyp] = mapped_column(SAEnum(MedienTyp), nullable=False)
    datei_pfad: Mapped[Optional[str]] = mapped_column(String(500))
    externe_url: Mapped[Optional[str]] = mapped_column(String(1000))
    timestamp_sek: Mapped[Optional[int]] = mapped_column(Integer)
    beschriftung: Mapped[Optional[str]] = mapped_column(String(500))

    kampf: Mapped["Kampf"] = relationship("Kampf", back_populates="medien")


class Erfolg(Base):
    __tablename__ = "erfolge"

    id: Mapped[int] = mapped_column(primary_key=True)
    kaempfer_id: Mapped[int] = mapped_column(ForeignKey("kaempfer.id"), nullable=False)
    veranstaltung_id: Mapped[int] = mapped_column(ForeignKey("veranstaltungen.id"), nullable=False)
    gewichtsklasse_id: Mapped[Optional[int]] = mapped_column(ForeignKey("gewichtsklassen.id"), nullable=True)
    platz: Mapped[int] = mapped_column(Integer, nullable=False)
    kategorie: Mapped[ErfolgKategorie] = mapped_column(SAEnum(ErfolgKategorie), nullable=False)
    foto_url: Mapped[Optional[str]] = mapped_column(String(500))
    notizen: Mapped[Optional[str]] = mapped_column(Text)

    kaempfer: Mapped["Kaempfer"] = relationship("Kaempfer")
    veranstaltung: Mapped["Veranstaltung"] = relationship("Veranstaltung")
    gewichtsklasse: Mapped[Optional["Gewichtsklasse"]] = relationship("Gewichtsklasse")


class Mannschaftskampf(Base):
    __tablename__ = "mannschaftskaempfe"

    id: Mapped[int] = mapped_column(primary_key=True)
    veranstaltung_id: Mapped[int] = mapped_column(ForeignKey("veranstaltungen.id"), nullable=False)
    verein_heim_id: Mapped[int] = mapped_column(ForeignKey("vereine.id"), nullable=False)
    verein_gast_id: Mapped[int] = mapped_column(ForeignKey("vereine.id"), nullable=False)
    siege_heim_direkt: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    siege_gast_direkt: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    veranstaltung: Mapped["Veranstaltung"] = relationship("Veranstaltung")
    verein_heim: Mapped["Verein"] = relationship("Verein", foreign_keys="[Mannschaftskampf.verein_heim_id]")
    verein_gast: Mapped["Verein"] = relationship("Verein", foreign_keys="[Mannschaftskampf.verein_gast_id]")
    einzelkaempfe: Mapped[list["MannschaftskampfEinzelkampf"]] = relationship(
        "MannschaftskampfEinzelkampf", back_populates="mannschaftskampf",
        order_by="MannschaftskampfEinzelkampf.id", cascade="all, delete-orphan"
    )


class MannschaftskampfEinzelkampf(Base):
    __tablename__ = "mannschaftskampf_einzelkaempfe"

    id: Mapped[int] = mapped_column(primary_key=True)
    mannschaftskampf_id: Mapped[int] = mapped_column(ForeignKey("mannschaftskaempfe.id"), nullable=False)
    gewichtsklasse_id: Mapped[Optional[int]] = mapped_column(ForeignKey("gewichtsklassen.id"), nullable=True)
    kampf_id: Mapped[Optional[int]] = mapped_column(ForeignKey("kaempfe.id"), nullable=True)
    kampflos_sieger: Mapped[Optional[KampflosSeite]] = mapped_column(SAEnum(KampflosSeite), nullable=True)

    mannschaftskampf: Mapped["Mannschaftskampf"] = relationship("Mannschaftskampf", back_populates="einzelkaempfe")
    gewichtsklasse: Mapped[Optional["Gewichtsklasse"]] = relationship("Gewichtsklasse")
    kampf: Mapped[Optional["Kampf"]] = relationship(
        "Kampf",
        primaryjoin="MannschaftskampfEinzelkampf.kampf_id == Kampf.id",
    )


class KampfEreignis(Base):
    __tablename__ = "kampf_ereignisse"

    id: Mapped[int] = mapped_column(primary_key=True)
    kampf_id: Mapped[int] = mapped_column(ForeignKey("kaempfe.id"), nullable=False)
    zeitpunkt_sek: Mapped[Optional[int]] = mapped_column(Integer)
    typ: Mapped[EreignisTyp] = mapped_column(SAEnum(EreignisTyp), nullable=False)
    farbe: Mapped[KaempferFarbe] = mapped_column(SAEnum(KaempferFarbe), nullable=False)
    technik_id: Mapped[Optional[int]] = mapped_column(ForeignKey("techniken.id"), nullable=True)
    technik_frei: Mapped[Optional[str]] = mapped_column(String(255))
    notiz: Mapped[Optional[str]] = mapped_column(Text)
    video_timestamp_sek: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    kampf: Mapped["Kampf"] = relationship("Kampf", back_populates="ereignisse")
    technik: Mapped[Optional["Technik"]] = relationship("Technik")
