"""
TerraScan Sample Radar Geometry & GeoJSON Generator (Milestone 1)
Provides sample coordinates and deterministic test vectors for NISAR testbeds.
"""

from typing import Dict, Any, List

def get_sample_locations() -> List[Dict[str, Any]]:
    return [
        {
            "id": "brahmaputra",
            "name": "Brahmaputra River Corridor",
            "region": "Assam, India",
            "coordinates": [26.18, 91.75],
            "zoom": 11,
            "description": "Monsoon flood testbed with frequent sandbar shifts and seasonal inundation.",
        },
        {
            "id": "mississippi",
            "name": "Lower Mississippi River Basin",
            "region": "Louisiana, USA",
            "coordinates": [30.45, -91.18],
            "zoom": 10,
            "description": "Complex alluvial delta with cypress backswamps and regulated spillways.",
        },
        {
            "id": "danube",
            "name": "Danube River Floodplain",
            "region": "Central Europe",
            "coordinates": [45.26, 19.83],
            "zoom": 10,
            "description": "Riparian wetland reserve subject to springtime snowmelt flooding.",
        },
        {
            "id": "synthetic_test",
            "name": "Synthetic Brahmaputra GeoTIFF",
            "region": "Local Real Pipeline",
            "coordinates": [26.20, 91.75],
            "zoom": 11,
            "description": "Local georeferenced GeoTIFF pair processed via the real Milestone 2 raster differencing pipeline.",
        },
        {
            "id": "nisar_local",
            "name": "NISAR L2 GCOV (sample-data/nisar)",
            "region": "NASA-ISRO L-band SAR",
            "coordinates": [26.19, 91.74],
            "zoom": 11,
            "description": "Real NASA-ISRO NISAR L2 GCOV HDF5 observation pair loaded via NISARGCOVAdapter.",
        },
    ]
