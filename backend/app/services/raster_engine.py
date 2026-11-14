"""
TerraScan Local Surface-Change Raster Processing Pipeline (Milestone 2)

Performs deterministic multi-temporal radar backscatter analysis on local georeferenced raster pairs.
Pipeline:
Load Rasters -> Validate & Align Extents -> Nodata Masking -> dB Calibration
-> Backscatter Differencing -> Magnitude Calculation -> Thresholding
-> Morphological Noise Filtering -> Area & Statistical Quantification
-> Vectorization (GeoJSON) -> Structured AnalysisResult
"""

import os
import math
import logging
from typing import Dict, Any, Tuple, Optional, List
import numpy as np
import rasterio
from rasterio.windows import from_bounds
from rasterio.features import shapes
from rasterio.warp import transform_geom, transform as warp_transform
from scipy.ndimage import binary_opening, label

from ..models.analysis import (
    AnalysisResult,
    ScientificMetrics,
    ProcessingParameters,
    GeoJsonFeatureCollection,
    GeoJsonFeature,
    TimelinePoint,
)

logger = logging.getLogger("terrascan.raster_engine")


class LoadedRaster:
    """Encapsulates a loaded georeferenced raster scene and its spatial metadata."""

    def __init__(
        self,
        data: np.ndarray,
        transform: rasterio.Affine,
        crs: Any,
        nodata: Optional[float],
        bounds: rasterio.coords.BoundingBox,
        res: Tuple[float, float],
        file_path: str,
    ):
        self.data = data
        self.transform = transform
        self.crs = crs
        self.nodata = nodata
        self.bounds = bounds
        self.res = res
        self.file_path = file_path
        self.height, self.width = data.shape


class GeoTIFFRasterLoader:
    """Standard GeoTIFF raster loader for NISAR and SAR-derived products."""

    def load(self, file_path: str) -> LoadedRaster:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Raster observation file not found: {file_path}")

        with rasterio.open(file_path) as src:
            if src.count < 1:
                raise ValueError(f"Raster file {file_path} contains no readable bands.")

            data = src.read(1).astype(np.float32)
            transform = src.transform
            crs = src.crs
            nodata = src.nodata
            bounds = src.bounds
            res = src.res

        return LoadedRaster(
            data=data,
            transform=transform,
            crs=crs,
            nodata=nodata,
            bounds=bounds,
            res=res,
            file_path=file_path,
        )


class HDF5NISARAdapter:
    """
    Isolated adapter for NISAR L2 HDF5 products (e.g. GCOV).
    Keeps HDF5-specific hierarchy traversal modular and localized.
    """

    def load(self, file_path: str, hdf5_dataset_path: str = "/science/LSAR/GCOV/grids/frequencyA/HHHH") -> LoadedRaster:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"NISAR HDF5 file not found: {file_path}")

        try:
            import h5py  # type: ignore
        except ImportError:
            raise ImportError(
                "h5py is required to ingest raw NISAR HDF5 products directly. "
                "Convert product to Cloud-Optimized GeoTIFF or install h5py."
            )

        with h5py.File(file_path, "r") as h5f:
            if hdf5_dataset_path not in h5f:
                raise KeyError(
                    f"Dataset path '{hdf5_dataset_path}' not found in NISAR HDF5 file. "
                    f"Available top-level keys: {list(h5f.keys())}"
                )
            dataset = h5f[hdf5_dataset_path]
            data = np.array(dataset, dtype=np.float32)

        # Fallback transform for HDF5 if spatial grid metadata is pending
        transform = rasterio.Affine(0.0001, 0, 0, 0, -0.0001, 0)
        bounds = rasterio.coords.BoundingBox(0, 0, 1, 1)

        return LoadedRaster(
            data=data,
            transform=transform,
            crs="EPSG:4326",
            nodata=np.nan,
            bounds=bounds,
            res=(0.0001, 0.0001),
            file_path=file_path,
        )


