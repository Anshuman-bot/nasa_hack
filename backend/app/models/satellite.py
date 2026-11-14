"""
TerraScan Satellite Data Models (Prompt 5)

Standardised Pydantic schemas shared across all satellite data provider services.
Every provider normalises its search results into SatelliteRecord before returning.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Unified Satellite Record
# ---------------------------------------------------------------------------

class SatelliteRecord(BaseModel):
    """
    Provider-agnostic metadata record returned by any satellite search service.
    Fields that cannot be populated from a specific provider are left as None.
    """
    provider: str = Field(..., description="Data provider identifier (nasa_earthdata, asf, nisar, csa, conae)")
    satellite: str = Field(..., description="Satellite / platform name")
    sensor: Optional[str] = Field(None, description="Instrument or sensor name")
    acquisition_date: Optional[str] = Field(None, description="Acquisition date (ISO 8601 or YYYY-MM-DD)")
    start_time: Optional[str] = Field(None, description="Scene start time (UTC, ISO 8601)")
    end_time: Optional[str] = Field(None, description="Scene end time (UTC, ISO 8601)")

    # Geographic coverage
    bbox: Optional[List[float]] = Field(
        None, description="Bounding box [min_lon, min_lat, max_lon, max_lat]"
    )
    center_lat: Optional[float] = Field(None, description="Scene centre latitude")
    center_lon: Optional[float] = Field(None, description="Scene centre longitude")

    # Product info
    data_format: Optional[str] = Field(None, description="File format (HDF5, GeoTIFF, NetCDF, …)")
    product_identifier: Optional[str] = Field(None, description="Unique product / granule / scene ID")
    product_type: Optional[str] = Field(None, description="Product type or processing level")
    collection: Optional[str] = Field(None, description="Dataset / collection name")

    # SAR-specific
    polarization: Optional[str] = Field(None, description="SAR polarization(s) (HH, VV, HH+HV, …)")
    radar_band: Optional[str] = Field(None, description="Radar band (L, C, X, S, …)")

    # Resolution
    spatial_resolution_m: Optional[float] = Field(None, description="Spatial resolution in metres")

    # Processing / download
    processing_status: Optional[str] = Field(None, description="Processing level or status")
    download_url: Optional[str] = Field(None, description="Direct download link (if available)")
    browse_url: Optional[str] = Field(None, description="Quick-look / browse image URL")
    access_url: Optional[str] = Field(None, description="Catalogue or detail page URL")

    # Raw provider metadata passthrough
    extra: Optional[Dict[str, Any]] = Field(None, description="Raw provider-specific metadata fields")


# ---------------------------------------------------------------------------
# Search Request/Response
# ---------------------------------------------------------------------------

class SatelliteSearchRequest(BaseModel):
    """Unified search parameters accepted by GET /api/satellite/search."""
    # Spatial
    bbox: Optional[List[float]] = Field(
        None, description="Bounding box [min_lon, min_lat, max_lon, max_lat]"
    )
    lat: Optional[float] = Field(None, description="Point latitude (alternative to bbox)")
    lon: Optional[float] = Field(None, description="Point longitude (alternative to bbox)")
    point_buffer_deg: float = Field(
        0.5, description="Degree buffer around lat/lon point (default 0.5°)"
    )

    # Temporal
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")

    # Filtering
    providers: Optional[List[str]] = Field(
        None,
        description="Restrict to specific providers; omit for all. "
                    "Options: nasa_earthdata, asf, nisar, csa, conae",
    )
    satellite: Optional[str] = Field(None, description="Platform name filter (e.g. NISAR, Sentinel-1)")
    data_type: Optional[str] = Field(None, description="Data type filter: SAR, optical, …")
    polarization: Optional[str] = Field(None, description="SAR polarization filter")

    # Pagination
    max_results: int = Field(50, ge=1, le=500, description="Maximum records per provider")


class SatelliteSearchResponse(BaseModel):
    """Response envelope for unified satellite search."""
    total_results: int
    providers_queried: List[str]
    providers_failed: List[str]
    results: List[SatelliteRecord]
    warnings: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Provider / Resource models
# ---------------------------------------------------------------------------

class ProviderInfo(BaseModel):
    """Metadata about a registered satellite data provider."""
    id: str
    name: str
    type: str = Field(..., description="machine_api | catalogue_portal | documentation | auth_required")
    description: str
    homepage_url: Optional[str] = None
    api_docs_url: Optional[str] = None
    requires_auth: bool = False
    auth_type: Optional[str] = Field(None, description="earthdata_login | registration | none")
    supported_params: List[str] = Field(default_factory=list)
    status: str = Field("unknown", description="ok | degraded | unavailable | catalogue_only")


class ResourceLink(BaseModel):
    """Educational / documentation resource link."""
    provider: str
    category: str = Field(..., description="documentation | tutorial | storymaps | portal | registration")
    title: str
    url: str
    description: Optional[str] = None


class SatelliteHealthResponse(BaseModel):
    """Health status for all satellite data provider services."""
    overall_status: str
    providers: List[Dict[str, Any]]
    timestamp: str
