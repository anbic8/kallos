from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Veranstaltung
from ..schemas import VeranstaltungCreate, VeranstaltungUpdate, VeranstaltungResponse
from ..deps import get_current_user, require_trainer

router = APIRouter(prefix="/api/veranstaltungen", tags=["veranstaltungen"])


@router.get("", response_model=list[VeranstaltungResponse])
def list_veranstaltungen(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Veranstaltung).order_by(Veranstaltung.datum.desc().nullslast(), Veranstaltung.id.desc()).all()


@router.post("", response_model=VeranstaltungResponse, status_code=201)
def create_veranstaltung(
    data: VeranstaltungCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    v = Veranstaltung(**data.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.get("/{veranstaltung_id}", response_model=VeranstaltungResponse)
def get_veranstaltung(veranstaltung_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    v = db.get(Veranstaltung, veranstaltung_id)
    if not v:
        raise HTTPException(status_code=404, detail="Veranstaltung nicht gefunden")
    return v


@router.patch("/{veranstaltung_id}", response_model=VeranstaltungResponse)
def update_veranstaltung(
    veranstaltung_id: int,
    data: VeranstaltungUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    v = db.get(Veranstaltung, veranstaltung_id)
    if not v:
        raise HTTPException(status_code=404, detail="Veranstaltung nicht gefunden")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(v, field, value)
    db.commit()
    db.refresh(v)
    return v


@router.delete("/{veranstaltung_id}", status_code=204)
def delete_veranstaltung(
    veranstaltung_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    v = db.get(Veranstaltung, veranstaltung_id)
    if not v:
        raise HTTPException(status_code=404, detail="Veranstaltung nicht gefunden")
    db.delete(v)
    db.commit()
