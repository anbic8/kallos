from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import (
    User, Verein, Veranstaltung, Kampf, Kaempfer,
    Mannschaftskampf, MannschaftskampfEinzelkampf, KampfEreignis, KampfMedien,
    Sieger, KampflosSeite,
)
from ..schemas import (
    MannschaftskampfCreate, MannschaftskampfResponse,
    EinzelkampfCreate, EinzelkampfResponse,
    LigaTabelle, LigaTabelleneintrag,
)
from ..deps import get_current_user, require_trainer

router = APIRouter(tags=["mannschaft"])


def _load_mk(mk_id: int, db: Session) -> Mannschaftskampf:
    mk = (
        db.query(Mannschaftskampf)
        .options(
            joinedload(Mannschaftskampf.verein_heim),
            joinedload(Mannschaftskampf.verein_gast),
            joinedload(Mannschaftskampf.veranstaltung),
            joinedload(Mannschaftskampf.einzelkaempfe).options(
                joinedload(MannschaftskampfEinzelkampf.gewichtsklasse),
                joinedload(MannschaftskampfEinzelkampf.kampf).options(
                    joinedload(Kampf.kaempfer_weiss).joinedload(Kaempfer.verein),
                    joinedload(Kampf.kaempfer_blau).joinedload(Kaempfer.verein),
                    joinedload(Kampf.gewichtsklasse),
                    joinedload(Kampf.sieger_technik),
                    joinedload(Kampf.ereignisse).joinedload(KampfEreignis.technik),
                    joinedload(Kampf.medien),
                ),
            ),
        )
        .filter(Mannschaftskampf.id == mk_id)
        .first()
    )
    if not mk:
        raise HTTPException(status_code=404, detail="Mannschaftskampf nicht gefunden")
    return mk


def _compute_siege(mk: Mannschaftskampf, db: Session) -> tuple[int, int]:
    siege_heim = 0
    siege_gast = 0
    for ek in mk.einzelkaempfe:
        if ek.kampflos_sieger == KampflosSeite.heim:
            siege_heim += 1
        elif ek.kampflos_sieger == KampflosSeite.gast:
            siege_gast += 1
        elif ek.kampf:
            k = ek.kampf
            if k.sieger == Sieger.unentschieden:
                continue
            sieger_id = k.kaempfer_weiss_id if k.sieger == Sieger.weiss else k.kaempfer_blau_id
            kaempfer = db.get(Kaempfer, sieger_id)
            if kaempfer:
                if kaempfer.verein_id == mk.verein_heim_id:
                    siege_heim += 1
                elif kaempfer.verein_id == mk.verein_gast_id:
                    siege_gast += 1
    return siege_heim, siege_gast


def _mk_to_response(mk: Mannschaftskampf, db: Session) -> MannschaftskampfResponse:
    siege_heim, siege_gast = _compute_siege(mk, db)
    mk.siege_heim = siege_heim
    mk.siege_gast = siege_gast
    return MannschaftskampfResponse.model_validate(mk)


# ---------- Mannschaftskaempfe ----------

