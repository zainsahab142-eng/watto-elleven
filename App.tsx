import React, { useState, useEffect } from 'react';
import HackerLogin from './components/HackerLogin';
import ScoreBoard from './components/ScoreBoard';
import MatchSetup from './components/MatchSetup';
import MatchHistory from './components/MatchHistory';
import { MatchState } from './types';

type View = 'login' | 'menu' | 'setup' | 'scoreboard' | 'history';

const App: React.FC = () => {
  const [view, setView] = useState<View>('login');
  const [activeMatch, setActiveMatch] = useState<MatchState | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load active match from local storage on mount if exists
  useEffect(() => {
    const saved = localStorage.getItem('wato_active_match');
    if (saved) {
      try {
        setActiveMatch(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load match", e);
      }
    }
  }, []);

  const handleMatchStart = (matchData: MatchState) => {
    setActiveMatch(matchData);
    localStorage.setItem('wato_active_match', JSON.stringify(matchData));
    setView('scoreboard');
  };

  const handleMatchEnd = () => {
    localStorage.removeItem('wato_active_match');
    setView('menu');
    setActiveMatch(null);
  };

  const renderContent = () => {
    switch (view) {
      case 'login':
        return <HackerLogin onLoginSuccess={() => setView('menu')} />;
      
      case 'menu':
        return (
          <div className={`min-h-screen flex flex-col items-center justify-center p-4 space-y-6 ${isDarkMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-4 text-center">
              WATTO <span className="text-green-600">ELEVEN</span>
            </h1>
            
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-4 py-2 rounded-full font-bold text-sm border flex items-center gap-2 mb-4 ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isDarkMode ? '🌙 DARK MODE' : '☀️ LIGHT MODE'}
            </button>
            
            <div className="w-full max-w-md space-y-4">
              <button 
                onClick={() => setView('setup')}
                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-xl tracking-widest clip-path-polygon transition-all transform hover:scale-105 shadow-lg"
                style={{ clipPath: 'polygon(5% 0, 100% 0, 100% 80%, 95% 100%, 0 100%, 0 20%)' }}
              >
                START NEW MATCH
              </button>

              {activeMatch && activeMatch.status === 'live' && (
                <button 
                  onClick={() => setView('scoreboard')}
                  className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xl tracking-widest clip-path-polygon transition-all transform hover:scale-105 shadow-lg"
                  style={{ clipPath: 'polygon(5% 0, 100% 0, 100% 80%, 95% 100%, 0 100%, 0 20%)' }}
                >
                  RESUME MATCH
                </button>
              )}

              <button 
                onClick={() => setView('history')}
                className={`w-full py-4 font-bold text-xl tracking-widest border transition-all transform hover:scale-105 ${
                    isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-green-500 border-green-900' 
                    : 'bg-white hover:bg-gray-50 text-green-700 border-gray-300 shadow-sm'
                }`}
              >
                MATCH HISTORY
              </button>
            </div>
            
            <div className={`mt-8 text-xs font-mono ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                v2.1 PRO | WATTO SPORTS
            </div>
          </div>
        );

      case 'setup':
        return <MatchSetup isDarkMode={isDarkMode} onStartMatch={handleMatchStart} onBack={() => setView('menu')} />;

      case 'history':
        return <MatchHistory isDarkMode={isDarkMode} onBack={() => setView('menu')} />;

      case 'scoreboard':
        return activeMatch ? (
          <ScoreBoard 
            isDarkMode={isDarkMode}
            initialState={activeMatch} 
            onMatchEnd={handleMatchEnd}
            onBack={() => setView('menu')}
          />
        ) : (
          <div>Error: No active match</div>
        );
        
      default:
        return <div>Unknown View</div>;
    }
  };

  return (
    <div className={`antialiased font-sans min-h-screen ${isDarkMode ? 'bg-black text-white selection:bg-green-500 selection:text-black' : 'bg-gray-100 text-gray-900 selection:bg-green-200 selection:text-black'}`}>
      {renderContent()}
    </div>
  );
};

export default App;