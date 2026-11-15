import React, { useState } from 'react';
import { ArrowRight, Menu, X, Radio } from 'lucide-react';

interface NavbarProps {
  currentPage: 'landing' | 'monitor';
  onNavigate: (page: 'landing' | 'monitor') => void;
  isBackendConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  isBackendConnected,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToChapter = (id: string) => {
    setMobileMenuOpen(false);
    if (currentPage !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[1200] px-4 sm:px-8 py-4 sm:py-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
          {/* Brand Mark in Anton Typography */}
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group bg-black/80 backdrop-blur-xl border border-white/10 hover:border-yellow/50 px-4 py-2 rounded-full transition-all duration-300"
          >
            <div className="w-3 h-3 rounded-full bg-yellow shadow-[0_0_10px_#FFE500] group-hover:scale-125 transition-transform" />
            <span className="font-anton text-xl sm:text-2xl text-white tracking-wide group-hover:text-yellow transition-colors">
              TERRASCAN
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] text-yellow/80 bg-royal-950 px-2 py-0.5 rounded-full border border-royal-700">
              SAR L-BAND
            </span>
          </div>

          {/* Center Editorial Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-1 bg-black/85 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full shadow-2xl">
            <button
              onClick={() => scrollToChapter('hero')}
              className="px-3.5 py-1.5 rounded-full font-mono text-xs text-slate-300 hover:text-black hover:bg-yellow transition-all"
            >
              01 // EXPLORE
            </button>
            <button
              onClick={() => scrollToChapter('planet')}
              className="px-3.5 py-1.5 rounded-full font-mono text-xs text-slate-300 hover:text-black hover:bg-yellow transition-all"
            >
              02 // PLANET
            </button>
            <button
              onClick={() => scrollToChapter('dynamics')}
              className="px-3.5 py-1.5 rounded-full font-mono text-xs text-slate-300 hover:text-black hover:bg-yellow transition-all"
            >
              03 // CHANGE
            </button>
            <button
              onClick={() => scrollToChapter('regions')}
              className="px-3.5 py-1.5 rounded-full font-mono text-xs text-slate-300 hover:text-black hover:bg-yellow transition-all"
            >
              04 // REGIONS
            </button>
            <button
              onClick={() => scrollToChapter('technology')}
              className="px-3.5 py-1.5 rounded-full font-mono text-xs text-slate-300 hover:text-black hover:bg-yellow transition-all"
            >
              05 // RADAR
            </button>
            <button
              onClick={() => scrollToChapter('contact')}
              className="px-3.5 py-1.5 rounded-full font-mono text-xs text-slate-300 hover:text-black hover:bg-yellow transition-all"
            >
              06 // TEAM
            </button>
          </nav>

          {/* Right Controls: Telemetry Beacon + Launch Monitor CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Backend Telemetry status */}
            <div
              title={
                isBackendConnected
                  ? 'FastAPI backend connected (NASA CMR active)'
                  : 'Operating in deterministic local mode'
              }
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 font-mono text-[11px]"
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  isBackendConnected ? 'text-yellow animate-pulse' : 'text-royal-400'
                }`}
              />
              <span className="text-slate-300">
                {isBackendConnected ? 'TELEMETRY LIVE' : 'LOCAL ENGINE'}
              </span>
            </div>

            {/* Launch Earth Monitor Button */}
            <button
              onClick={() => onNavigate(currentPage === 'landing' ? 'monitor' : 'landing')}
              className={`px-5 py-2 sm:px-6 sm:py-2.5 rounded-full font-anton tracking-wider text-xs sm:text-sm flex items-center gap-2 transition-all duration-300 shadow-xl ${
                currentPage === 'monitor'
                  ? 'bg-yellow text-black hover:bg-yellow-300 shadow-[0_0_20px_rgba(255,229,0,0.4)]'
                  : 'bg-royal-600 hover:bg-royal-500 text-white hover:shadow-[0_0_25px_rgba(23,73,216,0.6)]'
              }`}
            >
              <span>{currentPage === 'monitor' ? 'RETURN TO ORBIT' : 'LAUNCH MONITOR'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 text-white hover:text-yellow transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Editorial Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[1150] bg-black/95 backdrop-blur-2xl flex flex-col justify-between px-6 pt-28 pb-12 transition-all duration-500 lg:hidden">
          <div className="space-y-4">
            <div className="font-mono text-xs text-yellow tracking-widest border-b border-white/10 pb-2">
              ORBITAL CHAPTER INDEX
            </div>
            <div className="flex flex-col gap-3 font-anton text-3xl sm:text-4xl text-white">
              <button
                onClick={() => scrollToChapter('hero')}
                className="text-left hover:text-yellow transition-colors flex items-center justify-between"
              >
                <span>01 // EXPLORE</span>
                <span className="font-mono text-xs text-slate-500">COVER</span>
              </button>
              <button
                onClick={() => scrollToChapter('planet')}
                className="text-left hover:text-yellow transition-colors flex items-center justify-between"
              >
                <span>02 // OUR PLANET</span>
                <span className="font-mono text-xs text-slate-500">GLOBAL</span>
              </button>
              <button
                onClick={() => scrollToChapter('dynamics')}
                className="text-left hover:text-yellow transition-colors flex items-center justify-between"
              >
                <span>03 // OBSERVE CHANGE</span>
                <span className="font-mono text-xs text-slate-500">RADAR DELTA</span>
              </button>
              <button
                onClick={() => scrollToChapter('regions')}
                className="text-left hover:text-yellow transition-colors flex items-center justify-between"
              >
                <span>04 // REGIONS OF INTEREST</span>
                <span className="font-mono text-xs text-slate-500">GEOJSON</span>
              </button>
              <button
                onClick={() => scrollToChapter('technology')}
                className="text-left hover:text-yellow transition-colors flex items-center justify-between"
              >
                <span>05 // THE TECHNOLOGY</span>
                <span className="font-mono text-xs text-slate-500">SAR PHYSICS</span>
              </button>
              <button
                onClick={() => scrollToChapter('contact')}
                className="text-left hover:text-yellow transition-colors flex items-center justify-between"
              >
                <span>06 // TEAM &amp; CONTACT</span>
                <span className="font-mono text-xs text-slate-500">CREDITS</span>
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate(currentPage === 'landing' ? 'monitor' : 'landing');
              }}
              className="w-full py-4 rounded-xl bg-yellow text-black font-anton text-lg tracking-wider text-center"
            >
              {currentPage === 'monitor' ? 'RETURN TO ORBIT' : 'LAUNCH EARTH MONITOR &rarr;'}
            </button>
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
              <span>NASA SPACE APPS 2026</span>
              <span>DANCING WITH THE SARS</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};