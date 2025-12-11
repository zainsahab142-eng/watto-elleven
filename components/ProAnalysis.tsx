import React, { useState } from 'react';
import { MatchState, AnalysisResponse } from '../types';
import { getMatchAnalysis } from '../services/geminiService';

interface ProAnalysisProps {
  matchState: MatchState;
}

const ProAnalysis: React.FC<ProAnalysisProps> = ({ matchState }) => {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setIsOpen(true);
    const result = await getMatchAnalysis(matchState);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="w-full mt-6">
      {!isOpen ? (
        <button
          onClick={handleAnalyze}
          className="w-full bg-gradient-to-r from-yellow-700/80 to-yellow-900/80 border border-yellow-600/30 hover:from-yellow-600 hover:to-yellow-800 text-yellow-100 font-mono text-sm py-4 px-6 rounded shadow-lg transform transition hover:scale-[1.01] flex items-center justify-center gap-3 group"
        >
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          REQUEST AI TACTICAL ANALYSIS
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400 group-hover:rotate-12 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </button>
      ) : (
        <div className="bg-black/60 backdrop-blur-md border border-yellow-600/30 rounded-xl p-6 relative overflow-hidden">
          {/* Decorative lines */}
          <div className="absolute top-0 left-0 w-2 h-full bg-yellow-600/20"></div>
          
          <div className="flex justify-between items-center mb-6 pl-4">
            <h3 className="text-yellow-500 font-black tracking-widest text-lg flex items-center gap-2">
              <span className="text-2xl">⚡</span> WATTO INTELLIGENCE
            </h3>
            <button 
                onClick={handleAnalyze} 
                disabled={loading}
                className="text-xs bg-yellow-900/30 border border-yellow-700 text-yellow-200 px-4 py-2 rounded hover:bg-yellow-800/50 disabled:opacity-50 uppercase tracking-wider font-mono"
            >
                {loading ? 'ANALYZING...' : 'RE-SCAN'}
            </button>
          </div>

          {loading ? (
            <div className="space-y-4 pl-4 animate-pulse">
              <div className="h-2 bg-yellow-900/30 rounded w-full"></div>
              <div className="h-2 bg-yellow-900/30 rounded w-5/6"></div>
              <div className="h-2 bg-yellow-900/30 rounded w-4/6"></div>
              <div className="mt-4 h-20 bg-yellow-900/10 rounded border border-yellow-900/20"></div>
            </div>
          ) : analysis ? (
            <div className="space-y-5 pl-4">
              <div className="bg-gradient-to-r from-gray-900 to-transparent p-4 rounded-r-lg border-l-2 border-yellow-500">
                <p className="text-gray-300 italic text-sm font-serif">"{analysis.commentary}"</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900/40 p-4 rounded border border-gray-800">
                  <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Win Probability</span>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                        style={{ width: `${analysis.winProbability}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-mono font-bold text-lg">{analysis.winProbability}%</span>
                  </div>
                </div>
                <div className="bg-gray-900/40 p-4 rounded border border-gray-800">
                  <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Tactical Advice</span>
                  <p className="text-yellow-100/90 text-sm mt-1 leading-relaxed">{analysis.tacticalAdvice}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-400 pl-4 font-mono text-sm">>> ERROR: Analysis Link Failed.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProAnalysis;