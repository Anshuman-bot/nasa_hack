from typing import List, Literal, Tuple, Dict, Any, Optional
from pydantic import BaseModel, Field

AnalysisMode = Literal['flood', 'surface_change']
ConfidenceLevel = Literal['High', 'Moderate', 'Low']
ChangeIntensity = Literal['High', 'Moderate', 'Low', 'Subtle']

class TimelinePoint(BaseModel):
    id: str
    observationName: str
    date: str
    affectedAreaKm2: float
    baselineDiffPercent: float

class ScientificMetrics(BaseModel):
    beforeBackscatterDb: float
    afterBackscatterDb: float
    differenceDb: float
    thresholdDb: float
    classificationMethod: str
    polarization: str
    sensorFrequency: str
    radarBand: str

class ProcessingParameters(BaseModel):
    thresholdDb: float = Field(..., description="Configured backscatter change threshold in decibels")
    nodataHandling: str = Field(..., description="Strategy used to mask and exclude invalid or missing pixels")
    pixelResolutionMeters: float = Field(..., description="Approximate ground pixel resolution in meters")
    processingMode: str = Field(..., description="Processing algorithm: 'flood_specular_drop' or 'general_surface_change'")
    minClusterPixels: int = Field(..., description="Minimum connected component size threshold to filter isolated speckle")
    totalValidPixels: int = Field(..., description="Count of valid non-nodata pixels evaluated")
    changedPixelCount: int = Field(..., description="Count of pixels exceeding the change threshold")

class GeoJsonFeature(BaseModel):
    type: Literal['Feature'] = 'Feature'
    id: Optional[str] = None
    properties: Dict[str, Any]
    geometry: Dict[str, Any]

class GeoJsonFeatureCollection(BaseModel):
    type: Literal['FeatureCollection'] = 'FeatureCollection'
    features: List[GeoJsonFeature]

class AnalysisRequest(BaseModel):
    location: str = Field(..., description="Target region identifier (e.g. 'brahmaputra', 'mississippi', 'danube', or custom)")
    beforeDate: str = Field(..., description="Pre-event baseline observation date (YYYY-MM-DD)")
    afterDate: str = Field(..., description="Post-event observation date (YYYY-MM-DD)")
    analysisMode: AnalysisMode = Field('flood', description="Analysis mode: 'flood' or 'surface_change'")
    beforeRasterPath: Optional[str] = Field(None, description="Optional path to local pre-event GeoTIFF/HDF5 raster file")
    afterRasterPath: Optional[str] = Field(None, description="Optional path to local post-event GeoTIFF/HDF5 raster file")
    thresholdDb: Optional[float] = Field(4.5, description="Backscatter difference threshold in dB (default: 4.5 dB)")
    minClusterPixels: Optional[int] = Field(3, description="Minimum cluster size in pixels to filter speckle (default: 3)")
    polarization: Optional[str] = Field(None, description="NISAR polarimetric channel (e.g. 'HHHH', 'HVHV', 'VVVV')")
    aoiBounds: Optional[Tuple[float, float, float, float]] = Field(None, description="Optional AOI bbox (min_x, min_y, max_x, max_y) for windowed reading")

class AnalysisResult(BaseModel):
    id: str
    location: str
    locationCode: str
    centerCoordinates: Tuple[float, float]
    zoomLevel: int
    beforeDate: str
    afterDate: str
    analysisMode: AnalysisMode
    changeType: str
    affectedAreaKm2: float
    changePercent: float
    confidence: ConfidenceLevel
    changeIntensity: ChangeIntensity
    summary: str
    isDemoData: bool = True
    timeline: List[TimelinePoint]
    scientificMetrics: ScientificMetrics
    geoJson: GeoJsonFeatureCollection
    meanChange: Optional[float] = None
    maxChange: Optional[float] = None
    processingParameters: Optional[ProcessingParameters] = None
    rasterMetadata: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    radarMission: str
    supportedProducts: List[str]
    rasterPipelineAvailable: bool = True
