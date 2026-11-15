import { AnalysisResult } from '../types/analysis';

export interface LocationOption {
  id: string;
  name: string;
  region: string;
  coordinates: [number, number]; // lat, lng
  defaultZoom: number;
}

export const MONITORED_LOCATIONS: LocationOption[] = [
  {
    id: 'brahmaputra',
    name: 'Brahmaputra River Corridor',
    region: 'Assam, India',
    coordinates: [26.18, 91.75],
    defaultZoom: 11,
  },
  {
    id: 'central_valley_ag',
    name: 'San Joaquin Valley Agricultural Zone',
    region: 'California, USA (Agriculture)',
    coordinates: [36.75, -119.80],
    defaultZoom: 10,
  },
  {
    id: 'jakobshavn_cryo',
    name: 'Jakobshavn Isbræ Glacial Catchment',
    region: 'West Greenland (Cryosphere)',
    coordinates: [69.17, -50.05],
    defaultZoom: 9,
  },
  {
    id: 'san_andreas_def',
    name: 'San Andreas Fault Zone (Coachella)',
    region: 'Southern California, USA (Deformation)',
    coordinates: [33.72, -116.15],
    defaultZoom: 10,
  },
  {
    id: 'mississippi',
    name: 'Lower Mississippi River Basin',
    region: 'Louisiana, USA',
    coordinates: [30.45, -91.18],
    defaultZoom: 10,
  },
  {
    id: 'danube',
    name: 'Danube River Floodplain',
    region: 'Central Europe',
    coordinates: [45.26, 19.83],
    defaultZoom: 10,
  },
  {
    id: 'synthetic_test',
    name: 'Synthetic Brahmaputra GeoTIFF',
    region: 'Synthetic Local Pipeline',
    coordinates: [26.20, 91.75],
    defaultZoom: 12,
  },
  {
    id: 'nisar_local',
    name: 'NISAR L2 GCOV (sample-data/nisar)',
    region: 'NASA-ISRO L-band SAR (Local Sample)',
    coordinates: [26.19, 91.74],
    defaultZoom: 12,
  },
];

export const DEFAULT_ANALYSIS_RESULT: AnalysisResult = {
  id: 'ts-nisar-2026-0841',
  location: 'Brahmaputra River Corridor',
  locationCode: 'brahmaputra',
  centerCoordinates: [26.18, 91.75],
  zoomLevel: 11,
  beforeDate: '2026-05-12',
  afterDate: '2026-06-24',
  analysisMode: 'flood',
  changeType: 'Possible Flooding',
  affectedAreaKm2: 38.4,
  changePercent: 21.7,
  confidence: 'High',
  changeIntensity: 'High',
  summary:
    'Radar observations indicate substantial surface change concentrated around low-lying areas near the monitored river corridor. Approximately 38.4 km² has been flagged as possible newly inundated terrain.',
  isDemoData: true,
  scientificMetrics: {
    beforeBackscatterDb: -11.2,
    afterBackscatterDb: -18.7,
    differenceDb: -7.5,
    thresholdDb: -4.5,
    classificationMethod: 'NISAR L-band GCOV Relative Amplitude Thresholding',
    polarization: 'HH / HV Dual-Pol',
    sensorFrequency: '1.25 GHz (L-band SAR)',
    radarBand: 'L-band (24 cm wavelength)',
  },
  timeline: [
    {
      id: 'obs-1',
      observationName: 'Observation 1',
      date: '2026-04-18',
      affectedAreaKm2: 12.1,
      baselineDiffPercent: 0.0,
    },
    {
      id: 'obs-2',
      observationName: 'Observation 2',
      date: '2026-05-12',
      affectedAreaKm2: 15.3,
      baselineDiffPercent: +4.2,
    },
    {
      id: 'obs-3',
      observationName: 'Observation 3',
      date: '2026-06-05',
      affectedAreaKm2: 27.8,
      baselineDiffPercent: +14.6,
    },
    {
      id: 'obs-4',
      observationName: 'Observation 4',
      date: '2026-06-24',
      affectedAreaKm2: 38.4,
      baselineDiffPercent: +21.7,
    },
  ],
  geoJson: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'poly-1',
        properties: {
          name: 'North Embankment Overflow Zone',
          intensity: 'high',
          areaKm2: 18.2,
          backscatterDeltaDb: -8.4,
          description: 'Pronounced decrease in specular backscatter; indicative of standing water over formerly bare soil.',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [91.68, 26.22],
              [91.75, 26.26],
              [91.82, 26.24],
              [91.79, 26.19],
              [91.71, 26.18],
              [91.68, 26.22],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        id: 'poly-2',
        properties: {
          name: 'Southern Agricultural Lowland Inundation',
          intensity: 'moderate',
          areaKm2: 13.7,
          backscatterDeltaDb: -5.6,
          description: 'Moderate backscatter attenuation across seasonal floodplains and saturated paddy fields.',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [91.72, 26.12],
              [91.80, 26.15],
              [91.85, 26.11],
              [91.81, 26.08],
              [91.73, 26.09],
              [91.72, 26.12],
            ],
          ],
        },
      },
      {
        type: 'Feature',
        id: 'poly-3',
        properties: {
          name: 'Riparian Buffer Saturation Corridor',
          intensity: 'low',
          areaKm2: 6.5,
          backscatterDeltaDb: -4.8,
          description: 'Subtle moisture increase detected along river sandbars and peripheral wetland fringes.',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [91.63, 26.16],
              [91.69, 26.18],
              [91.70, 26.14],
              [91.64, 26.13],
              [91.63, 26.16],
            ],
          ],
        },
      },
    ],
  },
};

