// Realistic Powerup System with working effects
import { Powerup, PowerupRarity, GameState, Die } from '../types';

type PowerupEffect = (gameState: GameState, context?: PowerupContext) => void;

interface PowerupContext {
  diceManager?: any;
  dice?: Die[];
  game?: any;
  scoreManager?: any;
}

// Rarity definitions with colors and drop rates
export const RARITY_CONFIG = {
  common: { color: '#95a5a6', dropRate: 0.35, glowColor: 'rgba(149, 165, 166, 0.3)' },
  uncommon: { color: '#27ae60', dropRate: 0.25, glowColor: 'rgba(39, 174, 96, 0.3)' },
  rare: { color: '#3498db', dropRate: 0.18, glowColor: 'rgba(52, 152, 219, 0.3)' },
  epic: { color: '#9b59b6', dropRate: 0.12, glowColor: 'rgba(155, 89, 182, 0.3)' },
  legendary: { color: '#f39c12', dropRate: 0.07, glowColor: 'rgba(243, 156, 18, 0.3)' }
};

// All realistic powerups (working effects only)
const ALL_POWERUPS: Omit<Powerup, 'effect'>[] = [
  // === COMMON (15) - Simple point bonuses and minor buffs ===
  { id: 'c1', name: 'Lucky Charm', description: '+10 bonus points', rarity: 'common', type: 'active', cost: 0, icon: '🍀', stackable: true, maxStack: 5 },
  { id: 'c2', name: 'Small Win', description: '+15 bonus points', rarity: 'common', type: 'active', cost: 0, icon: '⭐', stackable: true, maxStack: 5 },
  { id: 'c3', name: 'Quick Points', description: '+20 bonus points', rarity: 'common', type: 'active', cost: 0, icon: '💫', stackable: true, maxStack: 4 },
  { id: 'c4', name: 'Momentum', description: '+1 extra roll next turn', rarity: 'common', type: 'passive', cost: 0, icon: '⚡', stackable: true, maxStack: 2 },
  { id: 'c5', name: 'Steady Hand', description: '+1 extra roll next turn', rarity: 'common', type: 'passive', cost: 0, icon: '✋', stackable: true, maxStack: 2 },
  { id: 'c6', name: 'Safe Bet', description: 'Minimum 10 points per category', rarity: 'common', type: 'passive', cost: 0, icon: '💰', stackable: true, maxStack: 1 },
  { id: 'c7', name: 'Opportunist', description: '+5 to your score, -5 from AI', rarity: 'common', type: 'active', cost: 0, icon: '🫳', stackable: true, maxStack: 2 },
  { id: 'c8', name: 'Focus', description: '+25 bonus points', rarity: 'common', type: 'active', cost: 0, icon: '🎯', stackable: true, maxStack: 3 },
  { id: 'c9', name: 'Warm Up', description: '+30 bonus points', rarity: 'common', type: 'active', cost: 0, icon: '🔥', stackable: true, maxStack: 3 },
  { id: 'c10', name: 'Backup', description: '+35 bonus points', rarity: 'common', type: 'active', cost: 0, icon: '📦', stackable: true, maxStack: 2 },
  { id: 'c11', name: 'Balanced', description: '+5 to all future category scores', rarity: 'common', type: 'passive', cost: 0, icon: '⚖️', stackable: true, maxStack: 3 },
  { id: 'c12', name: 'Patience', description: '+50 bonus points', rarity: 'common', type: 'active', cost: 0, icon: '⏳', stackable: true, maxStack: 1 },
  { id: 'c13', name: 'Second Wind', description: '+1 extra roll if you bust', rarity: 'common', type: 'passive', cost: 0, icon: '💨', stackable: true, maxStack: 1 },
  { id: 'c14', name: 'Insight', description: '+40 bonus points', rarity: 'common', type: 'active', cost: 0, icon: '👁️', stackable: true, maxStack: 2 },
  { id: 'c15', name: 'Flash', description: '+45 bonus points', rarity: 'common', type: 'active', cost: 0, icon: '✨', stackable: true, maxStack: 2 },

  // === UNCOMMON (15) - Better bonuses and some multipliers ===
  { id: 'u1', name: 'Lucky Streak', description: '+60 bonus points', rarity: 'uncommon', type: 'active', cost: 0, icon: '🍀', stackable: true, maxStack: 3 },
  { id: 'u2', name: 'Double Points', description: '2x next category score', rarity: 'uncommon', type: 'active', cost: 0, icon: '💎', stackable: true, maxStack: 2 },
  { id: 'u3', name: 'Bounty', description: '+70 bonus points', rarity: 'uncommon', type: 'active', cost: 0, icon: '💵', stackable: true, maxStack: 3 },
  { id: 'u4', name: 'Extra Roll', description: '+2 extra rolls next turn', rarity: 'uncommon', type: 'passive', cost: 0, icon: '🎳', stackable: true, maxStack: 1 },
  { id: 'u5', name: 'Vampiric', description: '+10 to your score, -10 from AI', rarity: 'uncommon', type: 'active', cost: 0, icon: '🧛', stackable: true, maxStack: 2 },
  { id: 'u6', name: 'Surge', description: '+80 bonus points', rarity: 'uncommon', type: 'active', cost: 0, icon: '📈', stackable: true, maxStack: 2 },
  { id: 'u7', name: 'Triple Points', description: '3x next category score', rarity: 'uncommon', type: 'active', cost: 0, icon: '💠', stackable: true, maxStack: 1 },
  { id: 'u8', name: 'Fortune', description: '+90 bonus points', rarity: 'uncommon', type: 'active', cost: 0, icon: '🎰', stackable: true, maxStack: 2 },
  { id: 'u9', name: 'Insurance', description: 'Minimum 20 points per category', rarity: 'uncommon', type: 'passive', cost: 0, icon: '📋', stackable: true, maxStack: 1 },
  { id: 'u10', name: 'Midas', description: '+100 bonus points', rarity: 'uncommon', type: 'active', cost: 0, icon: '👑', stackable: true, maxStack: 1 },
  { id: 'u11', name: 'Reroll All', description: 'Reroll all dice once', rarity: 'uncommon', type: 'active', cost: 0, icon: '🌪️', stackable: true, maxStack: 1 },
  { id: 'u12', name: 'Fire Roll', description: 'Reroll all unheld dice', rarity: 'uncommon', type: 'active', cost: 0, icon: '🔥', stackable: true, maxStack: 2 },
  { id: 'u13', name: 'Swap', description: 'Swap two dice values', rarity: 'uncommon', type: 'active', cost: 0, icon: '🔄', stackable: true, maxStack: 2 },
  { id: 'u14', name: 'Predict', description: '+110 bonus points', rarity: 'uncommon', type: 'active', cost: 0, icon: '🔮', stackable: true, maxStack: 1 },
  { id: 'u15', name: 'Lock In', description: '+2 extra rolls next turn', rarity: 'uncommon', type: 'passive', cost: 0, icon: '🔒', stackable: true, maxStack: 1 },

  // === RARE (12) - Strong effects and big bonuses ===
  { id: 'r1', name: 'Jackpot', description: '+150 bonus points', rarity: 'rare', type: 'active', cost: 0, icon: '💰', stackable: true, maxStack: 1 },
  { id: 'r2', name: 'Multiplier', description: '4x next category score', rarity: 'rare', type: 'active', cost: 0, icon: '✖️', stackable: true, maxStack: 1 },
  { id: 'r3', name: 'Golden Touch', description: '+175 bonus points', rarity: 'rare', type: 'active', cost: 0, icon: '🌟', stackable: true, maxStack: 1 },
  { id: 'r4', name: 'Momentum Boost', description: '+3 extra rolls next turn', rarity: 'rare', type: 'passive', cost: 0, icon: '🚀', stackable: true, maxStack: 1 },
  { id: 'r5', name: 'Time Stop', description: 'AI skips next turn', rarity: 'rare', type: 'active', cost: 0, icon: '⏸️', stackable: true, maxStack: 1 },
  { id: 'r6', name: 'Lucky 13', description: '+200 bonus points', rarity: 'rare', type: 'active', cost: 0, icon: '🍀', stackable: true, maxStack: 1 },
  { id: 'r7', name: 'Score Hacker', description: 'Set your score to 300', rarity: 'rare', type: 'active', cost: 0, icon: '💻', stackable: true, maxStack: 1 },
  { id: 'r8', name: 'Steal Power', description: '+50 to your score, -50 from AI', rarity: 'rare', type: 'active', cost: 0, icon: '🧲', stackable: true, maxStack: 1 },
  { id: 'r9', name: 'Fortress', description: '+10 to all future category scores', rarity: 'rare', type: 'passive', cost: 0, icon: '🏰', stackable: true, maxStack: 1 },
  { id: 'r10', name: 'Chaos', description: '+225 bonus points', rarity: 'rare', type: 'active', cost: 0, icon: '🌀', stackable: true, maxStack: 1 },
  { id: 'r11', name: 'Mind Reader', description: '+250 bonus points', rarity: 'rare', type: 'active', cost: 0, icon: '🧘', stackable: true, maxStack: 1 },
  { id: 'r12', name: 'Absorb', description: '+60 to your score, -60 from AI', rarity: 'rare', type: 'active', cost: 0, icon: '🧲', stackable: true, maxStack: 1 },

  // === EPIC (8) - Very strong effects ===
  { id: 'e1', name: 'Lucky Streak+', description: '+300 bonus points', rarity: 'epic', type: 'active', cost: 0, icon: '🌈', stackable: true, maxStack: 1 },
  { id: 'e2', name: 'Power Surge', description: '5x next category score', rarity: 'epic', type: 'active', cost: 0, icon: '⚡', stackable: true, maxStack: 1 },
  { id: 'e3', name: 'Category Master', description: '+15 to all future category scores', rarity: 'epic', type: 'passive', cost: 0, icon: '🎓', stackable: true, maxStack: 1 },
  { id: 'e4', name: 'Time Freeze', description: 'AI skips 2 turns', rarity: 'epic', type: 'active', cost: 0, icon: '❄️', stackable: true, maxStack: 1 },
  { id: 'e5', name: 'Perfect Game', description: '+350 bonus points', rarity: 'epic', type: 'active', cost: 0, icon: '💎', stackable: true, maxStack: 1 },
  { id: 'e6', name: 'Score Steal', description: '+100 to your score, -100 from AI', rarity: 'epic', type: 'active', cost: 0, icon: '🫳', stackable: true, maxStack: 1 },
  { id: 'e7', name: 'Omniscient', description: '+400 bonus points', rarity: 'epic', type: 'active', cost: 0, icon: '👁️‍🗨️', stackable: true, maxStack: 1 },
  { id: 'e8', name: 'Game Breaker', description: 'Set AI score to 0', rarity: 'epic', type: 'active', cost: 0, icon: '💥', stackable: true, maxStack: 1 },

  // === LEGENDARY (5) - Overpowered ===
  { id: 'l1', name: 'GOD MODE', description: '+500 bonus points', rarity: 'legendary', type: 'active', cost: 0, icon: '🌟', stackable: true, maxStack: 1 },
  { id: 'l2', name: 'Infinity Dice', description: '+5 extra rolls next turn', rarity: 'legendary', type: 'passive', cost: 0, icon: '♾️', stackable: true, maxStack: 1 },
  { id: 'l3', name: 'Score Multiplier', description: '10x next category score', rarity: 'legendary', type: 'active', cost: 0, icon: '🔟', stackable: true, maxStack: 1 },
  { id: 'l4', name: 'Absolute Win', description: '+200 to your score, -200 from AI', rarity: 'legendary', type: 'active', cost: 0, icon: '🏅', stackable: true, maxStack: 1 },
  { id: 'l5', name: 'Destiny', description: 'Set your score to 500', rarity: 'legendary', type: 'active', cost: 0, icon: '✨', stackable: true, maxStack: 1 }
];

