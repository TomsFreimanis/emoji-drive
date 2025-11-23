// src/App.tsx
import React, { useState, useEffect } from 'react';

import {
  Screen,
  EmojiFighter,
  GameResult,
  PlayerUpgrades,
  Zone,
  Difficulty,
  Artifact,
} from './types';

import { STARTER_FIGHTERS, GAME_ZONES } from './constants';

// UI screens
import { Home } from './components/Home';
import { BattleArena } from './components/BattleArena';
import { HybridLab } from './components/HybridLab';
import { GameOver } from './components/GameOver';
import { Leaderboard } from './components/Leaderboard';
import { LootShop } from './components/LootShop';

// Sounds
import { playSound } from './services/soundService';

// Firebase cloud sync
import {
  signInWithGoogle,
  signOut,
  onAuthChanged,
  saveGameToCloud,
  loadGameFromCloud,
  CloudSaveData,
  getCurrentUser,
} from './services/cloudSave';


export default function App() {
  // Active screen
  const [screen, setScreen] = useState<Screen>(Screen.HOME);

  // Player progression
  const [fighters, setFighters] = useState<EmojiFighter[]>(STARTER_FIGHTERS);
  const [selectedFighter, setSelectedFighter] = useState<EmojiFighter>(
    STARTER_FIGHTERS.find(f => f.unlocked) || STARTER_FIGHTERS[0]
  );

  const [gold, setGold] = useState(500);
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>({
    power: 0,
    speed: 0,
    fireRate: 0,
    health: 0,
  });

  const [unlockedZones, setUnlockedZones] = useState<string[]>([
    GAME_ZONES[0].id,
  ]);
  const [currentZone, setCurrentZone] = useState<Zone>(GAME_ZONES[0]);

  const [referralClaimed, setReferralClaimed] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');

  // Loot / artifacts
  const [inventory, setInventory] = useState<Artifact[]>([]);
  const [equippedArtifacts, setEquippedArtifacts] = useState<string[]>([]);

  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  // ----------------------------------------------------------
  // 🟦 FIREBASE CLOUD SYNC — AUTO LOAD ON LOGIN
  // ----------------------------------------------------------
  useEffect(() => {
    const unsub = onAuthChanged(async (user) => {
      if (!user) return;

      const cloud = await loadGameFromCloud(user.uid);
      if (!cloud) return;

      console.log("Loaded cloud save:", cloud);

      setGold(cloud.gold);
      setUpgrades(cloud.upgrades);
      setInventory(cloud.inventory);
      setEquippedArtifacts(cloud.equippedArtifactIds);
      setUnlockedZones(cloud.unlockedZoneIds);
      setCurrentZone(GAME_ZONES.find(z => z.id === cloud.currentZoneId) || GAME_ZONES[0]);
      setSelectedFighter(
        cloud.fighters.find(f => f.id === cloud.selectedFighterId) ||
        STARTER_FIGHTERS[0]
      );
      setFighters(cloud.fighters);
      setDifficulty(cloud.difficulty);
      setReferralClaimed(cloud.referralClaimed);
    });

    return () => unsub();
  }, []);

  // ----------------------------------------------------------
  // 🟩 AUTO-SAVE TO FIREBASE
  // ----------------------------------------------------------
  const cloudSave = async () => {
    const user = getCurrentUser();
    if (!user) return;

    const data: CloudSaveData = {
      gold,
      upgrades,
      inventory,
      equippedArtifactIds: equippedArtifacts,
      unlockedZoneIds: unlockedZones,
      currentZoneId: currentZone.id,
      selectedFighterId: selectedFighter.id,
      fighters,
      difficulty,
      referralClaimed,
    };

    await saveGameToCloud(user.uid, data);
  };

  // save on any change
  useEffect(() => {
    cloudSave();
  }, [
    gold,
    upgrades,
    inventory,
    equippedArtifacts,
    unlockedZones,
    currentZone,
    difficulty,
    fighters,
    referralClaimed,
    selectedFighter,
  ]);


  // ----------------------------------------------------------
  // 🟧 GAME LOGIC
  // ----------------------------------------------------------

  const handleUnlock = (newFighter: EmojiFighter) => {
    setFighters(prev => [...prev, newFighter]);
    setSelectedFighter(newFighter);
    setScreen(Screen.HOME);
  };

  const handleSell = (id: string, amount: number) => {
    setFighters(prev => prev.filter(f => f.id !== id));
    setGold(prev => prev + amount);

    if (selectedFighter.id === id) {
      const next = fighters.find(f => f.unlocked && f.id !== id) || STARTER_FIGHTERS[0];
      setSelectedFighter(next);
    }
  };

  const handleBuyFighter = (fighter: EmojiFighter) => {
    if (fighter.price && gold >= fighter.price) {
      setGold(prev => prev - fighter.price!);
      setFighters(prev => prev.map(f =>
        f.id === fighter.id ? { ...f, unlocked: true } : f
      ));
      setSelectedFighter({ ...fighter, unlocked: true });
      playSound('victory');
      return true;
    }
    playSound('error');
    return false;
  };

  const handleReferral = () => {
    if (!referralClaimed) {
      setGold(g => g + 10000);
      setReferralClaimed(true);
      playSound('victory');
    }
  };

  const handleBuyUpgrade = (type: keyof PlayerUpgrades, cost: number) => {
    if (gold < cost) return;
    setGold(g => g - cost);
    setUpgrades(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const handleGameOver = (result: GameResult) => {
    setLastResult(result);
    setGold(g => g + result.goldEarned);

    if (result.victory && result.difficulty !== 'EASY') {
      const idx = GAME_ZONES.findIndex(z => z.id === result.zoneId);
      if (idx !== -1 && idx < GAME_ZONES.length - 1) {
        const next = GAME_ZONES[idx + 1].id;
        if (!unlockedZones.includes(next)) {
          setUnlockedZones(u => [...u, next]);
        }
      }
    }

    setScreen(Screen.GAME_OVER);
  };

  // Add artifact to inventory
  const handleAddArtifact = (a: Artifact) => {
    setInventory(prev => [...prev, { ...a, id: a.id + '-' + Date.now() }]);
  };

  // Equip artifacts — 5 slots max
  const handleEquipArtifact = (id: string) => {
    setEquippedArtifacts(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length < 5) return [...prev, id];
      return [...prev.slice(1), id]; // remove 1st, add new
    });
  };


  // ----------------------------------------------------------
  // UI ROUTER
  // ----------------------------------------------------------
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

            equippedArtifacts={inventory.filter(a => equippedArtifacts.includes(a.id))}
          />
        );

      case Screen.BATTLE:
        return (
          <BattleArena
            fighter={selectedFighter}
            upgrades={upgrades}
            zone={currentZone}
            difficulty={difficulty}
            equippedArtifacts={inventory.filter(a => equippedArtifacts.includes(a.id))}
            onGameOver={handleGameOver}
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
            onSpendGold={amount => setGold(g => g - amount)}
          />
        );

      case Screen.LOOT_SHOP:
        return (
          <LootShop
            gold={gold}
            onSpendGold={amount => setGold(g => g - amount)}
            inventory={inventory}
            onAddArtifact={handleAddArtifact}
            equipped={equippedArtifacts}
            onEquip={handleEquipArtifact}
            onBack={() => setScreen(Screen.HOME)}
          />
        );

      case Screen.LEADERBOARD:
        return <Leaderboard onBack={() => setScreen(Screen.HOME)} />;

      case Screen.GAME_OVER:
        return lastResult ? (
          <GameOver
            result={lastResult}
            onReplay={() => setScreen(Screen.BATTLE)}
            onHome={() => setScreen(Screen.HOME)}
          />
        ) : null;

      default:
        return <div className="text-white">Loading…</div>;
    }
  };


  return (
    <div className="w-full h-screen bg-slate-950 overflow-hidden relative">
      {renderScreen()}
    </div>
  );
}
