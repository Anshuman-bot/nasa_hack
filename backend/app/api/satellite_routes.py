"""
TerraScan Satellite Data Discovery API Routes (Prompt 5)

Adds the following endpoints to the existing TerraScan backend:

  GET  /api/satellite/providers   — List all registered satellite data providers
  GET  /api/satellite/search      — Unified granule/metadata search across providers
  GET  /api/satellite/resources   — Educational, documentation, and catalogue links
  GET  /api/satellite/health      — Health check for all provider services

All endpoints follow the existing router and error-handling conventions
established in app/api/routes.py.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from ..models.satellite import (
    ProviderInfo,
    SatelliteSearchRequest,
    SatelliteSearchResponse,
    SatelliteHealthResponse,
)
from ..services.satellite_discovery import SatelliteDiscoveryService

logger = logging.getLogger("terrascan.satellite_routes")

satellite_router = APIRouter(prefix="/api/satellite", tags=["Satellite Discovery"])

# Single shared instance — services are lightweight (no persistent connections)
_discovery = SatelliteDiscoveryService()


# ---------------------------------------------------------------------------
# GET /api/satellite/providers
# ---------------------------------------------------------------------------

@satellite_router.get(
    "/providers",
    response_model=List[ProviderInfo],
    summary="List satellite data providers",
    description=(
        "Returns all registered satellite data providers with their type classification, "
        "authentication requirements, and supported search parameters."
    ),
)
def list_providers():
    """
    Returns the provider registry.

    Provider types:
    - machine_api: fully searchable via REST API (nasa_earthdata, asf)
    - catalogue_portal: browseable via external web portal (csa, conae, nisar)
    - documentation: static resource / educational links
    - auth_required: requires registration or credentials for any access
    """
    try:
        return _discovery.list_providers()
    except Exception as exc:
        logger.exception("Error listing providers")
        raise HTTPException(status_code=500, detail=f"Provider registry error: {exc}")


# ---------------------------------------------------------------------------
# GET /api/satellite/search
# ---------------------------------------------------------------------------

@satellite_router.get(
    "/search",
    response_model=SatelliteSearchResponse,
    summary="Unified satellite data search",
    description=(
        "Search across all supported satellite data providers using geographic, "
        "temporal, and sensor filters. Providers with no public API return catalogue "
        "reference records with external portal links."
    ),
)
def search_satellite_data(
    # Spatial — bbox takes priority over lat/lon
    bbox: Optional[str] = Query(
        None,
        description=(
            "Bounding box as 'min_lon,min_lat,max_lon,max_lat' (e.g. '91.5,25.9,92.0,26.5')"
        ),
    ),
    lat: Optional[float] = Query(None, description="Point latitude (use with lon)"),
    lon: Optional[float] = Query(None, description="Point longitude (use with lat)"),
    point_buffer_deg: float = Query(0.5, description="Degree buffer around lat/lon point"),

    # Temporal
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),

    # Filtering
    providers: Optional[str] = Query(
        None,
        description=(
            "Comma-separated provider IDs to query. "
            "Options: nasa_earthdata, asf, nisar, csa, conae. "
            "Omit to query all providers."
        ),
    ),
    satellite: Optional[str] = Query(None, description="Platform/satellite name filter"),
    data_type: Optional[str] = Query(None, description="Data type filter: SAR, optical"),
    polarization: Optional[str] = Query(None, description="SAR polarization filter: HH, VV, HH+HV"),

    # Pagination
    max_results: int = Query(50, ge=1, le=500, description="Maximum records per provider"),
):
    """
    Unified satellite granule search endpoint.

    **Fully functional providers** (actual granule search):
    - `nasa_earthdata`: NASA CMR API — no credentials needed for search
    - `asf`: ASF Vertex API — no credentials needed for search

    **Catalogue-only providers** (return portal links, no granule data):
    - `nisar`: NISAR data is discoverable via nasa_earthdata and asf providers
    - `csa`: RADARSAT-1 and RCM require CSA data access agreement
    - `conae`: SAOCOM requires CONAE registration — no public API

    Download of any results requires NASA Earthdata Login credentials
    configured via environment variables (EARTHDATA_USERNAME / EARTHDATA_PASSWORD).
    """
    # Parse bbox string → list
    parsed_bbox: Optional[List[float]] = None
    if bbox:
        try:
            parts = [float(v.strip()) for v in bbox.split(",")]
            if len(parts) != 4:
                raise ValueError("Expected 4 comma-separated values")
            parsed_bbox = parts
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid bbox format '{bbox}'. Expected 'min_lon,min_lat,max_lon,max_lat': {exc}",
            )

    # Parse providers string → list
    provider_list: Optional[List[str]] = None
    if providers:
        provider_list = [p.strip() for p in providers.split(",") if p.strip()]

    req = SatelliteSearchRequest(
        bbox=parsed_bbox,
        lat=lat,
        lon=lon,
        point_buffer_deg=point_buffer_deg,
        start_date=start_date,
        end_date=end_date,
        providers=provider_list,
        satellite=satellite,
        data_type=data_type,
        polarization=polarization,
        max_results=max_results,
    )

    try:
        return _discovery.search(req)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Satellite search error")
        raise HTTPException(status_code=500, detail=f"Search failed: {exc}")


# ---------------------------------------------------------------------------
# GET /api/satellite/resources
# ---------------------------------------------------------------------------

@satellite_router.get(
    "/resources",
    summary="Satellite data educational and catalogue resources",
    description=(
        "Returns all educational, documentation, StoryMap, training, and "
        "external catalogue links from all supported providers."
    ),
)
def list_resources(
    provider: Optional[str] = Query(None, description="Filter by provider ID"),
    category: Optional[str] = Query(
        None,
        description="Filter by category: documentation, tutorial, portal, storymaps, registration",
    ),
):
    """
    Resource registry — educational and catalogue links from all providers.

    Includes:
    - NASA ARSET training, Earthdata docs, SAR basics
    - NISAR user guide, StoryMaps, UAVSAR postcards
    - CSA SAR Python tutorial, RADARSAT open data portals
    - CONAE SAOCOM catalogue and registration links
    - ASF Vertex portal link
    """
    try:
        resources = _discovery.list_resources()

        # Apply optional filters
        if provider:
            resources = [r for r in resources if r.get("provider") == provider]
        if category:
            resources = [r for r in resources if r.get("category") == category]

        return {
            "total": len(resources),
            "resources": resources,
        }
    except Exception as exc:
        logger.exception("Resource listing error")
        raise HTTPException(status_code=500, detail=f"Resource listing failed: {exc}")


# ---------------------------------------------------------------------------
# GET /api/satellite/health
# ---------------------------------------------------------------------------

@satellite_router.get(
    "/health",
    response_model=SatelliteHealthResponse,
    summary="Satellite provider health check",
    description=(
        "Checks availability of all satellite data provider services. "
        "One unavailable provider does not degrade the overall system if any "
        "machine-API provider (nasa_earthdata, asf) remains reachable."
    ),
)
def satellite_health():
    """
    Health check for all satellite data provider services.

    Status values:
    - ok: provider is reachable and functional
    - degraded: provider partially available
    - unavailable: provider could not be reached
    - catalogue_only: provider has no machine API; external links remain valid
    """
    try:
        return _discovery.health()
    except Exception as exc:
        logger.exception("Satellite health check error")
        raise HTTPException(status_code=500, detail=f"Health check failed: {exc}")
