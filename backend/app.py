"""
Holocron backend (FastAPI).

Serves the built web app from ../dist and exposes an /api for anything that
needs a server later. The app itself still works without this server: it is a
static PWA (GitHub Pages / Cloudflare Pages). Run from the repo root:

    npm run build
    backend/.venv/bin/uvicorn app:app --app-dir backend --host 0.0.0.0 --port 8000 --reload

Then open http://localhost:8000/holocron/ (or the Mac's LAN address on the phone).
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

app = FastAPI(title="Holocron API", version="0.1.0")


@app.get("/api/health")
def health() -> dict:
    """Quick check that the server is up and the built app exists."""
    return {"ok": True, "app_built": (DIST / "index.html").exists()}


# --- static app --------------------------------------------------------------
# The Vite build uses base '/holocron/', so the app is mounted there.
if DIST.exists():
    app.mount("/holocron", StaticFiles(directory=DIST, html=True), name="app")


@app.get("/")
def root():
    if (DIST / "index.html").exists():
        return FileResponse(DIST / "index.html")
    return JSONResponse({"message": "Run `npm run build` first; the built app goes in dist/."}, status_code=503)
