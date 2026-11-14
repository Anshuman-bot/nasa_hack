"""
TerraScan CONAE SAOCOM Resource Service (Prompt 5)

Covers Argentina's CONAE SAOCOM satellite:
  - SAOCOM-1A and SAOCOM-1B: L-band SAR constellation
  - Operated by CONAE (Comisión Nacional de Actividades Espaciales)

Data classification:
  - SAOCOM Catalogue: External web portal (catalogos.conae.gov.ar) — no verified public REST API.
  - Registration/ordering: Requires account registration on argentina.gob.ar.

IMPORTANT — Implementation policy:
  CONAE's catalogos.conae.gov.ar portal does not expose a documented public REST API
  for programmatic granule search. The catalogue is a web UI.
  We DO NOT fabricate API calls or scrape the portal.
  Instead, this service:
    1. Documents SAOCOM's capabilities and classification.
    2. Returns catalogue links with clear labels.
    3. Provides structured SatelliteRecord placeholders where bbox/date metadata
       cannot be obtained programmatically.
"""

import logging
from typing import Any, Dict, List, Optional

from ..models.satellite import ProviderInfo, ResourceLink, SatelliteRecord

logger = logging.getLogger("terrascan.conae_service")


class CONAESaocomService:
    """
    CONAE SAOCOM satellite resource service.

    Classification: External catalogue / registration-required resource.
    No public granule search API is available.
    """

    PROVIDER_ID = "conae"

    def get_provider_info(self) -> ProviderInfo:
        return ProviderInfo(
            id=self.PROVIDER_ID,
            name="CONAE SAOCOM (Argentina)",
            type="catalogue_portal",
            description=(
                "SAOCOM (Satélite Argentino de Observación Con Microondas) is an Argentinian "
                "L-band SAR constellation operated by CONAE. SAOCOM-1A and 1B provide soil "
                "moisture, flood, and agricultural monitoring. Data access requires CONAE registration. "
                "No public granule-level REST API has been documented for external integration."
            ),
            homepage_url="https://catalogos.conae.gov.ar/catalogo/catalogoSatSaocomInfo.html",
            api_docs_url=None,  # No public API documented
            requires_auth=True,
            auth_type="registration",
            supported_params=[],
            status="catalogue_only",
        )

    def get_resources(self) -> List[ResourceLink]:
        """Return SAOCOM catalogue and registration resource links."""
        return [
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="portal",
                title="SAOCOM Image Catalogue (CONAE)",
                url="https://catalogos.conae.gov.ar/catalogo/catalogoSatSaocomInfo.html",
                description=(
                    "CONAE's official SAOCOM image catalogue portal for browsing and requesting "
                    "SAOCOM-1A/1B L-band SAR products."
                ),
            ),
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="registration",
                title="SAOCOM Data Access Registration",
                url="https://www.argentina.gob.ar/noticias/la-informacion-saocom-cada-vez-mas-accesible",
                description=(
                    "Argentine government announcement on SAOCOM data accessibility and "
                    "registration procedure for data requests."
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
        CONAE does not provide a public granule-level REST search API.
        Returns clearly labelled catalogue reference records for SAOCOM-1A and 1B.
        Users must visit the external catalogue to request actual scenes.
        """
        logger.info(
            "CONAE SAOCOM granule-level search is not available via public API. "
            "Returning catalogue reference records."
        )

        return [
            SatelliteRecord(
                provider=self.PROVIDER_ID,
                satellite="SAOCOM-1A",
                sensor="L-SAR",
                radar_band="L",
                polarization="HH, HV, VV, VH (selectable)",
                spatial_resolution_m=10.0,  # StripMap 10m nominal
                data_format="CEOS Level-1 / GeoTIFF",
                access_url="https://catalogos.conae.gov.ar/catalogo/catalogoSatSaocomInfo.html",
                extra={
                    "note": (
                        "CONAE does not provide a public granule-level search API. "
                        "Visit the catalogue link to browse and request SAOCOM data."
                    ),
                    "catalogue_type": "catalogue_portal_only",
                    "registration_required": True,
                    "registration_url": "https://www.argentina.gob.ar/noticias/la-informacion-saocom-cada-vez-mas-accesible",
                },
            ),
            SatelliteRecord(
                provider=self.PROVIDER_ID,
                satellite="SAOCOM-1B",
                sensor="L-SAR",
                radar_band="L",
                polarization="HH, HV, VV, VH (selectable)",
                spatial_resolution_m=10.0,
                data_format="CEOS Level-1 / GeoTIFF",
                access_url="https://catalogos.conae.gov.ar/catalogo/catalogoSatSaocomInfo.html",
                extra={
                    "note": (
                        "CONAE does not provide a public granule-level search API. "
                        "Visit the catalogue link to browse and request SAOCOM data."
                    ),
                    "catalogue_type": "catalogue_portal_only",
                    "registration_required": True,
                    "registration_url": "https://www.argentina.gob.ar/noticias/la-informacion-saocom-cada-vez-mas-accesible",
                },
            ),
        ][:max_results]

    def health_check(self) -> Dict[str, Any]:
        """
        CONAE has no machine-queryable health endpoint.
        Always returns catalogue_only status.
        """
        return {
            "provider": self.PROVIDER_ID,
            "status": "catalogue_only",
            "detail": (
                "CONAE SAOCOM does not provide a public REST API. "
                "Data access requires visiting the catalogue portal and registering."
            ),
        }