export class PowerupSystem {
  private allPowerups: Powerup[] = [];
  private powerupPool: Map<PowerupRarity, Powerup[]> = new Map();

  constructor() {
    this.initializePowerups();
  }

  private initializePowerups(): void {
    this.allPowerups = ALL_POWERUPS.map(p => ({
      ...p,
      effect: () => {} // Effects handled in Game.ts
    }));

    const rarities: PowerupRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    rarities.forEach(rarity => {
      this.powerupPool.set(rarity, this.allPowerups.filter(p => p.rarity === rarity));
    });
  }

  public getRandomPowerups(count: number = 3, excludeIds: string[] = []): Powerup[] {
    const result: Powerup[] = [];
    const usedIds = new Set<string>(excludeIds);

    // Build a flat pool of all available (not used) powerups
    let available = this.allPowerups.filter(p => !usedIds.has(p.id));
    if (available.length === 0) return [];

    for (let i = 0; i < count; i++) {
      if (available.length === 0) break;
      // Pick a random powerup from all available
      const randomIndex = Math.floor(Math.random() * available.length);
      const powerup = available[randomIndex];
      result.push(powerup);
      usedIds.add(powerup.id);
      // Remove from available
      available = available.filter(p => p.id !== powerup.id);
    }
    return result;
  }

