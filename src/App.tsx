import React, { useState } from 'react';
import { Screen, EmojiFighter, GameResult, PlayerUpgrades, Zone, Difficulty, Artifact } from './types';
import { STARTER_FIGHTERS, GAME_ZONES } from './constants';
import { Home } from './components/Home';
import { BattleArena } from './components/BattleArena';
import { HybridLab } from './components/HybridLab';
import { GameOver } from './components/GameOver';
import { Leaderboard } from './components/Leaderboard';
import { LootShop } from './components/LootShop';
import { playSound } from './components/services/soundService';

export default function App() {
  const [screen, setScreen] = useState<Screen>(Screen.HOME);
  const [fighters, setFighters] = useState<EmojiFighter[]>(STARTER_FIGHTERS);
  const [selectedFighter, setSelectedFighter] = useState<EmojiFighter>(
    STARTER_FIGHTERS.find(f => f.unlocked) || STARTER_FIGHTERS[0]
  );
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  
  // Progression State
  const [gold, setGold] = useState(500); 
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>({
    power: 0,
    speed: 0,
    fireRate: 0,
    health: 0
  });
  
  const [unlockedZones, setUnlockedZones] = useState<string[]>([GAME_ZONES[0].id]);
  const [currentZone, setCurrentZone] = useState<Zone>(GAME_ZONES[0]);
  const [referralClaimed, setReferralClaimed] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');

  // Inventory State
  const [inventory, setInventory] = useState<Artifact[]>([]);
  const [equippedArtifacts, setEquippedArtifacts] = useState<string[]>([]);

  // Handle unlocking new fighters from Hybrid Lab
  const handleUnlock = (newFighter: EmojiFighter) => {
    setFighters(prev => [...prev, newFighter]);
    setSelectedFighter(newFighter); // Auto select new fighter
    setScreen(Screen.HOME);
  };

  const handleSell = (id: string, amount: number) => {
      setFighters(prev => prev.filter(f => f.id !== id));
      setGold(prev => Math.floor(prev + amount));
      if (selectedFighter.id === id) {
          setSelectedFighter(fighters.find(f => f.unlocked && f.id !== id) || STARTER_FIGHTERS[0]);
      }
  };

  const handleBuyFighter = (fighter: EmojiFighter) => {
    if (fighter.price && gold >= fighter.price) {
      setGold(prev => Math.floor(prev - fighter.price!));
      setFighters(prev => prev.map(f => f.id === fighter.id ? { ...f, unlocked: true } : f));
      setSelectedFighter({ ...fighter, unlocked: true });
      playSound('victory');
      return true;
    } else {
      playSound('error');
      return false;
    }
  };

  const handleReferral = () => {
      if (!referralClaimed) {
          playSound('victory');
          setGold(prev => prev + 10000);
          setReferralClaimed(true);
      }
  };

  const handleGameOver = (result: GameResult) => {
    setLastResult(result);
    setGold(prev => Math.floor(prev + result.goldEarned));

    // Unlock next zone if victory on Normal or higher
    if (result.victory && result.difficulty !== 'EASY') {
       const currentIndex = GAME_ZONES.findIndex(z => z.id === result.zoneId);
       if (currentIndex !== -1 && currentIndex < GAME_ZONES.length - 1) {
          const nextZoneId = GAME_ZONES[currentIndex + 1].id;
          if (!unlockedZones.includes(nextZoneId)) {
             setUnlockedZones(prev => [...prev, nextZoneId]);
          }
       }
    }

    setScreen(Screen.GAME_OVER);
  };

  const handleBuyUpgrade = (type: keyof PlayerUpgrades, cost: number) => {
    if (gold >= cost) {
      setGold(prev => Math.floor(prev - cost));
      setUpgrades(prev => ({
        ...prev,
        [type]: prev[type] + 1
      }));
    }
  };
  
  const handleAddArtifact = (artifact: Artifact) => {
      setInventory(prev => [...prev, { ...artifact, id: artifact.id + Date.now() }]); // Unique ID for duplicates
  };

  const handleEquipArtifact = (id: string) => {
      if (equippedArtifacts.includes(id)) {
          setEquippedArtifacts(prev => prev.filter(aid => aid !== id));
      } else {
          if (equippedArtifacts.length < 3) {
              setEquippedArtifacts(prev => [...prev, id]);
          } else {
              // Replace last
              setEquippedArtifacts(prev => [...prev.slice(0,2), id]);
          }
      }
  };

  // Simple "Router"
  const renderScreen = () => {
    switch (screen) {
      case Screen.HOME:
        return (
          <Home 
            onPlay={() => setScreen(Screen.BATTLE)}
            onHybrid={() => setScreen(Screen.HYBRID_LAB)}
            onLeaderboard={() => setScreen(Screen.LEADERBOARD)}
            onLoot={() => setScreen(Screen.LOOT_SHOP)}
            selectedFighter={selectedFighter}
            fighters={fighters}
            onSelectFighter={setSelectedFighter}
            onBuyFighter={handleBuyFighter}
            gold={gold}
            upgrades={upgrades}
            onBuyUpgrade={handleBuyUpgrade}
            unlockedZones={unlockedZones}
            currentZone={currentZone}
            onSelectZone={setCurrentZone}
            onReferral={handleReferral}
            referralClaimed={referralClaimed}
            difficulty={difficulty}
            onSelectDifficulty={setDifficulty}
          />
        );
      case Screen.BATTLE:
        return (
          <BattleArena 
            fighter={selectedFighter}
            upgrades={upgrades}
            zone={currentZone}
            difficulty={difficulty}
            onGameOver={handleGameOver}
            equippedArtifacts={inventory.filter(a => equippedArtifacts.includes(a.id))}
          />
        );
      case Screen.HYBRID_LAB:
        return (
          <HybridLab 
            fighters={fighters.filter(f => f.unlocked)}
            onUnlock={handleUnlock}
            onSell={handleSell}
            onBack={() => setScreen(Screen.HOME)}
            gold={gold}
            onSpendGold={(amount) => setGold(prev => Math.floor(prev - amount))}
          />
        );
      case Screen.LOOT_SHOP:
        return (
          <LootShop 
             gold={gold}
             onSpendGold={(amount) => setGold(prev => Math.floor(prev - amount))}
             inventory={inventory}
             onAddArtifact={handleAddArtifact}
             onBack={() => setScreen(Screen.HOME)}
             equipped={equippedArtifacts}
             onEquip={handleEquipArtifact}
          />
        );
      case Screen.LEADERBOARD:
        return (
          <Leaderboard onBack={() => setScreen(Screen.HOME)} />
        );
      case Screen.GAME_OVER:
        return lastResult ? (
          <GameOver 
            result={lastResult}
            onReplay={() => setScreen(Screen.BATTLE)}
            onHome={() => setScreen(Screen.HOME)}
          />
        ) : null;
      default:
        return <div className="text-white">Loading...</div>;
    }
  };

  return (
    <div className="w-full h-screen bg-slate-950 relative overflow-hidden">
      {/* Render Current Screen */}
      {renderScreen()}

      {/* Optional API Key Warning for Demo */}
      {!process.env.API_KEY && screen !== Screen.BATTLE && (
         <div className="absolute bottom-2 left-2 right-2 bg-red-900/80 text-red-200 text-xs p-2 rounded text-center pointer-events-none z-50">
           Demo Mode: AI features limited. Set API_KEY in env.
         </div>
      )}
    </div>
  );
}