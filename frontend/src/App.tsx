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
        onNavigate={setCurrentPage}
        isBackendConnected={isBackendConnected}
      />

      {/* Page Routing */}
      <main className="flex-1 flex flex-col">
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