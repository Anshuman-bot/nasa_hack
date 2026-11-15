import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { EarthMonitorPage } from './pages/EarthMonitorPage';
import { SatelliteOrbitLoader } from './components/SatelliteOrbitLoader';
import { CustomCursor } from './components/CustomCursor';
import { DEFAULT_ANALYSIS_RESULT } from './data/mockAnalysisData';
import { checkBackendHealth, fetchDemoAnalysis } from './services/api';
import { AnalysisResult } from './types/analysis';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'monitor'>('landing');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult>(DEFAULT_ANALYSIS_RESULT);
  const [initialLocation, setInitialLocation] = useState<string>('brahmaputra');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleLaunchDomain = (locationId: string) => {
    setInitialLocation(locationId);
    setCurrentPage('monitor');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const handleNavigate = (page: 'landing' | 'monitor') => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  useEffect(() => {
    // Health check on start
    let isMounted = true;
    const initBackend = async () => {
      const isAlive = await checkBackendHealth();
      if (!isMounted) return;
      setIsBackendConnected(isAlive);

      if (isAlive) {
        const { data } = await fetchDemoAnalysis();
        if (isMounted && data) {
          setAnalysisData(data);
        }
      }
    };

    initBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-yellow selection:text-black">
      {/* Precision Custom Reticle Cursor */}
      <CustomCursor />

      {/* Cinematic Satellite Orbit 3D Loading Experience */}
      {isLoading && (
        <SatelliteOrbitLoader onComplete={() => setIsLoading(false)} />
      )}

      {/* Primary Unconventional Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isBackendConnected={isBackendConnected}
      />

      {/* Page Routing - Offset by Navbar height (h-20 = 80px) */}
      <main className="flex-1 flex flex-col pt-20">
        {currentPage === 'landing' ? (
          <LandingPage onLaunchMonitor={(locId) => handleLaunchDomain(locId || 'brahmaputra')} />
        ) : (
          <EarthMonitorPage
            initialData={analysisData}
            initialLocation={initialLocation}
            isBackendConnected={isBackendConnected}
          />
        )}
      </main>
    </div>
  );
};

export default App;