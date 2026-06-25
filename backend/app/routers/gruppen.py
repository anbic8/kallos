from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import User, Gruppe, Kaempfer
from ..schemas import GruppeCreate, GruppeUpdate, GruppeResponse, KaempferResponse
from ..deps import get_current_user, require_trainer

router = APIRouter(prefix="/api/gruppen", tags=["gruppen"])


def _load(gruppe_id: int, db: Session) -> Gruppe:
    g = db.query(Gruppe).options(joinedload(Gruppe.mitglieder)).filter(Gruppe.id == gruppe_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Gruppe nicht gefunden")
    return g


def _to_response(g: Gruppe) -> dict:
    return {
        "id": g.id,
        "name": g.name,
        "beschreibung": g.beschreibung,
        "mitglieder_anzahl": len(g.mitglieder),
    }


@router.get("", response_model=list[GruppeResponse])
def list_gruppen(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    gruppen = db.query(Gruppe).options(joinedload(Gruppe.mitglieder)).order_by(Gruppe.name).all()
    return [_to_response(g) for g in gruppen]


@router.post("", response_model=GruppeResponse, status_code=201)
def create_gruppe(data: GruppeCreate, db: Session = Depends(get_db), _: User = Depends(require_trainer)):
    if db.query(Gruppe).filter(Gruppe.name == data.name).first():
        raise HTTPException(status_code=400, detail="Gruppenname bereits vergeben")
    g = Gruppe(**data.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    return _to_response(_load(g.id, db))


@router.patch("/{gruppe_id}", response_model=GruppeResponse)
def update_gruppe(gruppe_id: int, data: GruppeUpdate, db: Session = Depends(get_db), _: User = Depends(require_trainer)):
    g = db.get(Gruppe, gruppe_id)
    if not g:
        raise HTTPException(status_code=404, detail="Gruppe nicht gefunden")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(g, field, value)
    db.commit()
    return _to_response(_load(gruppe_id, db))


@router.delete("/{gruppe_id}", status_code=204)
def delete_gruppe(gruppe_id: int, db: Session = Depends(get_db), _: User = Depends(require_trainer)):
    g = db.get(Gruppe, gruppe_id)
    if not g:
        raise HTTPException(status_code=404, detail="Gruppe nicht gefunden")
    db.delete(g)
    db.commit()


@router.get("/{gruppe_id}/mitglieder", response_model=list[KaempferResponse])
def list_mitglieder(gruppe_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    g = _load(gruppe_id, db)
    return g.mitglieder


@router.post("/{gruppe_id}/mitglieder/{kaempfer_id}", status_code=204)
def add_mitglied(gruppe_id: int, kaempfer_id: int, db: Session = Depends(get_db), _: User = Depends(require_trainer)):
    g = _load(gruppe_id, db)
    k = db.get(Kaempfer, kaempfer_id)
    if not k:
        raise HTTPException(status_code=404, detail="Kämpfer nicht gefunden")
    if k not in g.mitglieder:
        g.mitglieder.append(k)
        db.commit()


@router.delete("/{gruppe_id}/mitglieder/{kaempfer_id}", status_code=204)
def remove_mitglied(gruppe_id: int, kaempfer_id: int, db: Session = Depends(get_db), _: User = Depends(require_trainer)):
    g = _load(gruppe_id, db)
    k = db.get(Kaempfer, kaempfer_id)
    if k and k in g.mitglieder:
        g.mitglieder.remove(k)
        db.commit()
