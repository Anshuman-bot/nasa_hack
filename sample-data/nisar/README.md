# NASA–ISRO NISAR L2 GCOV Data Directory

This directory is designated for local NASA–ISRO Synthetic Aperture Radar (NISAR) Level-2 Geocoded Covariance (**L2 GCOV**) observation files (`.h5` or `.he5`).

---

## 1. Where to Place Downloaded NISAR Files
Place pairs of downloaded NISAR L2 GCOV files directly into this directory:
```
sample-data/
  nisar/
    NISAR_L2_PR_GCOV_001_024_A_20260512T001422.h5   <-- Pre-event observation (t0)
    NISAR_L2_PR_GCOV_001_024_A_20260624T001421.h5   <-- Post-event observation (t1)
    README.md
```

Files can be downloaded from:
- **Alaska Satellite Facility (ASF) DAAC**: [https://search.asf.alaska.edu/](https://search.asf.alaska.edu/)
- **NASA Earthdata Search**: [https://search.earthdata.nasa.gov/](https://search.earthdata.nasa.gov/)

---

## 2. Expected Internal Structure (NISAR L2 GCOV)
The TerraScan `NISARGCOVAdapter` expects standard NASA/ISRO L2 GCOV HDF5 hierarchy:
- **Root Group**: `/science/LSAR/GCOV/` (or `/science/SSAR/GCOV/`)
- **Identification**: `/science/LSAR/GCOV/identification/`
  - `mission_name`: `"NISAR"`
  - `product_type`: `"GCOV"`
  - `zero_doppler_start_time`: ISO 8601 acquisition timestamp
- **Spatial Grid**: `/science/LSAR/GCOV/grids/frequencyA/`
  - `xCoordinates`: Longitude or Easting coordinate 1D array
  - `yCoordinates`: Latitude or Northing coordinate 1D array
  - `projection`: EPSG code or coordinate reference system
  - `listOfPolarizations`: e.g. `['HHHH', 'HVHV']`
  - Polarimetric backscatter datasets: `HHHH`, `HVHV`, `VVVV`, `VHVH`

---

## 3. How to Trigger Analysis

### Option A: Automatic Folder Detection
When `location="nisar"` or `location="nisar_local"` is sent, TerraScan automatically loads the pair of `.h5` files from `sample-data/nisar/`:
```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "nisar_local",
    "beforeDate": "2026-05-12",
    "afterDate": "2026-06-24",
    "analysisMode": "flood",
    "polarization": "HHHH",
    "thresholdDb": 4.5
  }'
```

### Option B: Explicit File Paths
You can specify exact paths to any pair of NISAR GCOV files located anywhere on disk:
```bash
curl -X POST "http://localhost:8000/api/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Brahmaputra Flood Plain",
    "beforeDate": "2026-05-12",
    "afterDate": "2026-06-24",
    "analysisMode": "flood",
    "beforeRasterPath": "sample-data/nisar/NISAR_L2_PR_GCOV_001_024_A_20260512T001422.h5",
    "afterRasterPath": "sample-data/nisar/NISAR_L2_PR_GCOV_001_024_A_20260624T001421.h5",
    "polarization": "HHHH",
    "thresholdDb": 4.5
  }'
```

### Option C: Performance Windowing / AOI Cropping
For large multi-gigabyte NISAR swath products, pass `aoiBounds` `[min_lon, min_lat, max_lon, max_lat]` to slice the HDF5 datasets directly on disk:
```json
{
  "aoiBounds": [91.71, 26.16, 91.77, 26.22],
  "polarization": "HVHV"
}
```
*(Prevents loading entire orbits into memory).*
