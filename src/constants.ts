
import { EmojiFighter, Zone, Rarity, Difficulty, ZoneModifier, Artifact } from './types';

export const RARITY_INFO: Record<Rarity, { color: string; border: string; multiplier: number; shadow: string }> = {
  COMMON: { color: '#94a3b8', border: 'border-slate-400', multiplier: 1.0, shadow: 'shadow-slate-500/20' },
  RARE: { color: '#3b82f6', border: 'border-blue-500', multiplier: 1.2, shadow: 'shadow-blue-500/40' },
  EPIC: { color: '#a855f7', border: 'border-purple-500', multiplier: 1.5, shadow: 'shadow-purple-500/50' },
  LEGENDARY: { color: '#eab308', border: 'border-yellow-400', multiplier: 2.0, shadow: 'shadow-yellow-500/60' },
  MYTHIC: { color: '#ef4444', border: 'border-red-500', multiplier: 3.0, shadow: 'shadow-red-600/80' }
};

export const DIFFICULTY_TIERS: Record<Difficulty, { label: string; hpMult: number; dmgMult: number; goldMult: number; color: string }> = {
  EASY: { label: 'Casual', hpMult: 0.7, dmgMult: 0.7, goldMult: 0.8, color: 'text-green-400' },
  NORMAL: { label: 'Normal', hpMult: 1.0, dmgMult: 1.0, goldMult: 1.0, color: 'text-blue-400' },
  HARD: { label: 'Hardcore', hpMult: 1.6, dmgMult: 1.5, goldMult: 1.8, color: 'text-orange-400' },
  EXTREME: { label: 'Nightmare', hpMult: 2.5, dmgMult: 2.5, goldMult: 3.0, color: 'text-red-500' }
};

export const ZONE_MODIFIERS: { type: ZoneModifier; label: string; desc: string; color: string }[] = [
    { type: 'NONE', label: 'Standard', desc: 'No anomalies detected.', color: 'text-slate-400' },
    { type: 'GOLD_RUSH', label: 'Gold Rush', desc: 'Gold drops doubled!', color: 'text-yellow-400' },
    { type: 'GLASS_CANNON', label: 'Glass Cannon', desc: 'Double Damage, Half HP.', color: 'text-red-400' },
    { type: 'VAMPIRISM', label: 'Vampirism', desc: 'Kills restore HP.', color: 'text-purple-400' },
    { type: 'SPEED_DEMON', label: 'Speed Demon', desc: 'Everything moves 50% faster.', color: 'text-blue-400' },
    { type: 'TANKY_MOBS', label: 'Thick Skin', desc: 'Enemies have +50% HP.', color: 'text-green-400' },
    { type: 'CRITICAL_THINKING', label: 'Critical', desc: 'Crit chance +50%.', color: 'text-orange-400' }
];

export const ARTIFACTS: Artifact[] = [
  // Common
  { id: 'bandage', name: 'Sticky Bandage', icon: '🩹', description: '+2 HP per kill', rarity: 'COMMON', stats: { lifeSteal: 2 } },
  { id: 'sneakers', name: 'Old Sneakers', icon: '👟', description: '+5% Speed', rarity: 'COMMON', stats: { speed: 0.05 } },
  { id: 'rock', name: 'Pet Rock', icon: '🪨', description: '+10% Defense', rarity: 'COMMON', stats: { defense: 0.1 } },
  
  // Rare
  { id: 'magnet', name: 'Gold Magnet', icon: '🧲', description: '+20% Gold Earned', rarity: 'RARE', stats: { goldMult: 0.2 } },
  { id: 'scope', name: 'Red Dot', icon: '🔭', description: '+10% Crit Chance', rarity: 'RARE', stats: { critChance: 0.1 } },
  { id: 'protein', name: 'Alien Shake', icon: '🥤', description: '+15% Power', rarity: 'RARE', stats: { power: 0.15 } },

  // Epic
  { id: 'vamp_fangs', name: 'Vampire Fangs', icon: '🧛', description: '+10 HP per kill', rarity: 'EPIC', stats: { lifeSteal: 10 } },
  { id: 'berserk_helm', name: 'Viking Helm', icon: '🪖', description: '+40% Power, -10% Def', rarity: 'EPIC', stats: { power: 0.4, defense: -0.1 } },
  { id: 'lucky_clover', name: 'Neon Clover', icon: '🍀', description: '+25% Crit Chance', rarity: 'EPIC', stats: { critChance: 0.25 } },

  // Legendary
  { id: 'midas_crown', name: 'Midas Crown', icon: '👑', description: '+100% Gold Earned', rarity: 'LEGENDARY', stats: { goldMult: 1.0 } },
  { id: 'cyber_heart', name: 'Cyber Heart', icon: '🫀', description: '+50% Max HP', rarity: 'LEGENDARY', stats: { defense: 0.5 } }, // Using defense slot for HP calc logic in arena

  // Mythic
  { id: 'infinity_gem', name: 'Infinity Shard', icon: '💎', description: '+50% ALL STATS', rarity: 'MYTHIC', stats: { power: 0.5, speed: 0.5, defense: 0.5, critChance: 0.2 } },
  { id: 'void_essence', name: 'Void Essence', icon: '⚫', description: '+50 HP Lifesteal', rarity: 'MYTHIC', stats: { lifeSteal: 50 } },
];

