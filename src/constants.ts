import { EmojiFighter, Zone, Rarity, Difficulty, ZoneModifier, Artifact } from './types';

/* ===========================================================
 🔥 RARITY SYSTEM
=========================================================== */

export const RARITY_INFO: Record<
  Rarity,
  { color: string; border: string; multiplier: number; shadow: string }
> = {
  COMMON: { color: '#94a3b8', border: 'border-slate-400', multiplier: 1.0, shadow: 'shadow-slate-500/20' },
  RARE: { color: '#3b82f6', border: 'border-blue-500', multiplier: 1.2, shadow: 'shadow-blue-500/40' },
  EPIC: { color: '#a855f7', border: 'border-purple-500', multiplier: 1.5, shadow: 'shadow-purple-500/50' },
  LEGENDARY: { color: '#eab308', border: 'border-yellow-400', multiplier: 2.0, shadow: 'shadow-yellow-500/60' },
  MYTHIC: { color: '#ef4444', border: 'border-red-500', multiplier: 3.0, shadow: 'shadow-red-600/80' }
};

/* ===========================================================
 🔥 DIFFICULTY SYSTEM
=========================================================== */

export const DIFFICULTY_TIERS: Record<
  Difficulty,
  { label: string; hpMult: number; dmgMult: number; goldMult: number; color: string }
> = {
  EASY: { label: 'Casual', hpMult: 0.7, dmgMult: 0.7, goldMult: 0.8, color: 'text-green-400' },
  NORMAL: { label: 'Normal', hpMult: 1.0, dmgMult: 1.0, goldMult: 1.0, color: 'text-blue-400' },
  HARD: { label: 'Hardcore', hpMult: 1.6, dmgMult: 1.5, goldMult: 1.8, color: 'text-orange-400' },
  EXTREME: { label: 'Nightmare', hpMult: 2.5, dmgMult: 2.5, goldMult: 3.0, color: 'text-red-500' }
};

/* ===========================================================
 🔥 ZONE MODIFIERS
=========================================================== */

export const ZONE_MODIFIERS: {
  type: ZoneModifier;
  label: string;
  desc: string;
  color: string;
}[] = [
  { type: 'NONE', label: 'Standard', desc: 'No anomalies detected.', color: 'text-slate-400' },
  { type: 'GOLD_RUSH', label: 'Gold Rush', desc: 'Gold drops doubled!', color: 'text-yellow-400' },
  { type: 'GLASS_CANNON', label: 'Glass Cannon', desc: 'Double Damage, Half HP.', color: 'text-red-400' },
  { type: 'VAMPIRISM', label: 'Vampirism', desc: 'Kills restore HP.', color: 'text-purple-400' },
  { type: 'SPEED_DEMON', label: 'Speed Demon', desc: 'Everything moves 50% faster.', color: 'text-blue-400' },
  { type: 'TANKY_MOBS', label: 'Thick Skin', desc: 'Enemies have +50% HP.', color: 'text-green-400' },
  { type: 'CRITICAL_THINKING', label: 'Critical', desc: 'Crit chance +50%.', color: 'text-orange-400' }
];

/* ===========================================================
 🔥 ARTIFACTS
=========================================================== */

