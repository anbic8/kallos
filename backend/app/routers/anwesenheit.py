from datetime import date as date_type
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import User, Trainingsgruppe, TrainingsAnwesenheit, Gruppe, Kaempfer, Wochentag
from ..schemas import (
    TrainingsgruppeCreate, TrainingsgruppeUpdate, TrainingsgruppeResponse,
    TeilnehmerEintrag, AnwesenheitSaveRequest,
    KaempferAnwesenheitStatistik, TrainingsgruppenQuote, AnwesenheitVerlaufEintrag,
)
from ..deps import get_current_user, require_trainer

router = APIRouter(tags=["anwesenheit"])

WOCHENTAG_KURZ = {
    Wochentag.montag: "Mo", Wochentag.dienstag: "Di", Wochentag.mittwoch: "Mi",
    Wochentag.donnerstag: "Do", Wochentag.freitag: "Fr", Wochentag.samstag: "Sa", Wochentag.sonntag: "So",
}


def _load_tg(tg_id: int, db: Session) -> Trainingsgruppe:
    tg = (
        db.query(Trainingsgruppe)
        .options(joinedload(Trainingsgruppe.gruppe).joinedload(Gruppe.mitglieder))
        .filter(Trainingsgruppe.id == tg_id)
        .first()
    )
    if not tg:
        raise HTTPException(status_code=404, detail="Trainingsgruppe nicht gefunden")
    return tg


def _tg_label(tg: Trainingsgruppe) -> str:
    return f"{tg.gruppe.name} · {WOCHENTAG_KURZ[tg.wochentag]} {tg.uhrzeit.strftime('%H:%M')}"


# ---------- Trainingsgruppen ----------

