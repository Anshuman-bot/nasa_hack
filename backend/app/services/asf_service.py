"""
TerraScan ASF (Alaska Satellite Facility) Vertex Search Service (Prompt 5)

Integrates with the ASF Vertex search API — a documented, public REST interface
for SAR data discovery covering Sentinel-1, ALOS, ERS, JERS, RADARSAT-1, UAVSAR, etc.

Documented API: https://asf.alaska.edu/api/
Endpoint: https://api.daac.asf.alaska.edu/services/search/param

Authentication: Not required for search/metadata.
Download: Requires NASA Earthdata Login (stored in env vars, never exposed).
"""

import logging
import json
import urllib.request
import urllib.parse
import urllib.error
from typing import Any, Dict, List, Optional

from ..models.satellite import SatelliteRecord

logger = logging.getLogger("terrascan.asf_service")

# ---------------------------------------------------------------------------
# ASF Vertex public search endpoint
# ---------------------------------------------------------------------------
ASF_SEARCH_URL = "https://api.daac.asf.alaska.edu/services/search/param"
REQUEST_TIMEOUT = 20

# Platform aliases for user-friendly filtering
PLATFORM_MAP = {
    "sentinel-1": "Sentinel-1",
    "s1": "Sentinel-1",
    "alos": "ALOS",
    "alos-2": "ALOS-2",
    "uavsar": "UAVSAR",
    "ers-1": "ERS-1",
    "ers-2": "ERS-2",
    "jers-1": "JERS-1",
    "radarsat-1": "RADARSAT-1",
    "nisar": "NISAR",
}