export const ARTIFACTS: Artifact[] = [
  // Common
  { id: 'bandage', name: 'Sticky Bandage', icon: '🩹', description: '+2 HP per kill', rarity: 'COMMON', stats: { lifeSteal: 2 } },
  { id: 'sneakers', name: 'Old Sneakers', icon: '👟', description: '+5% Speed', rarity: 'COMMON', stats: { speed: 0.05 } },
  { id: 'rock', name: 'Pet Rock', name: 'Pet Rock', icon: '🐒', description: '+10% Defense', rarity: 'COMMON', stats: { defense: 0.1 } },

  // Rare
  { id: 'magnet', name: 'Gold Magnet', icon: '🧲', description: '+20% Gold Earned', rarity: 'RARE', stats: { goldMult: 0.2 } },
  { id: 'scope', name: 'Red Dot', icon: '🔭', description: '+10% Crit Chance', rarity: 'RARE', stats: { critChance: 0.1 } },
  { id: 'protein', name: 'Alien Shake', icon: '🤹🏾‍♂️', description: '+15% Power', rarity: 'RARE', stats: { power: 0.15 } },

  // Epic
  { id: 'vamp_fangs', name: 'Vampire Fangs', icon: '🧛', description: '+10 HP per kill', rarity: 'EPIC', stats: { lifeSteal: 10 } },
  { id: 'berserk_helm', name: 'Viking Helm', icon: '💪🏿', description: '+40% Power, -10% Def', rarity: 'EPIC', stats: { power: 0.4, defense: -0.1 } },
  { id: 'lucky_clover', name: 'Neon Clover', icon: '🍀', description: '+25% Crit Chance', rarity: 'EPIC', stats: { critChance: 0.25 } },

  // Legendary
  { id: 'midas_crown', name: 'Midas Crown', icon: '👑', description: '+100% Gold Earned', rarity: 'LEGENDARY', stats: { goldMult: 1.0 } },
  { id: 'cyber_heart', name: 'Cyber Heart', icon: '❤️', description: '+50% Max HP', rarity: 'LEGENDARY', stats: { defense: 0.5 } },

  // Mythic
  { id: 'infinity_gem', name: 'Infinity Shard', icon: '💎', description: '+50% ALL STATS', rarity: 'MYTHIC', stats: { power: 0.5, speed: 0.5, defense: 0.5, critChance: 0.2 } },
  { id: 'void_essence', name: 'Void Essence', icon: '⚫', description: '+50 HP Lifesteal', rarity: 'MYTHIC', stats: { lifeSteal: 50 } }
];

/* ===========================================================
 🔥 LOOT BOXES
=========================================================== */

export const LOOT_BOXES = [
  { id: 'bronze', name: 'BRONZE CRATE', price: 2500, icon: '📦', color: 'text-orange-400', border: 'border-orange-700', chances: { COMMON: 70, RARE: 25, EPIC: 5, LEGENDARY: 0, MYTHIC: 0 } },
  { id: 'silver', name: 'SILVER CACHE', price: 7500, icon: '🗳️', color: 'text-slate-300', border: 'border-slate-400', chances: { COMMON: 20, RARE: 50, EPIC: 25, LEGENDARY: 5, MYTHIC: 0 } },
  { id: 'gold', name: 'OMEGA CHEST', price: 25000, icon: '📀', color: 'text-yellow-400', border: 'border-yellow-500', chances: { COMMON: 0, RARE: 10, EPIC: 40, LEGENDARY: 45, MYTHIC: 5 } }
];

/* ===========================================================
 🔥 STARTER FIGHTERS
=========================================================== */

export const STARTER_FIGHTERS: EmojiFighter[] = [
  {
    id: 'skull',
    icon: '💀',
    name: 'Doom Skull',
    description: 'Balanced heavy hitter.',
    baseStats: { speed: 4, power: 8, defense: 8 },
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
    baseStats: { speed: 5, power: 10, defense: 8 },
    ability: 'Flash Freeze',
    weapon: 'SNIPER',
    rarity: 'RARE',
    unlocked: false,
    price: 150
  },
  {
    id: 'fire',
    icon: '🔥',
    name: 'Inferno',
    description: 'Close range devastation.',
    baseStats: { speed: 6, power: 9, defense: 6 },
    ability: 'Wildfire',
    weapon: 'SHOTGUN',
    rarity: 'RARE',
    unlocked: false,
    price: 200
  },
  {
    id: 'devil',
    icon: '😈',
    name: 'Lil Devil',
    description: 'Fast firing chaos engine.',
    baseStats: { speed: 7, power: 9, defense: 7 },
    ability: 'Chaos Dash',
    weapon: 'RAPID',
    rarity: 'EPIC',
    unlocked: false,
    price: 250
  },
  {
    id: 'clown',
    icon: '🤡',
    name: 'Honk Honk',
    description: 'Trick shots that seek targets.',
    baseStats: { speed: 8, power: 11, defense: 8 },
    ability: 'Jester Bomb',
    weapon: 'HOMING',
    rarity: 'EPIC',
    unlocked: false,
    price: 300
  },
  {
    id: 'robot',
    icon: '🤖',
    name: 'Mecha Bot',
    description: 'Aimbot enabled.',
    baseStats: { speed: 15, power: 17, defense: 19 },
    ability: 'Laser Beam',
    weapon: 'RAPID',
    rarity: 'LEGENDARY',
    unlocked: false,
    price: 500
  },
  {
    id: 'alien',
    icon: '👽',
    name: 'Zorg',
    description: 'Probing technology.',
    baseStats: { speed: 22, power: 22, defense: 22 },
    ability: 'Abduction',
    weapon: 'BLASTER',
    rarity: 'LEGENDARY',
    unlocked: false,
    price: 800
  }
];

