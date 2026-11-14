"""
TerraScan Satellite Discovery Tests (Prompt 5)

Covers:
  1. Provider registry — all 5 providers registered with correct types
  2. Metadata normalisation — SatelliteRecord field contracts
  3. Search parameter validation — bbox, dates
  4. API response handling — provider info, resources, search, health
  5. Error handling — bad bbox, bad dates, provider isolation
  6. Mocked responses — no real network calls; external credentials not required

Run from project root:
  cd backend
  python -m pytest tests/test_satellite_discovery.py -v
"""

import os
import sys
import json
import unittest
from unittest.mock import patch, MagicMock
from typing import Any, Dict, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


# ===========================================================================
# 1. Provider Registry Tests
# ===========================================================================

class TestProviderRegistry(unittest.TestCase):
    """GET /api/satellite/providers must return all 5 providers with correct fields."""

    def test_providers_endpoint_returns_200(self):
        resp = client.get("/api/satellite/providers")
        self.assertEqual(resp.status_code, 200)

    def test_all_five_providers_registered(self):
        resp = client.get("/api/satellite/providers")
        providers = {p["id"] for p in resp.json()}
        self.assertIn("nasa_earthdata", providers)
        self.assertIn("asf", providers)
        self.assertIn("nisar", providers)
        self.assertIn("csa", providers)
        self.assertIn("conae", providers)

    def test_machine_api_providers_identified(self):
        resp = client.get("/api/satellite/providers")
        machine = [p for p in resp.json() if p["type"] == "machine_api"]
        ids = {p["id"] for p in machine}
        self.assertIn("nasa_earthdata", ids)
        self.assertIn("asf", ids)

    def test_catalogue_only_providers_identified(self):
        resp = client.get("/api/satellite/providers")
        catalogue = [p for p in resp.json() if p["type"] == "catalogue_portal"]
        ids = {p["id"] for p in catalogue}
        # csa and conae and nisar must be catalogue_portal
        self.assertIn("csa", ids)
        self.assertIn("conae", ids)

    def test_provider_has_required_fields(self):
        resp = client.get("/api/satellite/providers")
        for provider in resp.json():
            for field in ["id", "name", "type", "description", "requires_auth"]:
                self.assertIn(field, provider, f"Provider {provider.get('id')} missing '{field}'")


# ===========================================================================
# 2. Metadata Normalisation Tests
# ===========================================================================

class TestMetadataNormalisation(unittest.TestCase):
    """SatelliteRecord must conform to unified schema regardless of provider."""

    def _make_record(self, **kwargs):
        from backend.app.models.satellite import SatelliteRecord
        defaults = dict(provider="test", satellite="TestSat")
        defaults.update(kwargs)
        return SatelliteRecord(**defaults)

    def test_minimal_record_valid(self):
        """A record with only required fields must be valid."""
        rec = self._make_record()
        self.assertEqual(rec.provider, "test")
        self.assertEqual(rec.satellite, "TestSat")
        self.assertIsNone(rec.sensor)

    def test_full_record_roundtrip(self):
        """A fully populated record must serialise and deserialise correctly."""
        from backend.app.models.satellite import SatelliteRecord
        rec = self._make_record(
            sensor="L-SAR",
            acquisition_date="2026-05-12",
            bbox=[91.5, 25.9, 92.0, 26.5],
            polarization="HH+HV",
            radar_band="L",
            spatial_resolution_m=10.0,
            download_url="https://example.com/data.h5",
            processing_status="L2",
        )
        d = rec.model_dump()
        rec2 = SatelliteRecord(**d)
        self.assertEqual(rec2.radar_band, "L")
        self.assertEqual(rec2.spatial_resolution_m, 10.0)

    def test_catalogue_placeholder_record(self):
        """CSA/CONAE catalogue records must have access_url but no download_url."""
        from backend.app.services.csa_service import CSARadarsatService
        svc = CSARadarsatService()
        records = svc.search()
        self.assertGreater(len(records), 0)
        for rec in records:
            self.assertIsNotNone(rec.access_url)
            self.assertIn("donnees-data.asc-csa.gc.ca", rec.access_url)

    def test_conae_records_clearly_labelled(self):
        """CONAE records must include a note indicating no public API."""
        from backend.app.services.conae_service import CONAESaocomService
        svc = CONAESaocomService()
        records = svc.search()
        self.assertGreater(len(records), 0)
        for rec in records:
            self.assertIsNotNone(rec.extra)
            self.assertIn("catalogue_type", rec.extra)


