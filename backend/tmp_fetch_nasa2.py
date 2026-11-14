import sys, os, json
# Ensure the project root is on PYTHONPATH
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(project_root)

from backend.app.services.nasa_earthdata_service import NASAEarthdataService

svc = NASAEarthdataService()

# First date range
records1 = svc.search(bbox=[-1.0, 0.0, 0.0, 1.0], start_date="2022-01-01", end_date="2022-01-02", max_results=5)
# Second date range
records2 = svc.search(bbox=[-1.0, 0.0, 0.0, 1.0], start_date="2023-01-01", end_date="2023-01-02", max_results=5)

print('Results for 2022-01-01 to 2022-01-02:', len(records1))
print(json.dumps([r.model_dump() for r in records1], indent=2))
print('Results for 2023-01-01 to 2023-01-02:', len(records2))
print(json.dumps([r.model_dump() for r in records2], indent=2))
