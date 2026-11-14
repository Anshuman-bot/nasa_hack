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

@router.get("/api/nisar/metadata", tags=["Metadata"])
def inspect_nisar_metadata():
    """Inspect and return standardized metadata for local NISAR GCOV sample files."""
    import os
    from ..services.nisar_gcov_adapter import NISARGCOVAdapter
    nisar_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../sample-data/nisar"))
    if not os.path.exists(nisar_dir):
        raise HTTPException(status_code=404, detail="sample-data/nisar directory not found.")
    files = sorted([
        os.path.join(nisar_dir, f)
        for f in os.listdir(nisar_dir)
        if f.lower().endswith((".h5", ".he5", ".hdf5"))
    ])
    if not files:
        raise HTTPException(status_code=404, detail="No NISAR HDF5 files found in sample-data/nisar/.")
    adapter = NISARGCOVAdapter()
    meta_list = []
    for f in files:
        try:
            m = adapter.inspect_metadata(f)
            meta_list.append(m.to_dict())
        except Exception as e:
            meta_list.append({"sourceFilename": os.path.basename(f), "error": str(e)})
    return {"files": meta_list}
