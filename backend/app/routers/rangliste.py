from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from typing import Optional
from ..models import User, Kaempfer, Verein, Kampf, Erfolg, Sieger, Abschluss
from ..deps import get_current_user

router = APIRouter(prefix="/api/rangliste", tags=["rangliste"])


@router.get("")
def get_rangliste(
    kriterium: str = "siege",
    min_kaempfe: int = 0,
    gruppe_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from ..models import Gruppe
    heimverein = db.query(Verein).order_by(Verein.id).first()
    if not heimverein:
        return []

    q = db.query(Kaempfer).filter(Kaempfer.verein_id == heimverein.id)
    if gruppe_id:
        q = q.filter(Kaempfer.gruppen.any(Gruppe.id == gruppe_id))
    kaempfer = q.all()
    kaempfer_ids = {k.id for k in kaempfer}

    kaempfe = db.query(Kampf).filter(
        (Kampf.kaempfer_weiss_id.in_(kaempfer_ids)) |
        (Kampf.kaempfer_blau_id.in_(kaempfer_ids))
    ).all()

    erfolge_alle = db.query(Erfolg).filter(Erfolg.kaempfer_id.in_(kaempfer_ids)).all()

    ranking = []
    for k in kaempfer:
        meine_kaempfe = [f for f in kaempfe if f.kaempfer_weiss_id == k.id or f.kaempfer_blau_id == k.id]
        total = len(meine_kaempfe)
        if total < min_kaempfe:
            continue

        siege = sum(
            1 for f in meine_kaempfe
            if (f.kaempfer_weiss_id == k.id and f.sieger == Sieger.weiss) or
               (f.kaempfer_blau_id == k.id and f.sieger == Sieger.blau)
        )
        ippons = sum(
            1 for f in meine_kaempfe
            if f.abschluss == Abschluss.ippon and (
                (f.kaempfer_weiss_id == k.id and f.sieger == Sieger.weiss) or
                (f.kaempfer_blau_id == k.id and f.sieger == Sieger.blau))
        )
        siegquote = round(siege / total * 100, 1) if total > 0 else 0.0
        meine_erfolge = [e for e in erfolge_alle if e.kaempfer_id == k.id]
        erfolge_punkte = sum(
            3 if e.platz == 1 else 2 if e.platz == 2 else 1 if e.platz == 3 else 0
            for e in meine_erfolge
        )
        turnier_siege = sum(1 for e in meine_erfolge if e.platz == 1)

        ranking.append({
            "kaempfer_id": k.id,
            "vorname": k.vorname,
            "nachname": k.nachname,
            "foto_url": k.foto_url,
            "aktueller_guertel": k.aktueller_guertel.value if k.aktueller_guertel else None,
            "total": total,
            "siege": siege,
            "ippons": ippons,
            "siegquote": siegquote,
            "turnier_siege": turnier_siege,
            "erfolge_punkte": erfolge_punkte,
        })

    sort_key = {
        "ippons": lambda x: (-x["ippons"], -x["siege"]),
        "siegquote": lambda x: (-x["siegquote"], -x["siege"]),
        "erfolge": lambda x: (-x["erfolge_punkte"], -x["turnier_siege"]),
        "turnier": lambda x: (-x["turnier_siege"], -x["erfolge_punkte"]),
    }.get(kriterium, lambda x: (-x["siege"], -x["siegquote"]))

    ranking.sort(key=sort_key)
    for i, r in enumerate(ranking):
        r["rang"] = i + 1
    return ranking
