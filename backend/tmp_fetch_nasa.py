import sys, os, json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
from backend.app.services.nasa_earthdata_service import NASAEarthdataService
svc = NASAEarthdataService()
records = svc.search(bbox=[-1.0, 0.0, 0.0, 1.0], start_date="2022-01-01", end_date="2022-01-05", max_results=5)
print(json.dumps([r.model_dump() for r in records], indent=2))
