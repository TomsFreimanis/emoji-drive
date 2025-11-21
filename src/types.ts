
export enum Screen {
  HOME = 'HOME',
  BATTLE = 'BATTLE',
  HYBRID_LAB = 'HYBRID_LAB',
  STORE = 'STORE',
  LEADERBOARD = 'LEADERBOARD',
  GAME_OVER = 'GAME_OVER',
  API_KEY_SELECT = 'API_KEY_SELECT',
  LOOT_SHOP = 'LOOT_SHOP'
}

export type WeaponType = 'BLASTER' | 'SHOTGUN' | 'SNIPER' | 'RAPID' | 'HOMING';
export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
export type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME';

export type ZoneModifier = 'NONE' | 'GOLD_RUSH' | 'GLASS_CANNON' | 'VAMPIRISM' | 'SPEED_DEMON' | 'TANKY_MOBS' | 'CRITICAL_THINKING';

export interface Artifact {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: Rarity;
  stats: {
    power?: number; // Percent multiplier (e.g., 0.1 = +10%)
    speed?: number;
    defense?: number;
    critChance?: number; // 0.0 - 1.0
    goldMult?: number;
    lifeSteal?: number; // HP per kill
  };
}

export interface EmojiFighter {
  id: string;
  icon: string; // The emoji character (fallback)
  avatarImage?: string; // Base64 image from Imagen
  name: string;
  description: string;
  baseStats: {
    speed: number;
    power: number;
    defense: number;
  };
  ability: string;
  weapon: WeaponType;
  rarity: Rarity;
  isHybrid?: boolean;
  unlocked: boolean;
  price?: number; // Cost to unlock in gold
  sellPrice?: number; // Value if sold
}

export interface PlayerUpgrades {
  power: number; // Level
  speed: number;
  fireRate: number;
  health: number;
}

export interface Zone {
  id: string;
  name: string;
  description: string;
  difficulty: number; // 1-16 Base difficulty
  colors: {
    bg: string;
    grid: string;
    accent: string;
  };
  icon: string;
  bossIcon: string;
}

export interface GameResult {
  score: number;
  enemiesDefeated: number;
  survivalTime: number;
  events: string[]; // Log for Gemini commentary
  commentary?: string; // Generated later
  goldEarned: number;
  zoneId: string;
  victory: boolean;
  fighterId?: string; // To track who was used
  difficulty: Difficulty;
  modifier?: ZoneModifier;
}

export interface HybridResult {
  name: string;
  description: string;
  ability: string;
  comboScore: number; // 0-100
  rarity: Rarity;
  avatarImage?: string;
}

export type EnemyType = 'CHASER' | 'SHOOTER' | 'TANK' | 'BOSS' | 'EXPLODER';

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  zoneName: string;
  fighterIcon: string;
  date: number;
}

export interface HistoryEntry {
  id: string;
  score: number;
  victory: boolean;
  zoneName: string;
  fighterName: string;
  date: number;
  gold: number;
}
