from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Verein
from ..schemas import VereinCreate, VereinUpdate, VereinResponse
from ..deps import get_current_user, require_admin

router = APIRouter(prefix="/api/vereine", tags=["vereine"])


@router.get("", response_model=list[VereinResponse])
def list_vereine(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Verein).all()


@router.get("/heimverein", response_model=VereinResponse)
def get_heimverein(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    v = db.query(Verein).order_by(Verein.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Kein Verein gefunden")
    return v


@router.post("", response_model=VereinResponse, status_code=201)
def create_verein(data: VereinCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    verein = Verein(**data.model_dump())
    db.add(verein)
    db.commit()
    db.refresh(verein)
    return verein


@router.get("/{verein_id}", response_model=VereinResponse)
def get_verein(verein_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    verein = db.get(Verein, verein_id)
    if not verein:
        raise HTTPException(status_code=404, detail="Verein nicht gefunden")
    return verein


@router.patch("/{verein_id}", response_model=VereinResponse)
def update_verein(verein_id: int, data: VereinUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    verein = db.get(Verein, verein_id)
    if not verein:
        raise HTTPException(status_code=404, detail="Verein nicht gefunden")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(verein, field, value)
    db.commit()
    db.refresh(verein)
    return verein
