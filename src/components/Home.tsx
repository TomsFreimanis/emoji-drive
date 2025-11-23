import React, { useState, useMemo } from 'react';
import {
  EmojiFighter,
  PlayerUpgrades,
  Zone,
  WeaponType,
  Difficulty,
  Artifact,
  Rarity,
} from '../types';
import { Button } from './ui/Button';
import {
  Zap,
  ShoppingBag,
  Sparkles,
  Coins,
  ArrowUpCircle,
  X,
  Lock,
  Crosshair,
  ChevronRight,
  Swords,
  BarChart3,
  UserPlus,
  CheckCircle,
  Trophy,
  Briefcase,
} from 'lucide-react';
import { GAME_ZONES, DIFFICULTY_TIERS, RARITY_INFO } from '../constants';
import { playSound } from '../services/soundService';

interface HomeProps {
  onPlay: () => void;
  onHybrid: () => void;
  onLeaderboard: () => void;
  onLoot: () => void;
  selectedFighter: EmojiFighter;
  fighters: EmojiFighter[];
  onSelectFighter: (f: EmojiFighter) => void;
  onBuyFighter: (f: EmojiFighter) => boolean;
  gold: number;
  upgrades: PlayerUpgrades;
  onBuyUpgrade: (type: keyof PlayerUpgrades, cost: number) => void;
  unlockedZones: string[];
  currentZone: Zone;
  onSelectZone: (z: Zone) => void;
  onReferral: () => void;
  referralClaimed: boolean;
  difficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;

  // NEW: pilns artifacts saraksts, kas ekipēts (no App)
  equippedArtifacts: Artifact[];
}

const WEAPON_INFO: Record<WeaponType, { name: string; desc: string }> = {
  BLASTER: { name: 'Blaster', desc: 'Balanced damage & speed.' },
  SHOTGUN: { name: 'Shotgun', desc: 'Short range, spread fire.' },
  SNIPER: { name: 'Sniper', desc: 'Long range, high damage.' },
  RAPID: { name: 'Rapid', desc: 'High fire rate, low accuracy.' },
  HOMING: { name: 'Homing', desc: 'Projectiles seek enemies.' },
};

const RARITY_RANK: Record<Rarity, number> = {
  COMMON: 0,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3,
  MYTHIC: 4,
};

