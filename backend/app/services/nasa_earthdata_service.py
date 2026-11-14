"""
TerraScan NASA Earthdata CMR Search Service (Prompt 5)

Integrates with NASA's Common Metadata Repository (CMR) public search API.
CMR is fully open — no credentials needed for metadata discovery.

Documented API: https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html

Authentication (Earthdata Login) is only required for data download.
Search/discovery is unauthenticated.
"""

import logging
import os
from typing import Any, Dict, List, Optional

import urllib.request
import urllib.parse
import urllib.error
import json

from ..models.satellite import SatelliteRecord

logger = logging.getLogger("terrascan.nasa_earthdata")

# ---------------------------------------------------------------------------
# Public CMR endpoint — no credentials required for search
# ---------------------------------------------------------------------------
CMR_GRANULE_SEARCH = "https://cmr.earthdata.nasa.gov/search/granules.json"
CMR_COLLECTION_SEARCH = "https://cmr.earthdata.nasa.gov/search/collections.json"

# Request timeout (seconds)
REQUEST_TIMEOUT = 15


def _http_get(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Minimal stdlib HTTP GET — avoids adding a requests dependency.
    Returns parsed JSON dict or raises on network/HTTP error.
    """
    query = urllib.parse.urlencode(params, doseq=True)
    full_url = f"{url}?{query}"
    logger.debug("CMR GET %s", full_url)

    req = urllib.request.Request(
        full_url,
        headers={
            "User-Agent": "TerraScan/0.1 (NASA Space Apps 2026; github.com/terrascan)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            raw = resp.read()
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise ConnectionError(f"CMR HTTP {exc.code}: {exc.reason}") from exc
    except urllib.error.URLError as exc:
        raise ConnectionError(f"CMR network error: {exc.reason}") from exc


def _granule_to_record(entry: Dict[str, Any]) -> SatelliteRecord:
    """Normalise a single CMR granule JSON entry into a SatelliteRecord."""

    # Bounding box from CMR boxes field: [S W N E]
    bbox: Optional[List[float]] = None
    boxes = entry.get("boxes", [])
    if boxes:
        try:
            s, w, n, e = [float(v) for v in boxes[0].split()]
            bbox = [w, s, e, n]
        except Exception:
            pass

    # Links: prefer download; fall back to browse / related
    download_url: Optional[str] = None
    browse_url: Optional[str] = None
    for link in entry.get("links", []):
        rel = link.get("rel", "")
        href = link.get("href", "")
        if "data#" in rel and not download_url:
            download_url = href
        elif "browse#" in rel and not browse_url:
            browse_url = href

    # Acquisition date
    acq_date = (
        entry.get("time_start", "")[:10]
        or entry.get("updated", "")[:10]
        or None
    )

    return SatelliteRecord(
        provider="nasa_earthdata",
        satellite=entry.get("dataset_id", entry.get("collection_concept_id", "NASA")),
        sensor=None,
        acquisition_date=acq_date,
        start_time=entry.get("time_start"),
        end_time=entry.get("time_end"),
        bbox=bbox,
        center_lat=(bbox[1] + bbox[3]) / 2 if bbox else None,
        center_lon=(bbox[0] + bbox[2]) / 2 if bbox else None,
        data_format=None,
        product_identifier=entry.get("producer_granule_id") or entry.get("id"),
        product_type=entry.get("granule_ur"),
        collection=entry.get("dataset_id"),
        processing_status=entry.get("processing_level_id"),
        download_url=download_url,
        browse_url=browse_url,
        access_url=f"https://search.earthdata.nasa.gov/search/granules?p={entry.get('collection_concept_id', '')}",
        extra={
            "concept_id": entry.get("id"),
            "collection_concept_id": entry.get("collection_concept_id"),
            "data_center": entry.get("data_center"),
            "original_format": entry.get("original_format"),
        },
    )


class NASAEarthdataService:
    """
    Wraps the NASA CMR public search API for granule discovery.

    Classification: Machine-accessible data source (unauthenticated search).
    Download requires NASA Earthdata Login credentials (stored in env vars).
    """

    PROVIDER_ID = "nasa_earthdata"

    # Default SAR-focused collections to search when no short_name is specified
    DEFAULT_SAR_COLLECTIONS = [
        "NISAR_L2_GCOV_V1",          # NISAR L2 GCOV (once operational)
        "SENTINEL-1A_SLC",            # Sentinel-1A SLC
        "SENTINEL-1B_SLC",            # Sentinel-1B SLC
        "UAVSAR_HDF5_L1",            # UAVSAR L1 HDF5
        "ALOS2PALSAR2_L1_1",         # ALOS-2 PALSAR-2
    ]

    def search(
        self,
        bbox: Optional[List[float]] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        point_buffer_deg: float = 0.5,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        short_name: Optional[str] = None,
        collection_concept_id: Optional[str] = None,
        max_results: int = 50,
    ) -> List[SatelliteRecord]:
        """
        Search NASA CMR for granule metadata.

        Parameters
        ----------
        bbox : [min_lon, min_lat, max_lon, max_lat] – preferred spatial filter
        lat, lon : point search (expanded to a small bounding box)
        start_date, end_date : temporal filter (YYYY-MM-DD)
        short_name : CMR collection short_name filter
        collection_concept_id : explicit CMR collection concept ID filter
        max_results : max granule records to return (CMR page_size capped at 500)
        """
        params: Dict[str, Any] = {
            "page_size": min(max_results, 100),
            "sort_key": "-start_date",
        }

        # Spatial filter
        if bbox and len(bbox) == 4:
            min_lon, min_lat, max_lon, max_lat = bbox
            params["bounding_box[]"] = f"{min_lon},{min_lat},{max_lon},{max_lat}"
        elif lat is not None and lon is not None:
            buf = point_buffer_deg
            params["bounding_box[]"] = f"{lon-buf},{lat-buf},{lon+buf},{lat+buf}"

        # Temporal filter
        if start_date or end_date:
            t0 = f"{start_date}T00:00:00Z" if start_date else ""
            t1 = f"{end_date}T23:59:59Z" if end_date else ""
            params["temporal[]"] = f"{t0},{t1}"

        # Collection filter
        if short_name:
            params["short_name[]"] = short_name
        elif collection_concept_id:
            params["collection_concept_id[]"] = collection_concept_id

        try:
            data = _http_get(CMR_GRANULE_SEARCH, params)
        except ConnectionError as exc:
            logger.warning("NASA Earthdata CMR unavailable: %s", exc)
            raise

        entries = data.get("feed", {}).get("entry", [])
        records = []
        for entry in entries[:max_results]:
            try:
                records.append(_granule_to_record(entry))
            except Exception as exc:
                logger.debug("Could not parse CMR entry: %s — %s", entry.get("id"), exc)

        logger.info("CMR returned %d granule records", len(records))
        return records

    def search_collections(
        self,
        keyword: str = "SAR",
        max_results: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Search CMR collections by keyword — useful for dataset discovery.
        Returns raw CMR collection entries (not normalised to SatelliteRecord).
        """
        params = {
            "keyword": keyword,
            "page_size": min(max_results, 100),
        }
        try:
            data = _http_get(CMR_COLLECTION_SEARCH, params)
        except ConnectionError as exc:
            logger.warning("CMR collection search failed: %s", exc)
            raise

        return data.get("feed", {}).get("entry", [])

    def health_check(self) -> Dict[str, Any]:
        """Ping CMR to verify availability."""
        try:
            _http_get(CMR_GRANULE_SEARCH, {"page_size": 1, "short_name[]": "UAVSAR_HDF5_L1"})
            return {"provider": self.PROVIDER_ID, "status": "ok", "detail": "CMR reachable"}
        except Exception as exc:
            return {"provider": self.PROVIDER_ID, "status": "unavailable", "detail": str(exc)}
