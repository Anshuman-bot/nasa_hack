import React from 'react';
import { ArrowRight, Activity } from 'lucide-react';

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
  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand / Logo (matching reference: geometric delta chevron + clean wordmark) */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3.5 cursor-pointer select-none group"
        >
          {/* Stylized Delta Logo Icon */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-8 h-8 group-hover:scale-105 transition-transform">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="60%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#a3e635" />
                </linearGradient>
              </defs>
              {/* Outer chevron */}
              <path
                d="M 20 4 L 36 34 L 28 34 L 20 18 L 12 34 L 4 34 Z"
                fill="url(#logoGrad)"
              />
              {/* Inner accent cutout notch */}
              <path
                d="M 20 22 L 25 33 L 15 33 Z"
                fill="#000000"
              />
            </svg>
          </div>

          <span className="text-xl sm:text-2xl font-semibold tracking-tight text-white font-sans">
            Terracan
          </span>
        </div>

        {/* Center Nav Links (matching reference layout: Home, Solutions, About, Contact) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => onNavigate('landing')}
            className={`relative py-2 text-sm transition-colors ${
              currentPage === 'landing'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Home</span>
            {currentPage === 'landing' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-acid-400 rounded-full"></span>
            )}
          </button>

          <a
            href="#solutions"
            onClick={(e) => {
              if (currentPage !== 'landing') {
                e.preventDefault();
                onNavigate('landing');
                setTimeout(() => {
                  document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="text-slate-400 hover:text-slate-200 py-2 transition-colors"
          >
            Solutions
          </a>

          <a
            href="#technology"
            onClick={(e) => {
              if (currentPage !== 'landing') {
                e.preventDefault();
                onNavigate('landing');
                setTimeout(() => {
                  document.getElementById('technology')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
            className="text-slate-400 hover:text-slate-200 py-2 transition-colors"
          >
            About
          </a>

          <a
            href="https://www.spaceappschallenge.org/"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-slate-200 py-2 transition-colors"
          >
            Contact
          </a>
        </nav>

        {/* Right CTA Button (matching reference: pill button with border) */}
        <div className="flex items-center gap-4">
          {/* Subtle live backend indicator */}
          <div
            title={isBackendConnected ? "FastAPI backend active (Port 8000)" : "Offline demo mode active"}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono"
          >
            <Activity className={`w-3 h-3 ${isBackendConnected ? 'text-acid-400' : 'text-amber-400'}`} />
            <span className="text-slate-300">
              {isBackendConnected ? 'API Live' : 'Demo Local'}
            </span>
          </div>

          <button
            onClick={() => onNavigate('monitor')}
            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-medium flex items-center gap-2 transition-all ${
              currentPage === 'monitor'
                ? 'bg-electric-600 text-white shadow-electric-glow'
                : 'border border-white/20 hover:border-white/40 text-white bg-transparent hover:bg-white/5'
            }`}
          >
            <span>Explore Platform</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
