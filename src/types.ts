// Dice and scoring types
export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
export type DiceHand = DieValue[];

export interface Die {
  value: DieValue;
  held: boolean;
  id: number;
}

export interface ScoringCategory {
  id: string;
  name: string;
  description: string;
  scoreFunction: (dice: DiceHand) => number;
  maxScore: number;
  used: boolean;
  score?: number;
}

// Powerup types
export type PowerupRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type PowerupType = 'active' | 'passive';

export interface Powerup {
  id: string;
  name: string;
  description: string;
  rarity: PowerupRarity;
  type: PowerupType;
  cost: number;
  effect: (gameState: GameState, context?: { diceManager?: any }) => void;
  icon: string;
  stackable?: boolean;
  maxStack?: number;
}

// Player types
export interface PlayerStats {
  health: number;
  maxHealth: number;
  currentScore: number;
  gamesWon: number;
  gamesPlayed: number;
}

export interface PermanentUpgrade {
  id: string;
  name: string;
  description: string;
  effect: (gameState: GameState) => void;
  cost?: number;
  isDowngrade?: boolean;
}

// Game state
export interface GameState {
  phase: 'menu' | 'player_turn' | 'player_start' | 'ai_turn' | 'ai_start' | 'ai_rolling' | 'ai_scoring' | 'rolling' | 'scoring' | 'powerup_select' | 'powerups_gallery' | 'gameover' | 'victory';
  dice: Die[];
  rollsRemaining: number;
  scoringCategories: ScoringCategory[];
  aiScoringCategories: ScoringCategory[];
  selectedCategory: string | null;
  currentTurn: 'player' | 'ai';
  player: PlayerStats;
  powerups: Powerup[];
  activePowerups: Powerup[];
  permanentUpgrades: PermanentUpgrade[];
  score: number;
  aiScore: number;
  totalScore: number;
  aiTotalScore: number;
  gameWinner: 'player' | 'ai' | null;
  temporaryInvincibility?: boolean;
  hasPhoenixRevive?: boolean;
  phoenixUsed?: boolean;
  categorySaverActive?: boolean;
}

// UI types
export interface Button {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  onClick: () => void;
  enabled: boolean;
  color?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// Screen types
export type ScreenType = 'menu' | 'battle' | 'shop' | 'upgrade' | 'gameover' | 'victory';