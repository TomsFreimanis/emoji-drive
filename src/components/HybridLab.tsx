
import React, { useState } from 'react';
import { EmojiFighter, HybridResult } from '../types';
import { Button } from './ui/Button';
import { createHybrid } from './services/geminiService';
import { Sparkles, TestTube, Coins, AlertCircle, Trash2, Plus, Star } from 'lucide-react';
import { playSound } from './services/soundService';
import { RARITY_INFO } from '../constants';

interface HybridLabProps {
  fighters: EmojiFighter[];
  onUnlock: (fighter: EmojiFighter) => void;
  onSell: (fighterId: string, amount: number) => void;
  onBack: () => void;
  gold: number;
  onSpendGold: (amount: number) => void;
}

const FUSION_COST = 500;
const SLOT_COST = 5000;

export const HybridLab: React.FC<HybridLabProps> = ({ fighters, onUnlock, onSell, onBack, gold, onSpendGold }) => {
  const [slot1, setSlot1] = useState<EmojiFighter | null>(null);
  const [slot2, setSlot2] = useState<EmojiFighter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<HybridResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maxSlots, setMaxSlots] = useState(3); // Starting slots

  const hybrids = fighters.filter(f => f.isHybrid);
  const hybridCount = hybrids.length;

  const handleCombine = async () => {
    if (!slot1 || !slot2) return;
    
    if (hybridCount >= maxSlots) {
        playSound('error');
        setError("Inventory Full! Buy Slots or Sell Hybrids.");
        setTimeout(() => setError(null), 3000);
        return;
    }

    if (gold < FUSION_COST) {
        playSound('error');
        setError("Not enough gold!");
        setTimeout(() => setError(null), 2000);
        return;
    }

    playSound('ui');
    onSpendGold(FUSION_COST);
    setIsGenerating(true);
    setResult(null);
    setError(null);

    try {
        const hybridData = await createHybrid(slot1.icon, slot2.icon);
        setResult(hybridData);
        playSound('victory'); 
    } catch (e) {
        console.error(e);
        setError("Fusion Failed. Gold Refunded.");
        onSpendGold(-FUSION_COST); // Refund
        playSound('error');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (result && slot1 && slot2) {
      playSound('powerup');
      const inheritedWeapon = Math.random() > 0.5 ? slot1.weapon : slot2.weapon;
      const rarityInfo = RARITY_INFO[result.rarity];
      
      // SPEED BALANCING:
      // We reduce the multiplier effect on Speed specifically, otherwise Mythic fighters become uncontrollable.
      // Formula: 1 + (Multiplier - 1) * 0.6. Example: Mythic (3.0) becomes 2.2x for speed instead of 3.0x.
      const speedMultiplier = 1 + ((rarityInfo.multiplier - 1) * 0.6);

      const newFighter: EmojiFighter = {
        id: `hybrid-${Date.now()}`,
        icon: slot1.icon + slot2.icon,
        avatarImage: result.avatarImage,
        name: result.name,
        description: result.description,
        ability: result.ability,
        // Base stats scaled by Rarity
        baseStats: {
          speed: Math.floor((slot1.baseStats.speed + slot2.baseStats.speed) / 2 * speedMultiplier),
          power: Math.floor((slot1.baseStats.power + slot2.baseStats.power) / 2 * rarityInfo.multiplier),
          defense: Math.floor((slot1.baseStats.defense + slot2.baseStats.defense) / 2 * rarityInfo.multiplier),
        },
        weapon: inheritedWeapon,
        rarity: result.rarity,
        isHybrid: true,
        unlocked: true,
        sellPrice: Math.floor(FUSION_COST * 0.5 * rarityInfo.multiplier)
      };
      onUnlock(newFighter);
      setSlot1(null);
      setSlot2(null);
      setResult(null);
    }
  };

  const handleBuySlot = () => {
      if (gold >= SLOT_COST) {
          onSpendGold(SLOT_COST);
          setMaxSlots(prev => prev + 1);
          playSound('powerup');
      } else {
          playSound('error');
      }
  };

  const handleSellHybrid = (f: EmojiFighter) => {
      if (f.sellPrice) {
          onSell(f.id, f.sellPrice);
          playSound('ui');
          if (slot1?.id === f.id) setSlot1(null);
          if (slot2?.id === f.id) setSlot2(null);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 p-6 overflow-y-auto font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="secondary" size="sm" onClick={onBack}>Back</Button>
        <div className="flex items-center gap-4">
            <div className="bg-black/30 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
                <Coins className="text-yellow-400 w-4 h-4" />
                <span className="text-white font-bold">{Math.floor(gold)}</span>
            </div>
            <div className="bg-indigo-900/50 px-3 py-1 rounded-full border border-indigo-500/30 flex items-center gap-2">
                <TestTube className="text-indigo-400 w-4 h-4" />
                <span className="text-white font-bold text-xs">SLOTS: {hybridCount}/{maxSlots}</span>
                <button 
                   onClick={handleBuySlot}
                   className="ml-2 bg-green-600 hover:bg-green-500 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1"
                >
                   <Plus className="w-3 h-3"/> {SLOT_COST}
                </button>
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 pb-40">
        
        {/* Slots */}
        <div className="flex items-center gap-4 w-full justify-center">
          <button 
            onClick={() => { playSound('ui'); setSlot1(null); }}
            className={`w-24 h-24 rounded-2xl border-4 border-dashed flex items-center justify-center text-4xl transition-all overflow-hidden shadow-xl
              ${slot1 ? 'border-purple-500 bg-purple-900/30' : 'border-slate-600 text-slate-600 bg-slate-800/50'}`}
          >
            {slot1 ? (slot1.avatarImage ? <img src={slot1.avatarImage} className="w-full h-full object-cover"/> : slot1.icon) : '+'}
          </button>
          
          <span className="text-2xl font-bold text-white animate-pulse">+</span>
          
          <button 
            onClick={() => { playSound('ui'); setSlot2(null); }}
            className={`w-24 h-24 rounded-2xl border-4 border-dashed flex items-center justify-center text-4xl transition-all overflow-hidden shadow-xl
              ${slot2 ? 'border-purple-500 bg-purple-900/30' : 'border-slate-600 text-slate-600 bg-slate-800/50'}`}
          >
            {slot2 ? (slot2.avatarImage ? <img src={slot2.avatarImage} className="w-full h-full object-cover"/> : slot2.icon) : '+'}
          </button>
        </div>

        {/* Action Area */}
        <div className="min-h-[200px] flex items-center justify-center w-full">
            {isGenerating ? (
              <div className="text-center animate-pulse">
                <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-2 animate-spin" />
                <p className="text-yellow-400 font-display text-xl">Analyzing DNA...</p>
                <p className="text-slate-500 text-sm">Determining Rarity...</p>
              </div>
            ) : result ? (
              <div className={`w-full max-w-xs bg-slate-800 p-4 rounded-3xl border-4 animate-in zoom-in duration-300 shadow-2xl ${RARITY_INFO[result.rarity].border} ${RARITY_INFO[result.rarity].shadow}`}>
                {/* Result Display */}
                <div className={`w-32 h-32 mx-auto bg-black rounded-full mb-4 border-4 overflow-hidden shadow-inner ${RARITY_INFO[result.rarity].border}`}>
                    {result.avatarImage ? (
                      <img src={result.avatarImage} alt="Hybrid" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">?</div>
                    )}
                </div>

                <div className="text-center mb-2">
                    <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-black/50 text-white`}>
                        {result.rarity}
                    </span>
                </div>

                <h3 className="text-3xl font-display text-white text-center mb-1">{result.name}</h3>
                <p className="text-slate-300 text-sm text-center italic mb-4 leading-tight">"{result.description}"</p>
                
                <div className="bg-slate-900 rounded-xl p-3 space-y-1 mb-4">
                  <div className="flex justify-between text-xs text-slate-400 uppercase tracking-widest font-bold">
                     <span>Ability</span>
                     <span className="text-white">{result.ability}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 uppercase tracking-widest font-bold">
                     <span>Potential</span>
                     <span style={{ color: RARITY_INFO[result.rarity].color }}>{result.comboScore}/100</span>
                  </div>
                </div>

                <div className="flex justify-center">
                   <Button variant="gold" size="md" onClick={handleSave} className="w-full">
                     Keep Fighter
                   </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                 {error && (
                     <div className="flex items-center gap-2 text-red-400 font-bold animate-bounce mb-2 text-center text-sm">
                         <AlertCircle className="w-4 h-4" /> {error}
                     </div>
                 )}
                 
                 <Button 
                    disabled={!slot1 || !slot2} 
                    onClick={handleCombine}
                    variant={(!slot1 || !slot2) ? 'secondary' : gold >= FUSION_COST ? 'primary' : 'danger'}
                    size="lg"
                    className={`w-full shadow-xl shadow-purple-500/20 ${(!slot1 || !slot2) ? '' : gold >= FUSION_COST ? '' : 'opacity-50'}`}
                >
                    <div className="flex flex-col items-center leading-none py-1">
                        <span className="text-lg">FUSE DNA</span>
                        {slot1 && slot2 && (
                            <span className={`text-xs font-bold flex items-center gap-1 ${gold >= FUSION_COST ? 'text-yellow-300' : 'text-red-200'}`}>
                                {FUSION_COST} <Coins className="w-3 h-3" />
                            </span>
                        )}
                    </div>
                </Button>
              </div>
            )}
        </div>

        {/* Inventory Selection */}
        <div className="w-full mt-2">
            <h3 className="text-slate-400 font-bold mb-3 uppercase text-sm tracking-wider text-center">Select Ingredients</h3>
            
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {fighters.map(f => {
                const isSelected = slot1?.id === f.id || slot2?.id === f.id;
                const rarity = RARITY_INFO[f.rarity || 'COMMON'];
                
                return (
                  <div key={f.id} className="relative group">
                      <button
                        onClick={() => { playSound('ui'); !slot1 ? setSlot1(f) : !slot2 ? setSlot2(f) : null; }}
                        disabled={isSelected}
                        className={`w-full aspect-square bg-slate-800 rounded-xl flex items-center justify-center text-2xl transition-all overflow-hidden border-2 relative
                        ${isSelected 
                            ? 'opacity-50 cursor-not-allowed border-slate-700' 
                            : `${rarity.border} hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] active:scale-90`
                        }
                        `}
                    >
                        {f.avatarImage ? (
                        <img src={f.avatarImage} className="w-full h-full object-cover" />
                        ) : (
                        f.icon
                        )}
                    </button>
                    {/* Sell Button for Hybrids */}
                    {f.isHybrid && !isSelected && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleSellHybrid(f); }}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-red-500"
                            title={`Sell for ${f.sellPrice}`}
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                    {/* Rarity Indicator */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${rarity.color.replace('text', 'bg')}`}></div>
                  </div>
                );
              })}
            </div>
        </div>
      </div>
    </div>
  );
};