@router.get("/api/trainingsgruppen", response_model=list[TrainingsgruppeResponse])
def list_trainingsgruppen(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return (
        db.query(Trainingsgruppe)
        .options(joinedload(Trainingsgruppe.gruppe))
        .order_by(Trainingsgruppe.wochentag, Trainingsgruppe.uhrzeit)
        .all()
    )


@router.post("/api/trainingsgruppen", response_model=TrainingsgruppeResponse, status_code=201)
def create_trainingsgruppe(
    data: TrainingsgruppeCreate, db: Session = Depends(get_db), _: User = Depends(require_trainer)
):
    tg = Trainingsgruppe(**data.model_dump())
    db.add(tg)
    db.commit()
    db.refresh(tg)
    return _load_tg(tg.id, db)


@router.get("/api/trainingsgruppen/{tg_id}", response_model=TrainingsgruppeResponse)
def get_trainingsgruppe(tg_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return _load_tg(tg_id, db)


@router.patch("/api/trainingsgruppen/{tg_id}", response_model=TrainingsgruppeResponse)
def update_trainingsgruppe(
    tg_id: int, data: TrainingsgruppeUpdate, db: Session = Depends(get_db), _: User = Depends(require_trainer)
):
    tg = db.get(Trainingsgruppe, tg_id)
    if not tg:
        raise HTTPException(status_code=404, detail="Trainingsgruppe nicht gefunden")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(tg, field, value)
    db.commit()
    return _load_tg(tg_id, db)


@router.delete("/api/trainingsgruppen/{tg_id}", status_code=204)
def delete_trainingsgruppe(tg_id: int, db: Session = Depends(get_db), _: User = Depends(require_trainer)):
    tg = db.get(Trainingsgruppe, tg_id)
    if not tg:
        raise HTTPException(status_code=404, detail="Trainingsgruppe nicht gefunden")
    db.delete(tg)
    db.commit()


# ---------- Anwesenheit erfassen ----------

@router.get("/api/trainingsgruppen/{tg_id}/teilnehmer", response_model=list[TeilnehmerEintrag])
def get_teilnehmer(
    tg_id: int, datum: date_type, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    tg = _load_tg(tg_id, db)

    mitglied_ids = {k.id for k in tg.gruppe.mitglieder}
    historische_ids = {
        row[0] for row in db.query(TrainingsAnwesenheit.kaempfer_id)
        .filter(TrainingsAnwesenheit.trainingsgruppe_id == tg_id).distinct().all()
    }
    alle_ids = mitglied_ids | historische_ids
    if not alle_ids:
        return []

    kaempfer_liste = (
        db.query(Kaempfer).filter(Kaempfer.id.in_(alle_ids))
        .order_by(Kaempfer.nachname, Kaempfer.vorname).all()
    )

    bestehende = {
        a.kaempfer_id: a.anwesend for a in db.query(TrainingsAnwesenheit).filter(
            TrainingsAnwesenheit.trainingsgruppe_id == tg_id,
            TrainingsAnwesenheit.datum == datum,
        ).all()
    }

    return [
        TeilnehmerEintrag(
            kaempfer_id=k.id, vorname=k.vorname, nachname=k.nachname, foto_url=k.foto_url,
            anwesend=bestehende.get(k.id, True),
        )
        for k in kaempfer_liste
    ]


@router.post("/api/trainingsgruppen/{tg_id}/anwesenheit", status_code=204)
def save_anwesenheit(
    tg_id: int, data: AnwesenheitSaveRequest, db: Session = Depends(get_db), _: User = Depends(require_trainer)
):
    if not db.get(Trainingsgruppe, tg_id):
        raise HTTPException(status_code=404, detail="Trainingsgruppe nicht gefunden")
    for eintrag in data.eintraege:
        bestehend = db.query(TrainingsAnwesenheit).filter(
            TrainingsAnwesenheit.trainingsgruppe_id == tg_id,
            TrainingsAnwesenheit.kaempfer_id == eintrag.kaempfer_id,
            TrainingsAnwesenheit.datum == data.datum,
        ).first()
        if bestehend:
            bestehend.anwesend = eintrag.anwesend
        else:
            db.add(TrainingsAnwesenheit(
                trainingsgruppe_id=tg_id, kaempfer_id=eintrag.kaempfer_id,
                datum=data.datum, anwesend=eintrag.anwesend,
            ))
    db.commit()


# ---------- Auswertung pro Kaempfer ----------

@router.get("/api/kaempfer/{kaempfer_id}/anwesenheit-statistik", response_model=KaempferAnwesenheitStatistik)
def get_kaempfer_anwesenheit(
    kaempfer_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    if not db.get(Kaempfer, kaempfer_id):
        raise HTTPException(status_code=404, detail="Kämpfer nicht gefunden")

    eintraege = (
        db.query(TrainingsAnwesenheit)
        .options(joinedload(TrainingsAnwesenheit.trainingsgruppe).joinedload(Trainingsgruppe.gruppe))
        .filter(TrainingsAnwesenheit.kaempfer_id == kaempfer_id)
        .order_by(TrainingsAnwesenheit.datum.desc())
        .all()
    )

    total = len(eintraege)
    anwesend = sum(1 for e in eintraege if e.anwesend)
    quote = round(anwesend / total * 100, 1) if total else 0.0

    nach_tg: dict[int, dict] = {}
    for e in eintraege:
        tg = e.trainingsgruppe
        if tg.id not in nach_tg:
            nach_tg[tg.id] = {"trainingsgruppe_id": tg.id, "label": _tg_label(tg), "total": 0, "anwesend": 0}
        nach_tg[tg.id]["total"] += 1
        if e.anwesend:
            nach_tg[tg.id]["anwesend"] += 1

    nach_trainingsgruppe = [
        TrainingsgruppenQuote(
            trainingsgruppe_id=v["trainingsgruppe_id"], label=v["label"],
            total=v["total"], anwesend=v["anwesend"],
            quote=round(v["anwesend"] / v["total"] * 100, 1) if v["total"] else 0.0,
        )
        for v in nach_tg.values()
    ]

    verlauf = [
        AnwesenheitVerlaufEintrag(
            datum=e.datum, anwesend=e.anwesend,
            trainingsgruppe_id=e.trainingsgruppe_id,
            trainingsgruppe_label=_tg_label(e.trainingsgruppe),
        )
        for e in eintraege[:20]
    ]

    return KaempferAnwesenheitStatistik(
        kaempfer_id=kaempfer_id, total_termine=total, anwesend=anwesend, quote=quote,
        nach_trainingsgruppe=nach_trainingsgruppe, verlauf=verlauf,
    )