export const MOCK_ANALYSIS_DATABASE: Record<string, AnalysisResult> = {
  brahmaputra: DEFAULT_ANALYSIS_RESULT,
  mississippi: {
    id: 'ts-nisar-2026-0912',
    location: 'Lower Mississippi River Basin',
    locationCode: 'mississippi',
    centerCoordinates: [30.45, -91.18],
    zoomLevel: 10,
    beforeDate: '2026-05-10',
    afterDate: '2026-06-20',
    analysisMode: 'flood',
    changeType: 'Candidate Surface Saturation',
    affectedAreaKm2: 44.2,
    changePercent: 18.5,
    confidence: 'Moderate',
    changeIntensity: 'Moderate',
    summary:
      'Radar observations indicate candidate surface change and moisture accumulation along low-gradient backswamps and tributary junctions. Approximately 44.2 km² flagged as candidate saturated terrain.',
    isDemoData: true,
    scientificMetrics: {
      beforeBackscatterDb: -13.0,
      afterBackscatterDb: -19.2,
      differenceDb: -6.2,
      thresholdDb: -4.5,
      classificationMethod: 'NISAR L-band GCOV Difference Thresholding',
      polarization: 'HH / HV Dual-Pol',
      sensorFrequency: '1.25 GHz (L-band SAR)',
      radarBand: 'L-band (24 cm wavelength)',
    },
    timeline: [
      { id: 'm-1', observationName: 'Observation 1', date: '2026-04-15', affectedAreaKm2: 18.4, baselineDiffPercent: 0.0 },
      { id: 'm-2', observationName: 'Observation 2', date: '2026-05-10', affectedAreaKm2: 22.1, baselineDiffPercent: +3.7 },
      { id: 'm-3', observationName: 'Observation 3', date: '2026-06-01', affectedAreaKm2: 33.6, baselineDiffPercent: +11.2 },
      { id: 'm-4', observationName: 'Observation 4', date: '2026-06-20', affectedAreaKm2: 44.2, baselineDiffPercent: +18.5 },
    ],
    geoJson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'miss-1',
          properties: {
            name: 'Atchafalaya Floodway Inflow Sector',
            intensity: 'high',
            areaKm2: 24.6,
            backscatterDeltaDb: -7.1,
            description: 'Significant backscatter drop typical of open shallow water inundating seasonal cypress swamp.',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-91.35, 30.55],
                [-91.20, 30.60],
                [-91.12, 30.48],
                [-91.28, 30.40],
                [-91.35, 30.55],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: 'miss-2',
          properties: {
            name: 'Pointe Coupee Backwater Ponding',
            intensity: 'moderate',
            areaKm2: 19.6,
            backscatterDeltaDb: -5.3,
            description: 'Soil saturation and backwater accumulation in agricultural drainage swales.',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-91.25, 30.38],
                [-91.15, 30.42],
                [-91.08, 30.32],
                [-91.18, 30.28],
                [-91.25, 30.38],
              ],
            ],
          },
        },
      ],
    },
  },
  danube: {
    id: 'ts-nisar-2026-0774',
    location: 'Danube River Floodplain',
    locationCode: 'danube',
    centerCoordinates: [45.26, 19.83],
    zoomLevel: 10,
    beforeDate: '2026-04-05',
    afterDate: '2026-05-18',
    analysisMode: 'surface_change',
    changeType: 'Candidate Surface Change',
    affectedAreaKm2: 26.8,
    changePercent: 12.3,
    confidence: 'Moderate',
    changeIntensity: 'Moderate',
    summary:
      'Multi-temporal radar analysis indicates surface roughness and dielectric property changes across peripheral wetlands and riparian meadows. Approximately 26.8 km² flagged for field verification.',
    isDemoData: true,
    scientificMetrics: {
      beforeBackscatterDb: -10.8,
      afterBackscatterDb: -16.0,
      differenceDb: -5.2,
      thresholdDb: -4.0,
      classificationMethod: 'NISAR L-band Surface Roughness Ratio',
      polarization: 'HH / HV Dual-Pol',
      sensorFrequency: '1.25 GHz (L-band SAR)',
      radarBand: 'L-band (24 cm wavelength)',
    },
    timeline: [
      { id: 'd-1', observationName: 'Observation 1', date: '2026-03-20', affectedAreaKm2: 14.0, baselineDiffPercent: 0.0 },
      { id: 'd-2', observationName: 'Observation 2', date: '2026-04-05', affectedAreaKm2: 16.5, baselineDiffPercent: +2.5 },
      { id: 'd-3', observationName: 'Observation 3', date: '2026-04-28', affectedAreaKm2: 21.0, baselineDiffPercent: +7.0 },
      { id: 'd-4', observationName: 'Observation 4', date: '2026-05-18', affectedAreaKm2: 26.8, baselineDiffPercent: +12.3 },
    ],
    geoJson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'dan-1',
          properties: {
            name: 'Kopacki Rit Marshland Surcharge',
            intensity: 'moderate',
            areaKm2: 18.0,
            backscatterDeltaDb: -5.8,
            description: 'Floodplain retention basin filling with seasonal flood pulse.',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [19.75, 45.30],
                [19.92, 45.34],
                [19.98, 45.22],
                [19.80, 45.20],
                [19.75, 45.30],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: 'dan-2',
          properties: {
            name: 'Peripheral Meadow Inundation',
            intensity: 'low',
            areaKm2: 8.8,
            backscatterDeltaDb: -4.4,
            description: 'Shallow ponding across unpaved alluvial channels.',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [19.68, 45.20],
                [19.74, 45.22],
                [19.76, 45.15],
                [19.70, 45.14],
                [19.68, 45.20],
              ],
            ],
          },
        },
      ],
    },
  },
  central_valley_ag: {
    id: 'ts-nisar-ag-2026-041',
    location: 'San Joaquin Valley Agricultural Zone',
    locationCode: 'central_valley_ag',
    centerCoordinates: [36.75, -119.80],
    zoomLevel: 10,
    beforeDate: '2026-05-12',
    afterDate: '2026-06-24',
    analysisMode: 'agriculture',
    changeType: 'Crop Biomass & Soil Saturation',
    affectedAreaKm2: 54.2,
    changePercent: 31.4,
    confidence: 'High',
    changeIntensity: 'High',
    summary:
      'NISAR L-band dual-polarization (HH/HV) and L3 Soil Moisture (SME2) analysis detects dynamic crop growth cycles, vegetation biomass volume scattering increases (+3.8 dB), and furrow irrigation soil saturation across 54.2 km².',
    isDemoData: true,
    scientificMetrics: {
      beforeBackscatterDb: -14.2,
      afterBackscatterDb: -10.4,
      differenceDb: +3.8,
      thresholdDb: +2.5,
      classificationMethod: 'NISAR L-band Dual-Pol (HH/HV) Biomass Index & L3 Soil Moisture (SME2)',
      polarization: 'HH / HV Dual-Pol',
      sensorFrequency: '1.25 GHz (L-band SAR)',
      radarBand: 'L-band (24 cm wavelength)',
    },
    timeline: [
      { id: 'ag-1', observationName: 'Emergence / Seedling', date: '2026-05-12', affectedAreaKm2: 13.5, baselineDiffPercent: 0.0 },
      { id: 'ag-2', observationName: 'Vegetative Growth', date: '2026-05-28', affectedAreaKm2: 29.8, baselineDiffPercent: +12.5 },
      { id: 'ag-3', observationName: 'Peak Canopy / Heading', date: '2026-06-10', affectedAreaKm2: 46.1, baselineDiffPercent: +23.5 },
      { id: 'ag-4', observationName: 'Soil Saturation / Ripening', date: '2026-06-24', affectedAreaKm2: 54.2, baselineDiffPercent: +31.4 },
    ],
    geoJson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'ag-poly-1',
          properties: {
            name: 'Fresno High-Biomass Crop Cluster',
            intensity: 'high',
            areaKm2: 32.5,
            backscatterDeltaDb: +3.8,
            description: 'Cross-polarization (HV) volume scattering elevation indicating dense orchard and alfalfa canopy development.',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-119.92, 36.82],
                [-119.70, 36.85],
                [-119.65, 36.70],
                [-119.88, 36.68],
                [-119.92, 36.82],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: 'ag-poly-2',
          properties: {
            name: 'Tulare Basin Soil Saturation Furrows',
            intensity: 'moderate',
            areaKm2: 21.7,
            backscatterDeltaDb: +2.7,
            description: 'Dielectric constant increase from flood-and-drip agricultural irrigation detected via L-band penetration.',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-119.80, 36.65],
                [-119.62, 36.67],
                [-119.60, 36.55],
                [-119.78, 36.53],
                [-119.80, 36.65],
              ],
            ],
          },
        },
      ],
    },
  },
  jakobshavn_cryo: {
    id: 'ts-nisar-cryo-2026-108',
    location: 'Jakobshavn Isbræ Glacial Catchment',
    locationCode: 'jakobshavn_cryo',
    centerCoordinates: [69.17, -50.05],
    zoomLevel: 9,
    beforeDate: '2026-05-12',
    afterDate: '2026-06-24',
    analysisMode: 'cryosphere',
    changeType: 'Glacial Terminus Retreat & Ice Melt',
    affectedAreaKm2: 78.6,
    changePercent: 28.2,
    confidence: 'High',
    changeIntensity: 'High',
    summary:
      'NISAR L-band SAR tracking measures 78.6 km² of rapid glacial terminus retreat, surface melt onset, and ice stream discharge acceleration into Ilulissat Icefjord over the monitored interval.',
    isDemoData: true,
    scientificMetrics: {
      beforeBackscatterDb: -8.5,
      afterBackscatterDb: -15.3,
      differenceDb: -6.8,
      thresholdDb: -4.0,
      classificationMethod: 'NISAR Polarimetric Speckle Tracking & Dielectric Melt Detection',
      polarization: 'HH Polarimetric',
      sensorFrequency: '1.25 GHz (L-band SAR)',
      radarBand: 'L-band (24 cm wavelength)',
    },
    timeline: [
      { id: 'cr-1', observationName: 'Solid Frozen Baseline', date: '2026-05-12', affectedAreaKm2: 27.5, baselineDiffPercent: 0.0 },
      { id: 'cr-2', observationName: 'Terminus Fracturing', date: '2026-05-25', affectedAreaKm2: 43.2, baselineDiffPercent: +9.8 },
      { id: 'cr-3', observationName: 'Supraglacial Melt', date: '2026-06-08', affectedAreaKm2: 62.9, baselineDiffPercent: +19.7 },
      { id: 'cr-4', observationName: 'Peak Calving Event', date: '2026-06-24', affectedAreaKm2: 78.6, baselineDiffPercent: +28.2 },
    ],
    geoJson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'cryo-poly-1',
          properties: {
            name: 'Jakobshavn Terminus Calving Front',
            intensity: 'high',
            areaKm2: 43.2,
            backscatterDeltaDb: -6.8,
            description: 'Rapid seaward ice shelf detachment with high-velocity ice melange discharge.',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-50.25, 69.22],
                [-49.85, 69.25],
                [-49.75, 69.12],
                [-50.15, 69.10],
                [-50.25, 69.22],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: 'cryo-poly-2',
          properties: {
            name: 'Upper Ice Sheet Supraglacial Melt Zone',
            intensity: 'moderate',
            areaKm2: 35.4,
            backscatterDeltaDb: -5.1,
            description: 'Severe dielectric absorption of L-band radar energy due to liquid water percolating through firn.',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-49.70, 69.28],
                [-49.30, 69.30],
                [-49.25, 69.18],
                [-49.65, 69.15],
                [-49.70, 69.28],
              ],
            ],
          },
        },
      ],
    },
  },
  san_andreas_def: {
    id: 'ts-nisar-def-2026-302',
    location: 'San Andreas Fault Zone (Coachella)',
    locationCode: 'san_andreas_def',
    centerCoordinates: [33.72, -116.15],
    zoomLevel: 10,
    beforeDate: '2026-05-12',
    afterDate: '2026-06-24',
    analysisMode: 'deformation',
    changeType: 'Seismic Slip & Ground Subsidence',
    affectedAreaKm2: 62.4,
    changePercent: 24.5,
    confidence: 'High',
    changeIntensity: 'High',
    summary:
      'NISAR L-band InSAR GUNW (Geocoded Unwrapped Interferogram) analysis reveals 62.4 km² of aseismic fault creep, line-of-sight surface displacement (~2.4 cm), and aquifer-compaction subsidence.',
    isDemoData: true,
    scientificMetrics: {
      beforeBackscatterDb: -12.8,
      afterBackscatterDb: -17.4,
      differenceDb: -4.6,
      thresholdDb: -3.5,
      classificationMethod: 'NISAR InSAR Phase Decorrelation & GUNW Differential Interferometry',
      polarization: 'HH Polarimetric InSAR',
      sensorFrequency: '1.25 GHz (L-band SAR)',
      radarBand: 'L-band (24 cm wavelength)',
    },
    timeline: [
      { id: 'def-1', observationName: 'InSAR Master Acquisition', date: '2026-05-12', affectedAreaKm2: 18.7, baselineDiffPercent: 0.0 },
      { id: 'def-2', observationName: '12-Day Repeat Orbit 1', date: '2026-05-24', affectedAreaKm2: 31.2, baselineDiffPercent: +8.5 },
      { id: 'def-3', observationName: '12-Day Repeat Orbit 2', date: '2026-06-05', affectedAreaKm2: 46.8, baselineDiffPercent: +17.1 },
      { id: 'def-4', observationName: 'InSAR Differential Pair', date: '2026-06-24', affectedAreaKm2: 62.4, baselineDiffPercent: +24.5 },
    ],
    geoJson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'def-poly-1',
          properties: {
            name: 'Coachella Valley Aseismic Fault Creep',
            intensity: 'high',
            areaKm2: 40.5,
            backscatterDeltaDb: -4.6,
            description: 'Differential interferometric fringe pattern indicating tectonic slip across the San Andreas plate boundary.',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-116.35, 33.85],
                [-116.05, 33.78],
                [-115.95, 33.62],
                [-116.25, 33.68],
                [-116.35, 33.85],
              ],
            ],
          },
        },
        {
          type: 'Feature',
          id: 'def-poly-2',
          properties: {
            name: 'Palm Desert Groundwater Basin Subsidence',
            intensity: 'moderate',
            areaKm2: 21.9,
            backscatterDeltaDb: -3.2,
            description: 'Gradual compaction of unconsolidated aquifer sediment captured by InSAR phase coherence analysis.',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-116.42, 33.74],
                [-116.30, 33.76],
                [-116.28, 33.66],
                [-116.40, 33.64],
                [-116.42, 33.74],
              ],
            ],
          },
        },
      ],
    },
  },
};
