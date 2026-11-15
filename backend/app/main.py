from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router
from .api.satellite_routes import satellite_router

app = FastAPI(
    title="TerraScan - NISAR SAR Surface Change API",
    description=(
        "Mission API for TerraScan — NASA Space Apps Challenge 2026 ('Dancing with the SARs'). "
        "Provides radar change detection endpoints using NASA-ISRO Synthetic Aperture Radar (NISAR) data."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for local Vite frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "operational",
        "message": "TerraScan NISAR SAR Processing Backend is Live",
        "docs": "/docs",
        "health": "/health",
        "radarMission": "NASA-ISRO Synthetic Aperture Radar (NISAR)"
    }

app.include_router(router)
app.include_router(satellite_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
