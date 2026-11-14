# Synthetic SAR Test Rasters

> **NOTICE: SYNTHETIC DATASET FOR UNIT AND INTEGRATION TESTING ONLY**  
> These GeoTIFF files are mathematically simulated small test observations created for Milestone 2 algorithm verification. They are NOT raw NASA/ISRO downlinks.

## Specifications
- **Format**: Cloud-Compatible GeoTIFF (Single-Band Float32)
- **Dimensions**: 120 x 120 pixels (~10 km x 10 km spatial coverage)
- **Coordinate Reference System (CRS)**: `EPSG:4326` (WGS84 Geodetic)
- **Bounding Box**: Longitude `[91.70, 91.80]`, Latitude `[26.15, 26.25]` (Brahmaputra corridor)
- **Pixel Resolution**: ~0.000833 degrees (~90 m ground sample distance)
- **NoData Value**: `-9999.0` (4-pixel border perimeter)

## Simulated Signal Characteristics
- **Baseline Land Surface**: Mean $\sigma^0 \approx -11.0\text{ dB}$ with Gaussian speckle noise.
- **Permanent River Channel**: Narrow specular channel with mean $\sigma^0 \approx -20.0\text{ dB}$ (invariant in both observations).
- **Candidate Inundation Zone (`synthetic_sar_after.tif`)**: A known low-lying basin of ~1,111 pixels where backscatter attenuates from $-10.5\text{ dB}$ to $-19.5\text{ dB}$ ($\Delta\sigma^0 \approx -9.0\text{ dB}$).
- **`synthetic_sar_identical.tif`**: Bit-exact replicate of pre-event scene for verification of null/zero change detection.
