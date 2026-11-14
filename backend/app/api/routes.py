from fastapi import APIRouter, HTTPException
from ..models.analysis import AnalysisRequest, AnalysisResult, HealthResponse
from ..services.nisar_pipeline import NISARPipelineService
from ..utils.sample_generator import get_sample_locations

router = APIRouter()
pipeline_service = NISARPipelineService()

@router.get("/health", response_model=HealthResponse, tags=["Diagnostics"])
def health_check():
    """Health check endpoint verifying FastAPI service status and NISAR mission metadata."""
    return HealthResponse(
        status="operational",
        service="TerraScan NISAR SAR Engine",
        version="0.1.0-milestone1",
        radarMission="NASA-ISRO Synthetic Aperture Radar (NISAR)",
        supportedProducts=["GCOV", "GSLC", "GUNW"],
    )

@router.get("/api/demo-analysis", response_model=AnalysisResult, tags=["Analysis"])
def get_demo_analysis():
    """Returns curated baseline demonstration analysis for Brahmaputra testbed."""
    req = AnalysisRequest(
        location="brahmaputra",
        beforeDate="2026-05-12",
        afterDate="2026-06-24",
        analysisMode="flood",
    )
    return pipeline_service.execute_analysis(req)

@router.post("/api/analyze", response_model=AnalysisResult, tags=["Analysis"])
def run_sar_analysis(request: AnalysisRequest):
    """
    Execute SAR surface change analysis for requested parameters.
    Supports either:
    - Sample/demo analysis (default testbeds)
    - Real local raster analysis (via beforeRasterPath/afterRasterPath or synthetic_test)
    """
    if not request.location:
        raise HTTPException(status_code=400, detail="Target location must be specified.")
    if request.beforeDate >= request.afterDate:
        raise HTTPException(status_code=400, detail="Before date must precede after date.")

    try:
        return pipeline_service.execute_analysis(request)
    except FileNotFoundError as fnf_err:
        raise HTTPException(status_code=404, detail=str(fnf_err))
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline processing failed: {str(exc)}")

@router.get("/api/locations", tags=["Metadata"])
def list_locations():
    """Return available monitored testbed regions."""
    return {"locations": get_sample_locations()}
