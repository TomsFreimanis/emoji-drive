
import React, { useEffect, useRef, useState } from 'react';
import { EmojiFighter, GameResult, PlayerUpgrades, Zone, EnemyType, WeaponType, Difficulty, ZoneModifier, Artifact } from '../types';
import { Heart, Zap, Coins, Skull, AlertTriangle, Box } from 'lucide-react';
import { Button } from './ui/Button';
import { playSound } from './services/soundService';
import { saveGameResult } from './services/firebaseService';
import { DIFFICULTY_TIERS, ZONE_MODIFIERS } from '../constants';

interface BattleArenaProps {
  fighter: EmojiFighter;
  upgrades: PlayerUpgrades;
  zone: Zone;
  difficulty: Difficulty;
  onGameOver: (result: GameResult) => void;
  equippedArtifacts: Artifact[];
}

interface Enemy {
  x: number; 
  y: number; 
  type: string; 
  enemyClass: EnemyType;
  hp: number; 
  maxHp: number;
  vx: number; 
  vy: number; 
  size: number;
  lastAttack: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  isEnemy?: boolean;
  damageMult: number;
  color: string;
  isHoming?: boolean;
  shape: 'circle' | 'square' | 'ellipse';
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
  size: number;
}

export const BattleArena: React.FC<BattleArenaProps> = ({ fighter, upgrades, zone, difficulty, onGameOver, equippedArtifacts }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [shield, setShield] = useState(0);
  const [maxShield, setMaxShield] = useState(0);
  const [ultimateCharge, setUltimateCharge] = useState(0);
  const [gold, setGold] = useState(0);
  const [combo, setCombo] = useState(0);
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);
  const [bossActive, setBossActive] = useState(false);
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [bossHpData, setBossHpData] = useState<{current: number, max: number} | null>(null);
  const [screenShake, setScreenShake] = useState(0);
  const [modifier, setModifier] = useState<ZoneModifier>('NONE');

  const fighterImageRef = useRef<HTMLImageElement | null>(null);

  const propsRef = useRef({ fighter, upgrades, zone, difficulty, onGameOver, equippedArtifacts });
  useEffect(() => {
      propsRef.current = { fighter, upgrades, zone, difficulty, onGameOver, equippedArtifacts };
  }, [fighter, upgrades, zone, difficulty, onGameOver, equippedArtifacts]);

  const gameState = useRef({
    player: { x: 0, y: 0, vx: 0, vy: 0 },
    enemies: [] as Enemy[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[],
    bullets: [] as Bullet[],
    items: [] as { x: number; y: number; type: 'RATE' | 'MULTI' | 'GOLD' | 'HEAL'; icon: string; life: number; val?: number }[],
    floatingTexts: [] as FloatingText[],
    lastShot: 0,
    lastShieldRegen: 0,
    isRunning: true,
    score: 0,
    gold: 0,
    enemiesDefeated: 0,
    events: [] as string[],
    frameId: 0,
    startTime: 0,
    timeElapsed: 0,
    bossSpawned: false,
    survivalModeComplete: false,
    stats: {
      fireRateMod: 0, 
      multiShot: 0 
    },
    killStreak: 0,
    lastKillTime: 0,
    currentMaxHp: 100 // Synced ref for game loop logic
  });

  const keys = useRef<Record<string, boolean>>({});

  // Init
  useEffect(() => {
    if (fighter.avatarImage) {
      const img = new Image();
      img.src = fighter.avatarImage;
      fighterImageRef.current = img;
    }

    // Pick a random modifier
    const mods = ZONE_MODIFIERS.map(m => m.type);
    const randomMod = mods[Math.floor(Math.random() * mods.length)];
    setModifier(randomMod);
    
    // Apply Stats Logic (Base + Upgrades + Artifacts)
    let baseHpCalc = 100 + (upgrades.health * 20);
    equippedArtifacts.forEach(a => {
        // Artifacts that give HP (using defense stat slot for HP percent currently, e.g., Cyber Heart)
        if (a.stats.defense && a.stats.defense > 0) baseHpCalc *= (1 + a.stats.defense); 
    });

    if (randomMod === 'GLASS_CANNON') baseHpCalc *= 0.5;
    if (randomMod === 'TANKY_MOBS') baseHpCalc *= 1.5; 

    baseHpCalc = Math.floor(baseHpCalc);

    setMaxHp(baseHpCalc);
    setHp(baseHpCalc);
    gameState.current.currentMaxHp = baseHpCalc;

    let defStat = fighter.baseStats.defense;
    equippedArtifacts.forEach(a => { 
        // Small defense boost from artifacts if mapped
        if(a.stats.defense && a.stats.defense > 0) defStat += (a.stats.defense * 5) 
    });

    const calculatedShield = Math.floor(defStat * 5); 
    setMaxShield(calculatedShield);
    setShield(calculatedShield);

    if (randomMod !== 'NONE') {
        setOverlayMessage(`ANOMALY: ${ZONE_MODIFIERS.find(m => m.type === randomMod)?.label}`);
    }

  }, [fighter, upgrades.health, equippedArtifacts]); // Added equippedArtifacts dependency

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    gameState.current.player.x = window.innerWidth / 2;
    gameState.current.player.y = window.innerHeight / 2;
    gameState.current.enemies = [];
    gameState.current.bullets = [];
    gameState.current.particles = [];
    gameState.current.items = [];
    gameState.current.floatingTexts = [];
    gameState.current.isRunning = true;
    gameState.current.startTime = Date.now();
    gameState.current.bossSpawned = false;
    gameState.current.lastShieldRegen = Date.now();
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const handleKeyDown = (e: KeyboardEvent) => { 
        keys.current[e.code] = true; 
        if (e.code === 'Space') triggerUltimate();
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    
    const calculateSpeed = (props: typeof propsRef.current) => {
        const { fighter, upgrades, equippedArtifacts } = props;
        const isSpeedDemon = modifier === 'SPEED_DEMON';
        
        // NORMALIZED SPEED CALCULATION
        const basePixels = 4;
        const statFactor = fighter.baseStats.speed * 0.6;
        const upgradeFactor = 1 + (upgrades.speed * 0.05);
        
        let artifactFactor = 1;
        equippedArtifacts.forEach(a => { if(a.stats.speed) artifactFactor += a.stats.speed; });

        let finalSpeed = (basePixels + statFactor) * upgradeFactor * artifactFactor;
        
        if (isSpeedDemon) finalSpeed *= 1.4;
        
        // Soft Cap
        if (finalSpeed > 13) {
            finalSpeed = 13 + (finalSpeed - 13) * 0.5;
        }
        
        return Math.min(finalSpeed, 18);
    };

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const tx = touch.clientX - rect.left;
      const ty = touch.clientY - rect.top;
      
      const dx = tx - gameState.current.player.x;
      const dy = ty - gameState.current.player.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      const speed = calculateSpeed(propsRef.current);

      if (dist > 10) {
        // Smooth movement for touch
        gameState.current.player.vx = (dx / dist) * speed;
        gameState.current.player.vy = (dy / dist) * speed;
      } else {
        gameState.current.player.vx = 0;
        gameState.current.player.vy = 0;
      }
    };

    const handleTouchEnd = () => {
       gameState.current.player.vx = 0;
       gameState.current.player.vy = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    const loop = () => {
      if (!gameState.current.isRunning) return;
      
      const now = Date.now();
      gameState.current.timeElapsed = (now - gameState.current.startTime) / 1000;
      
      update(canvas, calculateSpeed); // Pass speed calc to update loop
      draw(canvas.getContext('2d')!);
      gameState.current.frameId = requestAnimationFrame(loop);
    };
    gameState.current.frameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchmove', handleTouch);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(gameState.current.frameId);
    };
  }, [modifier]); 

  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameState.current.isRunning) return;
      const elapsed = (Date.now() - gameState.current.startTime) / 1000;
      const remaining = Math.max(0, 60 - elapsed);
      setTimeLeft(Math.ceil(remaining));
      
      if (Date.now() - gameState.current.lastShieldRegen > 3000) {
         setShield(prev => {
            const max = propsRef.current.fighter.baseStats.defense * 5; // Simplified regen cap
            return Math.min(max, prev + 2);
         });
      }

      if (elapsed > 55 && elapsed < 60 && !gameState.current.bossSpawned) {
          if (!showBossWarning) playSound('boss');
          setShowBossWarning(true);
      }
      
      if (screenShake > 0) {
          setScreenShake(prev => Math.max(0, prev - 1));
      }

      // Decay killstreak
      if (Date.now() - gameState.current.lastKillTime > 3000) {
          gameState.current.killStreak = 0;
      }

    }, 100);
    return () => clearInterval(interval);
  }, [screenShake]);

  const triggerUltimate = () => {
    if (ultimateCharge < 100) return;

    setUltimateCharge(0);
    setOverlayMessage("ULTIMATE BLAST!");
    setScreenShake(10);
    playSound('ultimate');
    gameState.current.events.push("USED ULTIMATE");
    
    const state = gameState.current;
    createParticles(state.player.x, state.player.y, 'cyan', 80);
    
    // Shockwave effect
    state.enemies.forEach(e => {
      e.hp -= 500;
      createParticles(e.x, e.y, 'cyan', 20);
      spawnFloatingText(e.x, e.y, "500", "#22d3ee", 24);
    });
    
    state.bullets = state.bullets.filter(b => !b.isEnemy);
  };

  const spawnFloatingText = (x: number, y: number, text: string, color: string, size: number = 16) => {
    gameState.current.floatingTexts.push({
      x, y, text, color, size,
      life: 40,
      vy: -2
    });
  };

  const endGame = async (victory: boolean) => {
    if (!gameState.current.isRunning) return;
    gameState.current.isRunning = false;
    
    playSound(victory ? 'victory' : 'defeat');
    
    const { zone, onGameOver, fighter, difficulty, equippedArtifacts } = propsRef.current;
    
    let goldMult = 1.0;
    equippedArtifacts.forEach(a => { if(a.stats.goldMult) goldMult += a.stats.goldMult; });
    
    const baseGold = gameState.current.gold + (victory ? 500 * zone.difficulty * DIFFICULTY_TIERS[difficulty].goldMult : 0);
    const finalGold = Math.floor(baseGold * goldMult);

    const result: GameResult = {
      score: gameState.current.score,
      enemiesDefeated: gameState.current.enemiesDefeated,
      survivalTime: Math.min(60, Math.floor(gameState.current.timeElapsed)),
      events: gameState.current.events,
      goldEarned: finalGold,
      zoneId: zone.id,
      victory,
      fighterId: fighter.id,
      difficulty,
      modifier: modifier
    };

    await saveGameResult(result, zone, fighter);
    onGameOver(result);
  };

  const update = (canvas: HTMLCanvasElement, calcSpeed: (props: any) => number) => {
    const state = gameState.current;
    const { fighter, upgrades, zone, difficulty, equippedArtifacts } = propsRef.current;
    const diffSettings = DIFFICULTY_TIERS[difficulty];

    const width = canvas.width;
    const height = canvas.height;
    const timeElapsed = state.timeElapsed;
    const maxTime = 60;

    // Modifier Effects
    const isGlassCannon = modifier === 'GLASS_CANNON';
    const isVampirism = modifier === 'VAMPIRISM';
    const isGoldRush = modifier === 'GOLD_RUSH';
    const isTankyMobs = modifier === 'TANKY_MOBS';
    const isCrit = modifier === 'CRITICAL_THINKING';

    let effectivePower = fighter.baseStats.power * (1 + (upgrades.power * 0.1));
    equippedArtifacts.forEach(a => { if(a.stats.power) effectivePower *= (1 + a.stats.power); });
    
    if (isGlassCannon) effectivePower *= 2.0;

    const takeDamage = (amount: number) => {
      const adjustedAmount = amount * diffSettings.dmgMult; // Apply Difficulty Scaling

      state.lastShieldRegen = Date.now();
      playSound('hit');
      setScreenShake(prev => prev + 2);
      setShield(prevShield => {
         if (prevShield >= adjustedAmount) {
            spawnFloatingText(state.player.x, state.player.y, `Blocked`, "#60a5fa", 14);
            return prevShield - adjustedAmount;
         } else {
            const remainder = adjustedAmount - prevShield;
            setHp(prevHp => {
               const newHp = prevHp - remainder;
               if (newHp <= 0 && gameState.current.isRunning) setTimeout(() => endGame(false), 0);
               return newHp;
            });
            state.events.push('Took Damage');
            spawnFloatingText(state.player.x, state.player.y, `-${Math.ceil(remainder)}`, "#f87171", 20);
            createParticles(state.player.x, state.player.y, 'red', 5);
            return 0;
         }
      });
    };

    if (timeElapsed >= maxTime && !state.bossSpawned) {
      state.bossSpawned = true;
      state.survivalModeComplete = true;
      setBossActive(true);
      setShowBossWarning(false);
      setOverlayMessage("BOSS BATTLE START!");
      playSound('boss');
      state.events.push("BOSS SPAWNED");
      setScreenShake(10);
      
      state.enemies.forEach(e => createParticles(e.x, e.y, 'purple', 5));
      state.enemies = []; 

      const bossBaseHp = 3000; 
      const zoneMultiplier = zone.difficulty > 8 ? Math.pow(1.3, zone.difficulty - 5) : zone.difficulty;
      
      let bossHp = bossBaseHp * zoneMultiplier * diffSettings.hpMult; 
      if (isTankyMobs) bossHp *= 1.5;

      state.enemies.push({
         x: width/2, y: -200,
         type: zone.bossIcon,
         enemyClass: 'BOSS',
         hp: Math.floor(bossHp), maxHp: Math.floor(bossHp),
         vx: 0, vy: 0,
         size: 120,
         lastAttack: 0
      });
      setBossHpData({ current: Math.floor(bossHp), max: Math.floor(bossHp) });
    }

    // Player Movement Update (Keyboard)
    const speed = calcSpeed(propsRef.current);
    
    if (keys.current['ArrowUp'] || keys.current['KeyW']) state.player.vy = -speed;
    else if (keys.current['ArrowDown'] || keys.current['KeyS']) state.player.vy = speed;
    else if (!keys.current['ArrowUp'] && !keys.current['ArrowDown'] && Math.abs(state.player.vy) > 0.1) state.player.vy *= 0.9;

    if (keys.current['ArrowLeft'] || keys.current['KeyA']) state.player.vx = -speed;
    else if (keys.current['ArrowRight'] || keys.current['KeyD']) state.player.vx = speed;
    else if (!keys.current['ArrowLeft'] && !keys.current['ArrowRight'] && Math.abs(state.player.vx) > 0.1) state.player.vx *= 0.9;

    state.player.x += state.player.vx;
    state.player.y += state.player.vy;
    state.player.x = Math.max(20, Math.min(width - 20, state.player.x));
    state.player.y = Math.max(20, Math.min(height - 20, state.player.y));

    // --- PROCEDURAL SPAWN LOGIC (ZONES 1-16) ---
    if (!state.bossSpawned) {
        const d = zone.difficulty; // 1 to 16
        const timeRatio = timeElapsed / 60;
        const spawnThreshold = 0.015 + (d * 0.004) + (timeRatio * 0.05); 
        const maxEnemies = 3 + d + Math.floor(timeElapsed / 4);

        if (state.enemies.length < maxEnemies && Math.random() < spawnThreshold) {
            const side = Math.floor(Math.random() * 4);
            let ex = 0, ey = 0;
            if (side === 0) { ex = Math.random() * width; ey = -40; }
            if (side === 1) { ex = width + 40; ey = Math.random() * height; }
            if (side === 2) { ex = Math.random() * width; ey = height + 40; }
            if (side === 3) { ex = -40; ey = Math.random() * height; }
            
            // Determine Enemy Type
            const rand = Math.random();
            let enemyClass: EnemyType = 'CHASER';
            let type = '👿';
            let hpMult = 1.0;
            let size = 30;

            if (d >= 4 && rand > 0.85) {
               enemyClass = 'EXPLODER'; type = '💣'; hpMult = 0.5; size = 35;
            } else if (d >= 2 && rand > 0.7) {
               enemyClass = 'SHOOTER'; type = '🛸'; hpMult = 0.8;
            } else if (d >= 3 && rand > 0.9) {
               enemyClass = 'TANK'; type = '🗿'; hpMult = 2.5; size = 50;
            }
            
            if (zone.id === 'zone_5') { type = '🧊'; }
            if (zone.id === 'zone_6') { type = '🌩️'; }
            if (zone.id === 'zone_8') { type = '👁️'; }
            if (zone.id === 'zone_9') { type = '🔥'; }
            if (zone.id === 'zone_10') { type = '🦑'; }
            if (zone.id === 'zone_11') { type = '👾'; }
            if (zone.id === 'zone_12') { type = '⚫'; }
            if (zone.id === 'zone_13') { type = '⚛️'; }
            if (zone.id === 'zone_14') { type = '👾'; }

            const baseHp = 15 + (timeElapsed * 2);
            const difficultyHp = baseHp * (1 + (d * 0.5)); 
            let finalHp = difficultyHp * hpMult * diffSettings.hpMult; 
            if (isTankyMobs) finalHp *= 1.5;

            state.enemies.push({
                x: ex, y: ey, type, enemyClass,
                hp: finalHp, maxHp: finalHp, 
                vx: 0, vy: 0, 
                size,
                lastAttack: 0
            });
        }
    } 

    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i];
      const dx = state.player.x - enemy.x;
      const dy = state.player.y - enemy.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Enemy Movement Logic
      let speedMod = 1.0 + (zone.difficulty * 0.15) + (timeElapsed * 0.01);
      if (modifier === 'SPEED_DEMON') speedMod *= 1.5;
      if (zone.id === 'zone_5') speedMod *= 1.2; 
      if (zone.id === 'zone_10') speedMod *= 0.6; 
      
      if (enemy.enemyClass === 'TANK') speedMod *= 0.4;
      if (enemy.enemyClass === 'EXPLODER') speedMod *= 2.0;
      
      speedMod = Math.min(speedMod, 14); 

      if (enemy.enemyClass === 'BOSS') {
         const targetX = state.player.x;
         const targetY = height * 0.25; 
         enemy.x += (targetX - enemy.x) * 0.03;
         enemy.y += (targetY - enemy.y) * 0.03;

         const attackRate = Math.max(300, 1500 - (zone.difficulty * 150));
         if (Date.now() - enemy.lastAttack > attackRate) {
             const attackType = Math.random();
             if (attackType > 0.4) {
                playSound('shoot');
                const count = 6 + zone.difficulty;
                for(let k=0; k<count; k++) {
                    const angle = (Math.PI / (count-1)) * k + (Date.now()/1000); 
                    state.bullets.push({
                        x: enemy.x, y: enemy.y + 60,
                        vx: Math.cos(angle + Math.PI/4) * 6,
                        vy: Math.sin(angle + Math.PI/4) * 6,
                        life: 300,
                        isEnemy: true,
                        damageMult: 1,
                        color: '#f87171',
                        shape: 'circle'
                    });
                }
             } else {
                 playSound('shoot');
                 state.bullets.push({
                     x: enemy.x, y: enemy.y,
                     vx: (dx/dist) * 15, vy: (dy/dist) * 15,
                     life: 200, isEnemy: true,
                     damageMult: 1,
                     color: '#f87171',
                     shape: 'circle'
                 });
             }
             enemy.lastAttack = Date.now();
         }
      } else {
          if (enemy.enemyClass === 'SHOOTER') {
            speedMod *= 0.7;
            if (dist < 350 && dist > 200) speedMod = 0; 
            if (dist < 200) speedMod = -1.5; 
            
            const shootDelay = Math.max(800, 3000 - (zone.difficulty * 250));

            if (Date.now() - enemy.lastAttack > shootDelay) {
                playSound('shoot');
                state.bullets.push({
                  x: enemy.x, y: enemy.y,
                  vx: (dx/dist) * (5 + zone.difficulty), vy: (dy/dist) * (5 + zone.difficulty),
                  life: 120,
                  isEnemy: true,
                  damageMult: 1,
                  color: '#fbbf24',
                  shape: 'circle'
                });
                enemy.lastAttack = Date.now();
            }
          }

          enemy.vx = (dx / dist) * speedMod;
          enemy.vy = (dy / dist) * speedMod;
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;
      }

      if (dist < (enemy.size + 20)) {
        let damage = Math.max(5, (enemy.enemyClass === 'BOSS' ? 40 : 10));
        if (enemy.enemyClass === 'EXPLODER') damage = 40 + (zone.difficulty * 5);
        else damage += zone.difficulty * 2;

        takeDamage(damage);
        
        if (enemy.enemyClass === 'EXPLODER') {
           playSound('explosion');
           setScreenShake(prev => prev + 5);
           createParticles(enemy.x, enemy.y, '#ef4444', 30);
           state.enemies.splice(i, 1); 
        }
        else if (enemy.enemyClass !== 'BOSS') {
            enemy.x -= (dx/dist) * 60;
            enemy.y -= (dy/dist) * 60;
        } else {
            state.player.x += (dx/dist) * 150;
            state.player.y += (dy/dist) * 150;
            setScreenShake(prev => prev + 5);
        }
        setCombo(0);
      }
    }

    const getWeaponStats = (type: WeaponType) => {
      switch(type) {
        case 'RAPID': return { delayMult: 0.3, damageMult: 0.3, speed: 14, spread: 0.15, count: 1, color: '#4ade80', shape: 'square' as const };
        case 'SNIPER': return { delayMult: 2.5, damageMult: 4.0, speed: 25, spread: 0, count: 1, color: '#06b6d4', shape: 'ellipse' as const };
        case 'SHOTGUN': return { delayMult: 1.8, damageMult: 0.6, speed: 10, spread: 0.4, count: 4, color: '#fb923c', shape: 'circle' as const }; 
        case 'HOMING': return { delayMult: 1.0, damageMult: 0.7, speed: 9, spread: 0, count: 1, homing: true, color: '#e879f9', shape: 'circle' as const };
        case 'BLASTER': default: return { delayMult: 0.8, damageMult: 1.0, speed: 12, spread: 0.05, count: 1, color: '#facc15', shape: 'circle' as const };
      }
    };
    
    const weaponStats = getWeaponStats(fighter.weapon);
    
    const speedReduction = fighter.baseStats.speed * 5; 
    const upgradeReduction = upgrades.fireRate * 20; 
    const buffReduction = state.stats.fireRateMod * 20; 
    
    const baseDelay = (550 - speedReduction - upgradeReduction - buffReduction);
    const fireDelay = Math.max(60, baseDelay * weaponStats.delayMult);
    
    if (Date.now() - state.lastShot > fireDelay) {
      playSound('shoot');
      let closest = null;
      let minDist = 1000; 
      
      const boss = state.enemies.find(e => e.enemyClass === 'BOSS');
      if (boss) {
          closest = boss;
      } else {
        for (const e of state.enemies) {
            const d = Math.hypot(e.x - state.player.x, e.y - state.player.y);
            if (d < minDist) { minDist = d; closest = e; }
        }
      }

      if (closest || weaponStats.homing) {
        const targetX = closest ? closest.x : state.player.x;
        const targetY = closest ? closest.y : state.player.y - 100;
        
        const angle = Math.atan2(targetY - state.player.y, targetX - state.player.x);
        const shots = Math.max(weaponStats.count, 1) + state.stats.multiShot; 
        const spread = weaponStats.spread;
        
        for (let i = 0; i < shots; i++) {
          const currentAngle = angle - ((shots-1) * spread / 2) + (i * spread);
          const jitter = weaponStats.spread > 0 && fighter.weapon === 'RAPID' ? (Math.random() - 0.5) * 0.2 : 0;

          state.bullets.push({
            x: state.player.x, y: state.player.y,
            vx: Math.cos(currentAngle + jitter) * weaponStats.speed,
            vy: Math.sin(currentAngle + jitter) * weaponStats.speed,
            life: fighter.weapon === 'SNIPER' ? 120 : 60,
            isEnemy: false,
            damageMult: weaponStats.damageMult,
            color: weaponStats.color,
            isHoming: weaponStats.homing,
            shape: weaponStats.shape
          });
        }
        state.lastShot = Date.now();
      }
    }

    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      
      if (b.isHoming && !b.isEnemy) {
         let nearest = null; 
         let minD = 800;
         for (const e of state.enemies) {
             const d = Math.hypot(e.x - b.x, e.y - b.y);
             if (d < minD) { minD = d; nearest = e; }
         }
         if (nearest) {
             const angle = Math.atan2(nearest.y - b.y, nearest.x - b.x);
             b.vx = b.vx * 0.92 + Math.cos(angle) * 1.5;
             b.vy = b.vy * 0.92 + Math.sin(angle) * 1.5;
         }
      }

      b.x += b.vx;
      b.y += b.vy;
      b.life--;
      
      if (b.isEnemy) {
        if (Math.hypot(state.player.x - b.x, state.player.y - b.y) < 15) {
            takeDamage(8);
            state.bullets.splice(i, 1);
            continue;
        }
      } 
      else {
        let hit = false;
        for (let j = state.enemies.length - 1; j >= 0; j--) {
            const e = state.enemies[j];
            const hitDist = e.enemyClass === 'BOSS' ? e.size + 20 : e.size + 10; 
            
            if (Math.hypot(e.x - b.x, e.y - b.y) < hitDist) {
                const damage = effectivePower * b.damageMult;
                e.hp -= damage;
                hit = true;
                createParticles(e.x, e.y, b.color, 1);
                
                // Artifact Crit Logic
                let critChance = 0;
                equippedArtifacts.forEach(a => { if(a.stats.critChance) critChance += a.stats.critChance; });
                
                let isCritLocal = Math.random() < critChance;
                if (isCrit) isCritLocal = Math.random() > 0.5; 

                const finalDmg = isCritLocal ? damage * 2.0 : damage;
                if (isCritLocal) e.hp -= damage; 

                spawnFloatingText(
                    e.x + (Math.random()*20 - 10), 
                    e.y - 20, 
                    Math.floor(finalDmg).toString(), 
                    isCritLocal ? '#facc15' : '#ffffff',
                    isCritLocal ? 24 : 16
                );
                
                if (e.enemyClass === 'BOSS') {
                    setBossHpData({ current: Math.floor(Math.max(0, e.hp)), max: Math.floor(e.maxHp) });
                }

                if (e.hp <= 0) {
                    if (e.enemyClass === 'EXPLODER') {
                       playSound('explosion');
                       createParticles(e.x, e.y, '#ef4444', 30);
                       setScreenShake(prev => prev + 5);
                    } else {
                       playSound('explosion'); 
                    }
                    
                    // Artifact Lifesteal Logic
                    let lifeSteal = 0;
                    equippedArtifacts.forEach(a => { if(a.stats.lifeSteal) lifeSteal += a.stats.lifeSteal; });

                    if (isVampirism) lifeSteal += 2;
                    
                    if (lifeSteal > 0) {
                        // FIX: Use currentMaxHp from ref to avoid stale closure
                        setHp(prev => Math.min(state.currentMaxHp, prev + lifeSteal));
                        createParticles(state.player.x, state.player.y, '#4ade80', 10);
                        spawnFloatingText(state.player.x, state.player.y, `+${lifeSteal}`, "#4ade80", 16);
                    }

                    // Kill Streak Logic
                    const killTime = Date.now();
                    if (killTime - state.lastKillTime < 1500) {
                        state.killStreak++;
                    } else {
                        state.killStreak = 1;
                    }
                    state.lastKillTime = killTime;

                    if (state.killStreak === 2) setOverlayMessage("DOUBLE KILL");
                    if (state.killStreak === 5) setOverlayMessage("KILLING SPREE");
                    if (state.killStreak === 10) setOverlayMessage("RAMPAGE!");
                    if (state.killStreak === 15) setOverlayMessage("GODLIKE!!");

                    const rand = Math.random();
                    // Item Drops
                    if (rand < 0.3) {
                        state.items.push({
                            x: e.x, y: e.y,
                            type: Math.random() > 0.5 ? 'RATE' : 'MULTI',
                            icon: Math.random() > 0.5 ? '⚡' : '⭐',
                            life: 400
                        });
                    }
                    // Heart Drop (Rare)
                    if (rand < 0.05) {
                        state.items.push({
                            x: e.x, y: e.y, type: 'HEAL', icon: '❤️', life: 600
                        });
                    }

                    if (rand < 0.5 || e.enemyClass === 'BOSS') {
                        let goldVal = Math.floor((e.enemyClass === 'BOSS' ? 2000 : 10 + (zone.difficulty * 2)) * diffSettings.goldMult);
                        if (isGoldRush) goldVal *= 2;
                        state.items.push({
                            x: e.x, y: e.y, type: 'GOLD', icon: '💰', life: 600,
                            val: goldVal
                        });
                    }

                    if (e.enemyClass === 'BOSS') {
                        setBossActive(false);
                        setOverlayMessage("ZONE CLEARED!");
                        state.events.push("BOSS DEFEATED");
                        state.score += 50000 * zone.difficulty;
                        createParticles(e.x, e.y, 'gold', 100);
                        setTimeout(() => endGame(true), 2500);
                    }

                    state.enemies.splice(j, 1);
                    state.score += 100 * zone.difficulty;
                    state.enemiesDefeated++;
                    setUltimateCharge(c => Math.min(100, c + 5)); 
                    setCombo(c => c + 1);
                }
                break; 
            }
        }
        if (hit || b.life <= 0) state.bullets.splice(i, 1);
        continue;
      }
      if (b.life <= 0) state.bullets.splice(i, 1);
    }

    for (let i = state.items.length - 1; i >= 0; i--) {
       const item = state.items[i];
       const dx = state.player.x - item.x;
       const dy = state.player.y - item.y;
       const dist = Math.hypot(dx, dy);
       if (dist < 150) {
         item.x += (dx/dist) * 12; 
         item.y += (dy/dist) * 12;
       }
       if (dist < 30) {
         playSound('powerup');
         if (item.type === 'RATE') {
           state.stats.fireRateMod += 1;
           setOverlayMessage("FIRE RATE UP!");
         } else if (item.type === 'MULTI') {
           state.stats.multiShot += 1;
           setOverlayMessage("MULTISHOT!");
         } else if (item.type === 'GOLD') {
           const val = item.val || 10;
           state.gold += Math.floor(val);
           setGold(state.gold);
         } else if (item.type === 'HEAL') {
           // FIX: Use currentMaxHp ref
           setHp(prev => Math.min(state.currentMaxHp, prev + (state.currentMaxHp * 0.2)));
           setOverlayMessage("HEALED!");
           createParticles(state.player.x, state.player.y, '#ef4444', 15);
           spawnFloatingText(state.player.x, state.player.y, "+HP", "#ef4444", 20);
         }
         
         createParticles(state.player.x, state.player.y, item.type === 'GOLD' ? 'yellow' : 'white', 8);
         state.items.splice(i, 1);
       }
       item.life--;
       if (item.life <= 0) state.items.splice(i, 1);
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) state.particles.splice(i, 1);
    }

    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const t = state.floatingTexts[i];
      t.y += t.vy;
      t.vy *= 0.9;
      t.life--;
      if (t.life <= 0) state.floatingTexts.splice(i, 1);
    }

    if (Math.random() < 0.02) setOverlayMessage(null);
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for(let i=0; i<count; i++) {
      gameState.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 20 + Math.random() * 10,
        color,
        size: Math.random() * 5 + 2
      });
    }
  };

  const getArtifactShortDesc = (a: Artifact) => {
      if (a.stats.power) return `+${Math.round(a.stats.power*100)}% DMG`;
      if (a.stats.defense) return `+${Math.round(a.stats.defense*100)}% HP`;
      if (a.stats.lifeSteal) return `+${a.stats.lifeSteal} Vamp`;
      if (a.stats.critChance) return `+${Math.round(a.stats.critChance*100)}% Crit`;
      if (a.stats.goldMult) return `+${Math.round(a.stats.goldMult*100)}% Gold`;
      return a.description;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    
    // Apply Shake
    const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
    const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
    
    ctx.save();
    ctx.translate(shakeX, shakeY);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, zone.colors.bg);
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = zone.colors.grid;
    ctx.lineWidth = 2;
    for(let x=0; x<width; x+=60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke(); }
    for(let y=0; y<height; y+=60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }

    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    gameState.current.items.forEach(item => {
       ctx.fillText(item.icon, item.x, item.y);
       if (item.type !== 'GOLD') {
         ctx.beginPath(); ctx.arc(item.x, item.y, 18, 0, Math.PI*2); ctx.strokeStyle = 'white'; ctx.stroke();
       }
    });

    if (fighter.avatarImage && fighterImageRef.current) {
      ctx.save();
      ctx.beginPath(); ctx.arc(gameState.current.player.x, gameState.current.player.y, 30, 0, Math.PI*2);
      ctx.closePath(); ctx.clip();
      ctx.drawImage(fighterImageRef.current, gameState.current.player.x - 30, gameState.current.player.y - 30, 60, 60);
      ctx.restore();
    } else {
      ctx.font = '40px serif'; ctx.fillText(fighter.icon, gameState.current.player.x, gameState.current.player.y);
    }

    if (shield > 0) {
       ctx.beginPath();
       ctx.arc(gameState.current.player.x, gameState.current.player.y, 40, 0, Math.PI*2);
       ctx.strokeStyle = `rgba(100, 200, 255, ${shield / maxShield})`;
       ctx.lineWidth = 4;
       ctx.stroke();
    }
    
    gameState.current.enemies.forEach(e => {
      ctx.font = `${e.size}px serif`;
      ctx.fillText(e.type, e.x, e.y);
      if (e.enemyClass !== 'BOSS' && e.hp < e.maxHp) {
         const barWidth = 30;
         const hpRatio = Math.max(0, e.hp / e.maxHp);
         ctx.fillStyle = 'red'; ctx.fillRect(e.x - 15, e.y - 30, barWidth, 4);
         ctx.fillStyle = 'green'; ctx.fillRect(e.x - 15, e.y - 30, barWidth * hpRatio, 4);
      }
    });

    gameState.current.bullets.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 5;
      ctx.shadowColor = b.color;
      
      const size = b.isEnemy ? 10 : 7;
      
      if (b.shape === 'square') {
        ctx.fillRect(b.x - size/2, b.y - size/2, size, size);
      } else if (b.shape === 'ellipse') {
         ctx.beginPath(); ctx.ellipse(b.x, b.y, size*2, size/2, Math.atan2(b.vy, b.vx), 0, Math.PI*2); ctx.fill();
      } else {
         ctx.beginPath(); ctx.arc(b.x, b.y, size, 0, Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur = 0;
    });

    gameState.current.particles.forEach(p => {
      ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 30;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
    });

    gameState.current.floatingTexts.forEach(t => {
      ctx.font = `bold ${t.size}px Inter`;
      ctx.fillStyle = t.color;
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
    });

    ctx.restore();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950">
      <canvas ref={canvasRef} className="block w-full h-full touch-none" />
      
      {/* HUD Layer */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
          <div className="flex items-center gap-3">
             <div className="w-16 h-16 rounded-full border-4 border-slate-800 overflow-hidden bg-slate-900 flex items-center justify-center shadow-xl ring-2 ring-white/20">
               {fighter.avatarImage ? (
                 <img src={fighter.avatarImage} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-3xl">{fighter.icon}</span>
               )}
             </div>

            <div className="flex flex-col gap-2">
              <div className="h-5 w-40 bg-slate-900/80 rounded-full border border-white/10 overflow-hidden relative backdrop-blur-md">
                 <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300" 
                   style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }} />
                 {shield > 0 && (
                     <div className="absolute left-0 top-0 bottom-0 bg-blue-500/50 border-r-2 border-blue-400 transition-all duration-300" 
                     style={{ width: `${Math.max(0, (shield / maxShield) * 100)}%` }} />
                 )}
                 <div className="absolute inset-0 flex items-center px-2 gap-1">
                    <Heart className="w-3 h-3 text-white fill-white drop-shadow" />
                    <span className="text-[10px] font-bold text-white drop-shadow tracking-wide">{Math.ceil(Math.max(0, hp))} / {maxHp}</span>
                 </div>
              </div>
              <div className="flex items-center gap-1 bg-black/40 px-3 py-0.5 rounded-full text-yellow-400 text-sm font-bold border border-yellow-500/20 w-fit backdrop-blur-sm">
                <Coins className="w-3 h-3" /> {Math.floor(gold)}
              </div>
            </div>
          </div>

          {/* Active Buffs HUD */}
          {(equippedArtifacts.length > 0 || gameState.current.stats.fireRateMod > 0 || gameState.current.stats.multiShot > 0) && (
              <div className="mt-2 flex flex-col gap-1 animate-in slide-in-from-left-5 fade-in duration-500">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest ml-1">Active Buffs</span>
                  {equippedArtifacts.map((a, idx) => (
                      <div key={`art-${idx}`} className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/10 backdrop-blur-sm w-fit">
                          <span className="text-xl">{a.icon}</span>
                          <span className="text-[10px] text-white font-bold">{getArtifactShortDesc(a)}</span>
                      </div>
                  ))}
                  {gameState.current.stats.fireRateMod > 0 && (
                      <div className="flex items-center gap-2 bg-yellow-900/40 p-1.5 rounded-lg border border-yellow-500/30 backdrop-blur-sm w-fit">
                          <span className="text-xl">⚡</span>
                          <span className="text-[10px] text-yellow-200 font-bold">Fire Rate +{gameState.current.stats.fireRateMod}</span>
                      </div>
                  )}
                  {gameState.current.stats.multiShot > 0 && (
                      <div className="flex items-center gap-2 bg-blue-900/40 p-1.5 rounded-lg border border-blue-500/30 backdrop-blur-sm w-fit">
                          <span className="text-xl">⭐</span>
                          <span className="text-[10px] text-blue-200 font-bold">Multishot +{gameState.current.stats.multiShot}</span>
                      </div>
                  )}
              </div>
          )}
      </div>

      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none">
        {bossActive ? (
           <div className="text-red-500 font-display text-3xl animate-pulse drop-shadow-lg flex items-center gap-2">
             <Skull /> BOSS BATTLE
           </div>
        ) : (
          <div className={`text-5xl font-display drop-shadow-lg flex items-center gap-2 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            <span className="text-2xl text-slate-400">TIME</span> {timeLeft}
          </div>
        )}
        <div className="text-slate-300 font-bold text-xs uppercase tracking-widest flex items-center gap-1 bg-black/30 px-2 py-1 rounded border border-white/5 backdrop-blur-sm">
           {zone.icon} {zone.name}
        </div>
        <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-black/30 px-2 py-1 rounded border border-white/5">
           {difficulty}
        </div>
        {modifier !== 'NONE' && (
            <div className={`text-[10px] font-bold uppercase tracking-widest bg-black/30 px-2 py-1 rounded border border-white/5 ${ZONE_MODIFIERS.find(m => m.type === modifier)?.color}`}>
                ANOMALY: {ZONE_MODIFIERS.find(m => m.type === modifier)?.label}
            </div>
        )}
      </div>

      <div className="absolute bottom-8 right-8 z-50 pointer-events-auto">
         <Button 
            variant="primary" 
            className={`rounded-full w-24 h-24 flex flex-col items-center justify-center border-4 shadow-2xl transition-all duration-300 ${ultimateCharge >= 100 ? 'animate-pulse border-yellow-400 bg-indigo-600 scale-110 shadow-indigo-500/50' : 'grayscale opacity-80 border-slate-700'}`}
            onClick={triggerUltimate}
            disabled={ultimateCharge < 100}
         >
            <Zap className={`w-8 h-8 mb-1 ${ultimateCharge >= 100 ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'}`}/>
            <span className="text-[10px] font-bold uppercase tracking-widest">{Math.floor(ultimateCharge)}%</span>
         </Button>
      </div>

      {showBossWarning && (
         <div className="absolute top-24 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none animate-bounce">
             <AlertTriangle className="w-16 h-16 text-red-500 fill-red-500/20" />
             <span className="text-red-500 font-display text-4xl tracking-widest drop-shadow-black stroke-2">WARNING</span>
         </div>
      )}

      {bossActive && bossHpData && (
         <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-md px-8 pointer-events-none animate-in fade-in slide-in-from-top-5">
            <div className="h-6 w-full bg-slate-900/90 rounded-full border border-red-500/50 overflow-hidden relative shadow-lg shadow-red-900/50">
               <div 
                 className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-red-700 to-red-500 transition-all duration-100"
                 style={{ width: `${Math.max(0, (bossHpData.current / bossHpData.max) * 100)}%` }}
               />
               <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white uppercase tracking-widest drop-shadow">
                  {zone.bossIcon} Boss Health
               </span>
            </div>
         </div>
      )}

      {overlayMessage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
           <h1 className="text-7xl font-display text-yellow-300 tracking-tighter transform -rotate-6 animate-bounce neon-text text-center px-4 drop-shadow-2xl stroke-black" 
               style={{ WebkitTextStroke: '2px black' }}>
             {overlayMessage}
           </h1>
        </div>
      )}
    </div>
  );
};
