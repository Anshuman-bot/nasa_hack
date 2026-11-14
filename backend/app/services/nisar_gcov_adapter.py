"""
TerraScan NASA-ISRO NISAR L2 GCOV Ingestion Adapter

Responsible for parsing official NISAR L2 GCOV (Geocoded Covariance) HDF5 products:
- Inspects /science/LSAR/GCOV and /science/SSAR/GCOV dataset hierarchies.
- Extracts geospatial coordinate arrays (xCoordinates, yCoordinates) and CRS projections.
- Identifies available polarimetric backscatter terms (HHHH, HVHV, VVVV, VHVH).
- Performs windowed / chunked extraction to avoid large memory copies on multi-gigabyte products.
- Formats extracted backscatter and scientific metadata into standardized LoadedRaster.
"""

import os
import math
import logging
from typing import Dict, Any, Tuple, Optional, List
import numpy as np
import rasterio
from rasterio.transform import Affine

from .raster_engine import LoadedRaster

logger = logging.getLogger("terrascan.nisar_adapter")


class NISARGCOVMetadata:
    """Standardized metadata container extracted from a NISAR L2 GCOV product."""

    def __init__(
        self,
        mission: str,
        product_type: str,
        polarization: str,
        available_polarizations: List[str],
        observation_date: str,
        crs: str,
        pixel_spacing: Tuple[float, float],
        pixel_resolution_meters: float,
        source_filename: str,
        orbit_direction: Optional[str] = None,
        track_number: Optional[int] = None,
        frequency_band: str = "frequencyA",
    ):
        self.mission = mission
        self.product_type = product_type
        self.polarization = polarization
        self.available_polarizations = available_polarizations
        self.observation_date = observation_date
        self.crs = crs
        self.pixel_spacing = pixel_spacing
        self.pixel_resolution_meters = pixel_resolution_meters
        self.source_filename = source_filename
        self.orbit_direction = orbit_direction
        self.track_number = track_number
        self.frequency_band = frequency_band

    def to_dict(self) -> Dict[str, Any]:
        return {
            "mission": self.mission,
            "productType": self.product_type,
            "product_type": self.product_type,
            "polarization": self.polarization,
            "availablePolarizations": self.available_polarizations,
            "available_polarizations": self.available_polarizations,
            "observationDate": self.observation_date,
            "observation_date": self.observation_date,
            "crs": self.crs,
            "CRS": self.crs,
            "pixelSpacing": [round(float(v), 6) for v in self.pixel_spacing],
            "pixel_spacing": [round(float(v), 6) for v in self.pixel_spacing],
            "pixelResolutionMeters": round(self.pixel_resolution_meters, 2),
            "pixel_resolution": round(self.pixel_resolution_meters, 2),
            "sourceFilename": self.source_filename,
            "source_filename": self.source_filename,
            "orbitDirection": self.orbit_direction,
            "orbit_direction": self.orbit_direction,
            "trackNumber": self.track_number,
            "track_number": self.track_number,
            "frequencyBand": self.frequency_band,
            "frequency_band": self.frequency_band,
        }


