from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os

from model import predict
from utils import save_image
from db import insert_report, get_reports, get_stats
app = FastAPI(
    title="Smart City AIa API",
    description="AI-powered urban issue detection and reporting system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/", tags=["Health"])
def home():
    return {"status": "Smart City AI Running", "version": "1.0.0"}


@app.post("/detect", tags=["Detection"])
async def detect(
    file: UploadFile = File(...),
    lat: float = Form(...),
    lng: float = Form(...),
    reporter: str = Form(default="anonymous")
):
    try:
        path, file_id = await save_image(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        result = predict(path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    # Clean detections for MongoDB (only store simple types)
    clean_detections = [
        {
            "type": str(d["type"]),
            "confidence": float(d["confidence"]),
        }
        for d in result.get("all_detections", [])
    ]

    data = {
        "file_id": file_id,
        "type": str(result["type"]),
        "confidence": float(result["confidence"]),
        "all_detections": clean_detections,
        "lat": float(lat),
        "lng": float(lng),
        "reporter": str(reporter),
    }

    insert_report(data)
    return data
    """
    Upload an image to detect urban issues (garbage, pollution, smoke).
    Returns the detected type, confidence score, and stores the report.
    """
    try:
        path, file_id = await save_image(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        result = predict(path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

    data = {
        "file_id": file_id,
        "image_url": f"/uploads/{file_id}.jpg",
        "type": result["type"],
        "confidence": result["confidence"],
        "all_detections": result.get("all_detections", []),
        "lat": lat,
        "lng": lng,
        "reporter": reporter,
    }

    insert_report(data)
    return data


@app.get("/reports", tags=["Reports"])
def reports(limit: int = Query(default=200, le=500)):
    """Fetch all submitted reports, newest first."""
    return get_reports(limit=limit)


@app.get("/stats", tags=["Reports"])
def stats():
    """Get aggregated detection counts by type."""
    return get_stats()


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