  private getWeightedRandomRarity(): PowerupRarity {
    const roll = Math.random();
    let cumulative = 0;
    const rarities: PowerupRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    
    for (const rarity of rarities) {
      cumulative += RARITY_CONFIG[rarity].dropRate;
      if (roll < cumulative) {
        return rarity;
      }
    }
    return 'common';
  }

  public getPowerupById(id: string): Powerup | undefined {
    return this.allPowerups.find(p => p.id === id);
  }

  public getAllPowerups(): Powerup[] {
    return [...this.allPowerups];
  }

  public getPowerupsByRarity(rarity: PowerupRarity): Powerup[] {
    return this.powerupPool.get(rarity) || [];
  }

  public getPowerupCount(): number {
    return this.allPowerups.length;
  }

  public getRarityColor(rarity: PowerupRarity): string {
    return RARITY_CONFIG[rarity].color;
  }

  public getRarityGlow(rarity: PowerupRarity): string {
    return RARITY_CONFIG[rarity].glowColor;
  }

  public applyPowerup(powerup: Powerup, gameState: GameState, context?: PowerupContext): void {
    // Effects handled in Game.ts
  }

  public getPowerupEffectDescription(powerup: Powerup): string {
    return powerup.description;
  }
}

export const powerupSystem = new PowerupSystem();