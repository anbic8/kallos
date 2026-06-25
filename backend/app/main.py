import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .routers import auth, kaempfer, vereine, stammdaten, veranstaltungen, kaempfe, medien, erfolge, mannschaft, ikkz, leistungstests, rangliste

app = FastAPI(title="JudoApp API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(kaempfer.router)
app.include_router(vereine.router)
app.include_router(stammdaten.router)
app.include_router(veranstaltungen.router)
app.include_router(kaempfe.router)
app.include_router(medien.router)
app.include_router(erfolge.router)
app.include_router(mannschaft.router)
app.include_router(ikkz.router)
app.include_router(leistungstests.router)
app.include_router(rangliste.router)

os.makedirs(settings.media_dir, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")


@app.get("/api/health")
def health():
    return {"status": "ok"}
