import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Waves,
  Mountain,
  Sprout,
  Zap,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { FloatingGeospatialStage } from '../components/FloatingGeospatialStage';

interface LandingPageProps {
  onLaunchMonitor: (locationId?: string) => void;
}

// Curated Earth-Observation Imagery with authentic coordinates and metadata
const SATELLITE_PANELS = [
  {
    id: 'brahmaputra',
    title: 'Brahmaputra River Corridor',
    country: 'Assam, India',
    coordinates: '26.18° N, 91.75° E',
    sensor: 'NISAR L-band SAR // GCOV',
    aspect: 'aspect-[4/3]',
    src: '/assam-brahmaputra.jpg',
    description: 'Braided river floodplains undergoing seasonal monsoon inundation.',
    rotation: '-rotate-1',
    layer: 'z-20',
    tag: 'FLOOD INUNDATION',
  },
  {
    id: 'san_andreas_def',
    title: 'San Andreas Fault Zone',
    country: 'California, USA',
    coordinates: '35.12° N, 119.65° W',
    sensor: 'InSAR Phase Correlation // GUNW',
    aspect: 'aspect-[16/10]',
    src: '/california-san-andreas.jpg',
    description: 'Tectonic boundary showing millimeter-scale crustal strain and creep.',
    rotation: 'rotate-2',
    layer: 'z-10',
    tag: 'CRUSTAL DEFORMATION',
  },
  {
    id: 'himalayas',
    title: 'Himalayan High Topography',
    country: 'Nepal & Tibet',
    coordinates: '27.98° N, 86.92° E',
    sensor: 'Terra ASTER & L-SAR Dual-Pol',
    aspect: 'aspect-[3/4]',
    src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
    description: 'High-altitude cryospheric glaciers and debris-covered tongues.',
    rotation: '-rotate-2',
    layer: 'z-20',
    tag: 'GLACIAL DYNAMICS',
  },
  {
    id: 'amazon',
    title: 'Amazon River Basin',
    country: 'Amazonas, Brazil',
    coordinates: '3.46° S, 62.21° W',
    sensor: 'Sentinel-1 Dual-Pol & L-band Penetration',
    aspect: 'aspect-square',
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    description: 'Densely forested drainage network with sub-canopy water scattering.',
    rotation: 'rotate-1',
    layer: 'z-10',
    tag: 'HYDROLOGY',
  },
  {
    id: 'jakobshavn_cryo',
    title: 'Jakobshavn Isbræ Ice Stream',
    country: 'West Greenland',
    coordinates: '69.17° N, 50.05° W',
    sensor: 'Repeat-Pass SAR Interferometry',
    aspect: 'aspect-[4/3]',
    src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
    description: 'Fastest flowing ice sheet glacier calving into Ilulissat Icefjord.',
    rotation: 'rotate-1',
    layer: 'z-30',
    tag: 'CRYOSPHERE FLOW',
  },
  {
    id: 'sahara',
    title: 'Richat Structure // Sahara',
    country: 'Mauritania',
    coordinates: '21.12° N, 11.40° W',
    sensor: 'Landsat 8 OLI & ALOS PALSAR',
    aspect: 'aspect-[16/9]',
    src: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    description: 'Deeply eroded 40-km circular geological dome in hyper-arid terrain.',
    rotation: '-rotate-1',
    layer: 'z-10',
    tag: 'GEOLOGY',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchMonitor }) => {
  // Mouse parallax coordinates
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 20;
      const y = (e.clientY / innerHeight - 0.5) * 20;
      setMouseOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-black text-white min-h-screen font-sans selection:bg-yellow selection:text-black overflow-x-hidden"
    >
      {/* =========================================================================
          CHAPTER 01 — EXPLORE // HERO SECTION (UNCONVENTIONAL EDITORIAL COMPOSITION)
          ========================================================================= */}
      <section
        id="hero"
        className="relative min-h-[calc(100vh-5rem)] pt-8 sm:pt-12 pb-16 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col justify-between"
      >
        {/* Ambient Royal Blue Backdrop Glow */}
        <div
          className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[750px] h-[550px] sm:h-[750px] bg-royal-600/20 rounded-full blur-[140px] pointer-events-none"
          style={{
            transform: `translate3d(${mouseOffset.x * 1.5}px, ${mouseOffset.y * 1.5}px, 0)`,
          }}
        />

        {/* Top Editorial Index & Spatial Telemetry Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-yellow">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow shadow-[0_0_8px_#FFE500]"></span>
              <span>CHAPTER 01 // ORBITAL ENTRY</span>
            </div>
            <div className="font-mono text-xs text-slate-400">
              NISAR DUAL-POL L-BAND (1.25 GHz) &bull; CONTINUOUS GLOBAL REPEAT CYCLE
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs text-slate-400">
            <div>
              <span className="text-yellow">COORDS:</span> 26.18&deg;N 91.75&deg;E
            </div>
            <div>
              <span className="text-royal-400">ALTITUDE:</span> 747 KM
            </div>
            <div className="hidden sm:block">
              <span className="text-white">POL:</span> HH + HV
            </div>
          </div>
        </div>

        {/* Central Asymmetric Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-10">
          {/* Left Column: Monumental Anton Typography */}
          <div className="lg:col-span-7 z-20 space-y-6">
            <div className="inline-block px-3 py-1 rounded-md bg-royal-600 text-white font-mono text-xs font-semibold tracking-wider">
              EXPERIMENTAL EARTH OBSERVATION
            </div>

            {/* Oversized Anton Headline */}
            <h1 className="font-anton text-6xl sm:text-7xl md:text-8xl xl:text-9xl text-white tracking-tight leading-[0.88] select-none">
              THE EARTH <br />
              <span className="text-yellow">NEVER STOPS</span> <br />
              <span className="text-transparent text-stroke-white hover:text-white transition-colors duration-500">
                TELLING
              </span>{' '}
              <span className="text-royal-400">STORIES.</span>
            </h1>

            {/* Editorial Paragraph */}
            <p className="text-slate-300 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
              Optical satellites are blinded by monsoon cloud decks and darkness. Active microwave
              radar pierces atmospheric veils to uncover tectonic deformation, glacial collapse, and
              catastrophic flood frontiers in millimeter precision.
            </p>

            {/* Interactive Launch Action */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onLaunchMonitor('brahmaputra')}
                className="px-8 py-4 rounded-full bg-yellow hover:bg-yellow-300 text-black font-anton text-base sm:text-lg tracking-wider flex items-center gap-3 transition-all duration-300 shadow-[0_0_30px_rgba(255,229,0,0.4)] active:scale-95"
              >
                <span>ENTER PLATFORM</span>
                <ArrowRight className="w-5 h-5 text-black" />
              </button>

              <a
                href="#planet"
                className="px-6 py-4 rounded-full border border-white/20 hover:border-yellow text-white font-mono text-xs tracking-wider flex items-center gap-2 hover:bg-white/5 transition-all"
              >
                <span>EXPLORE STORIES</span>
                <ChevronDown className="w-4 h-4 text-yellow" />
              </a>
            </div>
          </div>

          {/* Right Column: Floating Asymmetric Satellite Image Panels with Soft Corners */}
          <div className="lg:col-span-5 relative min-h-[420px] sm:min-h-[520px] flex items-center justify-center select-none">
            {/* Primary Main Floating Window: Brahmaputra River Corridor */}
            <div
              onClick={() => onLaunchMonitor('brahmaputra')}
              className="relative w-full max-w-[420px] rounded-[20px] overflow-hidden border border-white/15 bg-royal-950/80 shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:border-yellow group cursor-pointer animate-float-slow z-20"
              style={{
                transform: `translate3d(${mouseOffset.x * -1}px, ${mouseOffset.y * -1}px, 0)`,
              }}
            >
              <div className="aspect-[4/3] w-full overflow-hidden relative">
                <img
                  src={SATELLITE_PANELS[0].src}
                  alt={SATELLITE_PANELS[0].title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {/* Yellow Location Label */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-yellow text-black px-3 py-1 rounded-full font-mono text-[11px] font-bold shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                  <span>{SATELLITE_PANELS[0].country}</span>
                </div>

                <div className="absolute top-4 right-4 bg-royal-600/90 text-white font-mono text-[10px] px-2.5 py-1 rounded-full border border-white/20">
                  {SATELLITE_PANELS[0].tag}
                </div>
              </div>

              {/* Bottom Metadata Band */}
              <div className="p-4 space-y-1 bg-black/90 border-t border-white/10">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-anton text-lg text-white group-hover:text-yellow transition-colors">
                    {SATELLITE_PANELS[0].title}
                  </h3>
                  <span className="font-mono text-xs text-yellow">26.18&deg; N</span>
                </div>
                <p className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-2">
                  {SATELLITE_PANELS[0].description}
                </p>
              </div>
            </div>

            {/* Secondary Overlapping Floating Satellite Panel: San Andreas Fault */}
            <div
              onClick={() => onLaunchMonitor('san_andreas_def')}
              className="absolute -bottom-6 -left-6 sm:-left-10 w-[240px] sm:w-[280px] rounded-[18px] overflow-hidden border border-royal-400/40 bg-black/95 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-30 transition-all duration-500 hover:scale-105 hover:border-yellow group cursor-pointer animate-float-reverse hidden sm:block"
              style={{
                transform: `translate3d(${mouseOffset.x * 1.4}px, ${mouseOffset.y * 1.4}px, 0)`,
              }}
            >
              <div className="aspect-[16/10] w-full overflow-hidden relative">
                <img
                  src={SATELLITE_PANELS[1].src}
                  alt={SATELLITE_PANELS[1].title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute top-2.5 left-2.5 bg-yellow text-black font-mono text-[9px] font-bold px-2 py-0.5 rounded-full">
                  CALIFORNIA
                </div>
              </div>
              <div className="p-3 bg-black/95 border-t border-white/10">
                <div className="font-anton text-xs text-white group-hover:text-yellow transition-colors">
                  {SATELLITE_PANELS[1].title}
                </div>
                <div className="font-mono text-[10px] text-royal-400 mt-0.5">
                  CRUSTAL STRAIN // InSAR
                </div>
              </div>
            </div>

            {/* Tertiary Floating Accent Tag: Jakobshavn Glacial Catchment */}
            <div
              onClick={() => onLaunchMonitor('jakobshavn_cryo')}
              className="absolute -top-6 -right-4 sm:-right-8 bg-royal-700 text-white rounded-[14px] p-3 border border-white/20 shadow-xl z-10 hidden md:block cursor-pointer hover:border-yellow transition-all"
              style={{
                transform: `translate3d(${mouseOffset.x * -0.7}px, ${mouseOffset.y * -0.7}px, 0)`,
              }}
            >
              <div className="font-mono text-[10px] text-yellow font-bold uppercase tracking-wider">
                GREENLAND ICE STREAM
              </div>
              <div className="font-anton text-sm text-white mt-0.5">69.17&deg; N &bull; -50.05&deg; W</div>
              <div className="text-[10px] text-slate-300 font-sans mt-0.5">Terminal flow: 45m / day</div>
            </div>
          </div>
        </div>

        {/* Minimal Editorial Scroll Indicator */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-slate-500 gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-yellow animate-ping" />
            <span>RADAR PULSES ACTIVE ACROSS 12 MONITORED ORBITS</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 hover:text-yellow transition-colors">
            <span>SCROLL TO DESCEND</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-yellow" />
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE FLOATING SATELLITE STAGE (INSPIRED BY AGRUMEA VIDEO)
          ========================================================================= */}
      <section className="py-20 border-t border-white/10 relative overflow-hidden bg-gradient-to-b from-black via-royal-950/40 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="font-mono text-xs text-yellow tracking-widest uppercase">
                GEOSPATIAL ARCHIVE // HORIZONTAL ORBITAL STREAM
              </div>
              <h2 className="font-anton text-4xl sm:text-6xl text-white tracking-tight leading-none">
                BRAHMAPUTRA &amp; MONITORED DOMAINS
              </h2>
            </div>
            <p className="font-mono text-xs text-slate-400 max-w-sm">
              Hover and glide your cursor horizontally across the floating stage to pan through active radar observation canisters.
            </p>
          </div>
        </div>

        {/* 3D Floating Glide Stage with Rotating Central Emblem */}
        <FloatingGeospatialStage onSelectRegion={onLaunchMonitor} />
      </section>

      {/* =========================================================================
          CHAPTER 02 — OUR PLANET (EXPANSIVE PHOTOGRAPHIC DIVERSITY & ASYMMETRY)
          ========================================================================= */}
      <section id="planet" className="py-28 border-t border-white/10 relative bg-royal-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
          {/* Chapter Lead Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-3">
              <div className="font-mono text-xs text-yellow tracking-widest uppercase">
                CHAPTER 02 // GEOGRAPHICAL MOSAIC
              </div>
              <h2 className="font-anton text-5xl sm:text-6xl md:text-7xl text-white tracking-tight leading-none">
                A LIVING, RESTLESS <br />
                <span className="text-yellow">PLANETARY CRUST.</span>
              </h2>
            </div>
            <div className="lg:col-span-4 font-sans text-sm text-slate-300 leading-relaxed">
              From the glacial tongues of Greenland to the subterranean water tables of California&rsquo;s Central Valley, Earth operates in perpetual physical transformation.
            </div>
          </div>

          {/* Unconventional Full-Width & Staggered Photographic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Large Card 1: Himalayas High Glacier */}
            <div className="md:col-span-7 rounded-[22px] overflow-hidden border border-white/15 bg-black group relative">
              <div className="aspect-[16/10] overflow-hidden relative">
                <img
                  src={SATELLITE_PANELS[2].src}
                  alt={SATELLITE_PANELS[2].title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute top-5 left-5 bg-yellow text-black font-mono text-xs font-bold px-3 py-1 rounded-full">
                  27.98&deg; N // HIMALAYAS
                </div>
              </div>
              <div className="p-6 sm:p-8 space-y-2 bg-black border-t border-white/10">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-anton text-2xl sm:text-3xl text-white group-hover:text-yellow transition-colors">
                    HIMALAYAN GLACIAL MORAINE
                  </h3>
                  <span className="font-mono text-xs text-royal-400">ALT: 8,848M</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                  L-band microwave pulses penetrate supraglacial snowpacks and moraine debris, tracking ice-dammed lake outbursts and seasonal discharge boundaries.
                </p>
              </div>
            </div>

            {/* Asymmetrical Right Column: Amazon River Basin & Sahara */}
            <div className="md:col-span-5 space-y-6 sm:space-y-8">
              {/* Card 2: Amazon Basin */}
              <div className="rounded-[20px] overflow-hidden border border-white/15 bg-black group">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={SATELLITE_PANELS[3].src}
                    alt={SATELLITE_PANELS[3].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 bg-royal-600 text-white font-mono text-[11px] px-3 py-1 rounded-full">
                    AMAZON CANOPY
                  </div>
                </div>
                <div className="p-5 space-y-1 bg-black border-t border-white/10">
                  <div className="font-anton text-xl text-white group-hover:text-yellow transition-colors">
                    AMAZONIAN FLOODPLAIN
                  </div>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    24 cm microwave wavelengths penetrate dense tropical canopies to image floodwaters concealed beneath tree cover.
                  </p>
                </div>
              </div>

              {/* Card 3: Eye of the Sahara */}
              <div className="rounded-[20px] overflow-hidden border border-white/15 bg-black group">
                <div className="aspect-[16/9] overflow-hidden relative">
                  <img
                    src={SATELLITE_PANELS[5].src}
                    alt={SATELLITE_PANELS[5].title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 bg-yellow text-black font-mono text-[11px] font-bold px-3 py-1 rounded-full">
                    RICHAT DOME // SAHARA
                  </div>
                </div>
                <div className="p-5 space-y-1 bg-black border-t border-white/10">
                  <div className="font-anton text-xl text-white group-hover:text-yellow transition-colors">
                    STRUCTURAL GEOLOGY
                  </div>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    Hyper-arid concentric sedimentary cuestas revealing billions of years of crustal exhumation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CHAPTER 03 — REGIONS OF INTEREST (EDITORIAL GALLERY WITH DIRECT LAUNCH)
          ========================================================================= */}
      <section id="regions" className="py-28 border-t border-white/10 bg-royal-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-2">
              <div className="font-mono text-xs text-yellow tracking-widest uppercase">
                CHAPTER 03 // OPERATIONAL DOMAINS
              </div>
              <h2 className="font-anton text-5xl sm:text-6xl md:text-7xl text-white tracking-tight leading-none">
                TARGET REGIONS <br />
                <span className="text-yellow">READY FOR INSPECTION.</span>
              </h2>
            </div>
            <p className="font-sans text-sm text-slate-300 max-w-md">
              Select any monitored geographical domain to transition directly into the live radar analysis workspace.
            </p>
          </div>

          {/* 4 Primary Domain Cards (Grid Layout with Yellow/Royal Blue Interaction) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Domain 1: Brahmaputra River Corridor */}
            <div
              onClick={() => onLaunchMonitor('brahmaputra')}
              className="p-6 rounded-[20px] bg-black border border-white/15 hover:border-yellow transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:scale-[1.02] shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-royal-600/30 border border-royal-500 text-yellow flex items-center justify-center">
                    <Waves className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-yellow text-black font-bold">
                    ACTIVE
                  </span>
                </div>
                <div>
                  <h3 className="font-anton text-2xl text-white group-hover:text-yellow transition-colors">
                    BRAHMAPUTRA
                  </h3>
                  <div className="font-mono text-xs text-slate-400 mt-1">Assam, India &bull; Flooding</div>
                </div>
                <p className="font-sans text-xs text-slate-300 leading-relaxed">
                  Monsoonal river overflow and surface water displacement mapped via NISAR L2 GCOV covariance matrices.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center font-mono text-xs text-yellow">
                <span>INSPECT REGION</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>

            {/* Domain 2: San Andreas Fault Zone */}
            <div
              onClick={() => onLaunchMonitor('san_andreas_def')}
              className="p-6 rounded-[20px] bg-black border border-white/15 hover:border-yellow transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:scale-[1.02] shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-royal-600/30 border border-royal-500 text-yellow flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-yellow text-black font-bold">
                    ACTIVE
                  </span>
                </div>
                <div>
                  <h3 className="font-anton text-2xl text-white group-hover:text-yellow transition-colors">
                    SAN ANDREAS
                  </h3>
                  <div className="font-mono text-xs text-slate-400 mt-1">California, USA &bull; Strain</div>
                </div>
                <p className="font-sans text-xs text-slate-300 leading-relaxed">
                  Sub-centimeter interferometric phase coherence tracking along active strike-slip crustal faults.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center font-mono text-xs text-yellow">
                <span>INSPECT REGION</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>

            {/* Domain 3: Jakobshavn Glacial Catchment */}
            <div
              onClick={() => onLaunchMonitor('jakobshavn_cryo')}
              className="p-6 rounded-[20px] bg-black border border-white/15 hover:border-yellow transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:scale-[1.02] shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-royal-600/30 border border-royal-500 text-yellow flex items-center justify-center">
                    <Mountain className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-yellow text-black font-bold">
                    ACTIVE
                  </span>
                </div>
                <div>
                  <h3 className="font-anton text-2xl text-white group-hover:text-yellow transition-colors">
                    JAKOBSHAVN
                  </h3>
                  <div className="font-mono text-xs text-slate-400 mt-1">Greenland &bull; Ice Flow</div>
                </div>
                <p className="font-sans text-xs text-slate-300 leading-relaxed">
                  Terminal ice discharge velocities and calving dynamics tracked across 12-day orbital intervals.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center font-mono text-xs text-yellow">
                <span>INSPECT REGION</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>

            {/* Domain 4: San Joaquin Agricultural Zone */}
            <div
              onClick={() => onLaunchMonitor('central_valley_ag')}
              className="p-6 rounded-[20px] bg-black border border-white/15 hover:border-yellow transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:scale-[1.02] shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-royal-600/30 border border-royal-500 text-yellow flex items-center justify-center">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-yellow text-black font-bold">
                    ACTIVE
                  </span>
                </div>
                <div>
                  <h3 className="font-anton text-2xl text-white group-hover:text-yellow transition-colors">
                    CENTRAL VALLEY
                  </h3>
                  <div className="font-mono text-xs text-slate-400 mt-1">California &bull; Soil Moisture</div>
                </div>
                <p className="font-sans text-xs text-slate-300 leading-relaxed">
                  Dielectric permittivity shifts in topsoil and crop biomass variation detected through radar attenuation.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center font-mono text-xs text-yellow">
                <span>INSPECT REGION</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CHAPTER 04 — THE TECHNOLOGY (SWISS TYPOGRAPHY & DETERMINISTIC RADAR PIPELINE)
          ========================================================================= */}
      <section id="technology" className="py-28 border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-3">
              <div className="font-mono text-xs text-yellow tracking-widest uppercase">
                CHAPTER 04 // PHYSICAL METHODOLOGY
              </div>
              <h2 className="font-anton text-5xl sm:text-6xl md:text-7xl text-white tracking-tight leading-none">
                MICROWAVE PHYSICS. <br />
                <span className="text-yellow">ZERO HALLUCINATIONS.</span>
              </h2>
            </div>
            <div className="lg:col-span-4 font-sans text-sm text-slate-300 leading-relaxed">
              TerraScan abandons black-box approximations. Our engine relies strictly on rigorous radiometric calibration, log-ratio backscatter thresholding, and polygonized topology.
            </div>
          </div>

          {/* 5-Stage Deterministic Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-6 rounded-[18px] bg-royal-950/60 border border-white/10 hover:border-yellow transition-all space-y-3">
              <div className="font-anton text-3xl text-yellow">01</div>
              <h3 className="font-anton text-lg text-white">ORBITAL INGEST</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Ingest repeat-pass NISAR L-band dual-pol (HH/HV) geocoded covariance (GCOV) matrices.
              </p>
            </div>

            <div className="p-6 rounded-[18px] bg-royal-950/60 border border-white/10 hover:border-yellow transition-all space-y-3">
              <div className="font-anton text-3xl text-yellow">02</div>
              <h3 className="font-anton text-lg text-white">CO-REGISTRATION</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Sub-pixel alignment of baseline t₀ and event t₁ radar scenes with orbital ephemeris correction.
              </p>
            </div>

            <div className="p-6 rounded-[18px] bg-royal-950/60 border border-white/10 hover:border-yellow transition-all space-y-3">
              <div className="font-anton text-3xl text-yellow">03</div>
              <h3 className="font-anton text-lg text-white">DECIBEL RATIO</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Computation of logarithmic backscatter differences: &Delta;&sigma;&deg; = 10 log₁₀(t₁ / t₀).
              </p>
            </div>

            <div className="p-6 rounded-[18px] bg-royal-950/60 border border-white/10 hover:border-yellow transition-all space-y-3">
              <div className="font-anton text-3xl text-yellow">04</div>
              <h3 className="font-anton text-lg text-white">POLYGONIZATION</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Connected-component clustering and topological GeoJSON boundary extraction.
              </p>
            </div>

            <div className="p-6 rounded-[18px] bg-royal-950/60 border border-white/10 hover:border-yellow transition-all space-y-3">
              <div className="font-anton text-3xl text-yellow">05</div>
              <h3 className="font-anton text-lg text-white">DECISION SUPPORT</h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Transparent physical statistics formatted directly for civil protection and emergency responders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CHAPTER 05 — FINAL EXPERIENCE & PROJECT TEAM
          ========================================================================= */}
      <section id="contact" className="py-28 border-t border-white/10 relative bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-20">
          {/* Monumental Call to Action */}
          <div className="p-8 sm:p-14 rounded-[28px] bg-royal-600 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl z-10">
              <div className="font-mono text-xs uppercase tracking-widest text-yellow font-bold">
                CHAPTER 05 // EMBARK INTO ORBIT
              </div>
              <h2 className="font-anton text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-none">
                STEP INTO THE RADAR STREAM.
              </h2>
              <p className="text-slate-200 text-sm sm:text-base font-sans">
                Experience real multi-temporal Earth observation radar analytics without paywalls or proprietary vendor lock-in.
              </p>
            </div>

            <button
              onClick={() => onLaunchMonitor()}
              className="z-10 px-10 py-5 rounded-full bg-yellow hover:bg-yellow-300 text-black font-anton text-lg sm:text-xl tracking-wider shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 shrink-0"
            >
              LAUNCH MONITOR &rarr;
            </button>

            {/* Background Texture Accents */}
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-yellow/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Project Team & NASA Space Apps Citation */}
          <div className="space-y-10">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="font-mono text-xs text-yellow tracking-widest uppercase">
                CREATIVE &amp; SCIENTIFIC TEAM
              </div>
              <h3 className="font-anton text-3xl sm:text-4xl text-white tracking-tight">
                WHO BUILT TERRASCAN
              </h3>
              <p className="font-mono text-xs text-slate-400">
                NASA Space Apps Challenge 2026 &bull; Global Hackathon &bull; Dancing with the SARs
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Leader */}
              <div className="p-6 rounded-[20px] bg-royal-950/60 border border-yellow/40 hover:border-yellow transition-all flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] text-yellow font-bold px-2 py-0.5 rounded-full bg-yellow/15 border border-yellow/30">
                    TEAM LEADER
                  </span>
                  <h4 className="font-anton text-xl text-white mt-3">INZMAM</h4>
                  <p className="text-xs text-slate-300 font-sans mt-0.5">
                    Lead Architecture &amp; Engineering
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <a
                    href="mailto:modh.inzmam007@gmail.com"
                    className="font-mono text-xs text-yellow hover:underline flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>modh.inzmam007@gmail.com</span>
                  </a>
                </div>
              </div>

              {/* Anshuman */}
              <div className="p-6 rounded-[20px] bg-royal-950/60 border border-white/15 hover:border-yellow transition-all flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-300 font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    CORE MEMBER
                  </span>
                  <h4 className="font-anton text-xl text-white mt-3">ANSHUMAN</h4>
                  <p className="text-xs text-slate-300 font-sans mt-0.5">
                    Radar Analytics &amp; Pipeline
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <a
                    href="mailto:iganshumanig@gmail.com"
                    className="font-mono text-xs text-slate-300 hover:text-yellow transition-colors flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>iganshumanig@gmail.com</span>
                  </a>
                </div>
              </div>

              {/* Dhanistha */}
              <div className="p-6 rounded-[20px] bg-royal-950/60 border border-white/15 hover:border-yellow transition-all flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-300 font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    CORE MEMBER
                  </span>
                  <h4 className="font-anton text-xl text-white mt-3">DHANISTHA NANDA</h4>
                  <p className="text-xs text-slate-300 font-sans mt-0.5">
                    Research &amp; SAR Applications
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <a
                    href="mailto:dhanistha.nanda@gmail.com"
                    className="font-mono text-xs text-slate-300 hover:text-yellow transition-colors flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>dhanistha.nanda@gmail.com</span>
                  </a>
                </div>
              </div>

              {/* Anishka */}
              <div className="p-6 rounded-[20px] bg-royal-950/60 border border-white/15 hover:border-yellow transition-all flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[10px] text-slate-300 font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    CORE MEMBER
                  </span>
                  <h4 className="font-anton text-xl text-white mt-3">ANISHKA YADAV</h4>
                  <p className="text-xs text-slate-300 font-sans mt-0.5">
                    Geospatial UI &amp; Data Integration
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <a
                    href="mailto:anishkayadav2808@gmail.com"
                    className="font-mono text-xs text-slate-300 hover:text-yellow transition-colors flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>anishkayadav2808@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Minimalist Editorial Footer */}
          <footer className="pt-12 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-anton text-sm text-white">TERRASCAN</span>
              <span>&bull;</span>
              <span>NASA &bull; ISRO &bull; ESA &bull; CSA &bull; CONAE</span>
            </div>
            <div>DETERMINISTIC EARTH OBSERVATION // ZERO BLACK BOXES</div>
          </footer>
        </div>
      </section>
    </div>
  );
};