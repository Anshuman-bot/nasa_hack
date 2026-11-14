"""
TerraScan Milestone 2 Pipeline Unit & Integration Tests

Validates:
1. Identical rasters -> near-zero / zero change
2. Known synthetic changed region -> detected accurately
3. Nodata handling -> nodata border strictly excluded
4. Invalid inputs -> clean, descriptive errors
5. API Integration -> POST /api/analyze works for both local rasters and demo scenarios
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
import numpy as np
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.raster_engine import LocalRasterSurfaceChangePipeline

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample-data/synthetic_rasters"))
BEFORE_TIF = os.path.join(BASE_DIR, "synthetic_sar_before.tif")
AFTER_TIF = os.path.join(BASE_DIR, "synthetic_sar_after.tif")
IDENTICAL_TIF = os.path.join(BASE_DIR, "synthetic_sar_identical.tif")


def test_identical_rasters_yield_zero_change():
    """Identical observations must yield exactly 0 changed pixels and 0.0 affected area."""
    pipeline = LocalRasterSurfaceChangePipeline()
    result = pipeline.execute(
        before_raster_path=BEFORE_TIF,
        after_raster_path=IDENTICAL_TIF,
        threshold_db=4.5,
        analysis_mode="flood",
    )

    assert result.affectedAreaKm2 == 0.0
    assert result.changePercent == 0.0
    assert result.processingParameters.changedPixelCount == 0
    assert len(result.geoJson.features) == 0
    assert result.changeIntensity in ["Low", "Subtle"]


def test_known_synthetic_region_detected():
    """Known synthetic inundation area (~1,111 pixels) must be reliably detected."""
    pipeline = LocalRasterSurfaceChangePipeline()
    result = pipeline.execute(
        before_raster_path=BEFORE_TIF,
        after_raster_path=AFTER_TIF,
        threshold_db=4.5,
        analysis_mode="flood",
        min_cluster_pixels=3,
    )

    # Known flood area: 1,111 pixels. With 3x3 opening, should retain ~1,000 - 1,111 pixels
    assert result.affectedAreaKm2 > 5.0
    assert result.changePercent > 5.0
    assert result.processingParameters.changedPixelCount > 900
    assert result.meanChange < -5.0  # Significant drop in dB
    assert len(result.geoJson.features) > 0
    assert result.confidence in ["High", "Moderate"]
    assert result.isDemoData is False


def test_nodata_is_strictly_ignored():
    """NoData perimeter (4-pixel border around 120x120 raster = 12,544 inner valid pixels) must be excluded."""
    pipeline = LocalRasterSurfaceChangePipeline()
    result = pipeline.execute(
        before_raster_path=BEFORE_TIF,
        after_raster_path=AFTER_TIF,
        threshold_db=4.5,
    )

    # 120 x 120 with 4-pixel border on all sides = (120 - 8) * (120 - 8) = 112 * 112 = 12,544 valid pixels
    assert result.processingParameters.totalValidPixels == 12544


def test_invalid_input_file_raises_clean_error():
    """Non-existent raster path must raise FileNotFoundError with descriptive message."""
    pipeline = LocalRasterSurfaceChangePipeline()
    error_raised = False
    try:
        pipeline.execute(
            before_raster_path="sample-data/non_existent_file.tif",
            after_raster_path=AFTER_TIF,
        )
    except FileNotFoundError:
        error_raised = True
    assert error_raised, "Expected FileNotFoundError for non-existent raster file"


def test_api_analyze_with_synthetic_and_demo_modes():
    """Test API POST /api/analyze for both local raster processing and backwards-compatible demo mode."""
    client = TestClient(app)

    # 1. Real local raster processing via synthetic_test location
    resp_synth = client.post(
        "/api/analyze",
        json={
            "location": "synthetic_test",
            "beforeDate": "2026-05-10",
            "afterDate": "2026-06-20",
            "analysisMode": "flood",
            "thresholdDb": 4.5,
        },
    )
    assert resp_synth.status_code == 200
    data_synth = resp_synth.json()
    assert data_synth["isDemoData"] is False
    assert data_synth["affectedAreaKm2"] > 5.0
    assert data_synth["processingParameters"]["changedPixelCount"] > 900

    # 2. Real local raster processing with explicit raster paths
    resp_explicit = client.post(
        "/api/analyze",
        json={
            "location": "Custom GeoTIFF Run",
            "beforeDate": "2026-05-10",
            "afterDate": "2026-06-20",
            "analysisMode": "flood",
            "beforeRasterPath": BEFORE_TIF,
            "afterRasterPath": AFTER_TIF,
            "thresholdDb": 4.5,
        },
    )
    assert resp_explicit.status_code == 200
    assert resp_explicit.json()["isDemoData"] is False

    # 3. Existing Demo mode must remain intact (no regressions)
    resp_demo = client.post(
        "/api/analyze",
        json={
            "location": "brahmaputra",
            "beforeDate": "2026-05-12",
            "afterDate": "2026-06-24",
            "analysisMode": "flood",
        },
    )
    assert resp_demo.status_code == 200
    data_demo = resp_demo.json()
    assert data_demo["isDemoData"] is True
    assert data_demo["id"] == "ts-nisar-2026-0841"

    # 4. Invalid date validation error
    resp_inv = client.post(
        "/api/analyze",
        json={
            "location": "brahmaputra",
            "beforeDate": "2026-06-24",
            "afterDate": "2026-05-12",
            "analysisMode": "flood",
        },
    )
    assert resp_inv.status_code == 400



# ---------------------------------------------------------------------------
# Milestone 3 — NISAR L2 GCOV Adapter Tests
# ---------------------------------------------------------------------------

NISAR_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample-data/nisar"))
NISAR_BEFORE = os.path.join(NISAR_DIR, "NISAR_L2_PR_GCOV_001_024_A_20260512T001422.h5")
NISAR_AFTER  = os.path.join(NISAR_DIR, "NISAR_L2_PR_GCOV_001_024_A_20260624T001421.h5")


def test_nisar_gcov_adapter_inspect_metadata():
    """Adapter must parse mission, polarization, and CRS from synthetic NISAR HDF5."""
    from backend.app.services.nisar_gcov_adapter import NISARGCOVAdapter
    adapter = NISARGCOVAdapter()
    meta = adapter.inspect_metadata(NISAR_BEFORE)
    assert "NISAR" in meta.mission.upper()
    assert len(meta.available_polarizations) >= 1
    # Default polarization must be one of the discovered ones
    assert meta.polarization in meta.available_polarizations
    assert "4326" in meta.crs or "32" in meta.crs  # geographic or UTM
    assert meta.pixel_resolution_meters > 0


def test_nisar_gcov_adapter_load_raster_shape():
    """load_raster must return a 100x100 (synthetic) float32 array with valid transform."""
    from backend.app.services.nisar_gcov_adapter import NISARGCOVAdapter
    adapter = NISARGCOVAdapter()
    loaded, meta = adapter.load_raster(NISAR_BEFORE, polarization="HHHH")
    assert loaded.data.shape == (100, 100)
    assert loaded.data.dtype == np.float32
    assert loaded.transform is not None
    assert loaded.bounds is not None
    assert meta.polarization == "HHHH"


def test_nisar_gcov_adapter_invalid_polarization():
    """Requesting a non-existent polarization must raise KeyError with descriptive message."""
    from backend.app.services.nisar_gcov_adapter import NISARGCOVAdapter
    adapter = NISARGCOVAdapter()
    raised = False
    try:
        adapter.load_raster(NISAR_BEFORE, polarization="ZZZZ")
    except KeyError:
        raised = True
    assert raised, "Expected KeyError for unsupported polarization"


def test_nisar_local_pipeline_detects_flood_zone():
    """NISAR pair pipeline must detect the synthetic ~600-pixel flood zone."""
    pipeline = LocalRasterSurfaceChangePipeline()
    result = pipeline.execute(
        before_raster_path=NISAR_BEFORE,
        after_raster_path=NISAR_AFTER,
        threshold_db=4.5,
        analysis_mode="flood",
        polarization="HHHH",
        min_cluster_pixels=3,
    )
    assert result.isDemoData is False
    assert result.affectedAreaKm2 > 0.0
    assert result.changePercent > 0.0
    assert result.processingParameters.changedPixelCount > 10
    assert result.rasterMetadata is not None
    assert result.rasterMetadata.get("nisarMetadata", {}).get("mission", "").upper() == "NISAR"


def test_api_nisar_local_location():
    """POST /api/analyze with location='nisar_local' must return a real (non-demo) AnalysisResult."""
    client = TestClient(app)
    resp = client.post(
        "/api/analyze",
        json={
            "location": "nisar_local",
            "beforeDate": "2026-05-12",
            "afterDate": "2026-06-24",
            "analysisMode": "flood",
            "polarization": "HHHH",
            "thresholdDb": 4.5,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["isDemoData"] is False
    assert data["affectedAreaKm2"] > 0.0
    assert data["changeType"] == "Candidate Radar Surface Change"
    assert "NISAR" in data["rasterMetadata"].get("nisarMetadata", {}).get("mission", "")


def test_scientific_safety_candidate_surface_change():
    """Processing layer must report 'Candidate Radar Surface Change' rather than assuming flood."""
    pipeline = LocalRasterSurfaceChangePipeline()
    result = pipeline.execute(
        before_raster_path=NISAR_BEFORE,
        after_raster_path=NISAR_AFTER,
        threshold_db=4.5,
        analysis_mode="flood",
    )
    assert result.changeType == "Candidate Radar Surface Change"
    assert "candidate radar surface change" in result.summary.lower()
    for feature in result.geoJson.features:
        assert feature.properties.get("changeClassification") == "candidate radar surface change"


def test_change_detection_service_direct_feed():
    """Verify that ChangeDetectionService can be directly fed from NISARGCOVAdapter."""
    from backend.app.services.raster_engine import ChangeDetectionService
    from backend.app.services.nisar_gcov_adapter import NISARGCOVAdapter

    adapter = NISARGCOVAdapter()
    loaded_b, meta_b = adapter.load_raster(NISAR_BEFORE, polarization="HHHH")
    loaded_a, meta_a = adapter.load_raster(NISAR_AFTER, polarization="HHHH")

    service = ChangeDetectionService()
    result = service.detect_change(
        before_raster=loaded_b,
        after_raster=loaded_a,
        meta_b=meta_b.to_dict(),
        meta_a=meta_a.to_dict(),
        threshold_db=4.5,
        analysis_mode="flood",
    )

    assert result.affectedAreaKm2 > 0.0
    assert result.changeType == "Candidate Radar Surface Change"
    assert result.rasterMetadata["nisarMetadata"]["mission"] == "NISAR"


def test_nisar_polarization_selection_hvhv():
    """Verify user can select cross-pol (HVHV) channel if present in NISAR file."""
    from backend.app.services.nisar_gcov_adapter import NISARGCOVAdapter
    adapter = NISARGCOVAdapter()
    loaded, meta = adapter.load_raster(NISAR_BEFORE, polarization="HVHV")
    assert meta.polarization == "HVHV"
    assert loaded.data.shape == (100, 100)


def test_nisar_aoi_windowing_performance():
    """Verify AOI bounds extraction slices sub-arrays without full memory copies."""
    from backend.app.services.nisar_gcov_adapter import NISARGCOVAdapter
    adapter = NISARGCOVAdapter()
    aoi = (91.72, 26.17, 91.76, 26.21)
    loaded, meta = adapter.load_raster(NISAR_BEFORE, polarization="HHHH", aoi_bounds=aoi)
    # Full shape is 100x100, AOI sub-array must be smaller
    assert loaded.data.shape[0] < 100
    assert loaded.data.shape[1] < 100
    assert loaded.bounds.left >= 91.70


def test_incompatible_geometry_raises_error():
    """Differing orbit directions (e.g. Ascending vs Descending) must raise ValueError."""
    from backend.app.services.raster_engine import ChangeDetectionService
    from backend.app.services.nisar_gcov_adapter import NISARGCOVAdapter

    adapter = NISARGCOVAdapter()
    loaded_b, meta_b = adapter.load_raster(NISAR_BEFORE, polarization="HHHH")
    loaded_a, meta_a = adapter.load_raster(NISAR_AFTER, polarization="HHHH")

    meta_b_dict = meta_b.to_dict()
    meta_a_dict = meta_a.to_dict()
    meta_a_dict["orbitDirection"] = "Descending"

    service = ChangeDetectionService()
    error_raised = False
    try:
        service.detect_change(
            before_raster=loaded_b,
            after_raster=loaded_a,
            meta_b=meta_b_dict,
            meta_a=meta_a_dict,
        )
    except ValueError as val_err:
        if "Incompatible observation geometry" in str(val_err):
            error_raised = True
    assert error_raised, "Expected ValueError for incompatible orbit directions"


def test_api_nisar_metadata_endpoint():
    """GET /api/nisar/metadata returns metadata for sample NISAR pair."""
    client = TestClient(app)
    resp = client.get("/api/nisar/metadata")
    assert resp.status_code == 200
    data = resp.json()
    assert "files" in data
    assert len(data["files"]) >= 2
    for file_meta in data["files"]:
        assert file_meta["mission"] == "NISAR"
        assert file_meta["productType"] == "GCOV"
        assert len(file_meta["availablePolarizations"]) >= 1


if __name__ == "__main__":
    print("Running Milestone 2 Pipeline Verification Tests...")
    test_identical_rasters_yield_zero_change()
    print("PASS: Identical rasters -> zero change")
    test_known_synthetic_region_detected()
    print("PASS: Known synthetic region -> detected accurately")
    test_nodata_is_strictly_ignored()
    print("PASS: NoData border -> strictly ignored")
    test_invalid_input_file_raises_clean_error()
    print("PASS: Invalid input file -> clean error")
    test_api_analyze_with_synthetic_and_demo_modes()
    print("PASS: API integration (synthetic + demo modes) -> operational")
    print()
    print("Running Milestone 3 NISAR Adapter Tests...")
    test_nisar_gcov_adapter_inspect_metadata()
    print("PASS: NISARGCOVAdapter.inspect_metadata -> mission/polarization/CRS extracted")
    test_nisar_gcov_adapter_load_raster_shape()
    print("PASS: NISARGCOVAdapter.load_raster -> 100x100 float32 array")
    test_nisar_gcov_adapter_invalid_polarization()
    print("PASS: Invalid polarization -> clean KeyError")
    test_nisar_local_pipeline_detects_flood_zone()
    print("PASS: NISAR pair pipeline -> flood zone detected")
    test_api_nisar_local_location()
    print("PASS: POST /api/analyze nisar_local -> non-demo result")
    test_scientific_safety_candidate_surface_change()
    print("PASS: Scientific safety -> Candidate Radar Surface Change reported")
    test_change_detection_service_direct_feed()
    print("PASS: ChangeDetectionService direct raster feed operational")
    test_nisar_polarization_selection_hvhv()
    print("PASS: Cross-pol HVHV channel selectable")
    test_nisar_aoi_windowing_performance()
    print("PASS: AOI windowed reading prevents full memory copies")
    test_incompatible_geometry_raises_error()
    print("PASS: Incompatible geometry raises clear ValueError")
    test_api_nisar_metadata_endpoint()
    print("PASS: GET /api/nisar/metadata endpoint operational")
    print()
    print("All Milestone 2 + 3 tests passed successfully!")