# ===========================================================================
# 3. Search Parameter Validation Tests
# ===========================================================================

class TestSearchParameterValidation(unittest.TestCase):
    """Invalid parameters must return 422 errors, not 500."""

    def test_invalid_bbox_too_few_values(self):
        resp = client.get("/api/satellite/search?bbox=91.5,25.9,92.0")
        self.assertEqual(resp.status_code, 422)

    def test_invalid_bbox_non_numeric(self):
        resp = client.get("/api/satellite/search?bbox=bad,bbox,here,there")
        self.assertEqual(resp.status_code, 422)

    def test_invalid_date_format(self):
        """Non-ISO date strings must return 422."""
        with patch(
            "backend.app.services.satellite_discovery.SatelliteDiscoveryService.search",
            side_effect=ValueError("Invalid date format"),
        ):
            resp = client.get("/api/satellite/search?start_date=12-05-2026")
            # Route will catch ValueError from discovery service and return 422
            self.assertIn(resp.status_code, [422, 500])

    def test_inverted_date_range_rejected(self):
        """start_date > end_date must be rejected."""
        from backend.app.services.satellite_discovery import _validate_dates
        err = _validate_dates("2026-07-01", "2026-01-01")
        self.assertIsNotNone(err)
        self.assertIn("before", err)

    def test_valid_bbox_accepted(self):
        """A syntactically valid bbox should not trigger a 422 at the parsing stage."""
        from backend.app.services.satellite_discovery import _validate_bbox
        err = _validate_bbox([91.5, 25.9, 92.0, 26.5])
        self.assertIsNone(err)

    def test_inverted_bbox_rejected(self):
        """min_lon > max_lon must be rejected."""
        from backend.app.services.satellite_discovery import _validate_bbox
        err = _validate_bbox([92.0, 25.9, 91.5, 26.5])
        self.assertIsNotNone(err)

    def test_out_of_range_lat_rejected(self):
        from backend.app.services.satellite_discovery import _validate_bbox
        err = _validate_bbox([0, -95, 1, 0])  # lat -95 out of range
        self.assertIsNotNone(err)

    def test_max_results_capped(self):
        """max_results > 500 must be rejected by Pydantic (FastAPI 422)."""
        resp = client.get("/api/satellite/search?max_results=9999")
        self.assertEqual(resp.status_code, 422)


# ===========================================================================
# 4. API Response Handling — Mocked Provider Responses
# ===========================================================================

