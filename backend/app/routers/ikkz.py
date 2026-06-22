from datetime import date as date_type
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import User, KampfkonzeptEintrag
from ..schemas import IKKZCreate, IKKZUpdate, IKKZResponse
from ..deps import get_current_user, require_trainer

router = APIRouter(prefix="/api/ikkz", tags=["ikkz"])


def _load(ikkz_id: int, db: Session) -> KampfkonzeptEintrag:
    e = db.query(KampfkonzeptEintrag).options(
        joinedload(KampfkonzeptEintrag.technik)
    ).filter(KampfkonzeptEintrag.id == ikkz_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="IKKZ-Eintrag nicht gefunden")
    return e


@router.get("", response_model=list[IKKZResponse])
def list_ikkz(
    kaempfer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(KampfkonzeptEintrag).options(joinedload(KampfkonzeptEintrag.technik))
    if kaempfer_id:
        q = q.filter(KampfkonzeptEintrag.kaempfer_id == kaempfer_id)
    return q.order_by(KampfkonzeptEintrag.prioritaet, KampfkonzeptEintrag.id).all()


@router.post("", response_model=IKKZResponse, status_code=201)
def create_ikkz(
    data: IKKZCreate,
    kaempfer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_trainer),
):
    e = KampfkonzeptEintrag(
        kaempfer_id=kaempfer_id,
        erstellt_von=current_user.id,
        datum=data.datum or date_type.today(),
        **{k: v for k, v in data.model_dump().items() if k != "datum"},
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return _load(e.id, db)


@router.patch("/{ikkz_id}", response_model=IKKZResponse)
def update_ikkz(
    ikkz_id: int,
    data: IKKZUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    e = db.get(KampfkonzeptEintrag, ikkz_id)
    if not e:
        raise HTTPException(status_code=404, detail="IKKZ-Eintrag nicht gefunden")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(e, field, value)
    db.commit()
    return _load(ikkz_id, db)


@router.delete("/{ikkz_id}", status_code=204)
def delete_ikkz(ikkz_id: int, db: Session = Depends(get_db), _: User = Depends(require_trainer)):
    e = db.get(KampfkonzeptEintrag, ikkz_id)
    if not e:
        raise HTTPException(status_code=404, detail="IKKZ-Eintrag nicht gefunden")
    db.delete(e)
    db.commit()
