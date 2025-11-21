
import React, { useEffect, useState } from 'react';
import { Trophy, History, ArrowLeft, Crown, Calendar } from 'lucide-react';
import { Button } from './ui/Button';
import { fetchHistory, fetchLeaderboard } from './services/firebaseService';
import { LeaderboardEntry, HistoryEntry } from '../types';

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'HISTORY'>('GLOBAL');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [lbData, histData] = await Promise.all([
        fetchLeaderboard(),
        fetchHistory()
      ]);
      setLeaderboard(lbData);
      setHistory(histData);
      setLoading(false);
    };
    loadData();
  }, []);

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden font-sans">
      <div className="p-4 flex items-center gap-4 bg-slate-900/50 border-b border-white/5">
        <Button variant="secondary" size="sm" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-display text-white tracking-wider">RANKINGS</h1>
      </div>

      <div className="flex gap-2 p-4 justify-center">
        <button 
          onClick={() => setActiveTab('GLOBAL')}
          className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all
            ${activeTab === 'GLOBAL' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
          `}
        >
          <Trophy className="w-4 h-4" /> Top Players
        </button>
        <button 
          onClick={() => setActiveTab('HISTORY')}
          className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all
            ${activeTab === 'HISTORY' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
          `}
        >
          <History className="w-4 h-4" /> History
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 no-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500 animate-pulse">
            Loading Data...
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'GLOBAL' ? (
              leaderboard.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">No scores yet. Be the first!</div>
              ) : (
                leaderboard.map((entry, i) => (
                  <div key={entry.id} className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4 relative overflow-hidden">
                    {i < 3 && (
                       <div className={`absolute top-0 right-0 p-1.5 rounded-bl-xl text-xs font-bold
                         ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-900' : 'bg-amber-700 text-amber-100'}
                       `}>
                         #{i + 1}
                       </div>
                    )}
                    <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-2xl border-2 border-slate-700">
                      {entry.fighterIcon}
                    </div>
                    <div className="flex-1">
                       <h3 className="text-white font-bold">{entry.playerName}</h3>
                       <p className="text-xs text-slate-500">{entry.zoneName}</p>
                    </div>
                    <div className="text-right">
                       <div className="text-xl font-display text-yellow-400">{entry.score.toLocaleString()}</div>
                       <div className="text-xs text-slate-500">{formatDate(entry.date)}</div>
                    </div>
                  </div>
                ))
              )
            ) : (
              history.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">Play a match to see history!</div>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className={`p-4 rounded-2xl border flex items-center gap-4
                    ${entry.victory ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-red-900/10 border-red-500/20'}
                  `}>
                    <div className={`w-2 h-full absolute left-0 top-0 bottom-0 ${entry.victory ? 'bg-indigo-500' : 'bg-red-500'}`} />
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-1">
                         <span className={`text-xs font-bold px-2 py-0.5 rounded ${entry.victory ? 'bg-indigo-500 text-white' : 'bg-red-500 text-white'}`}>
                           {entry.victory ? 'WIN' : 'LOSS'}
                         </span>
                         <span className="text-slate-300 text-sm font-bold">{entry.fighterName}</span>
                       </div>
                       <p className="text-xs text-slate-500 flex items-center gap-1">
                         <Calendar className="w-3 h-3" /> {formatDate(entry.date)} • {entry.zoneName}
                       </p>
                    </div>
                    <div className="text-right">
                       <div className="text-lg font-bold text-white">{entry.score.toLocaleString()}</div>
                       <div className="text-xs text-yellow-400 font-bold">+{entry.gold} Gold</div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
