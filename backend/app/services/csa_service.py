"""
TerraScan Canadian Space Agency (CSA) RADARSAT Service (Prompt 5)

Covers:
  - RADARSAT Constellation Mission (RCM)
  - RADARSAT-1

Data classification:
  - RCM: Available via the Canadian Federal Government Open Data portal.
    The CSA Open Data catalogue has a CKAN-based API we can query for dataset metadata.
    Actual imagery requires a data access request / agreement — no self-service download API.
  - RADARSAT-1: Historical archive, same access path.
  - SAR Python Tutorial (GitHub): Documentation/educational resource.

Machine-accessible: CSA Open Data CKAN API (dataset discovery only, not granule-level search).
Full granule ordering requires contacting CSA or using authorised portals.

CKAN API base: https://donnees-data.asc-csa.gc.ca/api/3/action/
"""

import logging
import json
import urllib.request
import urllib.parse
import urllib.error
from typing import Any, Dict, List, Optional

from ..models.satellite import ProviderInfo, ResourceLink, SatelliteRecord

logger = logging.getLogger("terrascan.csa_service")

# ---------------------------------------------------------------------------
# CSA CKAN Open Data API — public, unauthenticated
# ---------------------------------------------------------------------------
CSA_CKAN_BASE = "https://donnees-data.asc-csa.gc.ca/api/3/action"
REQUEST_TIMEOUT = 15

# Known RCM dataset identifiers in the CSA Open Data catalogue
RCM_DATASET_ID = "rcm"
RS1_DATASET_ID = "radarsat1"


def _ckan_get(action: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Call a CSA CKAN API action and return the parsed JSON result."""
    url = f"{CSA_CKAN_BASE}/{action}"
    query = urllib.parse.urlencode(params)
    full_url = f"{url}?{query}"
    logger.debug("CSA CKAN GET %s", full_url)

    req = urllib.request.Request(
        full_url,
        headers={
            "User-Agent": "TerraScan/0.1 (NASA Space Apps 2026)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise ConnectionError(f"CSA CKAN HTTP {exc.code}: {exc.reason}") from exc
    except urllib.error.URLError as exc:
        raise ConnectionError(f"CSA CKAN network error: {exc.reason}") from exc


class CSARadarsatService:
    """
    Canadian Space Agency RADARSAT resource service.

    Classification:
      - Dataset catalogue discovery: Machine-accessible via CKAN API (metadata only).
      - Granule/scene ordering: Requires CSA data access agreement (external portal).
      - Educational resources: Static links.

    Note: CSA does not expose a granule-level spatial search API comparable to CMR or ASF.
    Dataset-level metadata (title, description, format, licence) can be retrieved via CKAN.
    For granule ordering the user must visit the external catalogue links provided.
    """

    PROVIDER_ID = "csa"

    def get_provider_info(self) -> ProviderInfo:
        return ProviderInfo(
            id=self.PROVIDER_ID,
            name="Canadian Space Agency (CSA) RADARSAT",
            type="catalogue_portal",
            description=(
                "CSA operates the RADARSAT Constellation Mission (RCM) and historical RADARSAT-1. "
                "Dataset metadata is accessible via the CSA Open Data CKAN API. "
                "Scene-level ordering requires a data access agreement."
            ),
            homepage_url="https://www.asc-csa.gc.ca/eng/satellites/radarsat/",
            api_docs_url="https://donnees-data.asc-csa.gc.ca/api/3/action/help_show?name=package_show",
            requires_auth=True,
            auth_type="registration",
            supported_params=["dataset_id"],
            status="catalogue_only",
        )

    def get_dataset_metadata(self, dataset_id: str = RCM_DATASET_ID) -> Dict[str, Any]:
        """
        Retrieve dataset-level metadata from the CSA CKAN catalogue.
        Returns raw CKAN package dict (title, description, resources, licence, etc.).
        This is dataset metadata — NOT individual granule/scene metadata.
        """
        try:
            result = _ckan_get("package_show", {"id": dataset_id})
            if result.get("success"):
                return result.get("result", {})
            raise ValueError(f"CKAN returned success=false for dataset '{dataset_id}'")
        except ConnectionError:
            raise

    def get_resources(self) -> List[ResourceLink]:
        """Return curated CSA data portal and educational resource links."""
        return [
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="portal",
                title="RADARSAT Constellation Mission (RCM) Open Data",
                url="https://donnees-data.asc-csa.gc.ca/en/dataset/rcm",
                description=(
                    "CSA Open Data entry for RCM — C-band SAR constellation providing "
                    "daily Canada coverage and maritime monitoring."
                ),
            ),
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="portal",
                title="RADARSAT-1 Historical Archive",
                url="https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1",
                description="CSA Open Data entry for the RADARSAT-1 historical C-band SAR archive.",
            ),
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="tutorial",
                title="SAR Python Tutorial (CSA GitHub)",
                url="https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial",
                description=(
                    "Official CSA Jupyter notebook tutorial on reading and processing "
                    "SAR data with Python using RADARSAT imagery."
                ),
            ),
        ]

    def search(
        self,
        bbox: Optional[List[float]] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        max_results: int = 50,
    ) -> List[SatelliteRecord]:
        """
        CSA does not provide a public granule-level spatial search API.
        This method returns dataset-level catalogue records for RCM and RADARSAT-1
        and directs the user to the external ordering portal.

        Returns representative SatelliteRecord entries (catalogue placeholders).
        """
        logger.info(
            "CSA granule-level spatial search is not available via public API. "
            "Returning catalogue reference records for RCM and RADARSAT-1."
        )

        records = []
        for ds_id, sat_name, sensor_name in [
            ("rcm", "RADARSAT Constellation Mission", "C-SAR"),
            ("radarsat1", "RADARSAT-1", "SAR"),
        ]:
            records.append(
                SatelliteRecord(
                    provider=self.PROVIDER_ID,
                    satellite=sat_name,
                    sensor=sensor_name,
                    radar_band="C",
                    data_format="CEOS / GeoTIFF",
                    access_url=f"https://donnees-data.asc-csa.gc.ca/en/dataset/{ds_id}",
                    extra={
                        "note": (
                            "CSA does not provide a public granule-level spatial search API. "
                            "Visit the catalogue link to request data access."
                        ),
                        "catalogue_type": "dataset_level",
                    },
                )
            )

        return records[:max_results]

    def health_check(self) -> Dict[str, Any]:
        """Ping CSA CKAN API to verify catalogue availability."""
        try:
            _ckan_get("site_read", {})
            return {"provider": self.PROVIDER_ID, "status": "ok", "detail": "CSA CKAN API reachable"}
        except Exception as exc:
            return {
                "provider": self.PROVIDER_ID,
                "status": "catalogue_only",
                "detail": f"CSA CKAN may be unavailable: {exc}. External catalogue links remain valid.",
            }