/* ===========================================================
 🔥 ADVANCED BOSS SYSTEM
=========================================================== */

export interface BossPattern {
  name: string;
  icon: string;
  description: string;
  frequency: number;
  danger: number;
}

export interface BossData {
  hpMultiplier: number;
  damageMultiplier: number;
  speedMultiplier: number;
  enrageThreshold: number;
  patterns: BossPattern[];
}

export const BOSS_TYPES: Record<string, BossData> = {
  DEFAULT: {
    hpMultiplier: 4,
    damageMultiplier: 2,
    speedMultiplier: 1,
    enrageThreshold: 0.35,
    patterns: [
      { name: "BULLET_WAVE", icon: "🌊", description: "Sweeping bullet wave.", frequency: 6, danger: 6 },
      { name: "BOMB_DROP", icon: "💣", description: "Explosive bombs detonate after 2 seconds.", frequency: 4, danger: 7 },
      { name: "DASH_ATTACK", icon: "⚡", description: "Boss dashes directly at the player.", frequency: 5, danger: 8 }
    ]
  },

  MAGMA_DRAGON: {
    hpMultiplier: 6,
    damageMultiplier: 3,
    speedMultiplier: 1.2,
    enrageThreshold: 0.40,
    patterns: [
      { name: "FIREBALL_SPIRAL", icon: "🔥", description: "Spiral of fireballs.", frequency: 4, danger: 9 },
      { name: "METEOR_STRIKE", icon: "☄️", description: "Meteors fall from above.", frequency: 7, danger: 10 }
    ]
  },

  CYBER_TANK: {
    hpMultiplier: 8,
    damageMultiplier: 2,
    speedMultiplier: 0.8,
    enrageThreshold: 0.50,
    patterns: [
      { name: "LASER_BEAM", icon: "🔦", description: "Sweeping laser.", frequency: 5, danger: 10 },
      { name: "DRONE_SWARM", icon: "🛸", description: "Drone homing bullets.", frequency: 6, danger: 7 }
    ]
  },

  SHADOW_DEMON: {
    hpMultiplier: 5,
    damageMultiplier: 4,
    speedMultiplier: 1.5,
    enrageThreshold: 0.30,
    patterns: [
      { name: "INVISIBLE_CHARGE", icon: "👻", description: "Invisible dash attack.", frequency: 5, danger: 10 },
      { name: "SHADOW_CLONES", icon: "🌀", description: "Creates mirror clones.", frequency: 7, danger: 8 }
    ]
  },

  VOID_ENTITY: {
    hpMultiplier: 10,
    damageMultiplier: 3,
    speedMultiplier: 1,
    enrageThreshold: 0.20,
    patterns: [
      { name: "BLACK_HOLE", icon: "🕳️", description: "Gravity vortex pulls the player.", frequency: 8, danger: 10 },
      { name: "VOID_BLAST", icon: "💥", description: "Large void blasts in random angles.", frequency: 6, danger: 9 }
    ]
  }
};

/* ===========================================================
 🔥 GAME ZONES
=========================================================== */