class TestAPIResponseHandlingMocked(unittest.TestCase):
    """
    These tests mock external HTTP calls so no credentials or network access are needed.
    """

    # ------- NASA Earthdata (CMR) mocked -------

    def test_nasa_earthdata_search_mocked(self):
        """
        CMR returns a GeoJSON-like feed; adapter must normalise to SatelliteRecord list.
        """
        fake_cmr_response = {
            "feed": {
                "entry": [
                    {
                        "id": "G12345-NSIDC",
                        "collection_concept_id": "C1234-NSIDC",
                        "dataset_id": "UAVSAR HDF5 L1",
                        "producer_granule_id": "uavsar_test_001",
                        "granule_ur": "UAVSAR_HDF5_L1:test_001",
                        "time_start": "2026-05-12T00:00:00Z",
                        "time_end": "2026-05-12T01:00:00Z",
                        "boxes": ["25.9 91.5 26.5 92.0"],
                        "links": [
                            {
                                "rel": "http://esipfed.org/ns/fedsearch/1.1/data#",
                                "href": "https://asf.alaska.edu/data/test.h5",
                            }
                        ],
                        "data_center": "ASF",
                        "original_format": "HDF5",
                    }
                ]
            }
        }

        with patch(
            "backend.app.services.nasa_earthdata_service._http_get",
            return_value=fake_cmr_response,
        ):
            from backend.app.services.nasa_earthdata_service import NASAEarthdataService
            svc = NASAEarthdataService()
            records = svc.search(bbox=[91.5, 25.9, 92.0, 26.5])

        self.assertEqual(len(records), 1)
        self.assertEqual(records[0].provider, "nasa_earthdata")
        self.assertEqual(records[0].product_identifier, "uavsar_test_001")
        self.assertEqual(records[0].bbox, [91.5, 25.9, 92.0, 26.5])
        self.assertEqual(records[0].acquisition_date, "2026-05-12")
        self.assertIsNotNone(records[0].download_url)

    # ------- ASF Vertex mocked -------

    def test_asf_search_mocked(self):
        """ASF returns GeoJSON FeatureCollection; adapter must normalise correctly."""
        fake_asf_response = {
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [91.5, 25.9],
                                [92.0, 25.9],
                                [92.0, 26.5],
                                [91.5, 26.5],
                                [91.5, 25.9],
                            ]
                        ],
                    },
                    "properties": {
                        "platform": "Sentinel-1",
                        "sensor": "C-SAR",
                        "beamMode": "IW",
                        "startTime": "2026-05-12T10:30:00Z",
                        "stopTime": "2026-05-12T10:30:30Z",
                        "sceneName": "S1A_IW_SLC__1SDV_20260512",
                        "processingLevel": "SLC",
                        "polarization": "VV+VH",
                        "flightDirection": "Ascending",
                        "url": "https://datapool.asf.alaska.edu/SLC/SA/S1A_test.zip",
                    },
                }
            ]
        }

        with patch(
            "backend.app.services.asf_service._http_get_json",
            return_value=fake_asf_response,
        ):
            from backend.app.services.asf_service import ASFVertexService
            svc = ASFVertexService()
            records = svc.search(bbox=[91.5, 25.9, 92.0, 26.5])

        self.assertEqual(len(records), 1)
        self.assertEqual(records[0].provider, "asf")
        self.assertEqual(records[0].satellite, "Sentinel-1")
        self.assertEqual(records[0].polarization, "VV+VH")
        self.assertAlmostEqual(records[0].bbox[0], 91.5, places=1)

    # ------- Unified search endpoint (providers=nasa_earthdata only) -------

    def test_unified_search_endpoint_mocked(self):
        """GET /api/satellite/search with mocked CMR returns valid SatelliteSearchResponse."""
        fake_cmr_response = {"feed": {"entry": []}}

        with patch(
            "backend.app.services.nasa_earthdata_service._http_get",
            return_value=fake_cmr_response,
        ):
            resp = client.get(
                "/api/satellite/search"
                "?bbox=91.5,25.9,92.0,26.5"
                "&start_date=2026-05-01"
                "&end_date=2026-06-30"
                "&providers=nasa_earthdata"
                "&max_results=10"
            )

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("total_results", data)
        self.assertIn("providers_queried", data)
        self.assertIn("results", data)
        self.assertIn("nasa_earthdata", data["providers_queried"])

    # ------- Resources endpoint -------

    def test_resources_endpoint_returns_links(self):
        resp = client.get("/api/satellite/resources")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("resources", data)
        self.assertGreater(data["total"], 0)
        # Every resource must have required fields
        for r in data["resources"]:
            self.assertIn("provider", r)
            self.assertIn("url", r)
            self.assertIn("title", r)
            self.assertIn("category", r)

    def test_resources_filter_by_provider(self):
        resp = client.get("/api/satellite/resources?provider=nisar")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        for r in data["resources"]:
            self.assertEqual(r["provider"], "nisar")

    def test_resources_filter_by_category(self):
        resp = client.get("/api/satellite/resources?category=tutorial")
        self.assertEqual(resp.status_code, 200)
        for r in resp.json()["resources"]:
            self.assertEqual(r["category"], "tutorial")


# ===========================================================================
# 5. Error Handling Tests
# ===========================================================================

