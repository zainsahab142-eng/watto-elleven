import React, { useState, useEffect } from 'react';
import { MatchState, PlayerStats, Team } from '../types';

interface ScoreBoardProps {
  initialState: MatchState;
  onMatchEnd: () => void;
  onBack: () => void;
  isDarkMode: boolean;
}

// Modal Component defined outside to prevent type errors and re-creation on render
interface ModalProps {
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, children }) => (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
        <div className={`w-full max-w-sm p-6 rounded-none border-2 border-green-500 bg-gray-900 shadow-[0_0_30px_rgba(34,197,94,0.3)]`}>
            <h3 className="text-2xl font-black mb-6 text-center text-green-500 uppercase tracking-widest border-b border-green-900 pb-2">{title}</h3>
            {children}
        </div>
    </div>
);

const ScoreBoard: React.FC<ScoreBoardProps> = ({ initialState, onMatchEnd, onBack, isDarkMode }) => {
  const [match, setMatch] = useState<MatchState>(initialState);
  const [undoStack, setUndoStack] = useState<MatchState[]>([]);
  
  // UI Control States
  const [showScorecard, setShowScorecard] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [waitingFor, setWaitingFor] = useState<'none' | 'striker' | 'bowler' | 'next_inning_players'>('none');
  const [isByeMode, setIsByeMode] = useState(false);
  
  // Input Value for modals
  const [playerInputName, setPlayerInputName] = useState('');
  
  // Styles
  const bgMain = isDarkMode ? 'bg-black text-white' : 'bg-gray-100 text-gray-900';
  const bgCard = isDarkMode ? 'bg-gray-900/50 border-green-900/50' : 'bg-white border-gray-300 shadow-sm';
  const borderHighlight = isDarkMode ? 'border-green-600' : 'border-green-600';
  const bgInput = isDarkMode ? 'bg-black border-green-800 text-white focus:border-green-500' : 'bg-gray-50 border-gray-300 text-gray-900';
  
  // Tactical Button Styles
  const btnBase = `relative font-bold transition-all active:scale-95 flex items-center justify-center overflow-hidden border-b-4 active:border-b-0 active:translate-y-1`;
  const btnNormal = isDarkMode 
    ? `bg-gray-800 border-gray-900 text-white hover:bg-gray-700` 
    : `bg-white border-gray-300 text-gray-800 hover:bg-gray-50 shadow-sm`;
  const btnGreen = `bg-green-600 border-green-800 text-white hover:bg-green-500`;
  const btnRed = `bg-red-600 border-red-800 text-white hover:bg-red-500`;
  const btnYellow = `bg-yellow-600 border-yellow-800 text-white hover:bg-yellow-500`;

  useEffect(() => {
     localStorage.setItem('wato_active_match', JSON.stringify(match));
     
     // --- CHECK IF INNING IS OVER FIRST ---
     const oversParts = match.battingTeam.oversPlayed.split('.');
     const totalBallsBowled = (parseInt(oversParts[0]) * 6) + parseInt(oversParts[1]);
     const maxBalls = match.config.totalOvers * 6;
     const isAllOut = match.battingTeam.wickets >= 10;
     const isOversFinished = totalBallsBowled >= maxBalls;

     // If the inning is physically over (10 wickets or Overs limit reached), 
     // STOP asking for new players.
     if ((isAllOut || isOversFinished) && match.status !== 'completed') {
         setWaitingFor('none');
         return; 
     }

     // --- NORMAL FLOW FOR NEW PLAYERS ---
     const striker = match.battingTeam.players[match.currentStrikerId];
     if (striker.isOut && match.status !== 'completed' && !isAllOut) {
         setWaitingFor('striker');
         return;
     }

     const bowler = match.bowlingTeam.players[match.currentBowlerId];
     // Check if over is completed (divisible by 6) and balls > 0
     // But strictly verify using the team total overs string to ensure we just finished an over
     const ballsInCurrentOver = parseInt(oversParts[1]);
     
     if (bowler.ballsBowled > 0 && ballsInCurrentOver === 0 && !isOversFinished && match.status !== 'completed') {
         setWaitingFor('bowler');
     }
  }, [match]);

  // --- HELPERS ---
  const getCurrentStriker = () => match.battingTeam.players[match.currentStrikerId];
  const getCurrentNonStriker = () => match.battingTeam.players[match.currentNonStrikerId];
  const getCurrentBowler = () => match.bowlingTeam.players[match.currentBowlerId];

  const getStrikeRate = (runs: number, balls: number) => balls > 0 ? ((runs/balls)*100).toFixed(0) : "0";
  const getEconomy = (runs: number, balls: number) => {
    const overs = balls / 6;
    return overs > 0 ? (runs / overs).toFixed(1) : "0.0";
  }

  const saveToHistory = (currentState: MatchState) => {
      setUndoStack(prev => [...prev.slice(-49), JSON.parse(JSON.stringify(currentState))]);
  };

  const handleUndo = () => {
      if (undoStack.length === 0) return;
      const previousState = undoStack[undoStack.length - 1];
      setMatch(previousState);
      setUndoStack(prev => prev.slice(0, -1));
      setWaitingFor('none');
      setIsByeMode(false);
  };

  const toggleByeMode = () => {
      setIsByeMode(!isByeMode);
  };

  // --- GAME LOGIC ---

  const submitNewPlayer = (e?: React.FormEvent, existingId?: number) => {
      if (e) e.preventDefault();
      saveToHistory(match);
      setMatch(prev => {
          const newState = JSON.parse(JSON.stringify(prev));
          if (waitingFor === 'striker') {
             const newPlayer: PlayerStats = { name: playerInputName, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, overs: 0, ballsBowled: 0, runsConceded: 0, wickets: 0, maidens: 0 };
             newState.battingTeam.players.push(newPlayer);
             newState.currentStrikerId = newState.battingTeam.players.length - 1;
             setPlayerInputName('');
             setWaitingFor('none');
          } else if (waitingFor === 'bowler') {
             if (existingId !== undefined) {
                 newState.currentBowlerId = existingId;
             } else {
                 const newPlayer: PlayerStats = { name: playerInputName, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, overs: 0, ballsBowled: 0, runsConceded: 0, wickets: 0, maidens: 0 };
                 newState.bowlingTeam.players.push(newPlayer);
                 newState.currentBowlerId = newState.bowlingTeam.players.length - 1;
             }
             setPlayerInputName('');
             setWaitingFor('none');
          }
          return newState;
      });
  };
  
  const checkMatchStatus = (state: MatchState) => {
      const oversParts = state.battingTeam.oversPlayed.split('.');
      const totalBallsBowled = (parseInt(oversParts[0]) * 6) + parseInt(oversParts[1]);
      const maxBalls = state.config.totalOvers * 6;
      const allOut = state.battingTeam.wickets >= 10;
      const oversDone = totalBallsBowled >= maxBalls;
      const chased = state.target && state.battingTeam.score > state.target;

      if (state.currentInning === 2) {
          if (chased) declareWinner(state, state.battingTeam.name);
          else if (allOut || oversDone) {
              if (state.battingTeam.score === state.target! - 1) declareWinner(state, "DRAW");
              else declareWinner(state, state.bowlingTeam.name);
          }
      }
  };

  const startSecondInning = () => {
      saveToHistory(match);
      setWaitingFor('next_inning_players');
  };
  
  const confirmSecondInningStart = (striker: string, nonStriker: string, bowler: string) => {
      setMatch(prev => {
          const target = prev.battingTeam.score + 1;
          const newBatting = prev.bowlingTeam;
          const newBowling = prev.battingTeam;
          newBatting.isBatting = true;
          newBowling.isBatting = false;

          const createP = (n: string): PlayerStats => ({name: n, runs:0, balls:0, fours:0, sixes:0, isOut:false, overs:0, ballsBowled:0, runsConceded:0, wickets:0, maidens:0});
          
          newBatting.players.push(createP(striker));
          newBatting.players.push(createP(nonStriker));
          newBowling.players.push(createP(bowler));

          return {
              ...prev,
              currentInning: 2,
              target: target,
              battingTeam: newBatting,
              bowlingTeam: newBowling,
              currentStrikerId: newBatting.players.length - 2,
              currentNonStrikerId: newBatting.players.length - 1,
              currentBowlerId: newBowling.players.length - 1,
              thisOver: [],
              ballByBallHistory: []
          };
      });
      setWaitingFor('none');
  };

  const declareWinner = (state: MatchState, winnerName: string) => {
      let resultText = "";
      if (winnerName === "DRAW") resultText = "Match Drawn!";
      else if (winnerName === state.battingTeam.name) {
          const wicketsLeft = 10 - state.battingTeam.wickets;
          resultText = `${winnerName} won by ${wicketsLeft} wickets`;
      } else {
          const runDiff = (state.target! - 1) - state.battingTeam.score;
          resultText = `${winnerName} won by ${runDiff} runs`;
      }

      const completedMatch = {
          ...state,
          status: 'completed' as const,
          winner: winnerName,
          winMargin: resultText
      };
      setMatch(completedMatch);
      setShowWinner(true);
      
      // Save FULL match state to history, not just summary
      const existingHistory = JSON.parse(localStorage.getItem('wato_history') || '[]');
      // Remove any partial match with same ID if exists to update it
      const filteredHistory = existingHistory.filter((m: any) => m.id !== completedMatch.id);
      localStorage.setItem('wato_history', JSON.stringify([completedMatch, ...filteredHistory]));
  };

  const addBall = (run: number | string) => {
      if (match.status === 'completed' || waitingFor !== 'none') return;
      saveToHistory(match);
      setMatch(prev => {
          const newState = JSON.parse(JSON.stringify(prev));
          const striker = newState.battingTeam.players[newState.currentStrikerId];
          const bowler = newState.bowlingTeam.players[newState.currentBowlerId];
          let isLegalBall = true;
          let runsScored = 0;

          if (isByeMode && typeof run === 'number') {
              newState.battingTeam.score += run;
              newState.thisOver.push(`B${run}`);
              isLegalBall = false;
              setIsByeMode(false);
          } else {
              if (run === 'W') {
                  striker.balls++;
                  striker.isOut = true;
                  striker.outBy = `b ${bowler.name}`;
                  bowler.ballsBowled++;
                  bowler.wickets++;
                  newState.battingTeam.wickets++;
                  newState.thisOver.push('W');
              } else if (run === 'WD') {
                  isLegalBall = false;
                  newState.battingTeam.score++;
                  bowler.runsConceded++;
                  newState.thisOver.push('WD');
              } else if (run === 'NB') {
                  isLegalBall = false;
                  newState.battingTeam.score++;
                  bowler.runsConceded++; 
                  newState.thisOver.push('NB');
              } else {
                  const r = typeof run === 'string' ? parseInt(run) : run;
                  runsScored = r;
                  striker.runs += r;
                  striker.balls++;
                  if (r === 4) striker.fours++;
                  if (r === 6) striker.sixes++;
                  bowler.runsConceded += r;
                  bowler.ballsBowled++;
                  newState.battingTeam.score += r;
                  newState.thisOver.push(r.toString());
              }
          }

          if (isLegalBall) {
               const balls = bowler.ballsBowled % 6;
               const overs = Math.floor(bowler.ballsBowled / 6);
               bowler.overs = parseFloat(`${overs}.${balls}`); 
               const currentTeamOversParts = newState.battingTeam.oversPlayed.split('.').map(Number);
               let teamBalls = (currentTeamOversParts[0] * 6) + currentTeamOversParts[1] + 1;
               newState.battingTeam.oversPlayed = `${Math.floor(teamBalls/6)}.${teamBalls%6}`;

               if (teamBalls % 6 === 0) {
                   newState.thisOver = [];
                   const temp = newState.currentStrikerId;
                   newState.currentStrikerId = newState.currentNonStrikerId;
                   newState.currentNonStrikerId = temp;
               } else {
                   if (runsScored % 2 !== 0) {
                       const temp = newState.currentStrikerId;
                       newState.currentStrikerId = newState.currentNonStrikerId;
                       newState.currentNonStrikerId = temp;
                   }
               }
          }
          return newState;
      });
  };

  useEffect(() => { checkMatchStatus(match); }, [match.battingTeam.score, match.battingTeam.wickets, match.battingTeam.oversPlayed]);

  const shareMatch = () => {
      const text = `🏏 *WATTO ELEVEN SCORE CARD* 🏏\n${match.config.teamA} vs ${match.config.teamB}\n${match.status === 'completed' ? `RESULT: ${match.winMargin}` : 'MATCH LIVE'}\n\n*WATTO ELEVEN PRO*`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  // --- RENDERS ---
  const striker = getCurrentStriker();
  const nonStriker = getCurrentNonStriker();
  const bowler = getCurrentBowler();

  if (waitingFor === 'striker' || waitingFor === 'bowler') {
      const isBowler = waitingFor === 'bowler';
      const existingBowlers = isBowler ? match.bowlingTeam.players.filter(p => p.ballsBowled > 0) : [];
      return (
          <Modal title={isBowler ? "DEPLOY BOWLER" : "NEW BATSMAN"}>
               {isBowler && existingBowlers.length > 0 && (
                  <div className="mb-4 space-y-2">
                      <p className="text-xs font-bold text-gray-500">PREVIOUS AGENTS:</p>
                      <div className="flex flex-wrap gap-2">
                          {existingBowlers.map((p, i) => (
                              <button key={i} onClick={() => submitNewPlayer(undefined, match.bowlingTeam.players.indexOf(p))}
                                className="text-xs border border-green-600 px-3 py-2 rounded-none hover:bg-green-600 hover:text-white text-green-500 font-mono font-bold transition-colors">
                                  {p.name}
                              </button>
                          ))}
                      </div>
                  </div>
              )}
              <form onSubmit={(e) => submitNewPlayer(e)}>
                  <input autoFocus value={playerInputName} onChange={e => setPlayerInputName(e.target.value)}
                      className={`w-full p-4 mb-4 rounded-none border-2 font-bold uppercase text-lg ${bgInput} outline-none focus:shadow-[0_0_15px_rgba(34,197,94,0.4)]`}
                      placeholder={isBowler ? "ENTER BOWLER NAME" : "ENTER BATSMAN NAME"} />
                  <button disabled={!playerInputName} type="submit"
                      className="w-full py-4 bg-green-600 hover:bg-green-500 text-black font-black text-xl tracking-widest rounded-none">
                      CONFIRM
                  </button>
              </form>
          </Modal>
      );
  }

  if (waitingFor === 'next_inning_players') {
      return (
         <Modal title="INITIATE 2ND INNING">
              <div className="space-y-4">
                  <input id="s2" placeholder="STRIKER NAME" className={`w-full p-3 border rounded-none font-bold uppercase ${bgInput}`} />
                  <input id="ns2" placeholder="NON-STRIKER NAME" className={`w-full p-3 border rounded-none font-bold uppercase ${bgInput}`} />
                  <input id="b2" placeholder="BOWLER NAME" className={`w-full p-3 border rounded-none font-bold uppercase ${bgInput}`} />
                  <button onClick={() => {
                        const s = (document.getElementById('s2') as HTMLInputElement).value;
                        const ns = (document.getElementById('ns2') as HTMLInputElement).value;
                        const b = (document.getElementById('b2') as HTMLInputElement).value;
                        if(s && ns && b) confirmSecondInningStart(s, ns, b);
                    }}
                    className="w-full py-4 bg-green-600 text-black font-black rounded-none mt-2 hover:bg-green-500">
                      START SEQUENCE
                  </button>
              </div>
         </Modal>
      );
  }

  if (showWinner) {
      return (
          <div className={`fixed inset-0 z-50 overflow-y-auto ${bgMain} p-4`}>
              <div className="max-w-2xl mx-auto space-y-6">
                 <button onClick={onMatchEnd} className="absolute top-4 left-4 text-gray-500 hover:text-white">⬅ MENU</button>
                  <div className="text-center py-20">
                      <h1 className="text-6xl font-black text-green-500 mb-4 animate-pulse">{match.winner} WINS</h1>
                      <p className="text-2xl text-white font-mono">{match.winMargin}</p>
                      <button onClick={onMatchEnd} className="mt-10 px-10 py-4 bg-gray-800 border border-green-500 text-green-500 font-bold tracking-widest hover:bg-green-900/20">EXIT TO MENU</button>
                  </div>
              </div>
          </div>
      )
  }

  // Calculate needed runs details
  const ballsBowledTotal = (parseInt(match.battingTeam.oversPlayed.split('.')[0])*6) + parseInt(match.battingTeam.oversPlayed.split('.')[1]);
  const ballsRemaining = (match.config.totalOvers * 6) - ballsBowledTotal;
  const runsNeeded = match.target ? match.target - match.battingTeam.score : 0;

  return (
    <div className={`min-h-screen flex flex-col ${bgMain} overflow-hidden font-sans`}>
      
      {/* 1. HEADER */}
      <div className={`flex justify-between items-center p-3 border-b-2 ${isDarkMode ? 'border-green-900 bg-black' : 'border-gray-300 bg-white'}`}>
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-green-500 transition-colors uppercase tracking-widest group">
              <span className="text-xl group-hover:-translate-x-1 transition-transform">❮</span> BACK
          </button>
          <div className="text-center">
              <div className="text-[10px] text-green-600 font-black tracking-[0.3em]">WATTO ELEVEN PRO</div>
              <div className="font-bold text-sm text-gray-300">{match.battingTeam.name} vs {match.bowlingTeam.name}</div>
          </div>
          <div className="w-16"></div> {/* Spacer for alignment */}
      </div>

      {/* 2. MAIN SCORE DISPLAY (HUGE) */}
      <div className="relative flex flex-col items-center justify-center py-4 md:py-8 bg-gradient-to-b from-gray-900/0 to-green-900/10">
           <div className={`text-7xl md:text-9xl font-black font-mono tracking-tighter leading-none flex items-baseline ${isDarkMode ? 'text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'text-gray-900'}`}>
               {match.battingTeam.score}<span className="text-4xl md:text-6xl text-gray-500 mx-1">/</span>{match.battingTeam.wickets}
           </div>
           
           <div className="flex gap-6 mt-2 text-sm md:text-base font-mono font-bold text-gray-400">
               <div className="flex items-center gap-2 px-3 py-1 rounded bg-gray-900/50 border border-gray-800">
                  <span className="text-gray-500">OVERS</span>
                  <span className="text-white text-xl">{match.battingTeam.oversPlayed}</span>
                  <span className="text-xs text-gray-600 self-end mb-1">/{match.config.totalOvers}</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 rounded bg-gray-900/50 border border-gray-800">
                  <span className="text-gray-500">CRR</span>
                  <span className="text-white text-xl">{(match.battingTeam.score / (ballsBowledTotal/6 || 1)).toFixed(2)}</span>
               </div>
           </div>

           {match.target && (
               <div className="mt-3 px-6 py-2 bg-yellow-900/20 border border-yellow-700/50 rounded-full">
                   <span className="text-yellow-500 font-bold text-sm tracking-wide animate-pulse">
                       NEED {runsNeeded} RUNS IN {ballsRemaining} BALLS
                   </span>
               </div>
           )}
      </div>

      {/* 3. ACTIVE PLAYERS (TERMINAL STYLE) */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          
          {/* BATSMAN CARD */}
          <div className={`p-1 border-l-4 ${borderHighlight} ${bgCard}`}>
              <div className="flex justify-between items-stretch bg-black/20 p-2">
                  <div className="flex-1">
                      <div className="flex items-center gap-2">
                          <div className="text-green-400 font-black text-xl md:text-2xl uppercase truncate w-32 md:w-auto">{striker.name}</div>
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                      </div>
                      <div className="text-[10px] text-gray-500 tracking-widest">ON STRIKE</div>
                  </div>
                  <div className="text-right">
                      <div className="text-3xl font-mono font-bold text-white leading-none">{striker.runs}<span className="text-sm text-gray-500">({striker.balls})</span></div>
                      <div className="text-xs text-gray-500 font-mono mt-1">SR: {getStrikeRate(striker.runs, striker.balls)}</div>
                  </div>
              </div>
              <div className="flex justify-between items-center px-2 py-1 border-t border-gray-800/50 mt-1">
                  <span className="text-gray-500 font-bold text-sm truncate w-32">{nonStriker.name}</span>
                  <span className="text-gray-400 font-mono text-sm">{nonStriker.runs} ({nonStriker.balls})</span>
              </div>
          </div>

          {/* BOWLER CARD */}
          <div className={`p-1 border-r-4 border-yellow-600 ${bgCard}`}>
              <div className="flex justify-between items-center bg-black/20 p-2">
                  <div>
                      <div className="text-yellow-500 font-black text-lg uppercase">{bowler.name}</div>
                      <div className="text-[10px] text-gray-500 tracking-widest">BOWLING</div>
                  </div>
                  <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-white">
                          {bowler.wickets}<span className="text-gray-500 mx-1">-</span>{bowler.runsConceded}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                          {bowler.overs} OVERS
                      </div>
                  </div>
              </div>
          </div>

          {/* THIS OVER STRIP */}
          <div className="flex items-center gap-2 py-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-gray-500 uppercase shrink-0">THIS OVER:</span>
              {match.thisOver.length === 0 ? <span className="text-xs text-gray-700 font-mono">Waiting...</span> : match.thisOver.map((b, i) => (
                  <div key={i} className={`w-8 h-8 shrink-0 flex items-center justify-center font-black font-mono text-sm border 
                      ${b === 'W' ? 'bg-red-500 border-red-400 text-white' : 
                        b === '4' ? 'bg-green-600 border-green-400 text-white' :
                        b === '6' ? 'bg-green-500 border-green-300 text-black' :
                        'bg-gray-800 border-gray-600 text-gray-300'}`}>
                      {b}
                  </div>
              ))}
          </div>

          {/* 4. CONTROLS (TACTICAL KEYPAD) */}
          <div className="grid grid-cols-4 gap-2 md:gap-3 select-none">
             {[0, 1, 2, 3].map(run => (
                 <button key={run} onClick={() => addBall(run)} className={`h-14 md:h-16 text-2xl ${btnBase} ${btnNormal}`}>
                     {run}
                 </button>
             ))}
             
             <button onClick={() => addBall(4)} className={`h-14 md:h-16 text-2xl ${btnBase} ${btnGreen}`}>4</button>
             <button onClick={() => addBall(6)} className={`h-14 md:h-16 text-2xl ${btnBase} ${btnGreen} border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]`}>6</button>
             
             <button onClick={() => addBall('WD')} className={`h-14 md:h-16 text-lg ${btnBase} ${btnYellow}`}>WD</button>
             <button onClick={() => addBall('NB')} className={`h-14 md:h-16 text-lg ${btnBase} ${btnYellow}`}>NB</button>

             <button onClick={() => addBall('W')} className={`col-span-2 h-14 md:h-16 text-xl ${btnBase} ${btnRed} tracking-widest`}>OUT</button>
             <button onClick={handleUndo} disabled={undoStack.length === 0} className={`col-span-2 h-14 md:h-16 text-xl ${btnBase} bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 disabled:opacity-50`}>UNDO</button>
             
             <button onClick={toggleByeMode} className={`col-span-4 h-12 text-sm font-bold tracking-widest uppercase transition-all ${isByeMode ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
                 {isByeMode ? ">>> SELECT EXTRAS RUNS <<<" : "EXTRAS (BYES / LEG BYES)"}
             </button>
          </div>
          
          <div className="pt-2 flex gap-2">
             <button onClick={() => setShowScorecard(true)} className="flex-1 py-3 bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-xs font-bold uppercase tracking-widest">
                 View Scorecard
             </button>
             <button onClick={shareMatch} className="flex-1 py-3 bg-green-900/30 border border-green-800 text-green-500 hover:bg-green-900/50 text-xs font-bold uppercase tracking-widest">
                 Share Match
             </button>
          </div>

           {/* Next Inning Button Check */}
            {match.currentInning === 1 && (match.battingTeam.wickets >= 10 || match.battingTeam.oversPlayed.startsWith(match.config.totalOvers.toString())) && (
                <button onClick={startSecondInning} className="w-full py-4 mt-4 bg-green-600 text-black font-black text-xl rounded shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-bounce uppercase tracking-widest">
                     START 2ND INNING 
                </button>
            )}

      </div>

      {/* Full Scorecard Modal */}
      {showScorecard && (
          <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto p-4 animate-fadeIn">
              <div className="max-w-3xl mx-auto">
                  <div className="flex justify-between items-center mb-6 sticky top-0 bg-black/95 py-4 border-b border-gray-800">
                      <h2 className="text-2xl font-black text-green-500 tracking-widest">FULL DATA LOG</h2>
                      <button onClick={() => setShowScorecard(false)} className="text-white text-xl hover:text-red-500">CLOSE [X]</button>
                  </div>
                  
                  {/* Reuse tables from previous design but with bg-gray-900/50 and mono fonts */}
                   <div className="space-y-8 pb-10">
                      <div className="border border-gray-800 bg-gray-900/30 p-4">
                          <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-green-500 pl-3">{match.battingTeam.name} Batting</h3>
                          {/* ... (Previous Table Logic, just ensure font-mono classes) ... */}
                          <table className="w-full text-sm text-gray-300 font-mono">
                              <thead>
                                  <tr className="text-gray-500 border-b border-gray-800 text-xs uppercase text-left">
                                      <th className="py-2">Player</th>
                                      <th className="py-2 text-right">R</th>
                                      <th className="py-2 text-right">B</th>
                                      <th className="py-2 text-right">4s</th>
                                      <th className="py-2 text-right">6s</th>
                                      <th className="py-2 text-right">SR</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {match.battingTeam.players.map((p, i) => (
                                      <tr key={i} className="border-b border-gray-800/50">
                                          <td className="py-2">
                                              <div className={p.isOut ? 'text-red-400' : 'text-green-400'}>{p.name}</div>
                                              <div className="text-[10px] text-gray-600">{p.outBy || (i === match.currentStrikerId || i === match.currentNonStrikerId ? 'active' : '')}</div>
                                          </td>
                                          <td className="text-right font-bold text-white">{p.runs}</td>
                                          <td className="text-right text-gray-500">{p.balls}</td>
                                          <td className="text-right text-gray-600">{p.fours}</td>
                                          <td className="text-right text-gray-600">{p.sixes}</td>
                                          <td className="text-right text-xs text-gray-500">{getStrikeRate(p.runs, p.balls)}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                      
                      {/* Bowling Table similar logic... */}
                       <div className="border border-gray-800 bg-gray-900/30 p-4">
                          <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-yellow-500 pl-3">{match.bowlingTeam.name} Bowling</h3>
                          <table className="w-full text-sm text-gray-300 font-mono">
                              <thead>
                                  <tr className="text-gray-500 border-b border-gray-800 text-xs uppercase text-left">
                                      <th className="py-2">Bowler</th>
                                      <th className="py-2 text-right">O</th>
                                      <th className="py-2 text-right">M</th>
                                      <th className="py-2 text-right">R</th>
                                      <th className="py-2 text-right">W</th>
                                      <th className="py-2 text-right">ECO</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {match.bowlingTeam.players.filter(p => p.ballsBowled > 0).map((p, i) => (
                                      <tr key={i} className="border-b border-gray-800/50">
                                          <td className="py-2 text-yellow-500">{p.name}</td>
                                          <td className="text-right">{p.overs}</td>
                                          <td className="text-right text-gray-600">{p.maidens}</td>
                                          <td className="text-right font-bold text-white">{p.runsConceded}</td>
                                          <td className="text-right font-bold text-green-500">{p.wickets}</td>
                                          <td className="text-right text-xs text-gray-500">{getEconomy(p.runsConceded, p.ballsBowled)}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                   </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ScoreBoard;
