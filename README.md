# TerraScan

> **See Earth change through radar.**  
> NASA Space Apps Challenge 2026 — *Dancing with the SARs*

TerraScan transforms NASA–ISRO Synthetic Aperture Radar (NISAR) observations into actionable surface-change intelligence, focusing on flood inundation and dynamic land changes.

---

## Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet & React-Leaflet (OpenStreetMap), Recharts, Lucide Icons.
- **Backend**: FastAPI, Pydantic, NumPy.
- **Color Theme**: Midnight Black (`#030712`) > Electric Cobalt Blue (`#1d4ed8`) > Acid Lime (`#a3e635`).
- **Cost**: 100% Free / Local First. No paid map tokens, no external AI/LLM API calls, no cloud database.

```
terrascan/
  frontend/          # Vite + React + TypeScript + Leaflet UI
  backend/           # FastAPI SAR analysis API & pipeline boundaries
    app/
      main.py        # Entry point & CORS
      api/           # REST endpoints (/health, /api/analyze, /api/demo-analysis)
      services/      # NISAR pipeline interfaces (loader, filter, threshold, polygonize)
      models/        # Pydantic data schemas
      utils/         # Testbed metadata & sample generators
  sample-data/       # Sample GeoJSON polygons and NISAR product metadata
  README.md
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

---

## Start Commands

### Start Backend (Port 8000)
From repository root:
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API docs available at: `http://localhost:8000/docs`

### Start Frontend (Port 3000)
From `frontend/` directory:
```bash
cd frontend
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_BACKEND_URL=http://localhost:8000
```
*(If backend is unreachable, frontend automatically operates in deterministic local fallback mode).*

---

## Current Demo Limitations (Milestone 1)
- Uses curated NISAR L-band testbed datasets (Brahmaputra, Mississippi, Danube) rather than real-time orbital downlinks.
- SAR backscatter values and thresholds are calibrated deterministically.
- GeoJSON flood polygons are pre-computed demonstration vectors.
- No live NASA Earthdata authentication required during Milestone 1.

---

## Future NISAR Integration (Milestone 2+)
- **Product Ingestion**: HDF5 / Cloud-Optimized GeoTIFF raster loader for NISAR L2 GCOV (Geocoded Covariance) products.
- **Calibration & Filtering**: Adaptive Refined Lee speckle filter and dual-pol (HH/HV) ratio processing.
- **Automated Thresholding**: Bimodal Kittler-Illingworth / Otsu surface water separation.
- **Vectorization**: Connected-component raster-to-polygon conversion via Rasterio / GDAL.
- **Extended Missions**: Wetlands, agricultural soil moisture, glacier velocity, and InSAR ground deformation (GSLC/GUNW).

---

## Team & Contact

- **Team Leader**:
  - Inzmam (`modh.inzmam007@gmail.com`)
- **Team Members**:
  - Anshuman (`iganshumanig@gmail.com`)
  - Dhanistha Nanda (`dhanistha.nanda@gmail.com`)
  - Anishka Yadav (`anishkayadav2808@gmail.com`)
