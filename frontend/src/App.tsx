import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { EarthMonitorPage } from './pages/EarthMonitorPage';
import { DEFAULT_ANALYSIS_RESULT } from './data/mockAnalysisData';
import { checkBackendHealth, fetchDemoAnalysis } from './services/api';
import { AnalysisResult } from './types/analysis';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'monitor'>('landing');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResult>(DEFAULT_ANALYSIS_RESULT);

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
    <div className="min-h-screen bg-midnight-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isBackendConnected={isBackendConnected}
      />

      {currentPage === 'landing' ? (
        <LandingPage onLaunchMonitor={() => setCurrentPage('monitor')} />
      ) : (
        <EarthMonitorPage
          initialData={analysisData}
          isBackendConnected={isBackendConnected}
        />
      )}
    </div>
  );
};

export default App;
