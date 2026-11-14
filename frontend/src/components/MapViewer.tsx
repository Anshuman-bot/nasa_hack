import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoJsonFeatureCollection, LayerVisibility } from '../types/analysis';
import { Layers, Eye, EyeOff, Radio } from 'lucide-react';

interface MapViewerProps {
  center: [number, number];
  zoom: number;
  layers: LayerVisibility;
  onLayerToggle: (layer: keyof LayerVisibility) => void;
  geoJson: GeoJsonFeatureCollection;
  locationName: string;
}

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.2,
    });
  }, [center, zoom, map]);

  return null;
};

export const MapViewer: React.FC<MapViewerProps> = ({
  center,
  zoom,
  layers,
  onLayerToggle,
  geoJson,
  locationName,
}) => {
  const geoJsonStyle = (feature: any) => {
    const intensity = feature?.properties?.intensity;
    let color = '#38bdf8'; // low
    let fillColor = '#0284c7';
    let fillOpacity = 0.45;

    if (intensity === 'high') {
      color = '#ef4444'; // high
      fillColor = '#dc2626';
      fillOpacity = 0.65;
    } else if (intensity === 'moderate') {
      color = '#f59e0b'; // moderate
      fillColor = '#d97706';
      fillOpacity = 0.55;
    }

    return {
      color,
      weight: 2,
      opacity: 0.9,
      fillColor,
      fillOpacity,
      dashArray: intensity === 'low' ? '4, 4' : undefined,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const { name, intensity, areaKm2, backscatterDeltaDb, description } = feature.properties;
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.45; min-width: 220px; padding: 2px;">
          <div style="font-weight: 700; color: #60a5fa; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
            ${name || 'Candidate Disturbance Zone'}
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #94a3b8;">Intensity:</span>
            <span style="font-weight: 600; text-transform: uppercase; color: ${
              intensity === 'high' ? '#ef4444' : intensity === 'moderate' ? '#f59e0b' : '#38bdf8'
            };">${intensity}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #94a3b8;">Area:</span>
            <span style="font-weight: 600; color: #f1f5f9;">${areaKm2 ? areaKm2 + ' km²' : 'N/A'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="color: #94a3b8;">Δ Backscatter:</span>
            <span style="font-family: monospace; color: #a3e635; font-weight: 600;">${backscatterDeltaDb ? backscatterDeltaDb + ' dB' : 'N/A'}</span>
          </div>
          <div style="color: #cbd5e1; font-size: 11px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 6px 8px; border-radius: 6px;">
            ${description || 'Candidate surface disturbance detected via SAR log-ratio thresholding.'}
          </div>
        </div>
      `;
      layer.bindPopup(popupHtml);
    }
  };

  return (
    <div className="relative w-full h-[460px] lg:h-[620px] rounded-2xl overflow-hidden border border-white/10 bg-midnight-950 shadow-2xl isolate">
      {/* Top Floating Badge */}
      <div className="absolute top-4 left-4 z-[500] bg-black/85 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 text-xs font-medium flex items-center gap-2.5 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-acid-400 animate-pulse"></span>
        <span className="text-white font-semibold">{locationName}</span>
        <span className="text-white/20">|</span>
        <span className="text-slate-400 font-mono text-[11px]">NISAR L-band SAR Grid</span>
      </div>

      {/* Layer Control Panel Floating Widget (Clean glass design) */}
      <div className="absolute bottom-4 right-4 z-[500] bg-black/85 backdrop-blur-md p-3.5 rounded-xl border border-white/10 shadow-2xl max-w-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-white mb-3 pb-2 border-b border-white/10">
          <Layers className="w-4 h-4 text-electric-400" />
          <span>Active Map Layers</span>
        </div>

        <div className="space-y-1 text-xs">
          {/* Base Map Toggle */}
          <button
            onClick={() => onLayerToggle('baseMap')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
              layers.baseMap ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Cartographic Base</span>
            {layers.baseMap ? <Eye className="w-3.5 h-3.5 text-electric-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Pre-Event SAR */}
          <button
            onClick={() => onLayerToggle('beforeLayer')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
              layers.beforeLayer ? 'bg-white/10 text-electric-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Pre-Event Radar (t₀)</span>
            {layers.beforeLayer ? <Eye className="w-3.5 h-3.5 text-electric-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Post-Event SAR */}
          <button
            onClick={() => onLayerToggle('afterLayer')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
              layers.afterLayer ? 'bg-white/10 text-electric-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Post-Event Radar (t₁)</span>
            {layers.afterLayer ? <Eye className="w-3.5 h-3.5 text-electric-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Detected Change GeoJSON */}
          <button
            onClick={() => onLayerToggle('detectedChange')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
              layers.detectedChange
                ? 'bg-acid-400/10 text-acid-300 border border-acid-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Candidate Disturbance</span>
            </div>
            {layers.detectedChange ? <Eye className="w-3.5 h-3.5 text-acid-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>

        {/* Legend */}
        <div className="mt-3 pt-2.5 border-t border-white/10 text-[10px] font-mono text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> High</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Moderate</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span> Low</span>
          </div>
        </div>
      </div>

      {/* SAR Calibration Notice */}
      {(layers.beforeLayer || layers.afterLayer) && (
        <div className="absolute top-16 left-4 z-[1000] bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] text-electric-300 border border-electric-500/30 flex items-center gap-2">
          <Radio className="w-3 h-3 text-acid-400 animate-pulse" />
          <span>Amplitude Calibration Filter Active</span>
        </div>
      )}

      {/* Leaflet Map */}
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <MapController center={center} zoom={zoom} />

        {layers.baseMap && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
          />
        )}

        {layers.detectedChange && geoJson && (
          <GeoJSON
            key={JSON.stringify(geoJson)}
            data={geoJson as any}
            style={geoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  );
};
