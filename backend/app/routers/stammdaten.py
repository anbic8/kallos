from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Gewichtsklasse, Technik
from ..schemas import GewichtsklasseCreate, GewichtsklasseResponse, TechnikCreate, TechnikResponse
from ..deps import get_current_user, require_admin

router = APIRouter(tags=["stammdaten"])


# --- Gewichtsklassen ---

@router.get("/api/gewichtsklassen", response_model=list[GewichtsklasseResponse])
def list_gewichtsklassen(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Gewichtsklasse).order_by(Gewichtsklasse.altersklasse, Gewichtsklasse.geschlecht, Gewichtsklasse.max_kg).all()


@router.post("/api/gewichtsklassen", response_model=GewichtsklasseResponse, status_code=201)
def create_gewichtsklasse(data: GewichtsklasseCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    gk = Gewichtsklasse(**data.model_dump())
    db.add(gk)
    db.commit()
    db.refresh(gk)
    return gk


# --- Techniken ---

@router.get("/api/techniken", response_model=list[TechnikResponse])
def list_techniken(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Technik).order_by(Technik.kategorie, Technik.name).all()


@router.post("/api/techniken", response_model=TechnikResponse, status_code=201)
def create_technik(data: TechnikCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(Technik).filter(Technik.name == data.name).first():
        raise HTTPException(status_code=400, detail="Technik existiert bereits")
    technik = Technik(**data.model_dump())
    db.add(technik)
    db.commit()
    db.refresh(technik)
    return technik
