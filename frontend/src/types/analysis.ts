export type AnalysisMode = 'flood' | 'surface_change';

export type ConfidenceLevel = 'High' | 'Moderate' | 'Low';
export type ChangeIntensity = 'High' | 'Moderate' | 'Low' | 'Subtle';

export interface TimelinePoint {
  id: string;
  observationName: string;
  date: string;
  affectedAreaKm2: number;
  baselineDiffPercent: number;
}

export interface ScientificMetrics {
  beforeBackscatterDb: number;
  afterBackscatterDb: number;
  differenceDb: number;
  thresholdDb: number;
  classificationMethod: string;
  polarization: string;
  sensorFrequency: string;
  radarBand: string;
}

export interface GeoJsonGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

export interface GeoJsonFeature {
  type: 'Feature';
  id?: string | number;
  properties: {
    name?: string;
    intensity: 'high' | 'moderate' | 'low';
    areaKm2?: number;
    backscatterDeltaDb?: number;
    description?: string;
  };
  geometry: GeoJsonGeometry;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface LayerVisibility {
  baseMap: boolean;
  beforeLayer: boolean;
  afterLayer: boolean;
  detectedChange: boolean;
}

export interface ProcessingParameters {
  thresholdDb: number;
  nodataHandling: string;
  pixelResolutionMeters: number;
  processingMode: string;
  minClusterPixels: number;
  totalValidPixels: number;
  changedPixelCount: number;
}

export interface AnalysisResult {
  id: string;
  location: string;
  locationCode: string;
  centerCoordinates: [number, number]; // [lat, lng]
  zoomLevel: number;
  beforeDate: string;
  afterDate: string;
  analysisMode: AnalysisMode;
  changeType: string;
  affectedAreaKm2: number;
  changePercent: number;
  confidence: ConfidenceLevel;
  changeIntensity: ChangeIntensity;
  summary: string;
  isDemoData: boolean;
  dataSource?: 'DEMO' | 'SYNTHETIC' | 'REAL_NISAR';
  timeline: TimelinePoint[];
  scientificMetrics: ScientificMetrics;
  geoJson: GeoJsonFeatureCollection;
  meanChange?: number;
  maxChange?: number;
  processingParameters?: ProcessingParameters;
  rasterMetadata?: Record<string, any>;
}

export interface AnalysisRequest {
  location: string;
  beforeDate: string;
  afterDate: string;
  analysisMode: AnalysisMode;
  beforeRasterPath?: string;
  afterRasterPath?: string;
  thresholdDb?: number;
  minClusterPixels?: number;
}
