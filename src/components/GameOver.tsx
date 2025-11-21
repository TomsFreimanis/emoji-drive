
import React, { useEffect, useState } from 'react';
import { GameResult } from '../types';
import { Button } from './ui/Button';
import { Share2, RefreshCw, Home as HomeIcon, MessageSquare, Coins, Trophy, SkipForward } from 'lucide-react';
import { getBattleCommentary } from './services/geminiService';

interface GameOverProps {
  result: GameResult;
  onReplay: () => void;
  onHome: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ result, onReplay, onHome }) => {
  const [commentary, setCommentary] = useState<string>("");
  const [loadingCommentary, setLoadingCommentary] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchCommentary = async () => {
      const text = await getBattleCommentary(result.events);
      if (mounted) {
        setCommentary(text);
        setLoadingCommentary(false);
      }
    };
    fetchCommentary();
    return () => { mounted = false; };
  }, [result.events]);

  return (
    <div className={`flex flex-col h-full items-center justify-center p-8 animate-in fade-in zoom-in duration-500 ${result.victory ? 'bg-indigo-950' : 'bg-slate-950'}`}>
      
      <div className="text-center mb-6 relative">
        {result.victory && <div className="absolute inset-0 bg-yellow-500 blur-[100px] opacity-20 rounded-full" />}
        
        <h1 className={`text-6xl font-display mb-2 transform -rotate-3 drop-shadow-2xl ${result.victory ? 'text-yellow-400 scale-110' : 'text-red-500'}`}>
          {result.victory ? "ZONE CLEARED!" : "GAME OVER"}
        </h1>
        
        <div className="h-12 flex items-center justify-center relative z-10">
          {loadingCommentary ? (
             <span className="text-slate-500 animate-pulse text-sm">Analyzing battle data...</span>
          ) : (
             <p className="text-slate-200 italic text-lg bg-black/30 px-4 py-2 rounded-full border border-white/10">
               <MessageSquare className="w-4 h-4 inline mr-2 text-purple-400"/>
               "{commentary}"
             </p>
          )}
        </div>
      </div>

      <div className="bg-slate-800/80 backdrop-blur p-6 rounded-3xl border-4 border-slate-700 w-full max-w-sm shadow-2xl mb-8 relative overflow-hidden">
         {result.victory && (
           <div className="absolute top-0 left-0 w-full h-full bg-yellow-400/5 animate-pulse pointer-events-none" />
         )}
         
         <div className="flex justify-between items-end mb-4 border-b border-slate-700 pb-4">
            <span className="text-slate-400 uppercase font-bold tracking-wider text-sm">Rewards</span>
            <span className="text-4xl font-display text-yellow-400 tracking-tighter flex items-center gap-2">
               +{Math.floor(result.goldEarned)} <Coins className="w-8 h-8 text-yellow-400 animate-bounce"/>
            </span>
         </div>
         
         <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm uppercase font-bold">Total Score</span>
              <span className="text-white font-mono text-xl">{result.score.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm uppercase font-bold">Time Alive</span>
              <span className="text-white font-mono text-xl">{result.survivalTime}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm uppercase font-bold">KOs</span>
              <span className="text-white font-mono text-xl text-red-400">{result.enemiesDefeated}</span>
            </div>
         </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs z-10">
        {result.victory ? (
           <Button variant="gold" onClick={onHome} size="lg" className="w-full shadow-xl shadow-yellow-500/30 animate-pulse">
             <SkipForward className="w-6 h-6 mr-2" /> NEXT LEVEL
           </Button>
        ) : (
           <Button variant="primary" onClick={onReplay} className="w-full shadow-lg shadow-indigo-500/30">
             <RefreshCw className="w-5 h-5" /> TRY AGAIN
           </Button>
        )}
        
        <Button variant="secondary" onClick={onHome} className="w-full">
          <HomeIcon className="w-5 h-5" /> MAIN MENU
        </Button>
      </div>

    </div>
  );
};
