import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import User, Kaempfer, UserRolle
from ..schemas import KaempferCreate, KaempferUpdate, KaempferResponse
from ..deps import get_current_user, require_trainer
from ..config import settings

router = APIRouter(prefix="/api/kaempfer", tags=["kaempfer"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FOTO_MB = 10


def _kaempfer_or_403(kaempfer_id: int, current_user: User, db: Session) -> Kaempfer:
    """Gibt Kaempfer zurueck; Athlet darf nur sein eigenes Profil sehen/bearbeiten."""
    k = db.query(Kaempfer).options(joinedload(Kaempfer.verein)).filter(Kaempfer.id == kaempfer_id).first()
    if not k:
        raise HTTPException(status_code=404, detail="Kämpfer nicht gefunden")
    if current_user.rolle == UserRolle.athlet and k.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    return k


@router.get("", response_model=list[KaempferResponse])
def list_kaempfer(
    intern: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    intern=true  -> alle Kämpfer mit verein_id (Vereinsmitglieder)
    intern=false -> alle externen Kämpfer (verein_id null oder anderer Verein)
    Athlet sieht immer nur das eigene Profil.
    """
    q = db.query(Kaempfer).options(joinedload(Kaempfer.verein))
    if current_user.rolle == UserRolle.athlet:
        q = q.filter(Kaempfer.user_id == current_user.id)
    elif intern:
        q = q.filter(Kaempfer.verein_id.isnot(None))
    return q.order_by(Kaempfer.nachname, Kaempfer.vorname).all()


@router.post("", response_model=KaempferResponse, status_code=201)
def create_kaempfer(
    data: KaempferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_trainer),
):
    kaempfer = Kaempfer(**data.model_dump())
    db.add(kaempfer)
    db.commit()
    db.refresh(kaempfer)
    return db.query(Kaempfer).options(joinedload(Kaempfer.verein)).filter(Kaempfer.id == kaempfer.id).first()


@router.get("/{kaempfer_id}", response_model=KaempferResponse)
def get_kaempfer(
    kaempfer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _kaempfer_or_403(kaempfer_id, current_user, db)


@router.patch("/{kaempfer_id}", response_model=KaempferResponse)
def update_kaempfer(
    kaempfer_id: int,
    data: KaempferUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    k = _kaempfer_or_403(kaempfer_id, current_user, db)
    # Athlet darf Rolle-bezogene Felder nicht aendern
    updates = data.model_dump(exclude_none=True)
    if current_user.rolle == UserRolle.athlet:
        updates.pop("verein_id", None)
        updates.pop("user_id", None)
    for field, value in updates.items():
        setattr(k, field, value)
    db.commit()
    db.refresh(k)
    return db.query(Kaempfer).options(joinedload(Kaempfer.verein)).filter(Kaempfer.id == k.id).first()


@router.post("/{kaempfer_id}/foto", response_model=KaempferResponse)
async def upload_foto(
    kaempfer_id: int,
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    k = _kaempfer_or_403(kaempfer_id, current_user, db)

    if foto.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Nur JPEG, PNG oder WebP erlaubt")

    content = await foto.read()
    if len(content) > MAX_FOTO_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Foto darf maximal {MAX_FOTO_MB} MB gross sein")

    ext = foto.filename.rsplit(".", 1)[-1].lower() if foto.filename and "." in foto.filename else "jpg"
    folder = os.path.join(settings.media_dir, "kaempfer", str(kaempfer_id))
    os.makedirs(folder, exist_ok=True)

    # Altes Foto loeschen
    if k.foto_url:
        old_path = os.path.join(settings.media_dir, k.foto_url.lstrip("/media/"))
        if os.path.exists(old_path):
            os.remove(old_path)

    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(folder, filename)
    with open(filepath, "wb") as f:
        f.write(content)

    k.foto_url = f"/media/kaempfer/{kaempfer_id}/{filename}"
    db.commit()
    db.refresh(k)
    return db.query(Kaempfer).options(joinedload(Kaempfer.verein)).filter(Kaempfer.id == k.id).first()


@router.delete("/{kaempfer_id}", status_code=204)
def delete_kaempfer(
    kaempfer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    k = db.get(Kaempfer, kaempfer_id)
    if not k:
        raise HTTPException(status_code=404, detail="Kämpfer nicht gefunden")
    db.delete(k)
    db.commit()
