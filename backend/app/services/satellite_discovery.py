"""
TerraScan Unified Satellite Discovery Service (Prompt 5)

Orchestrates all provider services into a single discovery interface.
One provider failing never breaks the other providers.
"""

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from ..models.satellite import (
    ProviderInfo,
    ResourceLink,
    SatelliteRecord,
    SatelliteSearchRequest,
    SatelliteSearchResponse,
    SatelliteHealthResponse,
)
from .nasa_earthdata_service import NASAEarthdataService
from .asf_service import ASFVertexService
from .nisar_resources_service import NISARResourceService
from .csa_service import CSARadarsatService
from .conae_service import CONAESaocomService

logger = logging.getLogger("terrascan.satellite_discovery")


def _validate_bbox(bbox: Optional[List[float]]) -> Optional[str]:
    """Return an error string if bbox is invalid, or None if valid."""
    if bbox is None:
        return None
    if len(bbox) != 4:
        return "bbox must have exactly 4 values: [min_lon, min_lat, max_lon, max_lat]"
    min_lon, min_lat, max_lon, max_lat = bbox
    if not (-180 <= min_lon <= 180 and -180 <= max_lon <= 180):
        return "Longitude values must be between -180 and 180"
    if not (-90 <= min_lat <= 90 and -90 <= max_lat <= 90):
        return "Latitude values must be between -90 and 90"
    if min_lon > max_lon:
        return "min_lon must be <= max_lon"
    if min_lat > max_lat:
        return "min_lat must be <= max_lat"
    return None


def _validate_dates(start_date: Optional[str], end_date: Optional[str]) -> Optional[str]:
    """Return an error string if dates are invalid, or None if valid."""
    if start_date is None and end_date is None:
        return None
    fmt = "%Y-%m-%d"
    try:
        t0 = datetime.strptime(start_date, fmt) if start_date else None
        t1 = datetime.strptime(end_date, fmt) if end_date else None
    except ValueError as exc:
        return f"Invalid date format (expected YYYY-MM-DD): {exc}"
    if t0 and t1 and t0 > t1:
        return "start_date must be before end_date"
    return None


