import React, { useState, useEffect } from 'react';
import { MatchState, PlayerStats, Team } from '../types';

interface MatchHistoryProps {
  onBack: () => void;
  isDarkMode: boolean;
}

type Tab = 'summary' | 'teamA' | 'teamB';

const MatchHistory: React.FC<MatchHistoryProps> = ({ onBack, isDarkMode }) => {
  const [history, setHistory] = useState<MatchState[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchState | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  
  const [deleteAllStep, setDeleteAllStep] = useState(0); 
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState(0);

  const bgMain = isDarkMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-900';
  const bgCard = isDarkMode ? 'bg-gray-900 border-green-900' : 'bg-white border-gray-200';
  const textMuted = isDarkMode ? 'text-gray-500' : 'text-gray-500';

  useEffect(() => {
    const saved = localStorage.getItem('wato_history');
    if (saved) {
        try {
            setHistory(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse history", e);
        }
    }
  }, []);

  const handleClearAll = () => {
      if (deleteAllStep === 0) setDeleteAllStep(1);
      else if (deleteAllStep === 1) setDeleteAllStep(2);
      else {
          localStorage.removeItem('wato_history');
          setHistory([]);
          setDeleteAllStep(0);
      }
  };

  const handleDeleteSingle = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (deleteId !== id) {
          setDeleteId(id);
          setDeleteStep(1);
          return;
      }
      if (deleteStep === 1) setDeleteStep(2);
      else if (deleteStep === 2) {
          const newHistory = history.filter(m => m.id !== id);
          localStorage.setItem('wato_history', JSON.stringify(newHistory));
          setHistory(newHistory);
          setDeleteId(null);
          setDeleteStep(0);
      }
  };

  const getDeleteLabel = (step: number) => {
      if (step === 1) return "CONFIRM?";
      if (step === 2) return "SURE?";
      return "DEL";
  };

  const openMatchDetails = (match: MatchState) => {
      // Guard for old history format which might not have full MatchState
      if (!match.battingTeam || !match.bowlingTeam) {
          alert("Detailed statistics unavailable for this legacy record.");
          return;
      }
      setSelectedMatch(match);
      setActiveTab('summary');
  };

  const getStrikeRate = (runs: number, balls: number) => balls > 0 ? ((runs/balls)*100).toFixed(0) : "0";
  const getEconomy = (runs: number, balls: number) => {
    const overs = balls / 6;
    return overs > 0 ? (runs / overs).toFixed(1) : "0.0";
  };

  // --- DETAIL VIEW COMPONENT ---
  const renderDetailView = () => {
      if (!selectedMatch) return null;
      
      const teamAData = selectedMatch.config.teamA === selectedMatch.battingTeam.name ? selectedMatch.battingTeam : selectedMatch.bowlingTeam;
      const teamBData = selectedMatch.config.teamB === selectedMatch.battingTeam.name ? selectedMatch.battingTeam : selectedMatch.bowlingTeam;
      
      const renderTeamStats = (team: Team) => {
          // SORTING LOGIC: High performance first
          const batters = [...team.players].sort((a, b) => b.runs - a.runs);
          const bowlers = [...team.players].filter(p => p.ballsBowled > 0).sort((a, b) => {
              // Sort by wickets desc, then economy asc
              if (b.wickets !== a.wickets) return b.wickets - a.wickets;
              return (a.runsConceded / (a.ballsBowled || 1)) - (b.runsConceded / (b.ballsBowled || 1));
          });

          return (
              <div className="space-y-6 relative z-10">
                  {/* Watermark in background of Stats */}
                  <div className="fixed inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
                       <h1 className="text-9xl font-black -rotate-45 text-white whitespace-nowrap">WATTO ELEVEN</h1>
                  </div>

                  {/* Batting Card */}
                  <div className="bg-gray-900/80 border border-green-900 backdrop-blur-sm p-4 relative z-10">
                      <div className="flex justify-between items-center mb-3 border-b border-green-800 pb-2">
                          <h3 className="text-xl font-black text-green-500 uppercase tracking-widest">{team.name} BATTING</h3>
                          <span className="text-xs text-gray-500 font-mono">SORTED BY RUNS</span>
                      </div>
                      <table className="w-full text-sm text-gray-300 font-mono">
                          <thead>
                              <tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase text-left">
                                  <th className="py-2">Player</th>
                                  <th className="py-2 text-right">R</th>
                                  <th className="py-2 text-right">B</th>
                                  <th className="py-2 text-right">4s</th>
                                  <th className="py-2 text-right">6s</th>
                                  <th className="py-2 text-right">SR</th>
                              </tr>
                          </thead>
                          <tbody>
                              {batters.map((p, i) => (
                                  <tr key={i} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                      <td className={`py-2 font-bold ${i === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>
                                          {p.name} {i === 0 && '👑'}
                                      </td>
                                      <td className="text-right font-bold text-white">{p.runs}</td>
                                      <td className="text-right text-gray-500">{p.balls}</td>
                                      <td className="text-right text-gray-600">{p.fours}</td>
                                      <td className="text-right text-gray-600">{p.sixes}</td>
                                      <td className="text-right text-xs text-gray-500">{getStrikeRate(p.runs, p.balls)}</td>
                                  </tr>
                              ))}
                              {batters.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-gray-600">No Batting Data</td></tr>}
                          </tbody>
                      </table>
                  </div>

                  {/* Bowling Card */}
                  <div className="bg-gray-900/80 border border-yellow-900 backdrop-blur-sm p-4 relative z-10">
                      <div className="flex justify-between items-center mb-3 border-b border-yellow-800 pb-2">
                          <h3 className="text-xl font-black text-yellow-500 uppercase tracking-widest">{team.name} BOWLING</h3>
                          <span className="text-xs text-gray-500 font-mono">SORTED BY WICKETS</span>
                      </div>
                      <table className="w-full text-sm text-gray-300 font-mono">
                          <thead>
                              <tr className="text-gray-500 border-b border-gray-800 text-[10px] uppercase text-left">
                                  <th className="py-2">Player</th>
                                  <th className="py-2 text-right">O</th>
                                  <th className="py-2 text-right">R</th>
                                  <th className="py-2 text-right">W</th>
                                  <th className="py-2 text-right">ECO</th>
                              </tr>
                          </thead>
                          <tbody>
                              {bowlers.map((p, i) => (
                                  <tr key={i} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                      <td className={`py-2 font-bold ${i === 0 ? 'text-green-400' : 'text-gray-300'}`}>
                                          {p.name} {i === 0 && '🎯'}
                                      </td>
                                      <td className="text-right text-gray-400">{p.overs}</td>
                                      <td className="text-right font-bold text-white">{p.runsConceded}</td>
                                      <td className="text-right font-bold text-green-500">{p.wickets}</td>
                                      <td className="text-right text-xs text-gray-500">{getEconomy(p.runsConceded, p.ballsBowled)}</td>
                                  </tr>
                              ))}
                               {bowlers.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-gray-600">No Bowling Data</td></tr>}
                          </tbody>
                      </table>
                  </div>
              </div>
          )
      }

      return (
          <div className="fixed inset-0 z-50 bg-black overflow-y-auto animate-fadeIn">
              <div className="min-h-screen flex flex-col">
                  {/* Header */}
                  <div className="sticky top-0 z-50 bg-black/95 border-b border-green-900 p-4 flex items-center justify-between backdrop-blur-md">
                      <button onClick={() => setSelectedMatch(null)} className="flex items-center gap-2 text-gray-400 hover:text-white uppercase font-bold text-sm">
                          <span>❮</span> RETURN
                      </button>
                      <div className="text-center">
                           <div className="text-[10px] text-green-600 tracking-[0.3em] font-black">WATTO STATS ENGINE</div>
                           <div className="text-white font-bold">{selectedMatch.config.teamA} vs {selectedMatch.config.teamB}</div>
                      </div>
                      <div className="w-16"></div>
                  </div>

                  {/* Tabs */}
                  <div className="flex bg-gray-900 border-b border-gray-800">
                      <button onClick={() => setActiveTab('summary')} className={`flex-1 py-4 text-xs font-black tracking-widest uppercase transition-colors ${activeTab === 'summary' ? 'bg-green-600 text-black' : 'text-gray-500 hover:bg-gray-800'}`}>
                          SUMMARY
                      </button>
                      <button onClick={() => setActiveTab('teamA')} className={`flex-1 py-4 text-xs font-black tracking-widest uppercase transition-colors ${activeTab === 'teamA' ? 'bg-green-600 text-black' : 'text-gray-500 hover:bg-gray-800'}`}>
                          {selectedMatch.config.teamA}
                      </button>
                      <button onClick={() => setActiveTab('teamB')} className={`flex-1 py-4 text-xs font-black tracking-widest uppercase transition-colors ${activeTab === 'teamB' ? 'bg-green-600 text-black' : 'text-gray-500 hover:bg-gray-800'}`}>
                          {selectedMatch.config.teamB}
                      </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 relative">
                       {/* Background Watermark */}
                       <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none overflow-hidden">
                           <h1 className="text-[150px] font-black -rotate-12 text-green-500 whitespace-nowrap">WATTO ELEVEN</h1>
                       </div>

                       {activeTab === 'summary' && (
                           <div className="space-y-6 relative z-10 max-w-lg mx-auto mt-10 text-center">
                               <div className="p-8 border-2 border-green-600 bg-gray-900/80 backdrop-blur-md">
                                   <div className="text-gray-500 tracking-[0.5em] text-xs mb-4">MATCH RESULT</div>
                                   <div className="text-4xl md:text-5xl font-black text-white leading-tight mb-2">{selectedMatch.winner}</div>
                                   <div className="text-green-500 font-mono text-xl">{selectedMatch.winMargin}</div>
                               </div>
                               
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="p-4 bg-gray-900 border border-gray-800">
                                       <div className="text-xs text-gray-500 mb-1">{selectedMatch.battingTeam.name}</div>
                                       <div className="text-2xl font-mono font-bold">{selectedMatch.battingTeam.score}/{selectedMatch.battingTeam.wickets}</div>
                                       <div className="text-xs text-gray-600">{selectedMatch.battingTeam.oversPlayed} Overs</div>
                                   </div>
                                   <div className="p-4 bg-gray-900 border border-gray-800">
                                       <div className="text-xs text-gray-500 mb-1">{selectedMatch.bowlingTeam.name}</div>
                                       <div className="text-2xl font-mono font-bold">{selectedMatch.bowlingTeam.score}/{selectedMatch.bowlingTeam.wickets}</div>
                                       <div className="text-xs text-gray-600">{selectedMatch.bowlingTeam.oversPlayed} Overs</div>
                                   </div>
                               </div>
                               <div className="text-gray-600 text-xs font-mono mt-8">MATCH ID: {selectedMatch.id}</div>
                           </div>
                       )}

                       {activeTab === 'teamA' && renderTeamStats(teamAData)}
                       {activeTab === 'teamB' && renderTeamStats(teamBData)}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className={`min-h-screen p-6 ${bgMain} font-mono`}>
      {selectedMatch ? renderDetailView() : (
          <div className="max-w-md mx-auto">
            <div className={`flex items-center mb-8 border-b pb-4 ${isDarkMode ? 'border-green-900' : 'border-green-200'}`}>
              <button onClick={onBack} className="text-2xl mr-4 hover:text-green-500">❮</button>
              <h2 className="text-2xl font-black text-green-600 tracking-widest">ARCHIVED_MATCHES_DB</h2>
            </div>

            {history.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No data found in local storage.</div>
            ) : (
              <div className="space-y-4">
                {history.map((match) => (
                  <div key={match.id} onClick={() => openMatchDetails(match)}
                      className={`border-l-4 border-green-600 p-4 relative bg-opacity-50 ${bgCard} cursor-pointer hover:bg-green-900/10 transition-colors group`}>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1 uppercase tracking-widest">
                      <span>{match.date}</span>
                      <span>ID: {match.id.slice(-4)}</span>
                    </div>
                    <div className="text-lg font-bold mb-1 uppercase group-hover:text-green-400 transition-colors">
                      {match.config ? `${match.config.teamA} vs ${match.config.teamB}` : `${(match as any).teamA} vs ${(match as any).teamB}`}
                    </div>
                    <div className="text-green-500 text-sm font-bold">
                      {match.winMargin || (match as any).result}
                    </div>
                    
                    <div className="absolute top-4 right-4">
                        <button onClick={(e) => handleDeleteSingle(match.id, e)} className={`text-[10px] px-2 py-1 font-bold uppercase tracking-widest border ${deleteId === match.id ? 'bg-red-900 border-red-500 text-red-500 animate-pulse' : 'border-gray-700 text-gray-600 hover:text-red-500'}`}>
                            {deleteId === match.id ? getDeleteLabel(deleteStep) : "DEL"}
                        </button>
                    </div>
                    <div className="absolute bottom-2 right-2 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                        CLICK TO VIEW STATS >>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {history.length > 0 && (
                <div className={`mt-8 pt-6 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-300'}`}>
                    <button onClick={handleClearAll} className={`w-full py-3 font-bold border text-sm tracking-widest uppercase ${deleteAllStep > 0 ? 'bg-red-900/20 text-red-500 border-red-900' : 'text-gray-500 border-gray-800 hover:border-red-900 hover:text-red-900'}`}>
                        {deleteAllStep === 0 ? "PURGE DATABASE" : getDeleteLabel(deleteAllStep)}
                    </button>
                </div>
            )}
          </div>
      )}
    </div>
  );
};

export default MatchHistory;