@router.get("/api/mannschaftskaempfe", response_model=list[MannschaftskampfResponse])
def list_mannschaftskaempfe(
    veranstaltung_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = (
        db.query(Mannschaftskampf)
        .options(
            joinedload(Mannschaftskampf.verein_heim),
            joinedload(Mannschaftskampf.verein_gast),
            joinedload(Mannschaftskampf.einzelkaempfe).options(
                joinedload(MannschaftskampfEinzelkampf.kampf).options(
                    joinedload(Kampf.kaempfer_weiss).joinedload(Kaempfer.verein),
                    joinedload(Kampf.kaempfer_blau).joinedload(Kaempfer.verein),
                ),
            ),
        )
    )
    if veranstaltung_id:
        q = q.filter(Mannschaftskampf.veranstaltung_id == veranstaltung_id)
    mks = q.all()
    return [_mk_to_response(mk, db) for mk in mks]


@router.post("/api/mannschaftskaempfe", response_model=MannschaftskampfResponse, status_code=201)
def create_mannschaftskampf(
    data: MannschaftskampfCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    mk = Mannschaftskampf(**data.model_dump())
    db.add(mk)
    db.commit()
    db.refresh(mk)
    return _mk_to_response(_load_mk(mk.id, db), db)


@router.get("/api/mannschaftskaempfe/{mk_id}", response_model=MannschaftskampfResponse)
def get_mannschaftskampf(mk_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return _mk_to_response(_load_mk(mk_id, db), db)


@router.delete("/api/mannschaftskaempfe/{mk_id}", status_code=204)
def delete_mannschaftskampf(mk_id: int, db: Session = Depends(get_db), _: User = Depends(require_trainer)):
    mk = db.get(Mannschaftskampf, mk_id)
    if not mk:
        raise HTTPException(status_code=404, detail="Mannschaftskampf nicht gefunden")
    db.delete(mk)
    db.commit()


@router.post("/api/mannschaftskaempfe/{mk_id}/einzelkaempfe", response_model=EinzelkampfResponse, status_code=201)
def add_einzelkampf(
    mk_id: int,
    data: EinzelkampfCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    if not db.get(Mannschaftskampf, mk_id):
        raise HTTPException(status_code=404, detail="Mannschaftskampf nicht gefunden")
    if not data.kampf_id and not data.kampflos_sieger:
        raise HTTPException(status_code=400, detail="Kampf oder Kampflos-Sieger erforderlich")
    ek = MannschaftskampfEinzelkampf(mannschaftskampf_id=mk_id, **data.model_dump())
    db.add(ek)
    db.commit()
    db.refresh(ek)
    return db.query(MannschaftskampfEinzelkampf).options(
        joinedload(MannschaftskampfEinzelkampf.gewichtsklasse),
        joinedload(MannschaftskampfEinzelkampf.kampf).options(
            joinedload(Kampf.kaempfer_weiss).joinedload(Kaempfer.verein),
            joinedload(Kampf.kaempfer_blau).joinedload(Kaempfer.verein),
            joinedload(Kampf.gewichtsklasse),
            joinedload(Kampf.sieger_technik),
            joinedload(Kampf.ereignisse),
            joinedload(Kampf.medien),
        ),
    ).filter(MannschaftskampfEinzelkampf.id == ek.id).first()


@router.delete("/api/mannschaftskaempfe/{mk_id}/einzelkaempfe/{ek_id}", status_code=204)
def delete_einzelkampf(
    mk_id: int,
    ek_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    ek = db.query(MannschaftskampfEinzelkampf).filter(
        MannschaftskampfEinzelkampf.id == ek_id,
        MannschaftskampfEinzelkampf.mannschaftskampf_id == mk_id,
    ).first()
    if not ek:
        raise HTTPException(status_code=404, detail="Einzelkampf nicht gefunden")
    db.delete(ek)
    db.commit()


# ---------- Liga-Tabelle ----------

@router.get("/api/veranstaltungen/{liga_id}/ligatabelle", response_model=LigaTabelle)
def get_ligatabelle(liga_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    liga = db.get(Veranstaltung, liga_id)
    if not liga:
        raise HTTPException(status_code=404, detail="Veranstaltung nicht gefunden")

    kampftage = db.query(Veranstaltung).filter(Veranstaltung.parent_liga_id == liga_id).all()
    if not kampftage:
        return LigaTabelle(liga_id=liga_id, eintraege=[])

    kampftag_ids = [k.id for k in kampftage]
    mannschaftskaempfe = (
        db.query(Mannschaftskampf)
        .filter(Mannschaftskampf.veranstaltung_id.in_(kampftag_ids))
        .options(
            joinedload(Mannschaftskampf.verein_heim),
            joinedload(Mannschaftskampf.verein_gast),
            joinedload(Mannschaftskampf.einzelkaempfe).joinedload(MannschaftskampfEinzelkampf.kampf),
        )
        .all()
    )

    tabelle: dict[int, dict] = {}

    def ensure(verein: Verein) -> None:
        if verein.id not in tabelle:
            tabelle[verein.id] = {
                "verein_id": verein.id, "verein_name": verein.name,
                "spiele": 0, "siege": 0, "niederlagen": 0, "unentschieden": 0, "punkte": 0,
            }

    for mk in mannschaftskaempfe:
        ensure(mk.verein_heim)
        ensure(mk.verein_gast)
        siege_heim, siege_gast = _compute_siege(mk, db)

        tabelle[mk.verein_heim_id]["spiele"] += 1
        tabelle[mk.verein_gast_id]["spiele"] += 1

        if siege_heim > siege_gast:
            tabelle[mk.verein_heim_id]["siege"] += 1
            tabelle[mk.verein_heim_id]["punkte"] += 2
            tabelle[mk.verein_gast_id]["niederlagen"] += 1
        elif siege_gast > siege_heim:
            tabelle[mk.verein_gast_id]["siege"] += 1
            tabelle[mk.verein_gast_id]["punkte"] += 2
            tabelle[mk.verein_heim_id]["niederlagen"] += 1
        else:
            tabelle[mk.verein_heim_id]["unentschieden"] += 1
            tabelle[mk.verein_heim_id]["punkte"] += 1
            tabelle[mk.verein_gast_id]["unentschieden"] += 1
            tabelle[mk.verein_gast_id]["punkte"] += 1

    eintraege = sorted(tabelle.values(), key=lambda x: (-x["punkte"], -x["siege"]))
    return LigaTabelle(liga_id=liga_id, eintraege=[LigaTabelleneintrag(**e) for e in eintraege])


# ---------- Kampftage einer Liga ----------

@router.get("/api/veranstaltungen/{liga_id}/kampftage", response_model=list[dict])
def get_kampftage(liga_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Veranstaltung).filter(
        Veranstaltung.parent_liga_id == liga_id
    ).order_by(Veranstaltung.datum).all()
