import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import User, Erfolg
from ..schemas import ErfolgCreate, ErfolgUpdate, ErfolgResponse
from ..deps import get_current_user, require_trainer
from ..config import settings

router = APIRouter(prefix="/api/erfolge", tags=["erfolge"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FOTO_MB = 10


def _load_erfolg(erfolg_id: int, db: Session) -> Erfolg:
    e = (
        db.query(Erfolg)
        .options(joinedload(Erfolg.veranstaltung), joinedload(Erfolg.gewichtsklasse))
        .filter(Erfolg.id == erfolg_id)
        .first()
    )
    if not e:
        raise HTTPException(status_code=404, detail="Erfolg nicht gefunden")
    return e


@router.get("", response_model=list[ErfolgResponse])
def list_erfolge(
    kaempfer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Erfolg).options(joinedload(Erfolg.veranstaltung), joinedload(Erfolg.gewichtsklasse))
    if kaempfer_id:
        q = q.filter(Erfolg.kaempfer_id == kaempfer_id)
    return q.order_by(Erfolg.platz).all()


@router.post("", response_model=ErfolgResponse, status_code=201)
def create_erfolg(data: ErfolgCreate, db: Session = Depends(get_db), _: User = Depends(require_trainer)):
    e = Erfolg(**data.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return _load_erfolg(e.id, db)


@router.patch("/{erfolg_id}", response_model=ErfolgResponse)
def update_erfolg(
    erfolg_id: int, data: ErfolgUpdate, db: Session = Depends(get_db), _: User = Depends(require_trainer)
):
    e = db.get(Erfolg, erfolg_id)
    if not e:
        raise HTTPException(status_code=404, detail="Erfolg nicht gefunden")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(e, field, value)
    db.commit()
    return _load_erfolg(erfolg_id, db)


@router.delete("/{erfolg_id}", status_code=204)
def delete_erfolg(erfolg_id: int, db: Session = Depends(get_db), _: User = Depends(require_trainer)):
    e = db.get(Erfolg, erfolg_id)
    if not e:
        raise HTTPException(status_code=404, detail="Erfolg nicht gefunden")
    if e.foto_url:
        pfad = os.path.join(settings.media_dir, e.foto_url.lstrip("/media/"))
        if os.path.exists(pfad):
            os.remove(pfad)
    db.delete(e)
    db.commit()


@router.post("/{erfolg_id}/foto", response_model=ErfolgResponse)
async def upload_foto(
    erfolg_id: int,
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    e = db.get(Erfolg, erfolg_id)
    if not e:
        raise HTTPException(status_code=404, detail="Erfolg nicht gefunden")
    if foto.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Nur JPEG, PNG oder WebP erlaubt")
    content = await foto.read()
    if len(content) > MAX_FOTO_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Foto darf maximal {MAX_FOTO_MB} MB groß sein")
    if e.foto_url:
        old = os.path.join(settings.media_dir, e.foto_url.lstrip("/media/"))
        if os.path.exists(old):
            os.remove(old)
    ext = foto.filename.rsplit(".", 1)[-1].lower() if foto.filename and "." in foto.filename else "jpg"
    folder = os.path.join(settings.media_dir, "erfolge", str(erfolg_id))
    os.makedirs(folder, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{ext}"
    with open(os.path.join(folder, filename), "wb") as f:
        f.write(content)
    e.foto_url = f"/media/erfolge/{erfolg_id}/{filename}"
    db.commit()
    return _load_erfolg(erfolg_id, db)