class SatelliteDiscoveryService:
    """
    Unified discovery orchestrator.

    Instantiates all provider services and routes search/resource/health
    requests to the appropriate providers while gracefully handling failures.
    """

    ALL_PROVIDERS = ["nasa_earthdata", "asf", "nisar", "csa", "conae"]

    # Providers with actual search APIs (others return catalogue placeholders)
    SEARCHABLE_PROVIDERS = {"nasa_earthdata", "asf"}

    def __init__(self):
        self._nasa = NASAEarthdataService()
        self._asf = ASFVertexService()
        self._nisar = NISARResourceService()
        self._csa = CSARadarsatService()
        self._conae = CONAESaocomService()

    # ------------------------------------------------------------------
    # Provider registry
    # ------------------------------------------------------------------

    def list_providers(self) -> List[ProviderInfo]:
        """Return provider metadata for all registered satellite data providers."""
        return [
            ProviderInfo(
                id="nasa_earthdata",
                name="NASA Earthdata (CMR)",
                type="machine_api",
                description=(
                    "NASA's Common Metadata Repository — public REST API for discovering "
                    "granules across all NASA Earth observation missions including NISAR, "
                    "UAVSAR, Sentinel-1 (hosted), MODIS, Landsat, and more."
                ),
                homepage_url="https://search.earthdata.nasa.gov/search",
                api_docs_url="https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html",
                requires_auth=False,  # Search is unauthenticated
                auth_type="earthdata_login",  # Required only for download
                supported_params=["bbox", "lat", "lon", "start_date", "end_date", "short_name"],
                status="ok",
            ),
            ProviderInfo(
                id="asf",
                name="Alaska Satellite Facility (ASF) Vertex",
                type="machine_api",
                description=(
                    "ASF Vertex REST search API for SAR granule discovery. "
                    "Covers Sentinel-1, ALOS/ALOS-2, UAVSAR, ERS, JERS, RADARSAT-1, "
                    "and future NISAR. Search is unauthenticated; download requires Earthdata Login."
                ),
                homepage_url="https://search.asf.alaska.edu/",
                api_docs_url="https://asf.alaska.edu/api/",
                requires_auth=False,
                auth_type="earthdata_login",
                supported_params=["bbox", "lat", "lon", "start_date", "end_date", "platform", "polarization"],
                status="ok",
            ),
            self._nisar.get_provider_info(),
            self._csa.get_provider_info(),
            self._conae.get_provider_info(),
        ]

    # ------------------------------------------------------------------
    # Unified search
    # ------------------------------------------------------------------

    def search(self, req: SatelliteSearchRequest) -> SatelliteSearchResponse:
        """
        Run search across all requested providers. Errors from individual
        providers are captured and reported — they do not propagate.
        """
        # Validation
        bbox_err = _validate_bbox(req.bbox)
        if bbox_err:
            raise ValueError(f"Invalid bounding box: {bbox_err}")

        date_err = _validate_dates(req.start_date, req.end_date)
        if date_err:
            raise ValueError(f"Invalid dates: {date_err}")

        # Determine which providers to query
        requested = set(req.providers) if req.providers else set(self.ALL_PROVIDERS)
        unknown = requested - set(self.ALL_PROVIDERS)
        warnings: List[str] = []
        if unknown:
            warnings.append(f"Unknown providers ignored: {sorted(unknown)}")

        active_providers = requested & set(self.ALL_PROVIDERS)

        all_records: List[SatelliteRecord] = []
        providers_queried: List[str] = []
        providers_failed: List[str] = []

        # Derive point bbox if lat/lon provided without bbox
        effective_bbox = req.bbox
        if effective_bbox is None and req.lat is not None and req.lon is not None:
            buf = req.point_buffer_deg
            effective_bbox = [req.lon - buf, req.lat - buf, req.lon + buf, req.lat + buf]

        for pid in sorted(active_providers):
            try:
                records = self._search_provider(
                    pid=pid,
                    bbox=effective_bbox,
                    lat=req.lat,
                    lon=req.lon,
                    point_buffer_deg=req.point_buffer_deg,
                    start_date=req.start_date,
                    end_date=req.end_date,
                    satellite=req.satellite,
                    polarization=req.polarization,
                    max_results=req.max_results,
                )
                all_records.extend(records)
                providers_queried.append(pid)
            except Exception as exc:
                logger.warning("Provider '%s' search failed: %s", pid, exc)
                providers_failed.append(pid)
                warnings.append(f"Provider '{pid}' unavailable: {exc}")

        return SatelliteSearchResponse(
            total_results=len(all_records),
            providers_queried=providers_queried,
            providers_failed=providers_failed,
            results=all_records,
            warnings=warnings if warnings else None,
        )

    def _search_provider(
        self,
        pid: str,
        bbox: Optional[List[float]],
        lat: Optional[float],
        lon: Optional[float],
        point_buffer_deg: float,
        start_date: Optional[str],
        end_date: Optional[str],
        satellite: Optional[str],
        polarization: Optional[str],
        max_results: int,
    ) -> List[SatelliteRecord]:
        """Dispatch search to the correct provider service."""
        if pid == "nasa_earthdata":
            return self._nasa.search(
                bbox=bbox,
                lat=lat,
                lon=lon,
                point_buffer_deg=point_buffer_deg,
                start_date=start_date,
                end_date=end_date,
                max_results=max_results,
            )
        elif pid == "asf":
            return self._asf.search(
                bbox=bbox,
                lat=lat,
                lon=lon,
                point_buffer_deg=point_buffer_deg,
                start_date=start_date,
                end_date=end_date,
                platform=satellite,
                polarization=polarization,
                max_results=max_results,
            )
        elif pid == "nisar":
            # NISAR data lives in NASA Earthdata / ASF — return resource info record
            return []  # No separate granule search for NISAR beyond CMR/ASF
        elif pid == "csa":
            return self._csa.search(bbox=bbox, start_date=start_date, end_date=end_date)
        elif pid == "conae":
            return self._conae.search(bbox=bbox, start_date=start_date, end_date=end_date)
        else:
            logger.warning("Unknown provider '%s' in search dispatch", pid)
            return []

    # ------------------------------------------------------------------
    # Resources
    # ------------------------------------------------------------------

    def list_resources(self) -> List[Dict[str, Any]]:
        """
        Return all educational, documentation, and catalogue resource links
        from all providers, grouped by provider.
        """
        all_resources: List[ResourceLink] = []
        all_resources.extend(self._nisar.get_resources())
        all_resources.extend(self._csa.get_resources())
        all_resources.extend(self._conae.get_resources())

        # NASA Earthdata / ASF resources
        all_resources.extend([
            ResourceLink(
                provider="nasa_earthdata",
                category="portal",
                title="NASA Earthdata Search",
                url="https://search.earthdata.nasa.gov/search",
                description="NASA Earthdata portal for discovering and downloading Earth observation data.",
            ),
            ResourceLink(
                provider="asf",
                category="portal",
                title="ASF Vertex SAR Data Portal",
                url="https://search.asf.alaska.edu/",
                description="Alaska Satellite Facility search portal for SAR granule discovery and download.",
            ),
        ])

        return [r.model_dump() for r in all_resources]

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    def health(self) -> SatelliteHealthResponse:
        """Check health of all provider services."""
        provider_statuses: List[Dict[str, Any]] = []

        for pid, check_fn in [
            ("nasa_earthdata", self._nasa.health_check),
            ("asf", self._asf.health_check),
            ("nisar", self._nisar.health_check),
            ("csa", self._csa.health_check),
            ("conae", self._conae.health_check),
        ]:
            try:
                result = check_fn()
                provider_statuses.append(result)
            except Exception as exc:
                provider_statuses.append(
                    {"provider": pid, "status": "unavailable", "detail": str(exc)}
                )

        # Overall status: ok if at least one searchable provider is up
        machine_statuses = [
            s for s in provider_statuses
            if s.get("provider") in self.SEARCHABLE_PROVIDERS
        ]
        overall = (
            "ok"
            if any(s.get("status") == "ok" for s in machine_statuses)
            else "degraded"
        )

        return SatelliteHealthResponse(
            overall_status=overall,
            providers=provider_statuses,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
