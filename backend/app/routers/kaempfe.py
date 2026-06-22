from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import User, Kampf, KampfEreignis, KampfMedien, Kaempfer, UserRolle, Sieger
from ..schemas import KampfCreate, KampfUpdate, KampfResponse, KampfEreignisCreate, KampfEreignisResponse
from ..deps import get_current_user, require_trainer

router = APIRouter(prefix="/api/kaempfe", tags=["kaempfe"])


def _load_kampf(kampf_id: int, db: Session) -> Kampf:
    k = (
        db.query(Kampf)
        .options(
            joinedload(Kampf.veranstaltung),
            joinedload(Kampf.kaempfer_weiss).joinedload(Kaempfer.verein),
            joinedload(Kampf.kaempfer_blau).joinedload(Kaempfer.verein),
            joinedload(Kampf.gewichtsklasse),
            joinedload(Kampf.sieger_technik),
            joinedload(Kampf.ereignisse).joinedload(KampfEreignis.technik),
            joinedload(Kampf.medien),
        )
        .filter(Kampf.id == kampf_id)
        .first()
    )
    if not k:
        raise HTTPException(status_code=404, detail="Kampf nicht gefunden")
    return k


@router.get("", response_model=list[KampfResponse])
def list_kaempfe(
    veranstaltung_id: Optional[int] = None,
    kaempfer_id: Optional[int] = None,
    is_scouting: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = (
        db.query(Kampf)
        .options(
            joinedload(Kampf.veranstaltung),
            joinedload(Kampf.kaempfer_weiss).joinedload(Kaempfer.verein),
            joinedload(Kampf.kaempfer_blau).joinedload(Kaempfer.verein),
            joinedload(Kampf.gewichtsklasse),
            joinedload(Kampf.sieger_technik),
            joinedload(Kampf.ereignisse).joinedload(KampfEreignis.technik),
            joinedload(Kampf.medien),
        )
    )
    if veranstaltung_id:
        q = q.filter(Kampf.veranstaltung_id == veranstaltung_id)
    if kaempfer_id:
        q = q.filter((Kampf.kaempfer_weiss_id == kaempfer_id) | (Kampf.kaempfer_blau_id == kaempfer_id))
    if is_scouting is not None:
        q = q.filter(Kampf.is_scouting == is_scouting)
    if current_user.rolle == UserRolle.athlet and current_user.kaempfer:
        kid = current_user.kaempfer.id
        q = q.filter((Kampf.kaempfer_weiss_id == kid) | (Kampf.kaempfer_blau_id == kid))
    return q.order_by(Kampf.id.desc()).all()


@router.post("", response_model=KampfResponse, status_code=201)
def create_kampf(
    data: KampfCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    kampf = Kampf(**data.model_dump())
    db.add(kampf)
    db.commit()
    db.refresh(kampf)
    return _load_kampf(kampf.id, db)


@router.get("/{kampf_id}", response_model=KampfResponse)
def get_kampf(kampf_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return _load_kampf(kampf_id, db)


@router.patch("/{kampf_id}", response_model=KampfResponse)
def update_kampf(
    kampf_id: int,
    data: KampfUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    kampf = db.get(Kampf, kampf_id)
    if not kampf:
        raise HTTPException(status_code=404, detail="Kampf nicht gefunden")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(kampf, field, value)
    db.commit()
    return _load_kampf(kampf_id, db)


@router.delete("/{kampf_id}", status_code=204)
def delete_kampf(kampf_id: int, db: Session = Depends(get_db), _: User = Depends(require_trainer)):
    kampf = db.get(Kampf, kampf_id)
    if not kampf:
        raise HTTPException(status_code=404, detail="Kampf nicht gefunden")
    db.delete(kampf)
    db.commit()


@router.post("/{kampf_id}/ereignisse", response_model=KampfEreignisResponse, status_code=201)
def add_ereignis(
    kampf_id: int,
    data: KampfEreignisCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    if not db.get(Kampf, kampf_id):
        raise HTTPException(status_code=404, detail="Kampf nicht gefunden")
    ereignis = KampfEreignis(kampf_id=kampf_id, **data.model_dump())
    db.add(ereignis)
    db.commit()
    db.refresh(ereignis)
    return ereignis


@router.delete("/{kampf_id}/ereignisse/{ereignis_id}", status_code=204)
def delete_ereignis(
    kampf_id: int,
    ereignis_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    e = db.query(KampfEreignis).filter(KampfEreignis.id == ereignis_id, KampfEreignis.kampf_id == kampf_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Ereignis nicht gefunden")
    db.delete(e)
    db.commit()