export const LOOT_BOXES = [
  { id: 'bronze', name: 'BRONZE CRATE', price: 2500, icon: '📦', color: 'text-orange-400', border: 'border-orange-700', chances: { COMMON: 70, RARE: 25, EPIC: 5, LEGENDARY: 0, MYTHIC: 0 } },
  { id: 'silver', name: 'SILVER CACHE', price: 7500, icon: '🗳️', color: 'text-slate-300', border: 'border-slate-400', chances: { COMMON: 20, RARE: 50, EPIC: 25, LEGENDARY: 5, MYTHIC: 0 } },
  { id: 'gold', name: 'OMEGA CHEST', price: 25000, icon: '📀', color: 'text-yellow-400', border: 'border-yellow-500', chances: { COMMON: 0, RARE: 10, EPIC: 40, LEGENDARY: 45, MYTHIC: 5 } },
];

export const STARTER_FIGHTERS: EmojiFighter[] = [
  {
    id: 'skull',
    icon: '💀',
    name: 'Doom Skull',
    description: 'Balanced heavy hitter.',
    baseStats: { speed: 4, power: 10, defense: 8 },
    ability: 'Bone Zone',
    weapon: 'BLASTER',
    rarity: 'COMMON',
    unlocked: true,
    price: 0
  },
  {
    id: 'cool',
    icon: '😎',
    name: 'Chill Shades',
    description: 'Precise shots. Keep your distance.',
    baseStats: { speed: 8, power: 4, defense: 6 },
    ability: 'Flash Freeze',
    weapon: 'SNIPER',
    rarity: 'RARE',
    unlocked: false,
    price: 1500
  },
  {
    id: 'fire',
    icon: '🔥',
    name: 'Inferno',
    description: 'Close range devastation.',
    baseStats: { speed: 6, power: 9, defense: 3 },
    ability: 'Wildfire',
    weapon: 'SHOTGUN',
    rarity: 'RARE',
    unlocked: false,
    price: 2000
  },
  {
    id: 'devil',
    icon: '😈',
    name: 'Lil Devil',
    description: 'Fast firing chaos engine.',
    baseStats: { speed: 9, power: 5, defense: 2 },
    ability: 'Chaos Dash',
    weapon: 'RAPID',
    rarity: 'EPIC',
    unlocked: false,
    price: 2500
  },
  {
    id: 'clown',
    icon: '🤡',
    name: 'Honk Honk',
    description: 'Trick shots that seek targets.',
    baseStats: { speed: 7, power: 6, defense: 5 },
    ability: 'Jester Bomb',
    weapon: 'HOMING',
    rarity: 'EPIC',
    unlocked: false,
    price: 3000
  },
  {
    id: 'robot',
    icon: '🤖',
    name: 'Mecha Bot',
    description: 'Aimbot enabled.',
    baseStats: { speed: 5, power: 7, defense: 9 },
    ability: 'Laser Beam',
    weapon: 'RAPID',
    rarity: 'LEGENDARY',
    unlocked: false,
    price: 5000
  },
  {
    id: 'alien',
    icon: '👽',
    name: 'Zorg',
    description: 'Probing technology.',
    baseStats: { speed: 8, power: 6, defense: 4 },
    ability: 'Abduction',
    weapon: 'BLASTER',
    rarity: 'LEGENDARY',
    unlocked: false,
    price: 8000
  }
];