export const GAME_ZONES: Zone[] = [
  {
    id: 'zone_1',
    name: 'Training Grounds',
    description: 'Pirmie mēģinājumi. Lēni ienaidnieki, maz šāvēju.',
    icon: '🌱',
    bossIcon: '😈',
    bossType: 'DEFAULT',
    difficulty: 1,
    colors: { bg: '#020617', grid: '#1e293b' },
  },
  {
    id: 'zone_2',
    name: 'Neon Alley',
    description: 'Pirmie šāvēji, vairāk mobu no sāniem.',
    icon: '🌃',
    bossIcon: '👹',
    bossType: 'DEFAULT',
    difficulty: 2,
    colors: { bg: '#020617', grid: '#1d2955' },
  },
  {
    id: 'zone_3',
    name: 'Data Core',
    description: 'Daudz šāvienu, exploderi parādās biežāk.',
    icon: '💾',
    bossIcon: '👁️',
    bossType: 'DEFAULT',
    difficulty: 3,
    colors: { bg: '#020617', grid: '#334155' },
  },
  {
    id: 'zone_4',
    name: 'Frozen Sector',
    description: 'Lēni, bet tankaini ienaidnieki.',
    icon: '❄️',
    bossIcon: '🧊',
    bossType: 'DEFAULT',
    difficulty: 4,
    colors: { bg: '#020617', grid: '#0f172a' },
  },
  {
    id: 'zone_5',
    name: 'Thunder Dome',
    description: 'Ātri šāvēji, daudz lodīšu.',
    icon: '⚡',
    bossIcon: '🌩️',
    bossType: 'DEFAULT',
    difficulty: 5,
    colors: { bg: '#020617', grid: '#1e293b' },
  },
  {
    id: 'zone_6',
    name: 'Void Edge',
    description: 'Redzamība slikta, bīstamas fāzes.',
    icon: '🌌',
    bossIcon: '⚫',
    bossType: 'DEFAULT',
    difficulty: 6,
    colors: { bg: '#020617', grid: '#020617' },
  },
  {
    id: 'zone_7',
    name: 'Bio Lab',
    description: 'Ātri exploderi un tanki vienlaicīgi.',
    icon: '🧪',
    bossIcon: '🧬',
    bossType: 'DEFAULT',
    difficulty: 7,
    colors: { bg: '#020617', grid: '#14532d' },
  },
  {
    id: 'zone_8',
    name: 'Overdrive Highway',
    description: 'Super ātri mobu viļņi, grūti izdzīvot.',
    icon: '🚦',
    bossIcon: '🚛',
    bossType: 'DEFAULT',
    difficulty: 8,
    colors: { bg: '#020617', grid: '#4b5563' },
  },
  {
    id: 'zone_9',
    name: 'Lava Core',
    description: 'Milzīgs dmg, maz vietas kļūdām.',
    icon: '🌋',
    bossIcon: '🔥',
    bossType: 'DEFAULT',
    difficulty: 9,
    colors: { bg: '#020617', grid: '#7f1d1d' },
  },
  {
    id: 'zone_10',
    name: 'Abyss Gate',
    description: 'Te sākas īstā elle.',
    icon: '🕳️',
    bossIcon: '👻',
    bossType: 'DEFAULT',
    difficulty: 10,
    colors: { bg: '#020617', grid: '#111827' },
  },
  {
    id: 'zone_11',
    name: 'Singularity',
    description: 'Lodes, tanki, exploderi – viss reizē.',
    icon: '⚛️',
    bossIcon: '🌀',
    bossType: 'DEFAULT',
    difficulty: 11,
    colors: { bg: '#020617', grid: '#0b1120' },
  },
  {
    id: 'zone_12',
    name: 'Final Overdrive',
    description: 'Pēdējais level, tikai krutie izdzīvo.',
    icon: '🏁',
    bossIcon: '👑',
    bossType: 'DEFAULT',
    difficulty: 12,
    colors: { bg: '#020617', grid: '#1f2937' },
  },
];

  // … (all your other zones unchanged; add bossType if you want)


/* ===========================================================
 🔥 ARENA COMMENTS
=========================================================== */

export const MOCK_COMMENTS = [
  "ABSOLUTE CHAOS!",
  "WHAT A HIT!",
  "EMOJI DOWN!",
  "UNSTOPPABLE!",
  "MAXIMUM OVERDRIVE!"
];
