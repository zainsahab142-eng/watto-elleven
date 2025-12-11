import { GoogleGenAI, Type } from "@google/genai";
import { MatchState, AnalysisResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMatchAnalysis = async (matchState: MatchState): Promise<AnalysisResponse> => {
  const striker = matchState.battingTeam.players[matchState.currentStrikerId];
  const nonStriker = matchState.battingTeam.players[matchState.currentNonStrikerId];
  const bowler = matchState.bowlingTeam.players[matchState.currentBowlerId];

  const oversPlayedStr = matchState.battingTeam.oversPlayed || "0.0";
  const [overs, balls] = oversPlayedStr.split('.').map(Number);
  const totalOversDecimal = overs + (balls / 6);
  const runRate = totalOversDecimal > 0 ? (matchState.battingTeam.score / totalOversDecimal).toFixed(2) : "0.00";

  const prompt = `
    You are Watto Eleven AI, a professional cricket analyst for a high-stakes match.
    
    Match Status:
    Score: ${matchState.battingTeam.score}/${matchState.battingTeam.wickets}
    Overs: ${matchState.battingTeam.oversPlayed}
    Target: ${matchState.target || 'N/A'}
    Run Rate: ${runRate}
    
    On the Crease:
    - Striker: ${striker.name} (${striker.runs} off ${striker.balls})
    - Non-Striker: ${nonStriker.name} (${nonStriker.runs} off ${nonStriker.balls})
    
    Bowling:
    - ${bowler.name}: ${bowler.overs} overs, ${bowler.runsConceded} runs, ${bowler.wickets} wickets.

    Last few balls: ${matchState.thisOver.join(', ')}

    Provide a professional, TV-broadcast style analysis.
    1. A short, exciting commentary on the current play.
    2. Estimated Win Probability for the batting team (0-100).
    3. Specific tactical advice based on the active batsman and bowler matchups.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commentary: { type: Type.STRING },
            winProbability: { type: Type.NUMBER },
            tacticalAdvice: { type: Type.STRING },
          },
          required: ["commentary", "winProbability", "tacticalAdvice"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }
    return JSON.parse(text) as AnalysisResponse;
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return {
      commentary: "Signal Lost. Re-establishing link with Watto Intelligence Satellite...",
      winProbability: 50,
      tacticalAdvice: "Maintain wicket preservation while rotating strike.",
    };
  }
};