export const Home: React.FC<HomeProps> = ({
  onPlay,
  onHybrid,
  onLeaderboard,
  onLoot,
  selectedFighter,
  fighters,
  onSelectFighter,
  onBuyFighter,
  gold,
  upgrades,
  onBuyUpgrade,
  unlockedZones,
  currentZone,
  onSelectZone,
  onReferral,
  referralClaimed,
  difficulty,
  onSelectDifficulty,
  equippedArtifacts,
}) => {
  const [showShop, setShowShop] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

  const upgradeCosts = {
    power: 100 * (upgrades.power + 1),
    speed: 100 * (upgrades.speed + 1),
    fireRate: 150 * (upgrades.fireRate + 1),
    health: 100 * (upgrades.health + 1),
  };

  const handleBuy = (type: keyof PlayerUpgrades, cost: number) => {
    playSound('ui');
    onBuyUpgrade(type, cost);
  };

  const handleSelectOrBuy = (f: EmojiFighter) => {
    if (f.unlocked) {
      playSound('ui');
      onSelectFighter(f);
    } else {
      onBuyFighter(f);
    }
  };

  // ======== TOTAL BUILD STATS (fighter + upgrades + gear) ========
  const totalStats = useMemo(() => {
    const basePower = selectedFighter.baseStats.power ?? 0;
    const baseSpeed = selectedFighter.baseStats.speed ?? 0;

    const artifactTotals = equippedArtifacts.reduce(
      (acc, art) => {
        const s: any = (art as any).stats || {};
        acc.power += s.power ?? 0;
        acc.speed += s.speed ?? 0;
        acc.health += s.health ?? s.defense ?? 0;
        acc.fireRate += s.fireRate ?? 0;
        acc.lifeSteal += s.lifeSteal ?? 0;
        acc.critChance += s.critChance ?? 0;
        acc.goldMult += s.goldMult ?? 0;
        return acc;
      },
      {
        power: 0,
        speed: 0,
        health: 0,
        fireRate: 0,
        lifeSteal: 0,
        critChance: 0,
        goldMult: 0,
      },
    );

    return {
      power: basePower + upgrades.power * 1 + artifactTotals.power * 10,
      speed: baseSpeed + upgrades.speed * 1 + artifactTotals.speed * 10,
      health: 100 + upgrades.health * 25 + artifactTotals.health * 80,
      fireRate: 1 + upgrades.fireRate * 0.08 + artifactTotals.fireRate * 0.5,
      lifeSteal: artifactTotals.lifeSteal,
      critChance: artifactTotals.critChance,
      goldMult: 1 + artifactTotals.goldMult,
    };
  }, [selectedFighter, upgrades, equippedArtifacts]);

  const totalPowerScore = useMemo(() => {
    return Math.round(
      totalStats.power * 8 +
        totalStats.health * 0.25 +
        totalStats.fireRate * 12 +
        totalStats.speed * 5 +
        (totalStats.critChance || 0) * 50 +
        (totalStats.lifeSteal || 0) * 60,
    );
  }, [totalStats]);

  const powerBar = Math.max(1, Math.min(10, Math.round(totalStats.power)));
  const speedBar = Math.max(1, Math.min(10, Math.round(totalStats.speed)));

  const renderReferralModal = () => (
    <div className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-700 p-6 shadow-2xl relative ring-1 ring-white/10 text-center">
        <button
          onClick={() => setShowReferralModal(false)}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-2"
        >
          <X className="w-5 h-5" />
        </button>

        <UserPlus className="w-14 h-14 text-green-400 mx-auto mb-3" />
        <h2 className="text-xl font-display text-white mb-2">INVITE A FRIEND</h2>
        <p className="text-slate-400 text-xs mb-4">
          Send a link to your squad. If they join, you get a massive gold bonus to kickstart your
          collection!
        </p>

        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between mb-4">
          <code className="text-slate-400 text-[11px] truncate">
            emojioverdrive.com/join/u/123
          </code>
          <Button size="sm" variant="secondary" className="text-[10px] h-8 px-2">
            COPY
          </Button>
        </div>

        {referralClaimed ? (
          <Button
            variant="secondary"
            disabled
            className="w-full bg-green-900/30 text-green-400 border-green-800"
          >
            <CheckCircle className="w-4 h-4 mr-2" /> REWARD CLAIMED
          </Button>
        ) : (
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={() => {
              onReferral();
              setShowReferralModal(false);
            }}
          >
            <div className="flex flex-col items-center leading-none">
              <span>INVITE & CLAIM</span>
              <span className="text-xs font-bold mt-1 text-yellow-800">+10,000 GOLD</span>
            </div>
          </Button>
        )}
      </div>
    </div>
  );

  const renderShop = () => (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-700 p-6 shadow-2xl relative ring-1 ring-white/10">
        <button
          onClick={() => setShowShop(false)}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-2"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="bg-slate-800 p-2 rounded-lg">
            <ShoppingBag className="text-yellow-400 w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display text-white leading-none">ITEM SHOP</h2>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest">
              Permanent Upgrades
            </p>
          </div>
          <div className="bg-black/30 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
            <Coins className="text-yellow-400 w-4 h-4" />
            <span className="text-white font-bold text-sm">{Math.floor(gold)}</span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          {/* Power */}
          <div className="bg-slate-800/50 p-3 rounded-xl flex justify-between items-center border border-slate-700/50 hover:bg-slate-800 transition-colors">
            <div>
              <h3 className="text-white font-bold uppercase flex items-center gap-2 text-xs">
                <Swords className="w-4 h-4 text-red-400" /> Damage
              </h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Lvl {upgrades.power}</p>
            </div>
            <Button
              size="sm"
              variant="gold"
              disabled={gold < upgradeCosts.power}
              onClick={() => handleBuy('power', upgradeCosts.power)}
              className={gold < upgradeCosts.power ? 'opacity-50 saturate-0' : ''}
            >
              {upgradeCosts.power} <Coins className="w-3 h-3 ml-1 inline" />
            </Button>
          </div>

          {/* Fire Rate */}
          <div className="bg-slate-800/50 p-3 rounded-xl flex justify-between items-center border border-slate-700/50 hover:bg-slate-800 transition-colors">
            <div>
              <h3 className="text-white font-bold uppercase flex items-center gap-2 text-xs">
                <ArrowUpCircle className="w-4 h-4 text-yellow-400" /> Fire Rate
              </h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Lvl {upgrades.fireRate}</p>
            </div>
            <Button
              size="sm"
              variant="gold"
              disabled={gold < upgradeCosts.fireRate}
              onClick={() => handleBuy('fireRate', upgradeCosts.fireRate)}
              className={gold < upgradeCosts.fireRate ? 'opacity-50 saturate-0' : ''}
            >
              {upgradeCosts.fireRate} <Coins className="w-3 h-3 ml-1 inline" />
            </Button>
          </div>

          {/* Speed */}
          <div className="bg-slate-800/50 p-3 rounded-xl flex justify-between items-center border border-slate-700/50 hover:bg-slate-800 transition-colors">
            <div>
              <h3 className="text-white font-bold uppercase flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-blue-400" /> Move Speed
              </h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Lvl {upgrades.speed}</p>
            </div>
            <Button
              size="sm"
              variant="gold"
              disabled={gold < upgradeCosts.speed}
              onClick={() => handleBuy('speed', upgradeCosts.speed)}
              className={gold < upgradeCosts.speed ? 'opacity-50 saturate-0' : ''}
            >
              {upgradeCosts.speed} <Coins className="w-3 h-3 ml-1 inline" />
            </Button>
          </div>

          {/* Health */}
          <div className="bg-slate-800/50 p-3 rounded-xl flex justify-between items-center border border-slate-700/50 hover:bg-slate-800 transition-colors">
            <div>
              <h3 className="text-white font-bold uppercase flex items-center gap-2 text-xs">
                <Trophy className="w-4 h-4 text-green-400" /> Max HP
              </h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Lvl {upgrades.health}</p>
            </div>
            <Button
              size="sm"
              variant="gold"
              disabled={gold < upgradeCosts.health}
              onClick={() => handleBuy('health', upgradeCosts.health)}
              className={gold < upgradeCosts.health ? 'opacity-50 saturate-0' : ''}
            >
              {upgradeCosts.health} <Coins className="w-3 h-3 ml-1 inline" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const isZoneLocked = !unlockedZones.includes(currentZone.id);
  const weaponInfo = WEAPON_INFO[selectedFighter.weapon];
  const rarityInfo = RARITY_INFO[selectedFighter.rarity || 'COMMON'];
  const diffInfo = DIFFICULTY_TIERS[difficulty];

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />

      {showShop && renderShop()}
      {showReferralModal && renderReferralModal()}

      {/* Centered mobile wrapper */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col h-[100dvh] px-3 sm:px-4">
        {/* Top Bar */}
        <div className="flex justify-between items-center pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 p-1.5 rounded-lg shadow-lg shadow-yellow-500/20">
              <Zap className="text-slate-900 w-5 h-5" fill="currentColor" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base sm:text-lg font-display text-white tracking-wider">EMOJI</h1>
              <span className="text-yellow-400 font-display text-xs sm:text-sm tracking-widest block -mt-0.5">
                OVERDRIVE
              </span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => {
                playSound('ui');
                setShowReferralModal(true);
              }}
              className="bg-green-900/50 hover:bg-green-800/50 p-2 rounded-full border border-green-700/50 transition-all active:scale-95 relative"
            >
              <UserPlus className="w-5 h-5 text-green-400" />
              {!referralClaimed && (
                <>
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full" />
                </>
              )}
            </button>

            <button
              onClick={() => {
                playSound('ui');
                onLeaderboard();
              }}
              className="bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full border border-slate-600 transition-all active:scale-95"
            >
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </button>

            <button
              onClick={() => {
                playSound('ui');
                onLoot();
              }}
              className="bg-slate-800/80 hover:bg-slate-700 p-2 rounded-full border border-slate-600 transition-all active:scale-95"
              title="Gear"
            >
              <Briefcase className="w-5 h-5 text-purple-400" />
            </button>

            <button
              onClick={() => {
                playSound('ui');
                setShowShop(true);
              }}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 pr-3 pl-2 py-1.5 rounded-full border border-slate-600 transition-all active:scale-95"
            >
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-bold text-sm">{Math.floor(gold)}</span>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
          <div className="flex flex-col gap-5 pt-1">
            {/* World Map Section */}
            <div className="w-full">
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    Mission Select
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    ZONE {unlockedZones.indexOf(currentZone.id) + 1} / {GAME_ZONES.length}
                  </span>
                </div>

                {/* Map Nodes */}
                <div className="relative w-full overflow-x-auto pb-3 no-scrollbar touch-pan-x">
                  <div className="flex items-center gap-4 px-2 py-2 min-w-max relative">
                    <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-800 -z-0 -translate-y-1/2 rounded-full" />
                    {GAME_ZONES.map((zone) => {
                      const isUnlocked = unlockedZones.includes(zone.id);
                      const isSelected = currentZone.id === zone.id;
                      return (
                        <button
                          key={zone.id}
                          onClick={() => {
                            if (isUnlocked) {
                              playSound('ui');
                              onSelectZone(zone);
                            }
                          }}
                          disabled={!isUnlocked}
                          className={`relative z-10 transition-all duration-300 group flex flex-col items-center gap-1 ${
                            isSelected ? 'scale-110' : 'scale-100'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border-2 flex items-center justify-center text-lg sm:text-xl shadow-lg transition-all relative overflow-hidden
                              ${
                                isSelected
                                  ? 'border-yellow-400 bg-slate-800 shadow-yellow-500/20'
                                  : isUnlocked
                                  ? 'border-indigo-500/50 bg-slate-800'
                                  : 'border-slate-800 bg-slate-900 opacity-40'
                              }
                            `}
                          >
                            {isSelected && (
                              <div className="absolute inset-0 bg-yellow-400/10 animate-pulse" />
                            )}
                            {isUnlocked ? zone.icon : <Lock className="w-4 h-4 text-slate-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Zone Details */}
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-3 bg-black/20 rounded-xl p-3 border border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-lg border border-slate-700">
                      {currentZone.bossIcon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center gap-2">
                        <h3 className="text-white font-bold text-xs tracking-wide">
                          {currentZone.name}
                        </h3>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-2 rounded-full ${
                                i < currentZone.difficulty ? 'bg-red-500' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5 leading-tight">
                        {currentZone.description}
                      </p>
                    </div>
                  </div>

                  {/* Difficulty Select */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(['EASY', 'NORMAL', 'HARD', 'EXTREME'] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          playSound('ui');
                          onSelectDifficulty(d);
                        }}
                        className={`py-1.5 rounded-lg text-[9px] font-bold uppercase border transition-all
                          ${
                            difficulty === d
                              ? 'bg-slate-800 border-white text-white shadow'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
                          }
                        `}
                      >
                        <div className={DIFFICULTY_TIERS[d].color}>
                          {DIFFICULTY_TIERS[d].label}
                        </div>
                        <div className="text-[8px] mt-0.5 text-slate-500 opacity-80">
                          x{DIFFICULTY_TIERS[d].goldMult} Gold
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Showcase */}
            <div className="flex flex-col items-center relative py-1">
              <div className="text-center mb-3">
                <h2 className="text-xl sm:text-2xl font-display text-white drop-shadow-lg">
                  {selectedFighter.name}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {weaponInfo.name}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest bg-black/50 px-2 py-0.5 rounded border border-white/10"
                    style={{ color: rarityInfo.color }}
                  >
                    {selectedFighter.rarity}
                  </span>
                </div>
              </div>

              {/* Main Character Avatar */}
              <div className="relative z-10 mb-2 sm:mb-3">
                <div
                  className="absolute inset-0 blur-[40px] sm:blur-[60px] rounded-full animate-pulse opacity-40"
                  style={{ backgroundColor: rarityInfo.color }}
                />
                <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 relative transform transition-transform hover:scale-105 duration-300 group">
                  {selectedFighter.avatarImage ? (
                    <img
                      src={selectedFighter.avatarImage}
                      className={`w-full h-full object-cover rounded-3xl border-4 shadow-2xl rotate-3 group-hover:rotate-0 transition-all ${rarityInfo.border}`}
                      alt={selectedFighter.name}
                    />
                  ) : (
                    <div
                      className={`w-full h-full flex items-center justify-center text-[3.5rem] sm:text-[4.5rem] md:text-[5rem] drop-shadow-2xl bg-slate-800 rounded-3xl border-4 rotate-3 group-hover:rotate-0 transition-all ${rarityInfo.border}`}
                    >
                      {selectedFighter.icon}
                    </div>
                  )}

                  <div className="absolute -bottom-3 -right-3 bg-slate-800 p-2 rounded-full border border-slate-700 shadow-lg">
                    {selectedFighter.weapon === 'BLASTER' && (
                      <Crosshair className="w-4 h-4 text-yellow-400" />
                    )}
                    {selectedFighter.weapon === 'SNIPER' && (
                      <Crosshair className="w-4 h-4 text-blue-400" />
                    )}
                    {selectedFighter.weapon === 'SHOTGUN' && (
                      <Crosshair className="w-4 h-4 text-red-400" />
                    )}
                    {selectedFighter.weapon === 'RAPID' && (
                      <Zap className="w-4 h-4 text-green-400" />
                    )}
                    {selectedFighter.weapon === 'HOMING' && (
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Equipped Artifacts strip (glow by rarity) */}
              {equippedArtifacts.length > 0 && (
                <div className="mt-1 mb-2 w-full max-w-xs mx-auto bg-slate-900/80 border border-slate-700 rounded-2xl px-2 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[9px] uppercase text-slate-400 font-bold mr-1">
                    Gear
                  </span>
                  {equippedArtifacts.map((a) => {
                    const rInfo = RARITY_INFO[a.rarity || 'COMMON'];
                    const rank = RARITY_RANK[a.rarity || 'COMMON'];
                    return (
                      <div
                        key={a.id}
                        className={`
                          relative w-8 h-8 rounded-xl flex items-center justify-center text-lg border ${rInfo.border}
                          ${
                            rank >= 2
                              ? 'shadow-[0_0_15px_rgba(129,140,248,0.7)] animate-[pulse_1.6s_ease-in-out_infinite]'
                              : ''
                          }
                        `}
                      >
                        {rank >= 1 && (
                          <div
                            className={`absolute inset-0 rounded-xl blur-md opacity-50 ${rInfo.color.replace(
                              'text',
                              'bg',
                            )}`}
                          />
                        )}
                        <span className="relative z-10 drop-shadow">{a.icon}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
                {/* TOTAL BUILD STATS */}
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">
                      Build Power
                    </div>
                    <div className="text-[11px] text-yellow-300 font-semibold">
                      {totalPowerScore.toLocaleString()}{' '}
                      <span className="text-[9px] text-slate-400">BP</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mb-1">
                        <span>Damage</span>
                        <span className="text-[9px] text-slate-300">
                          {totalStats.power.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex gap-0.5 h-1.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full ${
                              i < powerBar ? 'bg-red-500' : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mb-1">
                        <span>Speed</span>
                        <span className="text-[9px] text-slate-300">
                          {totalStats.speed.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex gap-0.5 h-1.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full ${
                              i < speedBar ? 'bg-blue-500' : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ability + extra stats */}
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 backdrop-blur-sm flex flex-col justify-center">
                  <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">
                    Special Ability
                  </p>
                  <p className="text-white font-display tracking-wide text-sm">
                    {selectedFighter.ability}
                  </p>
                  <p className="text-[9px] text-slate-500 leading-tight mt-1 italic">
                    "{selectedFighter.description}"
                  </p>

                  <div className="mt-2 grid grid-cols-3 gap-1 text-[9px] text-slate-300">
                    <div className="flex flex-col">
                      <span className="text-slate-500 uppercase">HP</span>
                      <span>{Math.round(totalStats.health)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 uppercase">Fire Rate</span>
                      <span>{totalStats.fireRate.toFixed(2)}x</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 uppercase">Gold</span>
                      <span>{Math.round(totalStats.goldMult * 100)}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 uppercase">Crit</span>
                      <span>
                        {totalStats.critChance ? Math.round(totalStats.critChance * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 uppercase">Vamp</span>
                      <span>{totalStats.lifeSteal || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls (fixed in wrapper) */}
        <div className="absolute bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-lg border-t border-white/5 p-3 sm:p-4 pb-6 flex flex-col gap-3 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {/* Fighter Scroll List */}
          <div className="w-full overflow-x-auto no-scrollbar pb-1.5">
            <div className="flex gap-3 min-w-max px-1">
              {fighters.map((f) => {
                const rInfo = RARITY_INFO[f.rarity || 'COMMON'];
                const isSelected = selectedFighter.id === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleSelectOrBuy(f)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 transition-all overflow-hidden relative group flex flex-col items-center justify-center
                      ${
                        f.unlocked
                          ? isSelected
                            ? `border-white bg-slate-800 ${rInfo.shadow} scale-105`
                            : `${rInfo.border} bg-slate-900 opacity-80 hover:opacity-100 hover:scale-105`
                          : 'border-slate-800 bg-black/50 grayscale opacity-70 hover:opacity-100 hover:border-green-500'
                      }
                    `}
                  >
                    {!f.unlocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
                        <Lock className="w-4 h-4 text-slate-400 mb-1" />
                        <div className="flex items-center text-[8px] font-bold text-yellow-400 bg-black/80 px-1 rounded">
                          {f.price} <Coins className="w-2 h-2 ml-0.5" />
                        </div>
                      </div>
                    )}

                    {f.avatarImage ? (
                      <img src={f.avatarImage} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-2xl sm:text-3xl">{f.icon}</div>
                    )}
                    {f.unlocked && (
                      <div
                        className={`absolute bottom-0 left-0 right-0 h-1 ${rInfo.color.replace(
                          'text',
                          'bg',
                        )}`}
                      ></div>
                    )}
                  </button>
                );
              })}

              {/* Hybrid Button */}
              <button
                onClick={() => {
                  playSound('ui');
                  onHybrid();
                }}
                className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center gap-1 hover:border-purple-500 hover:text-purple-400 text-slate-500 transition-colors group"
              >
                <Sparkles className="w-5 h-5 group-hover:animate-spin" />
                <span className="text-[8px] font-bold uppercase">Create</span>
              </button>
            </div>
          </div>

          {/* Main Action Button */}
          {isZoneLocked ? (
            <Button variant="secondary" className="w-full opacity-50 py-3 text-xs sm:text-sm" disabled>
              <Lock className="w-4 h-4 mr-2" /> COMPLETE ZONE {unlockedZones.length} FIRST
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full shadow-xl shadow-indigo-500/30 py-3 text-base sm:text-lg group"
              onClick={() => {
                playSound('ui');
                onPlay();
              }}
            >
              <div className="flex flex-col items-center leading-none">
                <div className="flex items-center">
                  <span className="group-hover:mr-2 transition-all">START MISSION</span>
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -ml-4 group-hover:ml-0" />
                </div>
                <span
                  className={`text-[9px] uppercase tracking-widest mt-1 ${diffInfo.color}`}
                >
                  {diffInfo.label} Difficulty
                </span>
              </div>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
