from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Leistungstest
from ..schemas import LeistungstestCreate, LeistungstestResponse
from ..deps import get_current_user, require_trainer

router = APIRouter(prefix="/api/leistungstests", tags=["leistungstests"])


@router.get("", response_model=list[LeistungstestResponse])
def list_tests(
    kaempfer_id: Optional[int] = None,
    testtyp: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Leistungstest)
    if kaempfer_id:
        q = q.filter(Leistungstest.kaempfer_id == kaempfer_id)
    if testtyp:
        q = q.filter(Leistungstest.testtyp == testtyp)
    return q.order_by(Leistungstest.datum.desc()).all()


@router.post("", response_model=LeistungstestResponse, status_code=201)
def create_test(
    data: LeistungstestCreate,
    kaempfer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    t = Leistungstest(kaempfer_id=kaempfer_id, **data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{test_id}", status_code=204)
def delete_test(test_id: int, db: Session = Depends(get_db), _: User = Depends(require_trainer)):
    t = db.get(Leistungstest, test_id)
    if not t:
        raise HTTPException(status_code=404, detail="Test nicht gefunden")
    db.delete(t)
    db.commit()