export const GAME_ZONES: Zone[] = [
  {
    id: 'zone_1',
    name: 'NEON STREETS',
    description: 'Low Danger. Mostly walkers.',
    difficulty: 1,
    icon: '🏙️',
    bossIcon: '🦍',
    colors: {
      bg: '#0f172a', // Slate 900
      grid: '#1e293b', // Slate 800
      accent: '#818cf8' // Indigo
    }
  },
  {
    id: 'zone_2',
    name: 'MAGMA CORE',
    description: 'Medium Danger. Projectile hell!',
    difficulty: 2,
    icon: '🌋',
    bossIcon: '🐲',
    colors: {
      bg: '#450a0a', // Red 950
      grid: '#7f1d1d', // Red 900
      accent: '#f87171' // Red 400
    }
  },
  {
    id: 'zone_3',
    name: 'CYBER VOID',
    description: 'High Danger. Heavy Tanks.',
    difficulty: 3,
    icon: '🌌',
    bossIcon: '👾',
    colors: {
      bg: '#020617', // Slate 950
      grid: '#4c1d95', // Violet 900
      accent: '#d8b4fe' // Violet 300
    }
  },
  {
    id: 'zone_4',
    name: 'BIO SANCTUM',
    description: 'Extreme Danger. Explosive hazards.',
    difficulty: 4,
    icon: '☣️',
    bossIcon: '👺',
    colors: {
      bg: '#052e16', // Green 950
      grid: '#14532d', // Green 900
      accent: '#4ade80' // Green 400
    }
  },
  {
    id: 'zone_5',
    name: 'CRYSTAL PEAKS',
    description: 'Frozen Wasteland. Slippery foes.',
    difficulty: 5,
    icon: '❄️',
    bossIcon: '🥶',
    colors: {
      bg: '#082f49', // Sky 950
      grid: '#0c4a6e', // Sky 900
      accent: '#38bdf8' // Sky 400
    }
  },
  {
    id: 'zone_6',
    name: 'THUNDER SPIRE',
    description: 'Electric Chaos. High Speed.',
    difficulty: 6,
    icon: '⚡',
    bossIcon: '🌩️',
    colors: {
      bg: '#422006', // Yellow 950 (Dark Bronze)
      grid: '#713f12', // Yellow 900
      accent: '#facc15' // Yellow 400
    }
  },
  {
    id: 'zone_7',
    name: 'SHADOW REALM',
    description: 'Nightmare Mode. Unseen horrors.',
    difficulty: 7,
    icon: '🌑',
    bossIcon: '👻',
    colors: {
      bg: '#000000',
      grid: '#312e81', // Indigo 900
      accent: '#a5b4fc' // Indigo 300
    }
  },
  {
    id: 'zone_8',
    name: 'OMEGA CORE',
    description: 'THE END. GOOD LUCK.',
    difficulty: 8,
    icon: '⚛️',
    bossIcon: '👁️',
    colors: {
      bg: '#1a0524', // Dark Purple
      grid: '#db2777', // Pink 600
      accent: '#f472b6' // Pink 400
    }
  },
  {
    id: 'zone_9',
    name: 'SOLAR FLARE',
    description: 'Blinding Light. Burn everything.',
    difficulty: 9,
    icon: '☀️',
    bossIcon: '🌞',
    colors: {
      bg: '#fff7ed', // Orange 50
      grid: '#f97316', // Orange 500
      accent: '#fdba74' // Orange 300
    }
  },
  {
    id: 'zone_10',
    name: 'DEEP ABYSS',
    description: 'Crushing Pressure. Slow movement.',
    difficulty: 10,
    icon: '🐙',
    bossIcon: '🦑',
    colors: {
      bg: '#020617', // Slate 950
      grid: '#0e7490', // Cyan 700
      accent: '#22d3ee' // Cyan 400
    }
  },
  {
    id: 'zone_11',
    name: 'GLITCH CITY',
    description: 'Reality Broken. Unpredictable.',
    difficulty: 11,
    icon: '💾',
    bossIcon: '🤖',
    colors: {
      bg: '#18181b', // Zinc 900
      grid: '#22c55e', // Green 500 (Matrix style)
      accent: '#4ade80' // Green 400
    }
  },
  {
    id: 'zone_12',
    name: 'EVENT HORIZON',
    description: 'THERE IS NO ESCAPE.',
    difficulty: 12,
    icon: '🕳️',
    bossIcon: '🪐',
    colors: {
      bg: '#000000',
      grid: '#ffffff',
      accent: '#f8fafc'
    }
  },
  {
    id: 'zone_13',
    name: 'QUANTUM REALM',
    description: 'Physics breakdown. Teleporters.',
    difficulty: 13,
    icon: '⚛️',
    bossIcon: '💠',
    colors: {
      bg: '#2e1065',
      grid: '#8b5cf6',
      accent: '#c4b5fd'
    }
  },
  {
    id: 'zone_14',
    name: 'PIXEL WASTELAND',
    description: 'Digital decay. Corrupted files.',
    difficulty: 14,
    icon: '👾',
    bossIcon: '🦠',
    colors: {
      bg: '#171717',
      grid: '#22c55e',
      accent: '#16a34a'
    }
  },
  {
    id: 'zone_15',
    name: 'CELESTIAL GATES',
    description: 'Divine Judgement. Pure energy.',
    difficulty: 15,
    icon: '✨',
    bossIcon: '👼',
    colors: {
      bg: '#fffbeb',
      grid: '#fcd34d',
      accent: '#fbbf24'
    }
  },
  {
    id: 'zone_16',
    name: 'THE SINGULARITY',
    description: 'The beginning and the end.',
    difficulty: 16,
    icon: '🌀',
    bossIcon: '🌌',
    colors: {
      bg: '#000000',
      grid: '#ef4444',
      accent: '#dc2626'
    }
  }
];

export const MOCK_COMMENTS = [
  "ABSOLUTE CHAOS!",
  "WHAT A HIT!",
  "EMOJI DOWN!",
  "UNSTOPPABLE!",
  "MAXIMUM OVERDRIVE!"
];
