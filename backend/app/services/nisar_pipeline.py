"""
TerraScan NISAR SAR Processing Pipeline Architecture (Milestone 1 Interface Boundary)

This module defines the architectural contracts and modular service boundaries for full NISAR
data ingestion, calibration, thresholding, and polygonization.

Pipeline stages:
NISAR GCOV Data -> Raster Loader -> Preprocessing -> Image Alignment
-> Backscatter Comparison -> Change Map -> Thresholding
-> Connected-Region Analysis -> Area Calculation -> GeoJSON Output -> Dashboard
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import os
import numpy as np
from ..models.analysis import (
    AnalysisRequest,
    AnalysisResult,
    GeoJsonFeatureCollection,
    GeoJsonFeature,
    TimelinePoint,
    ScientificMetrics,
)
from .raster_engine import LocalRasterSurfaceChangePipeline


class BaseRasterLoader(ABC):
    """Interface for loading NISAR Level-2 GCOV (Geocoded Covariance) or HDF5 products."""

    @abstractmethod
    def load_raster(self, file_path_or_uri: str, band: str = "HHHH") -> np.ndarray:
        """Load single-band or multi-polarization backscatter raster into NumPy array."""
        pass


class BaseSARPreprocessor(ABC):
    """Interface for radiometric calibration, speckle filtering (e.g. Lee/Refined Lee), and normalization."""

    @abstractmethod
    def filter_speckle(self, data: np.ndarray, window_size: int = 5) -> np.ndarray:
        """Apply spatial speckle noise reduction while preserving high-gradient water edges."""
        pass

    @abstractmethod
    def convert_to_db(self, linear_amplitude: np.ndarray) -> np.ndarray:
        """Convert linear backscatter intensity to decibels: 10 * log10(sigma_0)."""
        pass


class BaseImageAlignment(ABC):
    """Interface for sub-pixel image coregistration of repeat-pass observations."""

    @abstractmethod
    def coregister(self, reference_array: np.ndarray, secondary_array: np.ndarray) -> np.ndarray:
        """Align secondary acquisition to reference grid geometry."""
        pass


class BaseBackscatterComparator(ABC):
    """Interface for computing multi-temporal backscatter log-ratio and difference maps."""

    @abstractmethod
    def compute_difference(self, before_db: np.ndarray, after_db: np.ndarray) -> np.ndarray:
        """Compute pixel-wise delta: delta_sigma = after_db - before_db."""
        pass


class BaseThresholdingEngine(ABC):
    """Interface for automated bimodal or adaptive thresholding (e.g., Otsu / Kittler-Illingworth)."""

    @abstractmethod
    def calculate_threshold(self, diff_array: np.ndarray) -> float:
        """Compute optimal decibel cutoff separating surface water from rough terrain."""
        pass


class BasePolygonizer(ABC):
    """Interface for connected-component analysis and GeoJSON vector conversion."""

    @abstractmethod
    def to_geojson(self, binary_mask: np.ndarray, transform: Any) -> GeoJsonFeatureCollection:
        """Extract vector polygons and compute surface area in square kilometers."""
        pass


# =========================================================================
# MILESTONE 1 PIPELINE SERVICE IMPLEMENTATION (Deterministic Demo Adapter)
# =========================================================================

class NISARPipelineService:
    """
    Coordinator service for NISAR change detection.
    In Milestone 1: Serves verified, deterministic scientific demo datasets.
    In Milestone 2+: Connects to live Rasterio / GDAL / HDF5 processing pipeline.
    """

    def __init__(self):
        # Service hooks ready for future dependency injection
        self.loader: Optional[BaseRasterLoader] = None
        self.preprocessor: Optional[BaseSARPreprocessor] = None
        self.comparator: Optional[BaseBackscatterComparator] = None
        self.threshold_engine: Optional[BaseThresholdingEngine] = None
        self.polygonizer: Optional[BasePolygonizer] = None
        self.local_raster_pipeline = LocalRasterSurfaceChangePipeline()

    def _tag_source(self, result: AnalysisResult, *paths: str) -> AnalysisResult:
        synthetic = any("synthetic" in os.path.basename(p).lower() for p in paths)
        h5_only = all(p.lower().endswith((".h5", ".he5", ".hdf5")) for p in paths)
        # anything not clearly a non-synthetic HDF5 pair can never be REAL_NISAR
        result.dataSource = "SYNTHETIC" if (synthetic or not h5_only) else "REAL_NISAR"
        result.isDemoData = False
        if result.dataSource == "SYNTHETIC":
            m = result.scientificMetrics
            m.classificationMethod = "Synthetic test-data differencing (not NASA/NISAR analysis)"
            m.sensorFrequency = m.radarBand = "n/a (synthetic test data)"
            result.location = f"SYNTHETIC TEST DATA — {result.location}"
        return result

    def execute_analysis(self, request: AnalysisRequest) -> AnalysisResult:
        """
        Execute deterministic SAR surface change detection for requested location and dates,
        or run the real local raster processing pipeline if raster paths, NISAR GCOV files, or synthetic mode are specified.
        """
        # 1. Direct local raster processing if paths provided (GeoTIFF or NISAR HDF5)
        if request.beforeRasterPath and request.afterRasterPath:
            res = self.local_raster_pipeline.execute(
                before_raster_path=request.beforeRasterPath,
                after_raster_path=request.afterRasterPath,
                threshold_db=request.thresholdDb if request.thresholdDb is not None else 4.5,
                analysis_mode=request.analysisMode,
                min_cluster_pixels=request.minClusterPixels if request.minClusterPixels is not None else 3,
                polarization=request.polarization,
                aoi_bounds=request.aoiBounds,
                location_label=request.location,
                before_date=request.beforeDate,
                after_date=request.afterDate,
            )
            return self._tag_source(res, request.beforeRasterPath, request.afterRasterPath)

        # 2. Local NISAR sample folder auto-detection
        loc_key = request.location.lower().strip()
        if loc_key in ["nisar_local", "nisar_sample", "nisar"]:
            nisar_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../sample-data/nisar"))
            if os.path.exists(nisar_dir):
                h5_files = sorted([
                    os.path.join(nisar_dir, f)
                    for f in os.listdir(nisar_dir)
                    if f.lower().endswith((".h5", ".he5", ".hdf5"))
                ])
                if len(h5_files) >= 2:
                    res = self.local_raster_pipeline.execute(
                        before_raster_path=h5_files[0],
                        after_raster_path=h5_files[1],
                        threshold_db=request.thresholdDb if request.thresholdDb is not None else 4.5,
                        analysis_mode=request.analysisMode,
                        min_cluster_pixels=request.minClusterPixels if request.minClusterPixels is not None else 3,
                        polarization=request.polarization,
                        aoi_bounds=request.aoiBounds,
                        location_label="NISAR L2 GCOV (Local Sample Pair)",
                        before_date=request.beforeDate,
                        after_date=request.afterDate,
                    )
                    return self._tag_source(res, h5_files[0], h5_files[1])
            raise FileNotFoundError(
                "No paired NISAR L2 GCOV (.h5) files found in sample-data/nisar/. "
                "Please place two NISAR GCOV HDF5 observation files in sample-data/nisar/ "
                "or specify explicit beforeRasterPath and afterRasterPath in request payload."
            )

        # 3. Local synthetic raster testbed processing
        if loc_key in ["synthetic_test", "local_synthetic", "synthetic_sar"]:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../sample-data/synthetic_rasters"))
            b_path = os.path.join(base_dir, "synthetic_sar_before.tif")
            a_path = os.path.join(base_dir, "synthetic_sar_after.tif")
            res = self.local_raster_pipeline.execute(
                before_raster_path=b_path,
                after_raster_path=a_path,
                threshold_db=request.thresholdDb if request.thresholdDb is not None else 4.5,
                analysis_mode=request.analysisMode,
                min_cluster_pixels=request.minClusterPixels if request.minClusterPixels is not None else 3,
                location_label="Synthetic Brahmaputra Testbed (Local GeoTIFF)",
                before_date=request.beforeDate,
                after_date=request.afterDate,
            )
            return self._tag_source(res, b_path, a_path)

        # 4. Bundled demo scenarios
        if 'mississippi' in loc_key:
            return self._build_mississippi_scenario(request)
        elif 'danube' in loc_key:
            return self._build_danube_scenario(request)
        else:
            return self._build_brahmaputra_scenario(request)

    def _build_brahmaputra_scenario(self, request: AnalysisRequest) -> AnalysisResult:
        change_type = "Possible Flooding" if request.analysisMode == "flood" else "Candidate Surface Change"
        return AnalysisResult(
            id="ts-nisar-2026-0841",
            location="Brahmaputra River Corridor",
            locationCode="brahmaputra",
            centerCoordinates=(26.18, 91.75),
            zoomLevel=11,
            beforeDate=request.beforeDate,
            afterDate=request.afterDate,
            analysisMode=request.analysisMode,
            changeType=change_type,
            affectedAreaKm2=38.4,
            changePercent=21.7,
            confidence="High",
            changeIntensity="High",
            summary=(
                "Radar observations indicate substantial surface change concentrated around low-lying "
                "areas near the monitored river corridor. Approximately 38.4 km² has been flagged as "
                "possible newly inundated terrain."
            ),
            isDemoData=True,
            scientificMetrics=ScientificMetrics(
                beforeBackscatterDb=-11.2,
                afterBackscatterDb=-18.7,
                differenceDb=-7.5,
                thresholdDb=-4.5,
                classificationMethod="NISAR L-band GCOV Relative Amplitude Thresholding",
                polarization="HH / HV Dual-Pol",
                sensorFrequency="1.25 GHz (L-band SAR)",
                radarBand="L-band (24 cm wavelength)",
            ),
            timeline=[
                TimelinePoint(id="obs-1", observationName="Observation 1", date="2026-04-18", affectedAreaKm2=12.1, baselineDiffPercent=0.0),
                TimelinePoint(id="obs-2", observationName="Observation 2", date="2026-05-12", affectedAreaKm2=15.3, baselineDiffPercent=4.2),
                TimelinePoint(id="obs-3", observationName="Observation 3", date="2026-06-05", affectedAreaKm2=27.8, baselineDiffPercent=14.6),
                TimelinePoint(id="obs-4", observationName="Observation 4", date=request.afterDate, affectedAreaKm2=38.4, baselineDiffPercent=21.7),
            ],
            geoJson=GeoJsonFeatureCollection(
                type="FeatureCollection",
                features=[
                    GeoJsonFeature(
                        type="Feature",
                        id="poly-1",
                        properties={
                            "name": "North Embankment Overflow Zone",
                            "intensity": "high",
                            "areaKm2": 18.2,
                            "backscatterDeltaDb": -8.4,
                            "description": "Pronounced decrease in specular backscatter; indicative of standing water over formerly bare soil.",
                        },
                        geometry={
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [91.68, 26.22],
                                    [91.75, 26.26],
                                    [91.82, 26.24],
                                    [91.79, 26.19],
                                    [91.71, 26.18],
                                    [91.68, 26.22],
                                ]
                            ],
                        },
                    ),
                    GeoJsonFeature(
                        type="Feature",
                        id="poly-2",
                        properties={
                            "name": "Southern Agricultural Lowland Inundation",
                            "intensity": "moderate",
                            "areaKm2": 13.7,
                            "backscatterDeltaDb": -5.6,
                            "description": "Moderate backscatter attenuation across seasonal floodplains and saturated paddy fields.",
                        },
                        geometry={
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [91.72, 26.12],
                                    [91.80, 26.15],
                                    [91.85, 26.11],
                                    [91.81, 26.08],
                                    [91.73, 26.09],
                                    [91.72, 26.12],
                                ]
                            ],
                        },
                    ),
                    GeoJsonFeature(
                        type="Feature",
                        id="poly-3",
                        properties={
                            "name": "Riparian Buffer Saturation Corridor",
                            "intensity": "low",
                            "areaKm2": 6.5,
                            "backscatterDeltaDb": -4.8,
                            "description": "Subtle moisture increase detected along river sandbars and peripheral wetland fringes.",
                        },
                        geometry={
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [91.63, 26.16],
                                    [91.69, 26.18],
                                    [91.70, 26.14],
                                    [91.64, 26.13],
                                    [91.63, 26.16],
                                ]
                            ],
                        },
                    ),
                ],
            ),
        )

    def _build_mississippi_scenario(self, request: AnalysisRequest) -> AnalysisResult:
        change_type = "Possible Flooding" if request.analysisMode == "flood" else "Candidate Surface Saturation"
        return AnalysisResult(
            id="ts-nisar-2026-0912",
            location="Lower Mississippi River Basin",
            locationCode="mississippi",
            centerCoordinates=(30.45, -91.18),
            zoomLevel=10,
            beforeDate=request.beforeDate,
            afterDate=request.afterDate,
            analysisMode=request.analysisMode,
            changeType=change_type,
            affectedAreaKm2=44.2,
            changePercent=18.5,
            confidence="Moderate",
            changeIntensity="Moderate",
            summary=(
                "Radar observations indicate candidate surface change and moisture accumulation along low-gradient "
                "backswamps and tributary junctions. Approximately 44.2 km² flagged as candidate saturated terrain."
            ),
            isDemoData=True,
            scientificMetrics=ScientificMetrics(
                beforeBackscatterDb=-13.0,
                afterBackscatterDb=-19.2,
                differenceDb=-6.2,
                thresholdDb=-4.5,
                classificationMethod="NISAR L-band GCOV Difference Thresholding",
                polarization="HH / HV Dual-Pol",
                sensorFrequency="1.25 GHz (L-band SAR)",
                radarBand="L-band (24 cm wavelength)",
            ),
            timeline=[
                TimelinePoint(id="m-1", observationName="Observation 1", date="2026-04-15", affectedAreaKm2=18.4, baselineDiffPercent=0.0),
                TimelinePoint(id="m-2", observationName="Observation 2", date="2026-05-10", affectedAreaKm2=22.1, baselineDiffPercent=3.7),
                TimelinePoint(id="m-3", observationName="Observation 3", date="2026-06-01", affectedAreaKm2=33.6, baselineDiffPercent=11.2),
                TimelinePoint(id="m-4", observationName="Observation 4", date=request.afterDate, affectedAreaKm2=44.2, baselineDiffPercent=18.5),
            ],
            geoJson=GeoJsonFeatureCollection(
                type="FeatureCollection",
                features=[
                    GeoJsonFeature(
                        type="Feature",
                        id="miss-1",
                        properties={
                            "name": "Atchafalaya Floodway Inflow Sector",
                            "intensity": "high",
                            "areaKm2": 24.6,
                            "backscatterDeltaDb": -7.1,
                            "description": "Significant backscatter drop typical of open shallow water inundating seasonal cypress swamp.",
                        },
                        geometry={
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [-91.35, 30.55],
                                    [-91.20, 30.60],
                                    [-91.12, 30.48],
                                    [-91.28, 30.40],
                                    [-91.35, 30.55],
                                ]
                            ],
                        },
                    ),
                ],
            ),
        )

    def _build_danube_scenario(self, request: AnalysisRequest) -> AnalysisResult:
        change_type = "Candidate Surface Change"
        return AnalysisResult(
            id="ts-nisar-2026-0774",
            location="Danube River Floodplain",
            locationCode="danube",
            centerCoordinates=(45.26, 19.83),
            zoomLevel=10,
            beforeDate=request.beforeDate,
            afterDate=request.afterDate,
            analysisMode=request.analysisMode,
            changeType=change_type,
            affectedAreaKm2=26.8,
            changePercent=12.3,
            confidence="Moderate",
            changeIntensity="Moderate",
            summary=(
                "Multi-temporal radar analysis indicates surface roughness and dielectric property changes "
                "across peripheral wetlands and riparian meadows. Approximately 26.8 km² flagged for field verification."
            ),
            isDemoData=True,
            scientificMetrics=ScientificMetrics(
                beforeBackscatterDb=-10.8,
                afterBackscatterDb=-16.0,
                differenceDb=-5.2,
                thresholdDb=-4.0,
                classificationMethod="NISAR L-band Surface Roughness Ratio",
                polarization="HH / HV Dual-Pol",
                sensorFrequency="1.25 GHz (L-band SAR)",
                radarBand="L-band (24 cm wavelength)",
            ),
            timeline=[
                TimelinePoint(id="d-1", observationName="Observation 1", date="2026-03-20", affectedAreaKm2=14.0, baselineDiffPercent=0.0),
                TimelinePoint(id="d-2", observationName="Observation 2", date="2026-04-05", affectedAreaKm2=16.5, baselineDiffPercent=2.5),
                TimelinePoint(id="d-3", observationName="Observation 3", date="2026-04-28", affectedAreaKm2=21.0, baselineDiffPercent=7.0),
                TimelinePoint(id="d-4", observationName="Observation 4", date=request.afterDate, affectedAreaKm2=26.8, baselineDiffPercent=12.3),
            ],
            geoJson=GeoJsonFeatureCollection(
                type="FeatureCollection",
                features=[
                    GeoJsonFeature(
                        type="Feature",
                        id="dan-1",
                        properties={
                            "name": "Kopacki Rit Marshland Surcharge",
                            "intensity": "moderate",
                            "areaKm2": 18.0,
                            "backscatterDeltaDb": -5.8,
                            "description": "Floodplain retention basin filling with seasonal flood pulse.",
                        },
                        geometry={
                            "type": "Polygon",
                            "coordinates": [
                                [
                                    [19.75, 45.30],
                                    [19.92, 45.34],
                                    [19.98, 45.22],
                                    [19.80, 45.20],
                                    [19.75, 45.30],
                                ]
                            ],
                        },
                    ),
                ],
            ),
        )
