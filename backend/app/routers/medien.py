import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Kampf, KampfMedien, MedienTyp
from ..schemas import KampfMedienResponse
from ..deps import get_current_user, require_trainer
from ..config import settings

router = APIRouter(prefix="/api/kaempfe", tags=["medien"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"}
MAX_MEDIEN_MB = 2000


@router.post("/{kampf_id}/medien", response_model=KampfMedienResponse, status_code=201)
async def add_medien(
    kampf_id: int,
    typ: MedienTyp = Form(...),
    beschriftung: Optional[str] = Form(None),
    timestamp_sek: Optional[int] = Form(None),
    externe_url: Optional[str] = Form(None),
    datei: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    if not db.get(Kampf, kampf_id):
        raise HTTPException(status_code=404, detail="Kampf nicht gefunden")
    if not datei and not externe_url:
        raise HTTPException(status_code=400, detail="Datei oder externe URL erforderlich")

    datei_pfad = None
    if datei:
        content_type = datei.content_type or ""
        allowed = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES
        if content_type not in allowed:
            raise HTTPException(status_code=400, detail="Nicht unterstützter Dateityp")
        content = await datei.read()
        if len(content) > MAX_MEDIEN_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Datei darf maximal {MAX_MEDIEN_MB} MB groß sein")
        ext = datei.filename.rsplit(".", 1)[-1].lower() if datei.filename and "." in datei.filename else "bin"
        folder = os.path.join(settings.media_dir, "kaempfe", str(kampf_id))
        os.makedirs(folder, exist_ok=True)
        filename = f"{uuid.uuid4().hex}.{ext}"
        with open(os.path.join(folder, filename), "wb") as f:
            f.write(content)
        datei_pfad = f"/media/kaempfe/{kampf_id}/{filename}"

    medien = KampfMedien(
        kampf_id=kampf_id,
        typ=typ,
        datei_pfad=datei_pfad,
        externe_url=externe_url,
        timestamp_sek=timestamp_sek,
        beschriftung=beschriftung,
    )
    db.add(medien)
    db.commit()
    db.refresh(medien)
    return medien


@router.delete("/{kampf_id}/medien/{medien_id}", status_code=204)
def delete_medien(
    kampf_id: int,
    medien_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_trainer),
):
    m = db.query(KampfMedien).filter(KampfMedien.id == medien_id, KampfMedien.kampf_id == kampf_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Medien nicht gefunden")
    if m.datei_pfad:
        pfad = os.path.join(settings.media_dir, m.datei_pfad.lstrip("/media/"))
        if os.path.exists(pfad):
            os.remove(pfad)
    db.delete(m)
    db.commit()
