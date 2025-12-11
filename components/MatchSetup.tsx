import React, { useState } from 'react';
import { MatchState, Team, PlayerStats } from '../types';

interface MatchSetupProps {
  onStartMatch: (match: MatchState) => void;
  onBack: () => void;
  isDarkMode: boolean;
}

const MatchSetup: React.FC<MatchSetupProps> = ({ onStartMatch, onBack, isDarkMode }) => {
  const [step, setStep] = useState(1); 
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [overs, setOvers] = useState(5);
  const [tossResult, setTossResult] = useState<{winner: string, choice: 'bat' | 'bowl'} | null>(null);
  const [strikerName, setStrikerName] = useState('');
  const [nonStrikerName, setNonStrikerName] = useState('');
  const [bowlerName, setBowlerName] = useState('');

  const createPlayer = (name: string): PlayerStats => ({
    name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false,
    overs: 0, ballsBowled: 0, runsConceded: 0, wickets: 0, maidens: 0
  });

  const bgCard = isDarkMode ? 'bg-black border-green-900' : 'bg-white border-gray-200';
  const inputClass = isDarkMode 
    ? 'bg-gray-900 border-green-800 text-white focus:border-green-500 focus:shadow-[0_0_10px_#22c55e]' 
    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-green-600';
  const textMuted = isDarkMode ? 'text-gray-500' : 'text-gray-500';

  const handleToss = () => {
    return Math.random() > 0.5 ? teamA : teamB;
  };

  const [tempTossWinner, setTempTossWinner] = useState<string | null>(null);

  const startToss = () => {
    const winner = handleToss();
    setTempTossWinner(winner);
  };

  const confirmToss = (choice: 'bat' | 'bowl') => {
    if (!tempTossWinner) return;
    setTossResult({ winner: tempTossWinner, choice });
  };

  const manualSelectBatting = (teamName: string) => {
      setTossResult({ winner: teamName, choice: 'bat' });
  };

  const initializeMatch = () => {
    if (!tossResult || !strikerName || !nonStrikerName || !bowlerName) return;

    const teamAObj: Team = { name: teamA, players: [], isBatting: false, score: 0, wickets: 0, oversPlayed: "0.0" };
    const teamBObj: Team = { name: teamB, players: [], isBatting: false, score: 0, wickets: 0, oversPlayed: "0.0" };

    let battingTeam: Team;
    let bowlingTeam: Team;

    if ((tossResult.winner === teamA && tossResult.choice === 'bat') || 
        (tossResult.winner === teamB && tossResult.choice === 'bowl')) {
       battingTeam = teamAObj;
       bowlingTeam = teamBObj;
    } else {
       battingTeam = teamBObj;
       bowlingTeam = teamAObj;
    }

    battingTeam.isBatting = true;
    battingTeam.players.push(createPlayer(strikerName));
    battingTeam.players.push(createPlayer(nonStrikerName));
    bowlingTeam.players.push(createPlayer(bowlerName));

    const newMatch: MatchState = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      config: { teamA, teamB, totalOvers: overs, tossWinner: tossResult.winner, electedTo: tossResult.choice },
      currentInning: 1,
      battingTeam, bowlingTeam,
      currentStrikerId: 0, currentNonStrikerId: 1, currentBowlerId: 0,
      thisOver: [], ballByBallHistory: [], target: null, status: 'live'
    };
    onStartMatch(newMatch);
  };

  return (
    <div className={`min-h-screen p-6 flex flex-col items-center ${isDarkMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="w-full max-w-md flex items-center mb-8">
          <button onClick={onBack} className="text-2xl hover:text-green-500 transition-colors mr-4">❮</button>
          <h2 className="text-3xl font-black italic text-green-600 tracking-tighter">MATCH SETUP</h2>
      </div>

      {step === 1 && (
        <div className="w-full max-w-md space-y-6 animate-fadeIn">
          <div>
            <label className={`block text-xs font-bold mb-1 tracking-widest ${textMuted}`}>TEAM A DESIGNATION</label>
            <input value={teamA} onChange={e => setTeamA(e.target.value)} className={`w-full border p-4 outline-none font-bold uppercase ${inputClass}`} placeholder="E.g. REDHAWKS" />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1 tracking-widest ${textMuted}`}>TEAM B DESIGNATION</label>
            <input value={teamB} onChange={e => setTeamB(e.target.value)} className={`w-full border p-4 outline-none font-bold uppercase ${inputClass}`} placeholder="E.g. BLUESHARKS" />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1 tracking-widest ${textMuted}`}>OVERS LIMIT</label>
            <input type="number" value={overs} onChange={e => setOvers(parseInt(e.target.value))} className={`w-full border p-4 outline-none font-mono text-xl ${inputClass}`} />
          </div>
          
          <button disabled={!teamA || !teamB} onClick={() => setStep(2)} 
             className="w-full py-4 mt-4 bg-green-600 hover:bg-green-500 text-black font-black text-xl rounded-none disabled:opacity-50 tracking-widest transition-transform active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
             INITIALIZE TOSS SEQUENCE
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="w-full max-w-md space-y-8 animate-fadeIn text-center">
          {!tempTossWinner && !tossResult ? (
             <div className="space-y-6">
                <div className="flex justify-center gap-8 text-2xl font-black text-gray-500 uppercase">
                    <div>{teamA}</div><div className="text-green-600">VS</div><div>{teamB}</div>
                </div>
                <button onClick={startToss} className="w-full px-8 py-6 bg-yellow-600 text-black font-black text-xl tracking-widest hover:bg-yellow-500 shadow-lg mb-4">
                  FLIP COIN
                </button>
                <div className="text-xs text-gray-600">--- OR MANUAL OVERRIDE ---</div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => manualSelectBatting(teamA)} className={`p-3 border font-bold text-xs ${isDarkMode ? 'border-gray-700 hover:border-green-500' : 'bg-white border-gray-300'}`}>{teamA} BATS</button>
                    <button onClick={() => manualSelectBatting(teamB)} className={`p-3 border font-bold text-xs ${isDarkMode ? 'border-gray-700 hover:border-green-500' : 'bg-white border-gray-300'}`}>{teamB} BATS</button>
                </div>
             </div>
          ) : (
             <div className={`space-y-6 p-6 border ${bgCard}`}>
                 {!tossResult ? (
                    <>
                        <h3 className="text-3xl font-black text-green-500 uppercase">{tempTossWinner} WINS TOSS</h3>
                        <div className="flex gap-4 justify-center mt-4">
                            <button onClick={() => confirmToss('bat')} className={`flex-1 py-4 font-bold border ${tossResult?.choice === 'bat' ? 'bg-green-500 text-black' : 'border-green-600 text-green-500 hover:bg-green-900/20'}`}>BAT</button>
                            <button onClick={() => confirmToss('bowl')} className={`flex-1 py-4 font-bold border ${tossResult?.choice === 'bowl' ? 'bg-green-500 text-black' : 'border-green-600 text-green-500 hover:bg-green-900/20'}`}>BOWL</button>
                        </div>
                    </>
                 ) : (
                    <>
                         <h3 className="text-xl font-bold text-green-500 uppercase">{tossResult.winner} ELECTED TO {tossResult.choice}</h3>
                         <button onClick={() => setStep(3)} className="w-full py-4 mt-6 bg-green-600 text-black font-black text-xl animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.4)]">CONFIRM & PROCEED</button>
                    </>
                 )}
             </div>
          )}
           <button onClick={() => { setStep(1); setTossResult(null); setTempTossWinner(null); }} className={`text-xs underline ${textMuted}`}>RESET CONFIGURATION</button>
        </div>
      )}

      {step === 3 && tossResult && (
         <div className="w-full max-w-md space-y-6 animate-fadeIn">
            <h3 className="text-xl font-black text-center mb-4 tracking-widest text-green-600">DEPLOY SQUAD</h3>
            <div className={`p-4 border border-green-900 bg-gray-900/50`}>
                <div className="text-xs font-black text-green-500 mb-2 uppercase tracking-widest">{tossResult.choice === 'bat' ? tossResult.winner : (tossResult.winner === teamA ? teamB : teamA)} (BATTING)</div>
                <div className="space-y-3">
                    <input value={strikerName} onChange={e => setStrikerName(e.target.value)} className={`w-full border p-3 font-bold uppercase ${inputClass}`} placeholder="STRIKER" />
                    <input value={nonStrikerName} onChange={e => setNonStrikerName(e.target.value)} className={`w-full border p-3 font-bold uppercase ${inputClass}`} placeholder="NON-STRIKER" />
                </div>
            </div>
            <div className={`p-4 border border-yellow-900 bg-gray-900/50`}>
                <div className="text-xs font-black text-yellow-600 mb-2 uppercase tracking-widest">{tossResult.choice === 'bowl' ? tossResult.winner : (tossResult.winner === teamA ? teamB : teamA)} (BOWLING)</div>
                <input value={bowlerName} onChange={e => setBowlerName(e.target.value)} className={`w-full border p-3 font-bold uppercase ${inputClass}`} placeholder="OPENING BOWLER" />
            </div>
            <button disabled={!strikerName || !nonStrikerName || !bowlerName} onClick={initializeMatch} className="w-full py-5 bg-green-600 text-black font-black text-2xl disabled:opacity-50 shadow-[0_0_20px_rgba(34,197,94,0.5)] tracking-widest hover:scale-105 transition-transform">
                INITIATE MATCH
            </button>
         </div>
      )}
    </div>
  );
};

export default MatchSetup;