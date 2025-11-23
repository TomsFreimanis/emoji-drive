import React, { useMemo, useState } from 'react';
import { Artifact, Rarity } from '../types';
import { ARTIFACTS, LOOT_BOXES, RARITY_INFO } from '../constants';
import { Button } from './ui/Button';
import {
  ArrowLeft,
  Coins,
  Gift,
  Briefcase,
  CheckCircle,
  Sparkles,
  ArrowUpCircle,
} from 'lucide-react';
import { playSound } from '../services/soundService';

interface LootShopProps {
  gold: number;
  onSpendGold: (amount: number) => void;
  inventory: Artifact[];
  onAddArtifact: (artifact: Artifact) => void;
  onBack: () => void;

  // EQUIP
  // equipped = saraksts ar ekipoto artefaktu ID
  // (max 5 gab.)
  equipped: string[];
  onEquip: (id: string) => void; // toggle equip / unequip
}

const EQUIP_SLOTS = 5;

const rarityOrder: Record<Rarity, number> = {
  COMMON: 0,
  RARE: 1,
  EPIC: 2,
  LEGENDARY: 3,
  MYTHIC: 4,
};

const rarityChain: Rarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];

const getNextRarity = (r: Rarity): Rarity | null => {
  const idx = rarityChain.indexOf(r);
  if (idx === -1 || idx === rarityChain.length - 1) return null;
  return rarityChain[idx + 1];
};

const getArtifactShortStats = (artifact: Artifact): string | null => {
  const stats: any = (artifact as any).stats;
  if (!stats) return null;

  const parts: string[] = [];
  if (stats.power) parts.push(`+${Math.round(stats.power * 100)}% DMG`);
  if (stats.defense) parts.push(`+${Math.round(stats.defense * 100)}% HP`);
  if (stats.speed) parts.push(`+${Math.round(stats.speed * 100)}% SPD`);
  if (stats.lifeSteal) parts.push(`+${stats.lifeSteal} Vamp`);
  if (stats.critChance) parts.push(`+${Math.round(stats.critChance * 100)}% Crit`);
  if (stats.goldMult) parts.push(`+${Math.round(stats.goldMult * 100)}% Gold`);

  return parts.length ? parts.join(' · ') : null;
};