class LocalRasterSurfaceChangePipeline:
    """
    Core local surface-change detection engine.
    Executes calibration, difference calculation, thresholding, and vector polygonization.
    Supports GeoTIFF and official NASA-ISRO NISAR L2 GCOV HDF5 products.
    """

    def __init__(self):
        self.geotiff_loader = GeoTIFFRasterLoader()
        from .nisar_gcov_adapter import NISARGCOVAdapter
        self.nisar_adapter = NISARGCOVAdapter()

    def _load_observation(
        self,
        file_path: str,
        polarization: Optional[str] = None,
        aoi_bounds: Optional[Tuple[float, float, float, float]] = None,
    ) -> Tuple[LoadedRaster, Optional[Dict[str, Any]]]:
        ext = os.path.splitext(file_path)[1].lower()
        if ext in [".h5", ".he5", ".hdf5"]:
            loaded, meta = self.nisar_adapter.load_raster(file_path, polarization=polarization, aoi_bounds=aoi_bounds)
            return loaded, meta.to_dict()
        return self.geotiff_loader.load(file_path), None

    def _align_and_crop(
        self, before: LoadedRaster, after: LoadedRaster
    ) -> Tuple[np.ndarray, np.ndarray, rasterio.Affine, Tuple[float, float], float]:
        """
        Validate CRS and dimensions. Crop to intersection window if extents overlap.
        Uses pure in-memory affine coordinates slicing to support both GeoTIFF and HDF5 rasters.
        """
        # Validate CRS compatibility
        if before.crs and after.crs and str(before.crs).upper() != str(after.crs).upper():
            raise ValueError(
                f"Incompatible Coordinate Reference Systems: pre-event CRS ({before.crs}) "
                f"does not match post-event CRS ({after.crs}). Please reproject to a common CRS."
            )

        # Validate resolution compatibility
        if before.res and after.res:
            dx_ratio = abs(before.res[0]) / (abs(after.res[0]) + 1e-9)
            dy_ratio = abs(before.res[1]) / (abs(after.res[1]) + 1e-9)
            if not (0.75 <= dx_ratio <= 1.33 and 0.75 <= dy_ratio <= 1.33):
                raise ValueError(
                    f"Incompatible grid resolution: Pre-event pixel spacing {before.res} "
                    f"differs significantly from post-event pixel spacing {after.res}."
                )

        # Check for matching dimensions directly
        if before.data.shape == after.data.shape and before.transform == after.transform:
            return before.data, after.data, before.transform, before.res, before.bounds[3]

        # Compute spatial intersection bounding box
        inter_left = max(before.bounds.left, after.bounds.left)
        inter_bottom = max(before.bounds.bottom, after.bounds.bottom)
        inter_right = min(before.bounds.right, after.bounds.right)
        inter_top = min(before.bounds.top, after.bounds.top)

        if inter_left >= inter_right or inter_bottom >= inter_top:
            raise ValueError(
                f"Observation rasters do not spatially intersect. "
                f"Before bounds: {before.bounds}, After bounds: {after.bounds}"
            )

        # Pure in-memory affine slicing for both rasters
        def slice_from_bounds(raster: LoadedRaster, left: float, bottom: float, right: float, top: float):
            inv = ~raster.transform
            c0, r0 = [int(round(v)) for v in inv * (left, top)]
            c1, r1 = [int(round(v)) for v in inv * (right, bottom)]
            c_start, c_end = max(0, min(c0, c1)), min(raster.data.shape[1], max(c0, c1))
            r_start, r_end = max(0, min(r0, r1)), min(raster.data.shape[0], max(r0, r1))
            return raster.data[r_start:r_end, c_start:c_end]

        cropped_b = slice_from_bounds(before, inter_left, inter_bottom, inter_right, inter_top)
        cropped_a = slice_from_bounds(after, inter_left, inter_bottom, inter_right, inter_top)

        min_rows = min(cropped_b.shape[0], cropped_a.shape[0])
        min_cols = min(cropped_b.shape[1], cropped_a.shape[1])

        if min_rows <= 0 or min_cols <= 0:
            raise ValueError("Zero overlapping grid cells found between before and after observations.")

        cropped_b = cropped_b[:min_rows, :min_cols]
        cropped_a = cropped_a[:min_rows, :min_cols]

        dx = abs(before.res[0])
        dy = abs(before.res[1])
        y_decreasing = before.transform.e < 0
        cropped_transform = Affine(
            dx, 0.0, inter_left,
            0.0, -dy if y_decreasing else dy, inter_top if y_decreasing else inter_bottom
        )
        return cropped_b, cropped_a, cropped_transform, before.res, inter_top

    def _convert_to_db(self, array: np.ndarray, valid_mask: np.ndarray) -> np.ndarray:
        """
        Convert linear backscatter intensity to decibels (10 * log10(sigma0)).
        If values are already in decibels (contains negative numbers), preserves array.
        """
        out = array.copy()
        valid_vals = out[valid_mask]

        if valid_vals.size == 0:
            return out

        # If data is strictly positive linear power (e.g. values between 0.0001 and 100), convert to dB
        if np.all(valid_vals > 0) and np.median(valid_vals) < 50.0:
            # Linear power detected
            clipped = np.clip(out, 1e-7, None)
            out[valid_mask] = 10.0 * np.log10(clipped[valid_mask])
        return out

    def _calculate_pixel_area_m2(self, res: Tuple[float, float], center_lat: float, crs: Any) -> float:
        """Calculate ground pixel area in square meters for projected or geographic CRS."""
        res_x, res_y = abs(res[0]), abs(res[1])

        # If geographic degrees (EPSG:4326)
        if crs and ("4326" in str(crs) or "WGS 84" in str(crs) or res_x < 0.1):
            meters_per_deg_lat = 111320.0
            meters_per_deg_lon = 111320.0 * math.cos(math.radians(center_lat))
            return (res_y * meters_per_deg_lat) * (res_x * meters_per_deg_lon)

        # Projected (e.g. UTM with units in meters)
        return res_x * res_y

    def execute(
        self,
        before_raster_path: str,
        after_raster_path: str,
        threshold_db: float = 4.5,
        analysis_mode: str = "flood",
        min_cluster_pixels: int = 3,
        polarization: Optional[str] = None,
        aoi_bounds: Optional[Tuple[float, float, float, float]] = None,
        location_label: Optional[str] = None,
        before_date: Optional[str] = None,
        after_date: Optional[str] = None,
    ) -> AnalysisResult:
        """
        Load observations and execute change detection pipeline on two georeferenced raster files (GeoTIFF or NISAR HDF5).
        """
        logger.info(f"Loading pre-event raster: {before_raster_path}")
        before_raster, meta_b = self._load_observation(before_raster_path, polarization=polarization, aoi_bounds=aoi_bounds)
        logger.info(f"Loading post-event raster: {after_raster_path}")
        after_raster, meta_a = self._load_observation(after_raster_path, polarization=polarization, aoi_bounds=aoi_bounds)

        return self.detect_change(
            before_raster=before_raster,
            after_raster=after_raster,
            meta_b=meta_b,
            meta_a=meta_a,
            threshold_db=threshold_db,
            analysis_mode=analysis_mode,
            min_cluster_pixels=min_cluster_pixels,
            location_label=location_label,
            before_date=before_date,
            after_date=after_date,
        )

    def detect_change(
        self,
        before_raster: LoadedRaster,
        after_raster: LoadedRaster,
        meta_b: Optional[Dict[str, Any]] = None,
        meta_a: Optional[Dict[str, Any]] = None,
        threshold_db: float = 4.5,
        analysis_mode: str = "flood",
        min_cluster_pixels: int = 3,
        location_label: Optional[str] = None,
        before_date: Optional[str] = None,
        after_date: Optional[str] = None,
    ) -> AnalysisResult:
        """
        Core change detection routine: aligns observations, computes calibrated backscatter difference,
        applies noise filtering, computes spatial metrics, and vectorizes candidate radar surface change.
        """
        # Validate observation geometry for NISAR observations
        if meta_b and meta_a:
            orbit_b = (meta_b.get("orbitDirection") or meta_b.get("orbit_direction") or "").strip().lower()
            orbit_a = (meta_a.get("orbitDirection") or meta_a.get("orbit_direction") or "").strip().lower()
            if orbit_b and orbit_a and orbit_b != orbit_a:
                raise ValueError(
                    f"Incompatible observation geometry: Pre-event acquisition is '{meta_b.get('orbitDirection')}' "
                    f"while post-event acquisition is '{meta_a.get('orbitDirection')}'. "
                    f"Cross-pass radar backscatter cannot be compared safely."
                )

            freq_b = meta_b.get("frequencyBand") or meta_b.get("frequency_band")
            freq_a = meta_a.get("frequencyBand") or meta_a.get("frequency_band")
            if freq_b and freq_a and freq_b != freq_a:
                raise ValueError(
                    f"Incompatible frequency bands: Pre-event observation uses '{freq_b}' while post-event uses '{freq_a}'. "
                    f"Cross-frequency radar backscatter cannot be compared safely."
                )

            track_b = meta_b.get("trackNumber") or meta_b.get("track_number")
            track_a = meta_a.get("trackNumber") or meta_a.get("track_number")
            if track_b is not None and track_a is not None and track_b != track_a:
                raise ValueError(
                    f"Incompatible observation geometry: Pre-event track ({track_b}) does not match "
                    f"post-event track ({track_a}). Repeat-pass radar change detection requires matching track geometry."
                )

        # 1. Align and crop to mutual footprint
        data_b, data_a, transform, res, center_lat = self._align_and_crop(before_raster, after_raster)

        # 2. Build nodata validity mask
        nodata_b = before_raster.nodata
        nodata_a = after_raster.nodata

        valid_b = np.isfinite(data_b)
        if nodata_b is not None and not np.isnan(nodata_b):
            valid_b &= (data_b != nodata_b)

        valid_a = np.isfinite(data_a)
        if nodata_a is not None and not np.isnan(nodata_a):
            valid_a &= (data_a != nodata_a)

        valid_mask = valid_b & valid_a
        total_valid_pixels = int(np.sum(valid_mask))

        if total_valid_pixels == 0:
            raise ValueError("Invalid data: Zero valid overlapping pixels found between pre-event and post-event observations after nodata exclusion.")

        # 3. Calibration / dB conversion
        db_b = self._convert_to_db(data_b, valid_mask)
        db_a = self._convert_to_db(data_a, valid_mask)

        # 4. Compute backscatter delta and magnitude
        # delta_db = after - before
        diff_db = np.zeros_like(db_a, dtype=np.float32)
        diff_db[valid_mask] = db_a[valid_mask] - db_b[valid_mask]
        abs_magnitude = np.abs(diff_db)

        # 5. Thresholding & Scientific Safety
        # Reports 'Candidate Radar Surface Change' (never asserting definitive flooding solely from pixel differences)
        change_type_str = "Candidate Radar Surface Change"
        if analysis_mode == "flood":
            raw_change_mask = (diff_db <= -threshold_db) & valid_mask
            processing_mode_label = "radar_specular_attenuation"
        else:
            raw_change_mask = (abs_magnitude >= threshold_db) & valid_mask
            processing_mode_label = "general_surface_change"

        # 6. Morphological noise filtering / connected-component filtering
        structure = np.ones((3, 3), dtype=bool)
        opened_mask = binary_opening(raw_change_mask, structure=structure)

        if min_cluster_pixels > 1:
            labeled_array, num_features = label(opened_mask, structure=structure)
            filtered_mask = np.zeros_like(opened_mask, dtype=bool)
            for feat_idx in range(1, num_features + 1):
                component_mask = (labeled_array == feat_idx)
                if np.sum(component_mask) >= min_cluster_pixels:
                    filtered_mask |= component_mask
        else:
            filtered_mask = opened_mask

        changed_pixel_count = int(np.sum(filtered_mask))
        change_percent = (changed_pixel_count / total_valid_pixels) * 100.0 if total_valid_pixels > 0 else 0.0

        # 7. Spatial Area & Statistics
        pixel_area_m2 = self._calculate_pixel_area_m2(res, center_lat, before_raster.crs)
        pixel_res_meters = math.sqrt(pixel_area_m2)
        affected_area_km2 = (changed_pixel_count * pixel_area_m2) / 1_000_000.0

        if changed_pixel_count > 0:
            mean_change = float(np.mean(diff_db[filtered_mask]))
            max_change = float(np.max(abs_magnitude[filtered_mask]))
        else:
            mean_change = 0.0
            max_change = 0.0

        before_mean_db = float(np.mean(db_b[valid_mask]))
        after_mean_db = float(np.mean(db_a[valid_mask]))

        # Quality / Confidence Indicator
        if changed_pixel_count > 50 and abs(mean_change) >= (threshold_db + 2.0):
            confidence_level = "High"
            change_intensity = "High"
        elif changed_pixel_count > 10:
            confidence_level = "Moderate"
            change_intensity = "Moderate"
        else:
            confidence_level = "Low"
            change_intensity = "Low" if changed_pixel_count > 0 else "Subtle"

        # 8. Vectorization (GeoJSON Shapes)
        geojson_features: List[GeoJsonFeature] = []
        geographic = "4326" in str(before_raster.crs)
        to_wgs84 = (lambda g: g) if geographic else (lambda g: transform_geom(before_raster.crs, "EPSG:4326", g))

        if changed_pixel_count > 0:
            mask_uint8 = filtered_mask.astype(np.uint8)
            shape_gen = shapes(mask_uint8, mask=filtered_mask, transform=transform)

            feature_idx = 1
            for geom, val in shape_gen:
                if val == 1:
                    poly_intensity = "high" if abs(mean_change) >= (threshold_db + 3.0) else "moderate"
                    poly_desc = (
                        f"Candidate radar surface change zone showing {mean_change:.1f} dB backscatter delta. "
                        f"Detected via {processing_mode_label} thresholding."
                    )

                    feature = GeoJsonFeature(
                        type="Feature",
                        id=f"poly-det-{feature_idx}",
                        properties={
                            "name": f"Candidate Radar Surface Change Zone {feature_idx}",
                            "intensity": poly_intensity,
                            "backscatterDeltaDb": round(mean_change, 2),
                            "changeClassification": "candidate radar surface change",
                            "description": poly_desc,
                        },
                        geometry=to_wgs84(geom),
                    )
                    geojson_features.append(feature)
                    feature_idx += 1
                    if feature_idx > 80:  # Cap at 80 largest components for optimal payload size
                        break

        # Approximate Center Coordinates for map pan
        if before_raster.bounds:
            cx = (before_raster.bounds.left + before_raster.bounds.right) / 2.0
            cy = (before_raster.bounds.bottom + before_raster.bounds.top) / 2.0
            if not geographic:
                (cx,), (cy,) = warp_transform(before_raster.crs, "EPSG:4326", [cx], [cy])
            center_coords = (float(cy), float(cx))
        else:
            center_coords = (26.18, 91.75)

        # 9. Assembly of Transparent Scientific Result
        summary_text = (
            f"Multi-temporal SAR analysis identified approximately {affected_area_km2:.2f} km² "
            f"({change_percent:.2f}% of evaluated footprint) as candidate radar surface change. "
            f"Evaluated across {total_valid_pixels:,} valid pixels with backscatter delta cutoff at {threshold_db:.1f} dB. "
            f"Note: Detected regions represent candidate radar surface change; separate flood classification requires hydrological and terrain validation."
        )

        is_nisar = bool(meta_b and meta_b.get("mission") == "NISAR")
        loc_title = location_label or (f"NISAR L2 GCOV ({meta_b.get('polarization')})" if is_nisar else "Local Raster Pair Observation")
        b_date = (meta_b.get("observationDate") if is_nisar else None) or before_date or "Pre-Event Observation"
        a_date = (meta_a.get("observationDate") if (meta_a and is_nisar) else None) or after_date or "Post-Event Observation"

        processing_params = ProcessingParameters(
            thresholdDb=float(threshold_db),
            nodataHandling=f"Strict exclusion of NaN, Inf, non-positive, and specified nodata ({nodata_b}, {nodata_a})",
            pixelResolutionMeters=round(pixel_res_meters, 1),
            processingMode=processing_mode_label,
            minClusterPixels=int(min_cluster_pixels),
            totalValidPixels=total_valid_pixels,
            changedPixelCount=changed_pixel_count,
        )

        scientific_metrics = ScientificMetrics(
            beforeBackscatterDb=round(before_mean_db, 2),
            afterBackscatterDb=round(after_mean_db, 2),
            differenceDb=round(mean_change, 2),
            thresholdDb=float(threshold_db),
            classificationMethod="NISAR L2 GCOV Relative Amplitude Differencing (Candidate Radar Surface Change)" if is_nisar else "Local Multi-Temporal SAR Amplitude Ratio Differencing (Candidate Radar Surface Change)",
            polarization=meta_b.get("polarization", "Dual-Pol / Co-Pol SAR") if meta_b else "Dual-Pol / Co-Pol SAR",
            sensorFrequency="1.25 GHz (L-band NISAR)" if is_nisar else "1.25 GHz L-band / Microwave",
            radarBand="NISAR L-band GCOV" if is_nisar else "L-band / Microwave SAR",
        )

        timeline = [
            TimelinePoint(id="obs-1", observationName="Pre-Event Baseline", date=b_date, affectedAreaKm2=0.0, baselineDiffPercent=0.0),
            TimelinePoint(id="obs-2", observationName="Post-Event Acquisition", date=a_date, affectedAreaKm2=round(affected_area_km2, 2), baselineDiffPercent=round(change_percent, 2)),
        ]

        raster_meta = {
            "crs": str(before_raster.crs),
            "transform": [round(v, 6) for v in transform[:6]],
            "dimensions": [data_b.shape[0], data_b.shape[1]],
            "pixelResolutionMeters": round(pixel_res_meters, 1),
            "beforeRasterFile": os.path.basename(before_raster.file_path),
            "afterRasterFile": os.path.basename(after_raster.file_path),
        }
        if meta_b:
            raster_meta["nisarMetadata"] = meta_b
            if meta_a:
                raster_meta["nisarAfterMetadata"] = meta_a

        return AnalysisResult(
            id=f"ts-nisar-gcov-{os.path.basename(before_raster.file_path)[:10]}" if is_nisar else f"ts-local-{os.path.basename(before_raster.file_path)[:12]}-{os.path.basename(after_raster.file_path)[:12]}",
            location=loc_title,
            locationCode="nisar_gcov" if is_nisar else "local_raster",
            centerCoordinates=center_coords,
            zoomLevel=11,
            beforeDate=b_date,
            afterDate=a_date,
            analysisMode=analysis_mode,  # type: ignore
            changeType=change_type_str,
            affectedAreaKm2=round(affected_area_km2, 2),
            changePercent=round(change_percent, 2),
            confidence=confidence_level,  # type: ignore
            changeIntensity=change_intensity,  # type: ignore
            summary=summary_text,
            isDemoData=False,
            timeline=timeline,
            scientificMetrics=scientific_metrics,
            geoJson=GeoJsonFeatureCollection(type="FeatureCollection", features=geojson_features),
            meanChange=round(mean_change, 2),
            maxChange=round(max_change, 2),
            processingParameters=processing_params,
            rasterMetadata=raster_meta,
        )


# Provide standardized service alias matching architecture guidelines
ChangeDetectionService = LocalRasterSurfaceChangePipeline
