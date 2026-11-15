import React from 'react';
import { 
  ArrowRight, 
  Satellite, 
  BarChart2, 
  ShieldCheck, 
  CloudRain, 
  SunMedium, 
  Clock, 
  Waves, 
  Eye, 
  GitCompare, 
  Crosshair, 
  BarChart3, 
  BrainCircuit, 
  Sprout, 
  Mountain, 
  Zap, 
  CheckCircle2, 
  Layers,
  Mail
} from 'lucide-react';

interface LandingPageProps {
  onLaunchMonitor: (locationId?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchMonitor }) => {
  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans selection:bg-electric-600 selection:text-white">
      {/* HERO SECTION (Faithful to Reference Image) */}
      <section className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-between overflow-hidden px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8 sm:pt-14 pb-12">
        {/* Main Content Split: Left Copy & Right Earth Globe */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center flex-1">
          {/* Left Column (Text & CTAs) */}
          <div className="lg:col-span-6 z-10 space-y-6 pt-4 sm:pt-8">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-acid-400 shadow-acid-glow"></span>
              <span>Geospatial Intelligence Platform</span>
            </div>

            {/* Main Headline (Exact phrasing from reference) */}
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-sans leading-[1.08]">
              Terracan<br />
              See Deeper. <span className="text-electric-500">Plan Smarter</span><span className="text-acid-400">.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-400 max-w-xl font-normal leading-relaxed">
              Advanced satellite insights for a safer, smarter and more secure tomorrow.
            </p>

            {/* Contextual Space Apps NISAR note */}
            <p className="text-xs text-slate-500 max-w-lg leading-normal font-sans">
              Transforming NASA–ISRO NISAR synthetic aperture radar (SAR) microwave observations into high-precision surface-change intelligence.
            </p>

            {/* CTA Button (Matching reference: Blue pill with arrow) */}
            <div className="pt-2">
              <button
                onClick={() => onLaunchMonitor()}
                className="px-8 py-3.5 rounded-full bg-electric-600 hover:bg-electric-500 text-white font-medium text-sm sm:text-base flex items-center gap-2.5 shadow-electric-glow transition-all hover:gap-3.5 active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Right Column: High-fidelity Curved Earth Globe from Reference */}
          <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end select-none">
            {/* Ambient atmospheric glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/3 -translate-y-1/2 w-[380px] sm:w-[520px] h-[380px] sm:h-[520px] bg-electric-600/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative w-full max-w-[560px] aspect-[4/3] rounded-2xl overflow-hidden">
              <img
                src="/earth-globe.png"
                alt="Earth night view from orbit with glowing city lights"
                className="w-full h-full object-cover object-center scale-105"
              />
              {/* Subtle edge blend overlay to seamlessly melt into pure black background */}
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent pointer-events-none"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* BOTTOM FEATURE BAR (Exact 3-column structure from reference image) */}
        <div className="pt-12 sm:pt-16 mt-8 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1: Real-Time Insights */}
            <div className="flex items-center gap-4.5 p-2 md:border-r md:border-white/10 last:border-0">
              <div className="w-11 h-11 rounded-lg bg-electric-600/15 border border-electric-500/25 flex items-center justify-center text-electric-400 shrink-0">
                <Satellite className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">Real-Time Insights</h3>
                <p className="text-xs text-slate-400 mt-0.5">From space to your screen</p>
              </div>
            </div>

            {/* Feature 2: Actionable Analytics */}
            <div className="flex items-center gap-4.5 p-2 md:border-r md:border-white/10 last:border-0">
              <div className="w-11 h-11 rounded-lg bg-electric-600/15 border border-electric-500/25 flex items-center justify-center text-electric-400 shrink-0">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">Actionable Analytics</h3>
                <p className="text-xs text-slate-400 mt-0.5">Turn data into decisions</p>
              </div>
            </div>

            {/* Feature 3: Mission-Driven */}
            <div className="flex items-center gap-4.5 p-2">
              <div className="w-11 h-11 rounded-lg bg-electric-600/15 border border-electric-500/25 flex items-center justify-center text-electric-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">Mission-Driven</h3>
                <p className="text-xs text-slate-400 mt-0.5">Built for a safer tomorrow</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHY SYNTHETIC APERTURE RADAR (Sleek SaaS Cards) */}
      <section id="technology" className="py-24 border-t border-white/10 bg-midnight-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-acid-400 uppercase tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-acid-400"></span>
              <span>Physical Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Why Synthetic Aperture Radar?
            </h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base leading-relaxed">
              Unlike optical satellites blinded by weather and nocturnal cycles, active microwave radar penetrates darkness and atmosphere to illuminate Earth&rsquo;s physical surface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-electric-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-electric-600/20 text-electric-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <SunMedium className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Works day and night</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Emits active microwave pulses independent of solar illumination for continuous 24/7 global surveillance.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-electric-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-electric-600/20 text-electric-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <CloudRain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Observes through clouds</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                L-band microwaves (24 cm wavelength) penetrate dense storm clouds, heavy monsoon rain, and smoke.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-electric-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-electric-600/20 text-electric-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Waves className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Dynamic surface contrast</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Smooth water scatters radar specularly away, generating sharp dark boundaries against rough ground terrain.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-electric-500/50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-electric-600/20 text-electric-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Repeat-pass monitoring</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Precise 12-day orbital cycles enable rigorous baseline comparison and quantitative multi-temporal change detection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW TERRASCAN WORKS (5-Stage Pipeline) */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-electric-400 uppercase tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-electric-400"></span>
              <span>Scientific Methodology</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              How TerraScan Works
            </h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base leading-relaxed">
              A 5-stage deterministic pipeline translating complex SAR backscatter matrices into verified geospatial intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all">
              <div className="text-xs font-mono text-acid-400 mb-3">01 / ACQUISITION</div>
              <div className="flex items-center gap-2 text-white font-medium mb-2">
                <Eye className="w-4 h-4 text-electric-400" />
                <span>Observe</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingest repeat-pass NISAR L-band dual-pol (HH/HV) geocoded covariance (GCOV) radar scenes.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all">
              <div className="text-xs font-mono text-acid-400 mb-3">02 / CO-REGISTRATION</div>
              <div className="flex items-center gap-2 text-white font-medium mb-2">
                <GitCompare className="w-4 h-4 text-electric-400" />
                <span>Compare</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Co-register baseline t₀ and event t₁ grids, computing log-ratio decibel deltas (Δσ⁰).
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all">
              <div className="text-xs font-mono text-acid-400 mb-3">03 / THRESHOLDING</div>
              <div className="flex items-center gap-2 text-white font-medium mb-2">
                <Crosshair className="w-4 h-4 text-acid-400" />
                <span>Detect</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter radar speckle noise and apply bimodal thresholding to isolate candidate surface disturbance.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all">
              <div className="text-xs font-mono text-acid-400 mb-3">04 / POLYGONIZATION</div>
              <div className="flex items-center gap-2 text-white font-medium mb-2">
                <BarChart3 className="w-4 h-4 text-electric-400" />
                <span>Quantify</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extract connected GeoJSON boundaries, calculating inundated square kilometers and percentage deviation.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all">
              <div className="text-xs font-mono text-acid-400 mb-3">05 / DECISION SUPPORT</div>
              <div className="flex items-center gap-2 text-white font-medium mb-2">
                <BrainCircuit className="w-4 h-4 text-electric-400" />
                <span>Understand</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Synthesize transparent physics metrics and conservative intelligence for emergency authorities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: SOLUTIONS & ROADMAP */}
      <section id="solutions" className="py-24 border-t border-white/10 bg-midnight-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-acid-400 uppercase tracking-widest">
                <Layers className="w-3.5 h-3.5" />
                <span>Extensible Surface Change Platform</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                From Local Inundation to Planetary Scale Monitoring
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Engineered for rapid flood response today, the TerraScan architecture is structured with clean service boundaries to ingest multi-frequency SAR for global environmental tracking.
              </p>
              
              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-acid-400 mt-1 shrink-0" />
                  <p className="text-sm text-slate-300">
                    <strong className="text-white">Hydrology & Wetlands:</strong> Sub-canopy water detection leveraging NISAR L-band forest canopy penetration.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-acid-400 mt-1 shrink-0" />
                  <p className="text-sm text-slate-300">
                    <strong className="text-white">Agriculture & Soil Moisture:</strong> Soil dielectric permittivity tracking for drought and irrigation anomalies.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-acid-400 mt-1 shrink-0" />
                  <p className="text-sm text-slate-300">
                    <strong className="text-white">Cryosphere & Geohazards:</strong> Glacier velocity tracking and millimeter-scale InSAR ground deformation.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => onLaunchMonitor()}
                  className="px-6 py-2.5 rounded-full border border-white/20 hover:border-white/40 text-sm font-medium text-white flex items-center gap-2 hover:bg-white/5 transition-all"
                >
                  <span>Launch Earth Monitor</span>
                  <ArrowRight className="w-4 h-4 text-acid-400" />
                </button>
              </div>
            </div>

            {/* Application Cards Grid — All 4 Domains Live & Interactive */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Domain 1: Floods & Water */}
              <div 
                onClick={() => onLaunchMonitor('brahmaputra')}
                className="p-5 rounded-2xl bg-white/[0.03] border border-electric-500/40 hover:border-electric-400 relative overflow-hidden cursor-pointer group transition-all hover:bg-white/[0.06] hover:scale-[1.02] shadow-lg hover:shadow-electric-950/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center text-electric-400 group-hover:bg-electric-500/20 transition-colors">
                    <Waves className="w-5 h-5 text-electric-400" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ACTIVE
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white group-hover:text-electric-300 transition-colors flex items-center justify-between">
                  <span>Floods & Water</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-electric-400" />
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Surface inundation, river overflows, and specular attenuation mapping via NISAR L2 GCOV.
                </p>
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Assam & Mississippi</span>
                  <span className="text-electric-400">Launch &rarr;</span>
                </div>
              </div>

              {/* Domain 2: Agriculture */}
              <div 
                onClick={() => onLaunchMonitor('central_valley_ag')}
                className="p-5 rounded-2xl bg-white/[0.03] border border-emerald-500/40 hover:border-emerald-400 relative overflow-hidden cursor-pointer group transition-all hover:bg-white/[0.06] hover:scale-[1.02] shadow-lg hover:shadow-emerald-950/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                    <Sprout className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ACTIVE
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                  <span>Agriculture</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-emerald-400" />
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Crop growth phenology, soil saturation, and vegetation biomass variation via NISAR L3 SME2.
                </p>
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>San Joaquin Valley</span>
                  <span className="text-emerald-400">Launch &rarr;</span>
                </div>
              </div>

              {/* Domain 3: Cryosphere */}
              <div 
                onClick={() => onLaunchMonitor('jakobshavn_cryo')}
                className="p-5 rounded-2xl bg-white/[0.03] border border-cyan-500/40 hover:border-cyan-400 relative overflow-hidden cursor-pointer group transition-all hover:bg-white/[0.06] hover:scale-[1.02] shadow-lg hover:shadow-cyan-950/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                    <Mountain className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    ACTIVE
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                  <span>Cryosphere</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-cyan-400" />
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Glacial terminus retreat, ice sheet velocity flow, and seasonal melt tracked via polarimetric SAR.
                </p>
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Jakobshavn Isbræ</span>
                  <span className="text-cyan-400">Launch &rarr;</span>
                </div>
              </div>

              {/* Domain 4: Deformation */}
              <div 
                onClick={() => onLaunchMonitor('san_andreas_def')}
                className="p-5 rounded-2xl bg-white/[0.03] border border-purple-500/40 hover:border-purple-400 relative overflow-hidden cursor-pointer group transition-all hover:bg-white/[0.06] hover:scale-[1.02] shadow-lg hover:shadow-purple-950/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400 border border-purple-400/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                    ACTIVE
                  </span>
                </div>
                <h4 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors flex items-center justify-between">
                  <span>Deformation</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-purple-400" />
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Interferometric phase correlation for seismic fault creep and subsidence via NISAR L2 GUNW.
                </p>
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>San Andreas Fault</span>
                  <span className="text-purple-400">Launch &rarr;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT & TEAM SECTION */}
      <section id="contact" className="py-24 border-t border-white/5 relative bg-gradient-to-b from-black to-slate-950/60 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 border border-electric-500/20 text-electric-400 text-xs font-mono uppercase tracking-wider mb-4">
              Get in Touch &bull; Project Team
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Connect With Us
            </h2>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              NASA Space Apps Challenge 2026 — <em>Dancing with the SARs</em>. Reach out to the core engineering and research team behind TerraScan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Team Leader Card */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-electric-500/40 relative overflow-hidden group hover:border-electric-500/70 transition-all flex flex-col justify-between shadow-lg shadow-electric-950/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-electric-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-electric-500/20 text-electric-300 border border-electric-500/40 font-semibold">
                    TEAM LEADER
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">Inzmam</h3>
                <p className="text-xs text-slate-400 mt-1">Lead Architecture &amp; Engineering</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                <a
                  href="mailto:modh.inzmam007@gmail.com"
                  className="text-xs font-mono text-electric-400 hover:text-electric-300 break-all transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span>modh.inzmam007@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Member 1: Anshuman */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    TEAM MEMBER
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">Anshuman</h3>
                <p className="text-xs text-slate-400 mt-1">Radar Analytics &amp; Pipeline</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                <a
                  href="mailto:iganshumanig@gmail.com"
                  className="text-xs font-mono text-slate-300 group-hover:text-acid-400 break-all transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-acid-400" />
                  <span>iganshumanig@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Member 2: Dhanistha Nanda */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    TEAM MEMBER
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">Dhanistha Nanda</h3>
                <p className="text-xs text-slate-400 mt-1">Research &amp; SAR Applications</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                <a
                  href="mailto:dhanistha.nanda@gmail.com"
                  className="text-xs font-mono text-slate-300 group-hover:text-acid-400 break-all transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-acid-400" />
                  <span>dhanistha.nanda@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Member 3: Anishka Yadav */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    TEAM MEMBER
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">Anishka Yadav</h3>
                <p className="text-xs text-slate-400 mt-1">Geospatial UI &amp; Data Integration</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                <a
                  href="mailto:anishkayadav2808@gmail.com"
                  className="text-xs font-mono text-slate-300 group-hover:text-acid-400 break-all transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-acid-400" />
                  <span>anishkayadav2808@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER (Minimalist, human-built aesthetic) */}
      <footer className="py-12 border-t border-white/10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-semibold text-white">TerraScan</span>
              <span>&bull;</span>
              <span>NASA Space Apps Challenge 2026 &bull; Dancing with the SARs</span>
            </div>

            <div className="flex items-center gap-6 text-slate-400">
              <span>Free Local Stack</span>
              <span>No Paid APIs</span>
              <span>100% Deterministic Engine</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
