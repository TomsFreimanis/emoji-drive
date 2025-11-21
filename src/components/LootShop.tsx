
import React, { useState } from 'react';
import { Artifact, Rarity } from '../types';
import { ARTIFACTS, LOOT_BOXES, RARITY_INFO } from '../constants';
import { Button } from './ui/Button';
import { ArrowLeft, Coins, Gift, Briefcase, CheckCircle, Sparkles } from 'lucide-react';
import { playSound } from './services/soundService';

interface LootShopProps {
  gold: number;
  onSpendGold: (amount: number) => void;
  inventory: Artifact[];
  onAddArtifact: (artifact: Artifact) => void;
  onBack: () => void;
  equipped: string[];
  onEquip: (id: string) => void;
}

export const LootShop: React.FC<LootShopProps> = ({ gold, onSpendGold, inventory, onAddArtifact, onBack, equipped, onEquip }) => {
  const [openingBox, setOpeningBox] = useState<string | null>(null);
  const [animState, setAnimState] = useState<'IDLE' | 'SHAKING' | 'REVEAL'>('IDLE');
  const [reward, setReward] = useState<Artifact | null>(null);
  const [activeTab, setActiveTab] = useState<'SHOP' | 'GEAR'>('SHOP');

  const handleBuy = (boxId: string) => {
    const box = LOOT_BOXES.find(b => b.id === boxId);
    if (!box) return;

    if (gold < box.price) {
        playSound('error');
        return;
    }

    onSpendGold(box.price);
    setOpeningBox(boxId);
    setAnimState('SHAKING');
    
    // Shake animation sequence
    playSound('gacha_shake');
    setTimeout(() => playSound('gacha_shake'), 200);
    setTimeout(() => playSound('gacha_shake'), 400);
    setTimeout(() => playSound('gacha_shake'), 600);

    setTimeout(() => {
        setAnimState('REVEAL');
        playSound('gacha_open');
        
        // Determine Reward
        const rand = Math.random() * 100;
        let current = 0;
        let rarity: Rarity = 'COMMON';
        
        if (rand < (current += box.chances.COMMON)) rarity = 'COMMON';
        else if (rand < (current += box.chances.RARE)) rarity = 'RARE';
        else if (rand < (current += box.chances.EPIC)) rarity = 'EPIC';
        else if (rand < (current += box.chances.LEGENDARY)) rarity = 'LEGENDARY';
        else rarity = 'MYTHIC';

        const pool = ARTIFACTS.filter(a => a.rarity === rarity);
        const item = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : ARTIFACTS[0];
        
        setTimeout(() => {
            setReward(item);
            onAddArtifact(item);
            playSound('item_reveal');
        }, 500);

    }, 1000);
  };

  const reset = () => {
    setOpeningBox(null);
    setAnimState('IDLE');
    setReward(null);
  };

  const renderShop = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24 overflow-y-auto">
        {openingBox ? (
            <div className="flex flex-col items-center animate-in fade-in duration-500">
                {animState === 'SHAKING' && (
                    <div className="text-9xl animate-bounce cursor-pointer transform origin-bottom" style={{ animationDuration: '0.1s' }}>
                        {LOOT_BOXES.find(b => b.id === openingBox)?.icon}
                    </div>
                )}
                {animState === 'REVEAL' && !reward && (
                    <div className="text-9xl animate-ping duration-500 text-white">
                        💥
                    </div>
                )}
                {reward && (
                    <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                         <div className={`text-8xl p-6 rounded-3xl border-4 bg-slate-800 shadow-2xl ${RARITY_INFO[reward.rarity].border} ${RARITY_INFO[reward.rarity].shadow} relative`}>
                            <div className={`absolute inset-0 blur-3xl opacity-50 ${RARITY_INFO[reward.rarity].color.replace('text','bg')}`}></div>
                            <span className="relative z-10">{reward.icon}</span>
                         </div>
                         
                         <div className="text-center">
                             <h2 className={`text-3xl font-display ${RARITY_INFO[reward.rarity].color}`}>{reward.name}</h2>
                             <span className="text-xs font-bold uppercase bg-black/50 px-2 py-0.5 rounded text-white">{reward.rarity}</span>
                         </div>
                         
                         <p className="text-slate-300 italic">"{reward.description}"</p>
                         
                         <Button onClick={reset} variant="gold" size="lg" className="mt-4 animate-pulse">
                            CLAIM
                         </Button>
                    </div>
                )}
            </div>
        ) : (
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
                {LOOT_BOXES.map(box => (
                    <div key={box.id} className={`bg-slate-900 border-2 rounded-3xl p-6 flex flex-col items-center gap-4 hover:scale-105 transition-transform shadow-xl ${box.border}`}>
                        <div className="text-7xl drop-shadow-lg">{box.icon}</div>
                        <div className="text-center">
                            <h3 className={`font-display text-2xl ${box.color}`}>{box.name}</h3>
                            <div className="flex flex-wrap justify-center gap-1 mt-2">
                                {Object.entries(box.chances).map(([r, chance]) => (
                                    chance > 0 && (
                                        <span key={r} className={`text-[10px] px-1.5 rounded bg-slate-800 border border-white/10 ${RARITY_INFO[r as Rarity].color}`}>
                                            {chance}% {r.substring(0,3)}
                                        </span>
                                    )
                                ))}
                            </div>
                        </div>
                        <Button 
                            variant="gold" 
                            className="w-full" 
                            onClick={() => handleBuy(box.id)}
                            disabled={gold < box.price}
                        >
                            <span className="flex items-center gap-2">
                                {box.price} <Coins className="w-4 h-4" />
                            </span>
                        </Button>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  const renderInventory = () => (
      <div className="flex-1 p-6 pb-24 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
             <h2 className="text-slate-400 font-bold uppercase tracking-widest mb-4">Equipped ({equipped.length}/3)</h2>
             <div className="flex gap-4 mb-8">
                {Array.from({length: 3}).map((_, i) => {
                    const artifactId = equipped[i];
                    const item = artifactId ? inventory.find(a => a.id === artifactId) : null;
                    return (
                        <div key={i} className="w-24 h-24 bg-slate-900 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center relative">
                            {item ? (
                                <button onClick={() => { playSound('ui'); onEquip(item.id); }} className={`w-full h-full flex flex-col items-center justify-center rounded-2xl border-2 bg-slate-800 ${RARITY_INFO[item.rarity].border}`}>
                                    <span className="text-3xl">{item.icon}</span>
                                    <span className="text-[10px] text-slate-300 mt-1 font-bold px-1 text-center truncate w-full">{item.name}</span>
                                </button>
                            ) : (
                                <span className="text-slate-700 text-xs uppercase font-bold">Empty</span>
                            )}
                        </div>
                    )
                })}
             </div>

             <h2 className="text-slate-400 font-bold uppercase tracking-widest mb-4">Backpack</h2>
             {inventory.length === 0 ? (
                 <div className="text-center text-slate-500 py-10 italic">No artifacts yet. Buy some crates!</div>
             ) : (
                 <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                     {inventory.map(item => {
                         const isEquipped = equipped.includes(item.id);
                         return (
                             <button 
                                key={item.id + Math.random()} // Simple key for demo
                                onClick={() => { playSound('ui'); onEquip(item.id); }}
                                className={`aspect-square bg-slate-800 rounded-xl flex flex-col items-center justify-center border-2 relative transition-all
                                    ${isEquipped ? 'opacity-50 border-slate-600' : `hover:scale-105 ${RARITY_INFO[item.rarity].border}`}
                                `}
                             >
                                 <span className="text-3xl mb-1">{item.icon}</span>
                                 {isEquipped && <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5"><CheckCircle className="w-3 h-3 text-white"/></div>}
                                 <div className={`absolute bottom-0 w-full h-1 ${RARITY_INFO[item.rarity].color.replace('text','bg')}`}></div>
                             </button>
                         )
                     })}
                 </div>
             )}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans">
       <div className="p-4 flex items-center justify-between bg-slate-900 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="sm" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-display text-white tracking-wider">BLACK MARKET</h1>
          </div>
          <div className="bg-black/30 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
             <Coins className="text-yellow-400 w-4 h-4" />
             <span className="text-white font-bold">{Math.floor(gold)}</span>
          </div>
       </div>

       <div className="flex justify-center gap-2 p-4 bg-slate-900/50">
           <button 
             onClick={() => { playSound('ui'); setActiveTab('SHOP'); }}
             className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all
               ${activeTab === 'SHOP' ? 'bg-yellow-500 text-black shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
             `}
           >
             <Gift className="w-4 h-4" /> Loot Crates
           </button>
           <button 
             onClick={() => { playSound('ui'); setActiveTab('GEAR'); }}
             className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all
               ${activeTab === 'GEAR' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
             `}
           >
             <Briefcase className="w-4 h-4" /> Inventory
           </button>
       </div>

       {activeTab === 'SHOP' ? renderShop() : renderInventory()}
    </div>
  );
};
