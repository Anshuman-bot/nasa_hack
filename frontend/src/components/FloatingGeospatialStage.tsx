import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Compass } from 'lucide-react';

export interface FloatingRegion {
  id: string;
  name: string;
  country: string;
  coordinates: string;
  sensor: string;
  tag: string;
  metric: string;
  baseRotation: number; // degrees
  src: string;
  description: string;
}

const REGIONS: FloatingRegion[] = [
  {
    id: 'brahmaputra',
    name: 'Brahmaputra River Corridor',
    country: 'Assam, India',
    coordinates: '26.18° N, 91.75° E',
    sensor: 'NISAR L-band SAR // GCOV',
    tag: 'FLOOD INUNDATION',
    metric: 'Δσ° < -7.5 dB Specular Loss',
    baseRotation: -8,
    src: '/assam-brahmaputra.jpg',
    description: 'Braided river floodplains undergoing extreme seasonal monsoon inundation.',
  },
  {
    id: 'san_andreas_def',
    name: 'San Andreas Fault Zone',
    country: 'California, USA',
    coordinates: '35.12° N, 119.65° W',
    sensor: 'InSAR Phase Correlation // GUNW',
    tag: 'CRUSTAL STRAIN',
    metric: 'Creep Velocity: 2.8 mm / yr',
    baseRotation: 10,
    src: '/california-san-andreas.jpg',
    description: 'Tectonic plate boundary displaying sub-centimeter fault creep.',
  },
  {
    id: 'himalayas',
    name: 'Himalayan Glacial Tongue',
    country: 'Khumbu, Nepal',
    coordinates: '27.98° N, 86.92° E',
    sensor: 'Terra ASTER & L-SAR Dual-Pol',
    tag: 'GLACIAL RETREAT',
    metric: 'Elevation: 8,848m Moraine',
    baseRotation: -12,
    src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
    description: 'High-altitude supraglacial lakes and moraine dammed meltwater channels.',
  },
  {
    id: 'amazon',
    name: 'Amazon Drainage Basin',
    country: 'Amazonas, Brazil',
    coordinates: '3.46° S, 62.21° W',
    sensor: 'Sentinel-1 & L-band Penetration',
    tag: 'SUB-CANOPY HYDROLOGY',
    metric: 'Canopy Penetration: 24 cm',
    baseRotation: 6,
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    description: 'Dense tropical forest canopy with floodwaters detected below trees.',
  },
  {
    id: 'jakobshavn_cryo',
    name: 'Jakobshavn Isbræ Stream',
    country: 'West Greenland',
    coordinates: '69.17° N, 50.05° W',
    sensor: 'Repeat-Pass SAR Interferometry',
    tag: 'CRYOSPHERE FLOW',
    metric: 'Ice Flow: 45 m / day',
    baseRotation: -10,
    src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
    description: 'Fastest calving marine-terminating glacier into Ilulissat Icefjord.',
  },
  {
    id: 'sahara',
    name: 'Richat Geological Dome',
    country: 'Mauritania, Sahara',
    coordinates: '21.12° N, 11.40° W',
    sensor: 'Landsat 8 OLI & ALOS PALSAR',
    tag: 'STRUCTURAL GEOLOGY',
    metric: '40 km Concentric Dome',
    baseRotation: 14,
    src: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80',
    description: 'Hyper-arid circular exhumation dome revealing sedimentary cuestas.',
  },
  {
    id: 'mississippi',
    name: 'Lower Mississippi Delta',
    country: 'Louisiana, USA',
    coordinates: '30.45° N, 91.18° W',
    sensor: 'NISAR L-band Coastal SAR',
    tag: 'COASTAL SUBSIDENCE',
    metric: 'Wetland Loss Rate: High',
    baseRotation: -6,
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    description: 'Barrier islands and deltaic wetlands facing sea-level inundation.',
  },
  {
    id: 'central_valley_ag',
    name: 'San Joaquin Valley',
    country: 'California, USA',
    coordinates: '36.75° N, 119.80° W',
    sensor: 'NISAR L3 SME2 Soil Moisture',
    tag: 'AGRICULTURE SOIL',
    metric: 'Permittivity Shift: +18%',
    baseRotation: 8,
    src: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1000&q=80',
    description: 'Crop growth phenology and groundwater subsidence tracking.',
  },
];