def _http_get_json(url: str, params: Dict[str, Any]) -> Any:
    """Minimal stdlib HTTP GET returning parsed JSON."""
    query = urllib.parse.urlencode(params, doseq=True)
    full_url = f"{url}?{query}"
    logger.debug("ASF GET %s", full_url)

    req = urllib.request.Request(
        full_url,
        headers={
            "User-Agent": "TerraScan/0.1 (NASA Space Apps 2026)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            raw = resp.read()
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise ConnectionError(f"ASF HTTP {exc.code}: {exc.reason}") from exc
    except urllib.error.URLError as exc:
        raise ConnectionError(f"ASF network error: {exc.reason}") from exc


def _parse_asf_entry(item: Dict[str, Any]) -> SatelliteRecord:
    """
    Normalise a single ASF GeoJSON feature property set into SatelliteRecord.
    ASF returns a GeoJSON FeatureCollection; each feature has 'properties'.
    """
    p = item.get("properties", item)  # handle both raw dict and nested properties

    # Bounding box from ASF geometry (Polygon)
    bbox: Optional[List[float]] = None
    geom = item.get("geometry")
    if geom and geom.get("type") == "Polygon":
        try:
            coords = geom["coordinates"][0]
            lons = [c[0] for c in coords]
            lats = [c[1] for c in coords]
            bbox = [min(lons), min(lats), max(lons), max(lats)]
        except Exception:
            pass

    acq_date = str(p.get("startTime", ""))[:10] or None

    # Determine polarization
    pol = p.get("polarization") or p.get("processingLevel") or None

    # Spatial resolution varies by beam mode; populate when known
    res_m: Optional[float] = None
    if p.get("pixelSpacingAz"):
        try:
            res_m = float(p["pixelSpacingAz"])
        except Exception:
            pass

    return SatelliteRecord(
        provider="asf",
        satellite=p.get("platform", "Unknown"),
        sensor=p.get("sensor") or p.get("beamMode"),
        acquisition_date=acq_date,
        start_time=p.get("startTime"),
        end_time=p.get("stopTime"),
        bbox=bbox,
        center_lat=(bbox[1] + bbox[3]) / 2 if bbox else None,
        center_lon=(bbox[0] + bbox[2]) / 2 if bbox else None,
        data_format=p.get("fileType") or p.get("productType"),
        product_identifier=p.get("sceneName") or p.get("granuleName"),
        product_type=p.get("processingLevel"),
        collection=p.get("dataset") or p.get("collectionName"),
        polarization=pol,
        radar_band=p.get("band"),
        spatial_resolution_m=res_m,
        processing_status=p.get("processingLevel"),
        download_url=p.get("url") or p.get("downloadUrl"),
        browse_url=p.get("browse") or p.get("browseUrl"),
        access_url=(
            f"https://search.asf.alaska.edu/#granule={p.get('sceneName', '')}"
            if p.get("sceneName")
            else "https://search.asf.alaska.edu/"
        ),
        extra={
            "flightDirection": p.get("flightDirection"),
            "lookDirection": p.get("lookDirection"),
            "pathNumber": p.get("pathNumber"),
            "frameNumber": p.get("frameNumber"),
            "beamMode": p.get("beamMode"),
            "absoluteOrbit": p.get("absoluteOrbit"),
            "relativeOrbit": p.get("relativeOrbit"),
            "asf_product_id": p.get("productId") or p.get("sceneId"),
        },
    )


class ASFVertexService:
    """
    Wraps the ASF Vertex public search API for SAR granule discovery.

    Classification: Machine-accessible data source (unauthenticated search).
    Covers: Sentinel-1, ALOS/ALOS-2, UAVSAR, ERS, JERS, RADARSAT-1, and future NISAR.
    Download requires NASA Earthdata Login credentials.
    """

    PROVIDER_ID = "asf"

    def search(
        self,
        bbox: Optional[List[float]] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        point_buffer_deg: float = 0.5,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        platform: Optional[str] = None,
        processing_level: Optional[str] = None,
        polarization: Optional[str] = None,
        max_results: int = 50,
    ) -> List[SatelliteRecord]:
        """
        Search ASF Vertex for SAR granules.

        Parameters
        ----------
        bbox : [min_lon, min_lat, max_lon, max_lat]
        lat, lon : point search (buffered)
        start_date, end_date : YYYY-MM-DD
        platform : satellite platform name (Sentinel-1, ALOS, UAVSAR, …)
        processing_level : e.g. SLC, GRD, L1.1
        polarization : HH, VV, HH+HV, VV+VH, …
        max_results : maximum granule records
        """
        params: Dict[str, Any] = {
            "output": "geojson",
            "maxResults": min(max_results, 250),
        }

        # Spatial
        if bbox and len(bbox) == 4:
            min_lon, min_lat, max_lon, max_lat = bbox
            # ASF uses intersects WKT POLYGON
            poly = (
                f"POLYGON(({min_lon} {min_lat},{max_lon} {min_lat},"
                f"{max_lon} {max_lat},{min_lon} {max_lat},{min_lon} {min_lat}))"
            )
            params["intersectsWith"] = poly
        elif lat is not None and lon is not None:
            buf = point_buffer_deg
            poly = (
                f"POLYGON(({lon-buf} {lat-buf},{lon+buf} {lat-buf},"
                f"{lon+buf} {lat+buf},{lon-buf} {lat+buf},{lon-buf} {lat-buf}))"
            )
            params["intersectsWith"] = poly

        # Temporal
        if start_date:
            params["start"] = f"{start_date}T00:00:00UTC"
        if end_date:
            params["end"] = f"{end_date}T23:59:59UTC"

        # Platform
        if platform:
            mapped = PLATFORM_MAP.get(platform.lower(), platform)
            params["platform"] = mapped

        # Processing level
        if processing_level:
            params["processingLevel"] = processing_level

        # Polarization
        if polarization:
            params["polarization"] = polarization

        try:
            data = _http_get_json(ASF_SEARCH_URL, params)
        except ConnectionError as exc:
            logger.warning("ASF Vertex unavailable: %s", exc)
            raise

        features = []
        if isinstance(data, list):
            # ASF sometimes returns a list of FeatureCollections
            for fc in data:
                features.extend(fc.get("features", []))
        elif isinstance(data, dict):
            features = data.get("features", [])

        records = []
        for feat in features[:max_results]:
            try:
                records.append(_parse_asf_entry(feat))
            except Exception as exc:
                logger.debug("Could not parse ASF feature: %s", exc)

        logger.info("ASF Vertex returned %d granule records", len(records))
        return records

    def health_check(self) -> Dict[str, Any]:
        """Ping ASF Vertex to verify availability."""
        try:
            _http_get_json(ASF_SEARCH_URL, {"output": "geojson", "maxResults": 1, "platform": "UAVSAR"})
            return {"provider": self.PROVIDER_ID, "status": "ok", "detail": "ASF Vertex reachable"}
        except Exception as exc:
            return {"provider": self.PROVIDER_ID, "status": "unavailable", "detail": str(exc)}
