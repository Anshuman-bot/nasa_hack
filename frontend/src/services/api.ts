import { AnalysisRequest, AnalysisResult } from '../types/analysis';
import { DEFAULT_ANALYSIS_RESULT, MOCK_ANALYSIS_DATABASE } from '../data/mockAnalysisData';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  radarMission: string;
}

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    const response = await fetch(`${BACKEND_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

export const fetchDemoAnalysis = async (): Promise<{ data: AnalysisResult; isLiveBackend: boolean }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${BACKEND_URL}/api/demo-analysis`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      return { data, isLiveBackend: true };
    }
  } catch (err) {
    console.warn('Backend unavailable, falling back to bundled demo data:', err);
  }
  return { data: DEFAULT_ANALYSIS_RESULT, isLiveBackend: false };
};

export const runAnalysis = async (
  request: AnalysisRequest
): Promise<{ data: AnalysisResult; isLiveBackend: boolean }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      return { data, isLiveBackend: true };
    }
  } catch (err) {
    console.warn('Live backend query failed or offline, resolving via deterministic local analysis engine:', err);
  }

  // Fallback to deterministic local engine
  const matched = MOCK_ANALYSIS_DATABASE[request.location] || DEFAULT_ANALYSIS_RESULT;
  
  // Clone and adapt based on requested mode & dates deterministically
  const adapted: AnalysisResult = {
    ...matched,
    beforeDate: request.beforeDate,
    afterDate: request.afterDate,
    analysisMode: request.analysisMode,
    changeType: request.analysisMode === 'flood' ? 'Possible Flooding' : 'Candidate Surface Change',
    isDemoData: true,
  };

  return { data: adapted, isLiveBackend: false };
};
