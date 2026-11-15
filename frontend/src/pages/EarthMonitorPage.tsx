import React, { useState } from 'react';
import { AnalysisResult, AnalysisMode, LayerVisibility } from '../types/analysis';
import { MONITORED_LOCATIONS } from '../data/mockAnalysisData';
import { runAnalysis } from '../services/api';
import { AnalysisControls } from '../components/AnalysisControls';
import { MapViewer } from '../components/MapViewer';
import { AnalysisSummaryCards } from '../components/AnalysisSummaryCards';
import { ComparisonViewer } from '../components/ComparisonViewer';
import { ChangeHeatmapViewer } from '../components/ChangeHeatmapViewer';
import { ChangeTimelineChart } from '../components/ChangeTimelineChart';
import { TerraScanInsight } from '../components/TerraScanInsight';
import { ScientificTransparency } from '../components/ScientificTransparency';
import { WifiOff } from 'lucide-react';

interface EarthMonitorPageProps {
  initialData: AnalysisResult;
  initialLocation?: string;
  isBackendConnected: boolean;
}

export const EarthMonitorPage: React.FC<EarthMonitorPageProps> = ({
  initialData,
  initialLocation,
  isBackendConnected,
}) => {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult>(initialData);
  const [selectedLocation, setSelectedLocation] = useState<string>(initialLocation || initialData.locationCode);
  const [beforeDate, setBeforeDate] = useState<string>(initialData.beforeDate);
  const [afterDate, setAfterDate] = useState<string>(initialData.afterDate);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(initialData.analysisMode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comparison' | 'heatmap'>('comparison');

  const [layers, setLayers] = useState<LayerVisibility>({
    baseMap: true,
    beforeLayer: false,
    afterLayer: false,
    detectedChange: true,
  });

  // Run initial analysis on mount or whenever initialLocation changes from Landing Page selection
  React.useEffect(() => {
    if (initialLocation) {
      handleLocationChange(initialLocation);
    }
  }, [initialLocation]);

  const getDateError = (): string | null => {
    if (!beforeDate || !afterDate) return 'Both observation dates are required.';
    if (new Date(beforeDate) >= new Date(afterDate)) {
      return 'Pre-event date must precede post-event observation date.';
    }
    return null;
  };

  const handleLocationChange = (newLocId: string) => {
    setSelectedLocation(newLocId);
    const loc = MONITORED_LOCATIONS.find((l) => l.id === newLocId);
    if (loc) {
      // Auto-switch analysis mode to match domain if selecting a specialized testbed
      let targetMode = analysisMode;
      if (newLocId === 'central_valley_ag') targetMode = 'agriculture';
      else if (newLocId === 'jakobshavn_cryo') targetMode = 'cryosphere';
      else if (newLocId === 'san_andreas_def') targetMode = 'deformation';
      else if (newLocId === 'brahmaputra' || newLocId === 'mississippi') targetMode = 'flood';

      if (targetMode !== analysisMode) {
        setAnalysisMode(targetMode);
      }

      setCurrentAnalysis((prev) => ({
        ...prev,
        location: loc.name,
        locationCode: loc.id,
        centerCoordinates: loc.coordinates,
        zoomLevel: loc.defaultZoom,
      }));

      // Immediately trigger analysis refresh so data updates without needing a manual click
      runAnalysis({
        location: newLocId,
        beforeDate,
        afterDate,
        analysisMode: targetMode,
      })
        .then((res) => setCurrentAnalysis(res.data))
        .catch((err) => console.warn('Location switch auto-fetch failed:', err));
    }
  };

  const handleLayerToggle = (layer: keyof LayerVisibility) => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  const handleRunAnalysis = async () => {
    const error = getDateError();
    if (error) return;

    setIsLoading(true);
    setRunError(null);
    try {
      const response = await runAnalysis({
        location: selectedLocation,
        beforeDate,
        afterDate,
        analysisMode,
      });
      setCurrentAnalysis(response.data);
    } catch (err) {
      console.error('Analysis failed:', err);
      setRunError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col bg-black text-slate-100 font-sans">
      {/* Top Filter & Trigger Controls Bar */}
      <AnalysisControls
        location={selectedLocation}
        onLocationChange={handleLocationChange}
        beforeDate={beforeDate}
        onBeforeDateChange={setBeforeDate}
        afterDate={afterDate}
        onAfterDateChange={setAfterDate}
        analysisMode={analysisMode}
        onAnalysisModeChange={setAnalysisMode}
        onRunAnalysis={handleRunAnalysis}
        isLoading={isLoading}
        dateError={getDateError()}
        dataSource={currentAnalysis.dataSource ?? (currentAnalysis.isDemoData ? 'DEMO' : 'REAL_NISAR')}
      />

      {/* Backend Status Notice if running in fallback mode */}
      {!isBackendConnected && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs font-mono text-amber-300">
          <div className="flex items-center gap-2 max-w-7xl mx-auto">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Operating in local demonstration mode. Deterministic radar testbed data is fully interactive without an active API connection.
            </span>
          </div>
        </div>
      )}

      {/* Main Mission Control Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {runError && (
          <div className="mb-4 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center justify-between">
            <span>{runError}</span>
            <button onClick={() => setRunError(null)} className="text-amber-400 hover:text-white ml-2">✕</button>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT / CENTER COLUMN: Cartography & Imagery Viewers */}
          <div className="lg:col-span-7 space-y-6">
            <MapViewer
              center={currentAnalysis.centerCoordinates}
              zoom={currentAnalysis.zoomLevel}
              layers={layers}
              onLayerToggle={handleLayerToggle}
              geoJson={currentAnalysis.geoJson}
              locationName={currentAnalysis.location}
            />

            {/* Visualizer Tab Switcher */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                    activeTab === 'comparison'
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pre vs Post SAR Swipe
                </button>
                <button
                  onClick={() => setActiveTab('heatmap')}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                    activeTab === 'heatmap'
                      ? 'bg-white/10 text-acid-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Change Heatmap & Intensity
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                Resolution: 10m Ground Sample Distance
              </span>
            </div>

            {/* Tab Content */}
            {activeTab === 'comparison' ? (
              <ComparisonViewer
                beforeDate={currentAnalysis.beforeDate}
                afterDate={currentAnalysis.afterDate}
                locationName={currentAnalysis.location}
              />
            ) : (
              <ChangeHeatmapViewer
                locationName={currentAnalysis.location}
                affectedAreaKm2={currentAnalysis.affectedAreaKm2}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Surface Change Analysis Panel */}
          <div className="lg:col-span-5 space-y-6">
            <AnalysisSummaryCards data={currentAnalysis} />
            <ChangeTimelineChart timeline={currentAnalysis.timeline} />
            <TerraScanInsight data={currentAnalysis} />
            <ScientificTransparency
              metrics={currentAnalysis.scientificMetrics}
              parameters={currentAnalysis.processingParameters}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