interface FloatingGeospatialStageProps {
  onSelectRegion: (locationId: string) => void;
}

export const FloatingGeospatialStage: React.FC<FloatingGeospatialStageProps> = ({
  onSelectRegion,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mouseXNormalized, setMouseXNormalized] = useState<number>(0);
  const [currentShiftX, setCurrentShiftX] = useState<number>(0);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [cardTilt, setCardTilt] = useState<{ id: string; rx: number; ry: number } | null>(null);
  const [activeCenterIndex, setActiveCenterIndex] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Mouse move over the stage area to drive horizontal glide (like Agrumea)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Normalized -1 (left) to +1 (right)
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    setMouseXNormalized(normX);
  };

  // Smooth inertial interpolation for the glide
  useEffect(() => {
    const targetRange = 550; // max pixel shift
    const animate = () => {
      const target = -mouseXNormalized * targetRange;
      setCurrentShiftX((prev) => prev + (target - prev) * 0.075);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mouseXNormalized]);

  // Card-specific 3D interactive tilt when hovering
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = ((y - rect.height / 2) / (rect.height / 2)) * -12;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 12;
    setCardTilt({ id, rx, ry });
  };

  const handleCardMouseLeave = () => {
    setHoveredCardId(null);
    setCardTilt(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-[580px] sm:min-h-[660px] md:min-h-[720px] overflow-hidden flex items-center justify-center select-none py-12"
      style={{ perspective: '1400px' }}
    >
      {/* -------------------------------------------------------------
          BACKGROUND: GIANT ROTATING ROTARY EMBLEM (INSPIRED BY AGRUMEA)
          ------------------------------------------------------------- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="relative w-[500px] sm:w-[680px] md:w-[780px] aspect-square rounded-full flex items-center justify-center animate-orbit-spin opacity-85">
          {/* Background Radial Tint in Royal Blue */}
          <div className="absolute inset-4 rounded-full bg-royal-600/15 blur-2xl" />

          {/* Concentric Rotating Text Ring SVG */}
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <defs>
              <path
                id="agrumaTextCircle"
                d="M 250, 250 m -200, 0 a 200,200 0 1,1 400,0 a 200,200 0 1,1 -400,0"
              />
            </defs>
            <text
              fill="#FFE500"
              className="font-anton text-[26px] tracking-[6px] uppercase"
              style={{ letterSpacing: '8px' }}
            >
              <textPath href="#agrumaTextCircle">
                • THE EARTH NEVER STOPS TELLING STORIES • ACTIVE MICROWAVE RADAR • ALL-WEATHER 24/7 •
              </textPath>
            </text>
          </svg>

          {/* Central Stylized Radar Reticle in Bright Yellow */}
          <div className="absolute w-44 sm:w-56 h-44 sm:h-56 rounded-full border-2 border-dashed border-yellow/40 flex items-center justify-center">
            <div className="w-28 sm:w-36 h-28 sm:h-36 rounded-full border border-royal-400/50 flex items-center justify-center">
              <Compass className="w-8 h-8 text-yellow animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          FOREGROUND: HORIZONTAL STREAM OF 3D FLOATING CANISTERS/PANELS
          ------------------------------------------------------------- */}
      <div
        className="relative z-10 flex items-center gap-6 sm:gap-10 transition-transform duration-100 ease-out will-change-transform px-10"
        style={{
          transform: `translate3d(${currentShiftX}px, 0, 0)`,
        }}
      >
        {REGIONS.map((region, idx) => {
          const isHovered = hoveredCardId === region.id;
          const tiltX = cardTilt && cardTilt.id === region.id ? cardTilt.rx : 0;
          const tiltY = cardTilt && cardTilt.id === region.id ? cardTilt.ry : 0;

          // Parabolic height stagger (gives the organic wave arc seen in the Agrumea video)
          const verticalOffset = Math.sin(idx * 0.9) * 36;
          const currentRotation = isHovered ? 0 : region.baseRotation;

          return (
            <div
              key={region.id}
              onClick={() => {
                setActiveCenterIndex(idx);
                onSelectRegion(region.id);
              }}
              onMouseEnter={() => {
                setHoveredCardId(region.id);
                setActiveCenterIndex(idx);
              }}
              onMouseMove={(e) => handleCardMouseMove(e, region.id)}
              onMouseLeave={handleCardMouseLeave}
              className={`relative shrink-0 cursor-pointer transition-all duration-300 ease-out group ${
                isHovered ? 'z-40 scale-105' : 'z-20 hover:z-30'
              }`}
              style={{
                transform: `translate3d(0, ${verticalOffset}px, ${isHovered ? 60 : 0}px) rotate(${currentRotation}deg) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Canister Floating Photographic Card (Soft Rounded Corners 20px) */}
              <div
                className={`w-[260px] sm:w-[310px] md:w-[340px] rounded-[22px] overflow-hidden border transition-all duration-500 bg-black/95 shadow-2xl ${
                  isHovered
                    ? 'border-yellow shadow-[0_25px_60px_rgba(255,229,0,0.35)] -translate-y-3'
                    : 'border-white/20 hover:border-royal-400 shadow-[0_20px_45px_rgba(0,0,0,0.85)]'
                }`}
              >
                {/* Upper Photographic Satellite Aperture */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-royal-950">
                  <img
                    src={region.src}
                    alt={region.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter contrast-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

                  {/* Top Floating Badge: Bright Yellow Location Pill */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-2 bg-yellow text-black font-mono text-[11px] font-bold px-3 py-1 rounded-full shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                    <span>{region.country}</span>
                  </div>

                  {/* Right Sensor Tag (Royal Blue) */}
                  <div className="absolute top-3.5 right-3.5 bg-royal-600/90 text-white font-mono text-[9px] px-2.5 py-1 rounded-full border border-white/20">
                    {region.tag}
                  </div>

                  {/* Hover Inspection Callout */}
                  <div
                    className={`absolute inset-0 bg-royal-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center transition-opacity duration-300 ${
                      isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-yellow text-black flex items-center justify-center font-bold mb-2 shadow-lg">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                    <span className="font-anton text-lg text-white">ENTER TARGET GRID</span>
                    <span className="font-mono text-[10px] text-yellow mt-1">
                      CLICK TO LAUNCH MONITOR
                    </span>
                  </div>
                </div>

                {/* Bottom Technical Editorial Label */}
                <div className="p-4 sm:p-5 space-y-1.5 bg-black border-t border-white/10">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-anton text-lg sm:text-xl text-white group-hover:text-yellow transition-colors truncate">
                      {region.name}
                    </h3>
                  </div>

                  {/* Coords & Sensor */}
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                    <span className="text-yellow">{region.coordinates}</span>
                    <span className="text-royal-400 font-bold">{region.metric}</span>
                  </div>

                  <p className="font-sans text-xs text-slate-300 leading-relaxed line-clamp-2 pt-1">
                    {region.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* -------------------------------------------------------------
          BOTTOM INTERACTION TELEMETRY: GLIDE PROMPT & ACTIVE INDICATOR
          ------------------------------------------------------------- */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-between items-center px-6 sm:px-12 font-mono text-[11px] text-slate-400 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/75 px-3 py-1 rounded-full border border-white/10">
          <span className="w-2 h-2 rounded-full bg-yellow animate-ping" />
          <span className="text-white font-semibold">HOVER &amp; MOVE CURSOR HORIZONTALLY TO GLIDE</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-black/75 px-3 py-1 rounded-full border border-white/10">
          <span className="text-slate-400">STAGE TARGET:</span>
          <span className="text-yellow font-bold uppercase">
            {REGIONS[activeCenterIndex]?.name || 'BRAHMAPUTRA'}
          </span>
        </div>
      </div>
    </div>
  );
};