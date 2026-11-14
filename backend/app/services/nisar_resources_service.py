"""
TerraScan NISAR Resources Service (Prompt 5)

Provides information about NISAR mission resources.
NISAR is a future (2024+) NASA-ISRO mission. Its data products will be distributed
through NASA Earthdata (CMR/ASF). Pre-launch, only documentation and educational
resources are publicly available.

Classification:
  - NISAR data search: forwarded to nasa_earthdata and asf services (CMR + Vertex)
  - NISAR documentation, StoryMaps, UAVSAR postcards: catalogue/documentation links
  - NISAR data user guide: documentation resource

No fabricated NISAR-specific search API is implemented here because
no separate NISAR data API endpoint exists yet — data lives in CMR/ASF.
"""

import logging
from typing import Dict, Any, List

from ..models.satellite import ProviderInfo, ResourceLink

logger = logging.getLogger("terrascan.nisar_resources")


class NISARResourceService:
    """
    Provides NISAR mission resource links (documentation, StoryMaps, portals).

    Classification: Documentation and educational resources + catalogue links.
    For actual NISAR data search, use NASAEarthdataService or ASFVertexService.
    """

    PROVIDER_ID = "nisar"

    def get_provider_info(self) -> ProviderInfo:
        return ProviderInfo(
            id=self.PROVIDER_ID,
            name="NASA-ISRO NISAR Mission",
            type="catalogue_portal",
            description=(
                "NASA-ISRO Synthetic Aperture Radar (NISAR) is an L+S dual-band SAR mission "
                "providing global surface deformation, ecosystem, cryosphere, and hazard data. "
                "NISAR L2 GCOV products are searchable via NASA Earthdata CMR and ASF Vertex."
            ),
            homepage_url="https://nisar.jpl.nasa.gov/",
            api_docs_url="https://nisar-docs.asf.alaska.edu/",
            requires_auth=True,
            auth_type="earthdata_login",
            supported_params=["bbox", "start_date", "end_date", "polarization"],
            status="catalogue_only",  # Operational data not yet publicly released at scale
        )

    def get_resources(self) -> List[ResourceLink]:
        """Return curated list of NISAR documentation and educational resource links."""
        return [
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="documentation",
                title="NISAR Data User Guide (ASF)",
                url="https://nisar-docs.asf.alaska.edu/",
                description="Official user guide for NISAR L2 GCOV and GSLC product formats.",
            ),
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="portal",
                title="NASA Earthdata Search — NISAR Products",
                url="https://search.earthdata.nasa.gov/search?q=NISAR",
                description="Earthdata CMR portal for discovering NISAR L1/L2 granules.",
            ),
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="portal",
                title="ASF Vertex — NISAR Data",
                url="https://search.asf.alaska.edu/#platform=NISAR",
                description="ASF Vertex SAR search portal filtered to NISAR platform.",
            ),
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="storymaps",
                title="NISAR ArcGIS StoryMaps",
                url="https://nisar.jpl.nasa.gov/applications/arcgis-storymaps/",
                description="Interactive NISAR application showcases via ArcGIS StoryMaps.",
            ),
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="documentation",
                title="NISAR Societal Benefit Applications",
                url="https://nisar.jpl.nasa.gov/applications/societal-benefit/",
                description="Overview of NISAR's societal benefit areas including hazards and ecosystems.",
            ),
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="tutorial",
                title="UAVSAR Postcards (Educational)",
                url="https://uavsar.jpl.nasa.gov/education/postcards.html",
                description=(
                    "UAVSAR airborne SAR imagery postcards — excellent visual examples "
                    "of L-band SAR change detection, predecessor to NISAR."
                ),
            ),
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="tutorial",
                title="NASA ARSET SAR Training",
                url="https://appliedsciences.nasa.gov/get-involved/training",
                description=(
                    "NASA Applied Remote Sensing Training — courses on SAR, InSAR, "
                    "flood mapping, and NISAR-specific applications."
                ),
            ),
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="documentation",
                title="Remote Sensing Basics (Earthdata)",
                url="https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/remote-sensing",
                description="Introduction to remote sensing concepts from NASA Earthdata.",
            ),
            ResourceLink(
                provider=self.PROVIDER_ID,
                category="documentation",
                title="SAR Basics (Earthdata)",
                url="https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar",
                description="Introduction to Synthetic Aperture Radar from NASA Earthdata.",
            ),
        ]

    def health_check(self) -> Dict[str, Any]:
        """
        NISAR resource service is static — always healthy.
        Actual data availability depends on NASA Earthdata / ASF.
        """
        return {
            "provider": self.PROVIDER_ID,
            "status": "ok",
            "detail": "NISAR resource links are static; data search forwarded to nasa_earthdata and asf providers.",
        }