class NISARGCOVAdapter:
    """
    Adapter responsible for parsing NASA-ISRO NISAR L2 GCOV products.
    Keeps HDF5-specific tree traversal completely decoupled from generic change processing.
    """

    def __init__(self):
        try:
            import h5py
            self.h5py = h5py
        except ImportError:
            self.h5py = None

    def _ensure_h5py(self):
        if self.h5py is None:
            raise ImportError(
                "h5py is required to ingest NASA-ISRO NISAR L2 GCOV HDF5 products. "
                "Install it using: python -m pip install h5py"
            )

    def _locate_gcov_root(self, h5f) -> Tuple[str, Any]:
        """
        Dynamically discover the GCOV group root inside the HDF5 hierarchy.
        Supports both L-SAR and S-SAR instruments.
        """
        candidates = [
            "/science/LSAR/GCOV",
            "/science/SSAR/GCOV",
            "/science/GCOV",
            "/GCOV",
        ]
        for path in candidates:
            if path in h5f:
                return path, h5f[path]

        # Scan top-level groups dynamically
        for key in h5f.keys():
            if "science" in key.lower() or "nisar" in key.lower() or "lsar" in key.lower():
                try:
                    for sub in h5f[key].keys():
                        if "gcov" in sub.lower():
                            full_path = f"/{key}/{sub}"
                            return full_path, h5f[full_path]
                except Exception:
                    pass

        available_keys = list(h5f.keys())
        raise ValueError(
            f"Unsupported NISAR product. Could not locate a valid GCOV dataset group. "
            f"Available top-level groups: {available_keys}. Expected NASA-ISRO L2 GCOV."
        )

    def _extract_identification(self, gcov_group, base_filename: str) -> Dict[str, Any]:
        """Extract mission, product type, and acquisition timing metadata."""
        meta = {
            "mission": "NISAR",
            "productType": "GCOV",
            "observationDate": "2026-01-01T00:00:00Z",
            "orbitDirection": "Ascending",
            "trackNumber": None,
        }

        if "identification" in gcov_group:
            ident = gcov_group["identification"]

            def get_text_attr_or_ds(key: str, default: Any = None):
                if key in ident:
                    val = ident[key][()]
                    if isinstance(val, bytes):
                        return val.decode("utf-8", errors="replace")
                    return str(val)
                elif key in ident.attrs:
                    val = ident.attrs[key]
                    if isinstance(val, bytes):
                        return val.decode("utf-8", errors="replace")
                    return str(val)
                return default

            meta["mission"] = get_text_attr_or_ds("mission_name", "NISAR")
            meta["productType"] = get_text_attr_or_ds("product_type", "GCOV")
            
            # Acquisition timestamp
            date_val = (
                get_text_attr_or_ds("zero_doppler_start_time")
                or get_text_attr_or_ds("sensing_start")
                or get_text_attr_or_ds("acquisition_start")
            )
            if date_val:
                meta["observationDate"] = date_val.split(".")[0]

            meta["orbitDirection"] = get_text_attr_or_ds("orbit_pass_direction", "Ascending")
            track_val = get_text_attr_or_ds("track_number")
            if track_val and track_val.isdigit():
                meta["trackNumber"] = int(track_val)

        if meta["mission"].upper() != "NISAR":
            raise ValueError(f"Unsupported product: Expected mission 'NISAR', but found '{meta['mission']}'.")
        if meta["productType"].upper() != "GCOV":
            raise ValueError(
                f"Unsupported NISAR product: Expected product type 'GCOV', but found '{meta['productType']}'. "
                f"TerraScan supports Level-2 Geocoded Covariance (GCOV) products."
            )

        return meta

    def inspect_metadata(self, file_path: str) -> NISARGCOVMetadata:
        """Inspect product headers and return standardized NISAR metadata without loading full rasters."""
        self._ensure_h5py()

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"NISAR file not found: {file_path}")

        filename = os.path.basename(file_path)

        with self.h5py.File(file_path, "r") as h5f:
            root_path, gcov_group = self._locate_gcov_root(h5f)
            ident_meta = self._extract_identification(gcov_group, filename)

            if "grids" not in gcov_group:
                raise KeyError(f"Corrupted NISAR product: '{root_path}' does not contain expected 'grids' group.")

            grids = gcov_group["grids"]
            # Locate frequency group (prefer frequencyA, fallback to first available)
            freq_name = "frequencyA" if "frequencyA" in grids else list(grids.keys())[0]
            freq_group = grids[freq_name]

            # Discover available polarizations
            available_pols: List[str] = []
            if "listOfPolarizations" in freq_group:
                pols_ds = freq_group["listOfPolarizations"][()]
                for p in pols_ds:
                    if isinstance(p, bytes):
                        available_pols.append(p.decode("utf-8", errors="replace"))
                    else:
                        available_pols.append(str(p))
            else:
                for k in freq_group.keys():
                    if k.upper() in ["HHHH", "HVHV", "VVVV", "VHVH", "HH", "HV", "VV", "VH"]:
                        available_pols.append(k)

            if not available_pols:
                raise KeyError(
                    f"No polarimetric backscatter datasets discovered in NISAR GCOV {freq_name}. "
                    f"Available entries: {list(freq_group.keys())}"
                )

            # Choose sensible default polarization (prefer HHHH or VVVV co-pol, or first available)
            default_pol = "HHHH" if "HHHH" in available_pols else ("VVVV" if "VVVV" in available_pols else available_pols[0])

            # Extract coordinates and CRS
            if "xCoordinates" not in freq_group or "yCoordinates" not in freq_group:
                raise KeyError("NISAR GCOV grid is missing 'xCoordinates' or 'yCoordinates' arrays.")

            x_coords = freq_group["xCoordinates"]
            y_coords = freq_group["yCoordinates"]
            x0, x1 = float(x_coords[0]), float(x_coords[-1])
            y0, y1 = float(y_coords[0]), float(y_coords[-1])

            dx = abs(float(x_coords[1] - x_coords[0])) if len(x_coords) > 1 else 0.0001
            dy = abs(float(y_coords[1] - y_coords[0])) if len(y_coords) > 1 else 0.0001

            # Extract projection / CRS
            crs_str = "EPSG:4326"
            if "projection" in freq_group:
                proj_val = freq_group["projection"][()]
                if isinstance(proj_val, (int, np.integer)):
                    crs_str = f"EPSG:{proj_val}"
                elif isinstance(proj_val, bytes):
                    decoded = proj_val.decode("utf-8", errors="replace")
                    crs_str = f"EPSG:{decoded}" if decoded.isdigit() else decoded
            elif "coordinateReferenceSystem" in freq_group:
                crs_ds = freq_group["coordinateReferenceSystem"]
                if "epsg_code" in crs_ds.attrs:
                    crs_str = f"EPSG:{crs_ds.attrs['epsg_code']}"

            # Calculate pixel resolution in meters
            if "4326" in crs_str or dx < 0.1:
                center_lat = (y0 + y1) / 2.0
                pixel_res_meters = dx * 111320.0 * math.cos(math.radians(center_lat))
            else:
                pixel_res_meters = dx

            return NISARGCOVMetadata(
                mission=ident_meta["mission"],
                product_type=ident_meta["productType"],
                polarization=default_pol,
                available_polarizations=available_pols,
                observation_date=ident_meta["observationDate"],
                crs=crs_str,
                pixel_spacing=(dx, dy),
                pixel_resolution_meters=pixel_res_meters,
                source_filename=filename,
                orbit_direction=ident_meta.get("orbitDirection"),
                track_number=ident_meta.get("trackNumber"),
                frequency_band=freq_name,
            )

    def prepare_comparable_values(self, data: np.ndarray) -> np.ndarray:
        """
        Convert linear backscatter intensity / power to decibels (10 * log10(sigma0))
        for standardized multi-temporal comparison. If values are already in decibels, preserves array.
        """
        out = data.copy()
        valid_mask = np.isfinite(out)
        valid_vals = out[valid_mask]
        if valid_vals.size == 0:
            return out
        if np.all(valid_vals > 0) and np.median(valid_vals) < 50.0:
            clipped = np.clip(out, 1e-7, None)
            out[valid_mask] = 10.0 * np.log10(clipped[valid_mask])
        return out

    def load_raster(
        self,
        file_path: str,
        polarization: Optional[str] = None,
        aoi_bounds: Optional[Tuple[float, float, float, float]] = None,
        prepare_values: bool = True,
    ) -> Tuple[LoadedRaster, NISARGCOVMetadata]:
        """
        Extract the specified polarimetric backscatter raster layer from NISAR L2 GCOV.
        Supports windowed extraction via aoi_bounds (min_lon, min_lat, max_lon, max_lat)
        to prevent large memory spikes on high-resolution orbit swaths.
        Masks invalid values and prepares comparable decibel values.
        """
        self._ensure_h5py()

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"NISAR observation file not found: {file_path}")

        meta = self.inspect_metadata(file_path)

        # Polarization selection
        if polarization is not None:
            pol_clean = polarization.strip().upper()
            if pol_clean not in meta.available_polarizations:
                raise KeyError(
                    f"Requested polarization '{polarization}' not present in {file_path}. "
                    f"Available polarizations: {meta.available_polarizations}"
                )
            selected_pol = pol_clean
        else:
            selected_pol = meta.polarization

        meta.polarization = selected_pol

        with self.h5py.File(file_path, "r") as h5f:
            root_path, gcov_group = self._locate_gcov_root(h5f)
            freq_group = gcov_group["grids"][meta.frequency_band]

            if selected_pol not in freq_group:
                raise KeyError(f"Dataset for polarization '{selected_pol}' not found in {meta.frequency_band}.")

            dataset = freq_group[selected_pol]
            x_coords = freq_group["xCoordinates"][()]
            y_coords = freq_group["yCoordinates"][()]

            dx = float(abs(x_coords[1] - x_coords[0])) if len(x_coords) > 1 else 0.0001
            dy = float(abs(y_coords[1] - y_coords[0])) if len(y_coords) > 1 else 0.0001

            # Determine row order (y coordinates can be decreasing from top to bottom)
            y_decreasing = y_coords[0] > y_coords[-1]
            x_min, x_max = float(min(x_coords)), float(max(x_coords))
            y_min, y_max = float(min(y_coords)), float(max(y_coords))

            # Full image bounding box
            full_bounds = rasterio.coords.BoundingBox(x_min, y_min, x_max, y_max)

            # Windowed / AOI extraction if specified
            if aoi_bounds is not None:
                aoi_min_x, aoi_min_y, aoi_max_x, aoi_max_y = aoi_bounds
                
                # Check spatial intersection with product footprint
                if (
                    aoi_min_x > x_max
                    or aoi_max_x < x_min
                    or aoi_min_y > y_max
                    or aoi_max_y < y_min
                ):
                    raise ValueError(
                        f"Specified AOI {aoi_bounds} does not intersect NISAR scene footprint "
                        f"[{x_min:.4f}, {y_min:.4f}, {x_max:.4f}, {y_max:.4f}]."
                    )

                # Convert spatial AOI to column and row indices
                col_start = max(0, int(math.floor((aoi_min_x - x_min) / dx)))
                col_end = min(len(x_coords), int(math.ceil((aoi_max_x - x_min) / dx)))

                if y_decreasing:
                    row_start = max(0, int(math.floor((y_max - aoi_max_y) / dy)))
                    row_end = min(len(y_coords), int(math.ceil((y_max - aoi_min_y) / dy)))
                else:
                    row_start = max(0, int(math.floor((aoi_min_y - y_min) / dy)))
                    row_end = min(len(y_coords), int(math.ceil((aoi_max_y - y_min) / dy)))

                # Windowed read directly from HDF5 slice without reading entire dataset
                data = dataset[row_start:row_end, col_start:col_end].astype(np.float32)

                # Sliced origin and transform
                sub_x_min = x_min + (col_start * dx)
                sub_y_max = y_max - (row_start * dy) if y_decreasing else y_min + (row_end * dy)
                sub_x_max = sub_x_min + (data.shape[1] * dx)
                sub_y_min = sub_y_max - (data.shape[0] * dy)

                transform = Affine(dx, 0.0, sub_x_min, 0.0, -dy if y_decreasing else dy, sub_y_max if y_decreasing else sub_y_min)
                bounds = rasterio.coords.BoundingBox(sub_x_min, sub_y_min, sub_x_max, sub_y_max)
            else:
                # Full scene read
                data = dataset[()].astype(np.float32)
                top_y = y_max if y_decreasing else y_min
                transform = Affine(dx, 0.0, x_min, 0.0, -dy if y_decreasing else dy, top_y)
                bounds = full_bounds

            # Extract NoData fill value
            nodata_val = np.nan
            if "_FillValue" in dataset.attrs:
                try:
                    nodata_val = float(dataset.attrs["_FillValue"])
                except Exception:
                    pass

            # Mask invalid values
            if nodata_val is not None and not np.isnan(nodata_val):
                data[data == nodata_val] = np.nan
            data[~np.isfinite(data)] = np.nan
            data[data <= 0] = np.nan

            if np.all(np.isnan(data)):
                raise ValueError(
                    f"Invalid data: NISAR observation dataset '{selected_pol}' in {filename} "
                    f"contains zero valid finite backscatter pixels."
                )

            # Prepare comparable values (convert linear power to dB)
            if prepare_values:
                data = self.prepare_comparable_values(data)
                nodata_val = np.nan

        loaded = LoadedRaster(
            data=data,
            transform=transform,
            crs=meta.crs,
            nodata=nodata_val,
            bounds=bounds,
            res=(dx, dy),
            file_path=file_path,
        )

        return loaded, meta
