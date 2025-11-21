
import { GameResult, LeaderboardEntry, HistoryEntry, Zone, EmojiFighter } from '../../types';

// --- CONFIGURATION ---
// Set to FALSE to use real Firebase. Set to TRUE for instant demo mode (localStorage).
const USE_MOCK = true; 

// Paste your Firebase Config here if USE_MOCK is false
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// --- MOCK IMPLEMENTATION (LocalStorage) ---
const mockDB = {
  saveScore: async (result: GameResult, zone: Zone, fighter: EmojiFighter) => {
    // 1. Save to History
    const history: HistoryEntry[] = JSON.parse(localStorage.getItem('eo_history') || '[]');
    const newHistoryEntry: HistoryEntry = {
      id: Date.now().toString(),
      score: result.score,
      victory: result.victory,
      zoneName: zone.name,
      fighterName: fighter.name,
      date: Date.now(),
      gold: result.goldEarned
    };
    history.unshift(newHistoryEntry); // Add to top
    localStorage.setItem('eo_history', JSON.stringify(history.slice(0, 50))); // Keep last 50

    // 2. Save to Leaderboard (if high score)
    if (result.score > 0) {
      const leaderboard: LeaderboardEntry[] = JSON.parse(localStorage.getItem('eo_leaderboard') || '[]');
      const newEntry: LeaderboardEntry = {
        id: Date.now().toString(),
        playerName: 'Player', // Could be customizable
        score: result.score,
        zoneName: zone.name,
        fighterIcon: fighter.icon,
        date: Date.now()
      };
      leaderboard.push(newEntry);
      leaderboard.sort((a, b) => b.score - a.score);
      localStorage.setItem('eo_leaderboard', JSON.stringify(leaderboard.slice(0, 100)));
    }
  },

  getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    const data = JSON.parse(localStorage.getItem('eo_leaderboard') || '[]');
    
    // Seed some fake data if empty
    if (data.length === 0) {
      return [
        { id: '1', playerName: 'EmojiKing', score: 150000, zoneName: 'OMEGA CORE', fighterIcon: '👽', date: Date.now() },
        { id: '2', playerName: 'SpeedRunner', score: 85000, zoneName: 'MAGMA CORE', fighterIcon: '⚡', date: Date.now() },
        { id: '3', playerName: 'TankBuild', score: 42000, zoneName: 'NEON STREETS', fighterIcon: '🗿', date: Date.now() }
      ];
    }
    return data;
  },

  getHistory: async (): Promise<HistoryEntry[]> => {
    await new Promise(r => setTimeout(r, 300));
    return JSON.parse(localStorage.getItem('eo_history') || '[]');
  }
};

// --- PUBLIC API ---
export const saveGameResult = async (result: GameResult, zone: Zone, fighter: EmojiFighter) => {
  if (USE_MOCK) {
    await mockDB.saveScore(result, zone, fighter);
  } else {
    // Real Firebase implementation would go here
    console.log("Firebase not configured. Using Mock.");
  }
};

export const fetchLeaderboard = async () => {
  return USE_MOCK ? mockDB.getLeaderboard() : [];
};

export const fetchHistory = async () => {
  return USE_MOCK ? mockDB.getHistory() : [];
};
