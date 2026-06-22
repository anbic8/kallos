import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .routers import auth, kaempfer, vereine, stammdaten, veranstaltungen, kaempfe

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

os.makedirs(settings.media_dir, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")


@app.get("/api/health")
def health():
    return {"status": "ok"}