export const LootShop: React.FC<LootShopProps> = ({
  gold,
  onSpendGold,
  inventory,
  onAddArtifact,
  onBack,
  equipped,
  onEquip,
}) => {
  const [openingBox, setOpeningBox] = useState<string | null>(null);
  const [animState, setAnimState] = useState<'IDLE' | 'SHAKING' | 'REVEAL'>('IDLE');
  const [reward, setReward] = useState<Artifact | null>(null);
  const [activeTab, setActiveTab] = useState<'SHOP' | 'GEAR'>('SHOP');
  const [inspect, setInspect] = useState<Artifact | null>(null);
  const [shards, setShards] = useState<number>(0);
  const [lastShardBonus, setLastShardBonus] = useState<number>(0);
  const [upgradePreview, setUpgradePreview] = useState<Artifact | null>(null);

  // ====== helper dati ======
  const countsById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of inventory) {
      map[a.id] = (map[a.id] || 0) + 1;
    }
    return map;
  }, [inventory]);

  const upgradeableList = useMemo(
    () =>
      inventory
        .filter((a, idx, self) => self.findIndex((x) => x.id === a.id) === idx)
        .map((artifact) => ({
          artifact,
          count: countsById[artifact.id] || 0,
        }))
        .filter(({ artifact, count }) => {
          const next = getNextRarity(artifact.rarity);
          return count >= 3 && next !== null;
        }),
    [inventory, countsById],
  );

  // ====== BOX BUY / ROLL ======

  const handleBuy = (boxId: string) => {
    const box = LOOT_BOXES.find((b) => b.id === boxId);
    if (!box) return;

    if (gold < box.price) {
      playSound('error');
      return;
    }

    onSpendGold(box.price);
    setOpeningBox(boxId);
    setAnimState('SHAKING');
    setReward(null);
    setLastShardBonus(0);
    setUpgradePreview(null);

    playSound('gacha_shake');
    setTimeout(() => playSound('gacha_shake'), 200);
    setTimeout(() => playSound('gacha_shake'), 400);
    setTimeout(() => playSound('gacha_shake'), 600);

    setTimeout(() => {
      setAnimState('REVEAL');
      playSound('gacha_open');

      // RARITY roll
      const rand = Math.random() * 100;
      let current = 0;
      let rarity: Rarity = 'COMMON';

      if (rand < (current += box.chances.COMMON)) rarity = 'COMMON';
      else if (rand < (current += box.chances.RARE)) rarity = 'RARE';
      else if (rand < (current += box.chances.EPIC)) rarity = 'EPIC';
      else if (rand < (current += box.chances.LEGENDARY)) rarity = 'LEGENDARY';
      else rarity = 'MYTHIC';

      const pool = ARTIFACTS.filter((a) => a.rarity === rarity);
      const item = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : ARTIFACTS[0];

      // ultra rare shard (kosmētiska valūta, var vēlāk izmantot)
      const shardRoll = Math.random();
      const gainedShards = shardRoll < 0.05 ? 1 : 0; // 5% chance
      if (gainedShards > 0) {
        setShards((prev) => prev + gainedShards);
        setLastShardBonus(gainedShards);
      }

      setTimeout(() => {
        setReward(item);
        onAddArtifact(item);
        playSound('item_reveal');
        setInspect(item);
      }, 450);
    }, 900);
  };

  // CLAIM + auto-equip brīvā slotā
  const handleClaim = () => {
    if (reward) {
      if (!equipped.includes(reward.id) && equipped.length < EQUIP_SLOTS) {
        playSound('ui');
        onEquip(reward.id);
      }
    }
    reset();
  };

  const reset = () => {
    setOpeningBox(null);
    setAnimState('IDLE');
    setReward(null);
    setLastShardBonus(0);
    setUpgradePreview(null);
  };

  // ====== UPGRADE (3x same item -> next rarity) ======

  const handleUpgrade = (artifact: Artifact) => {
    const next = getNextRarity(artifact.rarity);
    if (!next) return;

    const pool = ARTIFACTS.filter((a) => a.rarity === next);
    if (!pool.length) return;

    const upgraded = pool[Math.floor(Math.random() * pool.length)];

    setOpeningBox('UPGRADE');
    setAnimState('REVEAL');
    setReward(upgraded);
    setUpgradePreview(artifact);
    setLastShardBonus(0);
    onAddArtifact(upgraded);

    playSound('gacha_open');
    playSound('item_reveal');
  };

  // ========= RENDER HELPERS =========

  const renderShop = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24 pt-4 overflow-y-auto">
      {openingBox ? (
        // ============ OPENING / ANIM VIEW ============
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-4 animate-in fade-in duration-500 text-center">
          {animState === 'SHAKING' && (
            <div className="text-7xl sm:text-8xl animate-bounce cursor-pointer transform origin-bottom drop-shadow-[0_0_25px_rgba(250,250,250,0.6)]">
              {openingBox === 'UPGRADE'
                ? '✨'
                : LOOT_BOXES.find((b) => b.id === openingBox)?.icon}
            </div>
          )}

          {animState === 'REVEAL' && !reward && (
            <div className="relative">
              <div className="text-6xl sm:text-7xl animate-ping duration-700 text-white">💥</div>
            </div>
          )}

          {reward && (
            <div className="flex flex-col items-center gap-4 w-full">
              {/* ITEM karkass + glow animācijas */}
              <div
                className={`
                  relative p-4 sm:p-6 rounded-3xl border-4 bg-slate-900/90 shadow-[0_0_50px_rgba(0,0,0,0.9)]
                  ${RARITY_INFO[reward.rarity].border}
                  ${
                    rarityOrder[reward.rarity] >= rarityOrder['EPIC']
                      ? 'animate-[pulse_1.5s_ease-in-out_infinite]'
                      : ''
                  }
                `}
              >
                <div
                  className={`
                    pointer-events-none absolute inset-0 rounded-3xl blur-3xl opacity-60
                    ${
                      rarityOrder[reward.rarity] >= rarityOrder['RARE']
                        ? RARITY_INFO[reward.rarity].color.replace('text', 'bg')
                        : 'bg-slate-500/60'
                    }
                  `}
                />
                {rarityOrder[reward.rarity] >= rarityOrder['LEGENDARY'] && (
                  <div className="pointer-events-none absolute -inset-3 rounded-[1.7rem] border border-yellow-300/60 animate-[spin_6s_linear_infinite]" />
                )}

                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="text-6xl sm:text-7xl drop-shadow-2xl animate-[bounce_1.2s_ease-in-out]">
                    {reward.icon}
                  </div>
                  {upgradePreview && (
                    <div className="flex items-center gap-2 text-xs text-amber-200 bg-amber-900/40 px-3 py-1 rounded-full border border-amber-500/40">
                      <ArrowUpCircle className="w-3 h-3" />
                      Upgraded from {upgradePreview.name}
                    </div>
                  )}
                  {lastShardBonus > 0 && (
                    <div className="flex items-center gap-2 text-xs text-indigo-200 bg-indigo-900/40 px-3 py-1 rounded-full border border-indigo-500/40">
                      <Sparkles className="w-3 h-3" />
                      +{lastShardBonus} Overdrive Shard
                    </div>
                  )}
                </div>
              </div>

              {/* NAME / RARITY / SHORT STATS */}
              <div className="text-center space-y-1 px-2">
                <h2
                  className={`text-xl sm:text-2xl font-display tracking-wide ${
                    RARITY_INFO[reward.rarity].color
                  }`}
                >
                  {reward.name}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-black/60 px-2 py-0.5 rounded-full text-white border border-white/10">
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  {reward.rarity}
                </span>
                {getArtifactShortStats(reward) && (
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                    {getArtifactShortStats(reward)}
                  </p>
                )}
              </div>

              <p className="text-slate-300 italic text-sm sm:text-base max-w-sm leading-snug">
                “{reward.description}”
              </p>

              <Button
                onClick={handleClaim}
                variant="gold"
                size="lg"
                className="mt-2 w-full max-w-xs animate-pulse"
              >
                {equipped.length < EQUIP_SLOTS ? 'CLAIM & EQUIP' : 'CLAIM'}
              </Button>

              <button
                type="button"
                onClick={reset}
                className="mt-1 text-[11px] text-slate-500 underline"
              >
                Skip animation
              </button>
            </div>
          )}
        </div>
      ) : (
        // ============ SHOP BOX GRID ============
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Gift className="w-3 h-3" />
              Tap a crate to open!
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-indigo-500/40 text-[11px] text-indigo-200">
                <Sparkles className="w-3 h-3" />
                Shards: <span className="font-bold">{shards}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {LOOT_BOXES.map((box) => (
              <div
                key={box.id}
                className={`
                  bg-slate-900/90 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-3
                  hover:scale-[1.03] transition-transform shadow-xl
                  ${box.border}
                `}
              >
                <div className="text-5xl sm:text-6xl drop-shadow-[0_0_18px_rgba(0,0,0,0.7)] mb-1">
                  {box.icon}
                </div>

                <div className="text-center space-y-1">
                  <h3 className={`font-display text-lg sm:text-xl ${box.color}`}>
                    {box.name}
                  </h3>

                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {Object.entries(box.chances).map(([r, chance]) =>
                      chance > 0 ? (
                        <span
                          key={r}
                          className={`text-[9px] px-1.5 rounded-full bg-slate-900/80 border border-white/10 ${
                            RARITY_INFO[r as Rarity].color
                          }`}
                        >
                          {chance}% {r.substring(0, 3)}
                        </span>
                      ) : null,
                    )}
                  </div>
                </div>

                <Button
                  variant="gold"
                  className="w-full mt-1"
                  onClick={() => handleBuy(box.id)}
                  disabled={gold < box.price}
                >
                  <span className="flex items-center justify-center gap-2 text-sm">
                    {box.price} <Coins className="w-4 h-4" />
                  </span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderInventory = () => {
    const equippedCount = Math.min(equipped.length, EQUIP_SLOTS);

    return (
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 pb-24 overflow-y-auto">
        {/* LEFT: EQUIPPED + BACKPACK */}
        <div className="w-full md:w-2/3 max-w-2xl mx-auto flex flex-col gap-6">
          {/* EQUIPPED SLOTS */}
          <div>
            <h2 className="text-slate-400 font-bold uppercase tracking-widest mb-3 text-xs flex items-center justify-between">
              <span>
                Equipped ({equippedCount}/{EQUIP_SLOTS})
              </span>
              <span className="text-[10px] text-slate-500">Tap to unequip</span>
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: EQUIP_SLOTS }).map((_, i) => {
                const artifactId = equipped[i];
                const item = artifactId ? inventory.find((a) => a.id === artifactId) : null;

                return (
                  <div
                    key={i}
                    className="aspect-square bg-slate-900 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center relative"
                  >
                    {item ? (
                      <button
                        onClick={() => {
                          playSound('ui');
                          onEquip(item.id);
                          setInspect(item);
                        }}
                        className={`
                          w-full h-full flex flex-col items-center justify-center rounded-2xl border-2 bg-slate-800
                          ${RARITY_INFO[item.rarity].border}
                        `}
                      >
                        <span className="text-2xl sm:text-3xl">{item.icon}</span>
                        <span className="text-[9px] text-slate-200 mt-1 font-bold px-1 text-center truncate w-full">
                          {item.name}
                        </span>
                      </button>
                    ) : (
                      <span className="text-slate-700 text-[10px] uppercase font-bold">
                        Empty
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BACKPACK GRID */}
          <div>
            <h2 className="text-slate-400 font-bold uppercase tracking-widest mb-3 text-xs flex items-center justify-between">
              <span>Backpack</span>
              <span className="text-[10px] text-slate-500">
                Tap to equip / show details
              </span>
            </h2>
            {inventory.length === 0 ? (
              <div className="text-center text-slate-500 py-10 italic text-sm">
                No artifacts yet. Buy some crates!
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {inventory.map((item) => {
                  const isEquipped = equipped.includes(item.id);
                  const isUpgradeable =
                    (countsById[item.id] || 0) >= 3 && getNextRarity(item.rarity) !== null;

                  return (
                    <button
                      key={item.id + Math.random()}
                      onClick={() => {
                        playSound('ui');
                        onEquip(item.id);
                        setInspect(item);
                      }}
                      onMouseEnter={() => setInspect(item)}
                      className={`
                        relative aspect-square bg-slate-800 rounded-xl flex flex-col items-center justify-center border-2 transition-all
                        ${
                          isEquipped
                            ? 'opacity-60 border-slate-500'
                            : `hover:scale-105 ${RARITY_INFO[item.rarity].border}`
                        }
                      `}
                    >
                      <span className="text-2xl sm:text-3xl mb-0.5">{item.icon}</span>
                      {isEquipped && (
                        <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5 shadow-md">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div
                        className={`absolute bottom-0 w-full h-1 ${RARITY_INFO[
                          item.rarity
                        ].color.replace('text', 'bg')}`}
                      />
                      {isUpgradeable && (
                        <div className="absolute -top-1 -left-1 bg-amber-500 text-[9px] font-bold px-1 py-0.5 rounded-tr-lg rounded-bl-lg shadow">
                          3x
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: DETAILS + UPGRADE LAB */}
        <div className="w-full md:w-1/3 max-w-sm mx-auto flex flex-col gap-4">
          {/* DETAILS PANEL */}
          <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-2">
              Artifact Details
            </h3>
            {inspect ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      w-10 h-10 rounded-xl flex items-center justify-center text-2xl
                      bg-slate-800 border-2 ${RARITY_INFO[inspect.rarity].border}
                    `}
                  >
                    {inspect.icon}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-sm font-display ${
                        RARITY_INFO[inspect.rarity].color
                      } leading-tight`}
                    >
                      {inspect.name}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                      {inspect.rarity}
                    </div>
                  </div>
                </div>
                {getArtifactShortStats(inspect) && (
                  <div className="text-[11px] text-slate-200">
                    {getArtifactShortStats(inspect)}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 italic leading-snug">
                  “{inspect.description}”
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Tap an artifact in your backpack to see what it does.
              </p>
            )}
          </div>

          {/* UPGRADE LAB */}
          <div className="bg-slate-900/90 border border-amber-700/60 rounded-2xl p-4 shadow-[0_0_25px_rgba(251,191,36,0.15)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs text-amber-300 uppercase font-bold tracking-widest flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4" /> Upgrade Lab
              </h3>
              <span className="text-[10px] text-amber-200/80">
                3x same item → next tier
              </span>
            </div>

            {upgradeableList.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                Collect at least 3 copies of the same artifact to upgrade it.
              </p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {upgradeableList.map(({ artifact, count }) => {
                  const next = getNextRarity(artifact.rarity);
                  if (!next) return null;

                  return (
                    <div
                      key={artifact.id}
                      className="flex items-center gap-2 bg-slate-950/70 border border-slate-700 rounded-xl px-2 py-2"
                    >
                      <div
                        className={`
                          w-8 h-8 rounded-lg flex items-center justify-center text-xl
                          bg-slate-800 border ${RARITY_INFO[artifact.rarity].border}
                        `}
                      >
                        {artifact.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] font-semibold text-slate-100 truncate">
                          {artifact.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {count}x • Upgrade to{' '}
                          <span className={RARITY_INFO[next].color}>{next}</span>
                        </div>
                      </div>
                      <Button
                        variant="gold"
                        size="sm"
                        className="text-[10px] px-2 py-1"
                        onClick={() => handleUpgrade(artifact)}
                      >
                        Upgrade
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ========= MAIN =========

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans">
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between bg-slate-900 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              playSound('ui');
              onBack();
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-display text-white tracking-wider">
              BLACK MARKET
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">
              Loot • Upgrades • Shards
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-black/40 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2 text-sm">
            <Coins className="text-yellow-400 w-4 h-4" />
            <span className="text-white font-bold">{Math.floor(gold)}</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex justify-center gap-2 p-3 bg-slate-900/60">
        <button
          onClick={() => {
            playSound('ui');
            setActiveTab('SHOP');
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all
            ${
              activeTab === 'SHOP'
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }
          `}
        >
          <Gift className="w-4 h-4" /> Loot Crates
        </button>
        <button
          onClick={() => {
            playSound('ui');
            setActiveTab('GEAR');
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all
            ${
              activeTab === 'GEAR'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }
          `}
        >
          <Briefcase className="w-4 h-4" /> Inventory
        </button>
      </div>

      {activeTab === 'SHOP' ? renderShop() : renderInventory()}
    </div>
  );
};