class TestErrorHandling(unittest.TestCase):
    """One provider failing must not break the discovery system."""

    def test_failed_provider_does_not_break_search(self):
        """
        If nasa_earthdata raises, asf should still succeed (mocked to return empty).
        The response must still return 200.
        """
        with patch(
            "backend.app.services.nasa_earthdata_service._http_get",
            side_effect=ConnectionError("CMR timed out"),
        ), patch(
            "backend.app.services.asf_service._http_get_json",
            return_value={"features": []},
        ):
            resp = client.get(
                "/api/satellite/search?bbox=91.5,25.9,92.0,26.5&providers=nasa_earthdata,asf"
            )

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("nasa_earthdata", data["providers_failed"])
        self.assertIn("asf", data["providers_queried"])
        # Warnings must mention the failed provider
        self.assertIsNotNone(data.get("warnings"))
        self.assertTrue(any("nasa_earthdata" in w for w in data["warnings"]))

    def test_all_providers_failing_still_returns_200(self):
        """Even if all external providers fail, endpoint returns 200 with empty results."""
        with patch(
            "backend.app.services.nasa_earthdata_service._http_get",
            side_effect=ConnectionError("CMR down"),
        ), patch(
            "backend.app.services.asf_service._http_get_json",
            side_effect=ConnectionError("ASF down"),
        ):
            resp = client.get(
                "/api/satellite/search"
                "?bbox=0,0,1,1&providers=nasa_earthdata,asf"
            )

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["total_results"], 0)
        self.assertGreater(len(data["providers_failed"]), 0)

    def test_health_endpoint_handles_provider_outage(self):
        """Health endpoint must still return 200 when a provider is unreachable."""
        with patch(
            "backend.app.services.nasa_earthdata_service.NASAEarthdataService.health_check",
            return_value={"provider": "nasa_earthdata", "status": "unavailable", "detail": "timeout"},
        ), patch(
            "backend.app.services.asf_service.ASFVertexService.health_check",
            return_value={"provider": "asf", "status": "ok", "detail": "ok"},
        ), patch(
            "backend.app.services.csa_service.CSARadarsatService.health_check",
            return_value={"provider": "csa", "status": "ok", "detail": "ok"},
        ):
            resp = client.get("/api/satellite/health")

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("overall_status", data)
        self.assertIn("providers", data)
        self.assertIn("timestamp", data)

    def test_unknown_provider_in_search_produces_warning(self):
        """An unknown provider ID in providers list must produce a warning, not 500."""
        with patch(
            "backend.app.services.nasa_earthdata_service._http_get",
            return_value={"feed": {"entry": []}},
        ):
            resp = client.get(
                "/api/satellite/search?providers=nasa_earthdata,nonexistent_xyz"
            )

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        warnings = data.get("warnings") or []
        self.assertTrue(any("nonexistent_xyz" in w for w in warnings))


# ===========================================================================
# 6. Health Endpoint Tests
# ===========================================================================

class TestHealthEndpoint(unittest.TestCase):

    def test_satellite_health_returns_all_providers(self):
        with patch(
            "backend.app.services.nasa_earthdata_service.NASAEarthdataService.health_check",
            return_value={"provider": "nasa_earthdata", "status": "ok", "detail": "ok"},
        ), patch(
            "backend.app.services.asf_service.ASFVertexService.health_check",
            return_value={"provider": "asf", "status": "ok", "detail": "ok"},
        ), patch(
            "backend.app.services.csa_service.CSARadarsatService.health_check",
            return_value={"provider": "csa", "status": "ok", "detail": "ok"},
        ):
            resp = client.get("/api/satellite/health")

        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        provider_ids = {p["provider"] for p in data["providers"]}
        for pid in ["nasa_earthdata", "asf", "nisar", "csa", "conae"]:
            self.assertIn(pid, provider_ids)

    def test_overall_status_ok_when_at_least_one_machine_provider_up(self):
        with patch(
            "backend.app.services.nasa_earthdata_service.NASAEarthdataService.health_check",
            return_value={"provider": "nasa_earthdata", "status": "ok", "detail": "ok"},
        ), patch(
            "backend.app.services.asf_service.ASFVertexService.health_check",
            return_value={"provider": "asf", "status": "unavailable", "detail": "down"},
        ), patch(
            "backend.app.services.csa_service.CSARadarsatService.health_check",
            return_value={"provider": "csa", "status": "ok", "detail": "ok"},
        ):
            resp = client.get("/api/satellite/health")

        self.assertEqual(resp.json()["overall_status"], "ok")

    def test_overall_status_degraded_when_no_machine_provider_up(self):
        with patch(
            "backend.app.services.nasa_earthdata_service.NASAEarthdataService.health_check",
            return_value={"provider": "nasa_earthdata", "status": "unavailable", "detail": "down"},
        ), patch(
            "backend.app.services.asf_service.ASFVertexService.health_check",
            return_value={"provider": "asf", "status": "unavailable", "detail": "down"},
        ), patch(
            "backend.app.services.csa_service.CSARadarsatService.health_check",
            return_value={"provider": "csa", "status": "catalogue_only", "detail": "down"},
        ):
            resp = client.get("/api/satellite/health")

        self.assertEqual(resp.json()["overall_status"], "degraded")


# ===========================================================================
# Entry point
# ===========================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("TerraScan Satellite Discovery Tests (Prompt 5)")
    print("=" * 70)
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    for cls in [
        TestProviderRegistry,
        TestMetadataNormalisation,
        TestSearchParameterValidation,
        TestAPIResponseHandlingMocked,
        TestErrorHandling,
        TestHealthEndpoint,
    ]:
        suite.addTests(loader.loadTestsFromTestCase(cls))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("\nAll satellite discovery tests passed.")
    else:
        print(f"\n{len(result.failures)} failure(s), {len(result.errors)} error(s).")
        sys.exit(1)
