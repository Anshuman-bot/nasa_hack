import sys, os, json

# Add the project root to PYTHONPATH so imports work
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(project_root)

from backend.app.services.nasa_earthdata_service import NASAEarthdataService

svc = NASAEarthdataService()

# Use a known SAR collection short_name that CMR recognises
SHORT_NAME = "UAVSAR_HDF5_L1"

# Small bbox covering part of the United States (lon/lat order)
BBOX = [-100.0, 30.0, -99.0, 31.0]   # [min_lon, min_lat, max_lon, max_lat]

# First date range (early 2022)
records_2022 = svc.search(
    bbox=BBOX,
    start_date="2022-01-01",
    end_date="2022-01-02",
    short_name=SHORT_NAME,
    max_results=5,
)

# Second date range (early 2023)
records_2023 = svc.search(
    bbox=BBOX,
    start_date="2023-01-01",
    end_date="2023-01-02",
    short_name=SHORT_NAME,
    max_results=5,
)

print("=== 2022-01-01 → 2022-01-02 ===")
print(f"Granules found: {len(records_2022)}")
print(json.dumps([r.model_dump() for r in records_2022], indent=2))

print("\n=== 2023-01-01 → 2023-01-02 ===")
print(f"Granules found: {len(records_2023)}")
print(json.dumps([r.model_dump() for r in records_2023], indent=2))
