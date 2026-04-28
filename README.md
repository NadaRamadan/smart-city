# 🌆 Smart City AI System

AI-powered urban issue detection, citizen reporting, and government dashboard.

## Architecture

```
smart-city-system/
├── backend/          FastAPI + YOLOv8 + MongoDB
├── ai/               Training scripts & dataset config
├── frontend-user/    Citizen reporter app (React + Vite, port 3000)
└── frontend-admin/   Government dashboard (React + Vite, port 3001)
```

## Quick Start

### 1. Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas URI)
- A trained `best.pt` YOLOv8 model (see AI section below)

---

### 2. Backend

```bash
cd backend
pip install -r requirements.txt

# Option A: use real model
cp /path/to/your/best.pt .

# Option B: skip model (returns mock results)
# The API will return 503 on /detect if best.pt is missing

uvicorn app:app --reload
# → http://localhost:8000
# → Docs: http://localhost:8000/docs
```

**Environment variables (optional):**
```
MONGO_URI=mongodb://localhost:27017
MODEL_PATH=best.pt
UPLOAD_DIR=uploads
```

---

### 3. Train the AI model

```bash
cd ai

# 1. Collect images of: garbage, pollution, smoke
# 2. Label them with Roboflow or CVAT
# 3. Export in YOLOv8 format to ai/dataset/

pip install ultralytics
python train.py
# Best model saved to: runs/detect/smart_city_v1/weights/best.pt
# Copy it to backend/best.pt
```

**Dataset structure:**
```
ai/dataset/
├── data.yaml
├── images/
│   ├── train/
│   └── val/
└── labels/
    ├── train/
    └── val/
```

**Classes:** `garbage`, `pollution`, `smoke`

---

### 4. Frontend — Citizen App

```bash
cd frontend-user
npm install
npm run dev
# → http://localhost:3000
```

Features:
- Drag & drop image upload
- Auto GPS location capture
- AI detection result with confidence bar
- Report submission feedback

---

### 5. Frontend — Admin Dashboard

```bash
cd frontend-admin
npm install
npm run dev
# → http://localhost:3001
```

Features:
- Live stat cards (auto-refresh every 15s)
- Detection breakdown bars
- Google Maps heatmap
- Filterable & searchable reports table

**To enable Google Maps heatmap:**
1. Get a Google Maps API key with Maps JavaScript API + Visualization library enabled
2. Replace `YOUR_GOOGLE_MAPS_API_KEY` in `frontend-admin/index.html`

---

## API Reference

| Method | Endpoint    | Description                        |
|--------|-------------|------------------------------------|
| GET    | `/`         | Health check                       |
| POST   | `/detect`   | Upload image → run YOLO detection  |
| GET    | `/reports`  | List all reports (newest first)    |
| GET    | `/stats`    | Aggregated counts by type          |
| GET    | `/docs`     | Swagger UI                         |

**POST /detect fields:**
- `file` — image (JPEG/PNG/WEBP, max 10MB)
- `lat` — float latitude
- `lng` — float longitude
- `reporter` — string (optional, default "anonymous")

---

## Detection Classes

| Class      | Icon | Description                    |
|------------|------|--------------------------------|
| garbage    | 🗑️   | Illegal dumping, litter        |
| pollution  | ☁️   | Water/air pollution            |
| smoke      | 💨   | Industrial smoke, fires        |
| clean      | ✅   | No issues detected             |

---

## Stack

- **Backend:** FastAPI, YOLOv8 (Ultralytics), MongoDB (pymongo)
- **Frontend:** React 18, Vite, CSS Modules
- **Maps:** Google Maps JavaScript API + HeatmapLayer
- **Fonts:** Space Mono, DM Sans
