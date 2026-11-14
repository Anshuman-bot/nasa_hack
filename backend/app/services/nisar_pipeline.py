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
from datetime import datetime
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

    def _compute_date_scale_factor(self, before_date_str: str, after_date_str: str, baseline_nominal_days: float = 30.0) -> float:
        """
        Dynamically scale simulated radar change response based on the elapsed days
        between before_date and after_date, reflecting SAR temporal decorrelation and hydrological accumulation.
        """
        try:
            d_before = datetime.strptime(before_date_str[:10], "%Y-%m-%d")
            d_after = datetime.strptime(after_date_str[:10], "%Y-%m-%d")
            delta_days = max(1, (d_after - d_before).days)
        except Exception:
            delta_days = int(baseline_nominal_days)

        # Smooth non-linear factor: 12-day repeat orbit minimum to seasonal saturation
        # baseline_nominal_days (~30d) gives ~1.0
        scale = 0.5 + 0.5 * (delta_days / baseline_nominal_days) ** 0.6
        return round(float(min(3.0, max(0.35, scale))), 3)

    def _build_brahmaputra_scenario(self, request: AnalysisRequest) -> AnalysisResult:
        change_type = "Possible Flooding" if request.analysisMode == "flood" else "Candidate Surface Change"
        scale = self._compute_date_scale_factor(request.beforeDate, request.afterDate, baseline_nominal_days=48.0)

        base_area = 38.4
        affected_area = round(base_area * scale, 1)
        change_pct = round(min(95.0, 21.7 * (scale ** 0.8)), 1)
        diff_db = round(-7.5 * min(1.6, max(0.5, scale ** 0.5)), 1)
        after_db = round(-11.2 + diff_db, 1)

        area_p1 = round(18.2 * scale, 1)
        area_p2 = round(13.7 * scale, 1)
        area_p3 = round(max(1.0, affected_area - area_p1 - area_p2), 1)

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
            affectedAreaKm2=affected_area,
            changePercent=change_pct,
            confidence="High" if scale > 0.7 else "Moderate",
            changeIntensity="High" if scale > 0.9 else ("Moderate" if scale > 0.5 else "Low"),
            summary=(
                f"Radar observations indicate substantial surface change concentrated around low-lying "
                f"areas near the monitored river corridor over the {(datetime.strptime(request.afterDate[:10], '%Y-%m-%d') - datetime.strptime(request.beforeDate[:10], '%Y-%m-%d')).days if ('-' in request.beforeDate and '-' in request.afterDate) else 30}-day observation interval. "
                f"Approximately {affected_area} km² ({change_pct}% baseline variation) has been flagged as "
                f"candidate surface change."
            ),
            isDemoData=True,
            scientificMetrics=ScientificMetrics(
                beforeBackscatterDb=-11.2,
                afterBackscatterDb=after_db,
                differenceDb=diff_db,
                thresholdDb=-4.5,
                classificationMethod="NISAR L-band GCOV Relative Amplitude Thresholding",
                polarization="HH / HV Dual-Pol",
                sensorFrequency="1.25 GHz (L-band SAR)",
                radarBand="L-band (24 cm wavelength)",
            ),
            timeline=[
                TimelinePoint(id="obs-1", observationName="Pre-Event Baseline", date=request.beforeDate, affectedAreaKm2=round(affected_area * 0.3, 1), baselineDiffPercent=0.0),
                TimelinePoint(id="obs-2", observationName="Intermediate Pass 1", date="2026-05-12", affectedAreaKm2=round(affected_area * 0.45, 1), baselineDiffPercent=round(change_pct * 0.3, 1)),
                TimelinePoint(id="obs-3", observationName="Intermediate Pass 2", date="2026-06-05", affectedAreaKm2=round(affected_area * 0.75, 1), baselineDiffPercent=round(change_pct * 0.7, 1)),
                TimelinePoint(id="obs-4", observationName="Post-Event Analysis", date=request.afterDate, affectedAreaKm2=affected_area, baselineDiffPercent=change_pct),
            ],
            geoJson=GeoJsonFeatureCollection(
                type="FeatureCollection",
                features=[
                    GeoJsonFeature(
                        type="Feature",
                        id="poly-1",
                        properties={
                            "name": "North Embankment Overflow Zone",
                            "intensity": "high" if scale > 0.8 else "moderate",
                            "areaKm2": area_p1,
                            "backscatterDeltaDb": round(diff_db * 1.1, 1),
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
                            "areaKm2": area_p2,
                            "backscatterDeltaDb": round(diff_db * 0.8, 1),
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
                            "areaKm2": area_p3,
                            "backscatterDeltaDb": round(diff_db * 0.6, 1),
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
        scale = self._compute_date_scale_factor(request.beforeDate, request.afterDate, baseline_nominal_days=45.0)

        base_area = 44.2
        affected_area = round(base_area * scale, 1)
        change_pct = round(min(95.0, 18.5 * (scale ** 0.8)), 1)
        diff_db = round(-6.2 * min(1.6, max(0.5, scale ** 0.5)), 1)
        after_db = round(-13.0 + diff_db, 1)

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
            affectedAreaKm2=affected_area,
            changePercent=change_pct,
            confidence="Moderate",
            changeIntensity="High" if scale > 0.9 else ("Moderate" if scale > 0.5 else "Low"),
            summary=(
                f"Radar observations indicate candidate surface change and moisture accumulation along low-gradient "
                f"backswamps and tributary junctions. Approximately {affected_area} km² flagged as candidate saturated terrain."
            ),
            isDemoData=True,
            scientificMetrics=ScientificMetrics(
                beforeBackscatterDb=-13.0,
                afterBackscatterDb=after_db,
                differenceDb=diff_db,
                thresholdDb=-4.5,
                classificationMethod="NISAR L-band GCOV Difference Thresholding",
                polarization="HH / HV Dual-Pol",
                sensorFrequency="1.25 GHz (L-band SAR)",
                radarBand="L-band (24 cm wavelength)",
            ),
            timeline=[
                TimelinePoint(id="m-1", observationName="Pre-Event Baseline", date=request.beforeDate, affectedAreaKm2=round(affected_area * 0.4, 1), baselineDiffPercent=0.0),
                TimelinePoint(id="m-2", observationName="Intermediate Pass 1", date="2026-05-10", affectedAreaKm2=round(affected_area * 0.55, 1), baselineDiffPercent=round(change_pct * 0.4, 1)),
                TimelinePoint(id="m-3", observationName="Intermediate Pass 2", date="2026-06-01", affectedAreaKm2=round(affected_area * 0.8, 1), baselineDiffPercent=round(change_pct * 0.75, 1)),
                TimelinePoint(id="m-4", observationName="Post-Event Analysis", date=request.afterDate, affectedAreaKm2=affected_area, baselineDiffPercent=change_pct),
            ],
            geoJson=GeoJsonFeatureCollection(
                type="FeatureCollection",
                features=[
                    GeoJsonFeature(
                        type="Feature",
                        id="miss-1",
                        properties={
                            "name": "Atchafalaya Floodway Inflow Sector",
                            "intensity": "high" if scale > 0.85 else "moderate",
                            "areaKm2": affected_area,
                            "backscatterDeltaDb": diff_db,
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
        scale = self._compute_date_scale_factor(request.beforeDate, request.afterDate, baseline_nominal_days=40.0)

        base_area = 26.8
        affected_area = round(base_area * scale, 1)
        change_pct = round(min(95.0, 12.3 * (scale ** 0.8)), 1)
        diff_db = round(-5.2 * min(1.6, max(0.5, scale ** 0.5)), 1)
        after_db = round(-10.8 + diff_db, 1)

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
            affectedAreaKm2=affected_area,
            changePercent=change_pct,
            confidence="Moderate",
            changeIntensity="Moderate" if scale > 0.6 else "Low",
            summary=(
                f"Multi-temporal radar analysis indicates surface roughness and dielectric property changes "
                f"across peripheral wetlands and riparian meadows. Approximately {affected_area} km² flagged for field verification."
            ),
            isDemoData=True,
            scientificMetrics=ScientificMetrics(
                beforeBackscatterDb=-10.8,
                afterBackscatterDb=after_db,
                differenceDb=diff_db,
                thresholdDb=-4.0,
                classificationMethod="NISAR L-band Surface Roughness Ratio",
                polarization="HH / HV Dual-Pol",
                sensorFrequency="1.25 GHz (L-band SAR)",
                radarBand="L-band (24 cm wavelength)",
            ),
            timeline=[
                TimelinePoint(id="d-1", observationName="Pre-Event Baseline", date=request.beforeDate, affectedAreaKm2=round(affected_area * 0.45, 1), baselineDiffPercent=0.0),
                TimelinePoint(id="d-2", observationName="Intermediate Pass 1", date="2026-04-05", affectedAreaKm2=round(affected_area * 0.6, 1), baselineDiffPercent=round(change_pct * 0.35, 1)),
                TimelinePoint(id="d-3", observationName="Intermediate Pass 2", date="2026-04-28", affectedAreaKm2=round(affected_area * 0.8, 1), baselineDiffPercent=round(change_pct * 0.7, 1)),
                TimelinePoint(id="d-4", observationName="Post-Event Analysis", date=request.afterDate, affectedAreaKm2=affected_area, baselineDiffPercent=change_pct),
            ],
            geoJson=GeoJsonFeatureCollection(
                type="FeatureCollection",
                features=[
                    GeoJsonFeature(
                        type="Feature",
                        id="dan-1",
                        properties={
                            "name": "Kopacki Rit Marshland Surcharge",
                            "intensity": "moderate" if scale > 0.7 else "low",
                            "areaKm2": affected_area,
                            "backscatterDeltaDb": diff_db,
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
