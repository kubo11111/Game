# Implementation Plan

## Overview
Create a complete Yatzy/Balatro hybrid dice game with roguelike elements, featuring 5 dice, 3 rolls per turn, 30+ unique powerups, 10 enemy battles, a final boss, pixel art Balatro-inspired visuals, and a shop/upgrade system built with TypeScript and HTML5 Canvas.

## Types

### Core Game Types
```typescript
// Dice and scoring types
type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
type DiceHand = DieValue[];

interface Die {
  value: DieValue;
  held: boolean;
  id: number;
}

interface ScoringCategory {
  id: string;
  name: string;
  description: string;
  scoreFunction: (dice: DiceHand) => number;
  maxScore: number;
  used: boolean;
}

// Powerup types
type PowerupRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
type PowerupType = 'active' | 'passive';

interface Powerup {
  id: string;
  name: string;
  description: string;
  rarity: PowerupRarity;
  type: PowerupType;
  cost: number;
  effect: (gameState: GameState) => void;
  icon: string;
  stackable?: boolean;
  maxStack?: number;
}

// Enemy types
interface Enemy {
  id: number;
  name: string;
  targetScore: number;
  health: number;
  maxHealth: number;
  attack: number;
  isBoss: boolean;
  description: string;
}

// Player types
interface PlayerStats {
  health: number;
  maxHealth: number;
  currency: number;
  currentScore: number;
  round: number;
  maxRound: number;
}

interface PermanentUpgrade {
  id: string;
  name: string;
  description: string;
  effect: string;
  cost?: number;
}

// Game state
interface GameState {
  phase: 'menu' | 'battle' | 'rolling' | 'scoring' | 'shop' | 'upgrade' | 'gameover' | 'victory';
  dice: Die[];
  rollsRemaining: number;
  scoringCategories: ScoringCategory[];
  selectedCategory: string | null;
  player: PlayerStats;
  currentEnemy: Enemy | null;
  enemies: Enemy[];
  powerups: Powerup[];
  activePowerups: Powerup[];
  permanentUpgrades: PermanentUpgrade[];
  score: number;
  totalScore: number;
  roundScores: number[];
}
```

### UI Types
```typescript
interface Button {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  onClick: () => void;
  enabled: boolean;
  color?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
```

## Files

### File Structure
```
/src
  /core
    Game.ts           - Main game class and state management
    Dice.ts           - Dice logic and rolling mechanics
    Scoring.ts        - Yatzy scoring system
    PowerupSystem.ts  - Powerup management and effects
    EnemySystem.ts    - Enemy generation and battle logic
    UpgradeSystem.ts  - Permanent upgrade system
  /ui
    Renderer.ts       - Canvas rendering engine
    ButtonManager.ts  - UI button handling
    PixelArt.ts       - Pixel art assets and drawing
    ParticleSystem.ts - Visual effects
    ScoreLegend.ts    - Scoring reference display
  /screens
    MenuScreen.ts     - Main menu
    BattleScreen.ts   - Battle gameplay
    ShopScreen.ts     - Powerup shop
    UpgradeScreen.ts  - Permanent upgrades
    GameOverScreen.ts - Game over/victory screens
  /assets
    sprites.ts        - Pixel art sprite definitions
    colors.ts         - Color palette
    sounds.ts         - Sound effect definitions (optional)
  /utils
    helpers.ts        - Utility functions
    constants.ts      - Game constants
  index.ts            - Entry point
  types.ts            - TypeScript type definitions
/index.html           - HTML template
/style.css            - Basic styling
/tsconfig.json        - TypeScript configuration
/package.json         - Dependencies
/webpack.config.js    - Build configuration
```

### New Files to Create
1. **src/types.ts** - All TypeScript interfaces and types
2. **src/core/Game.ts** - Main game loop and state management
3. **src/core/Dice.ts** - Dice rolling, holding, and value management
4. **src/core/Scoring.ts** - Yatzy scoring categories and calculations
5. **src/core/PowerupSystem.ts** - 30+ powerups with unique effects
6. **src/core/EnemySystem.ts** - 10 enemies + final boss with increasing difficulty
7. **src/core/UpgradeSystem.ts** - Permanent upgrade/downgrade system
8. **src/ui/Renderer.ts** - Canvas 2D rendering with pixel art style
9. **src/ui/ButtonManager.ts** - Interactive UI buttons
10. **src/ui/PixelArt.ts** - Pixel art drawing utilities
11. **src/ui/ParticleSystem.ts** - Visual effects for dice rolls, scoring
12. **src/ui/ScoreLegend.ts** - Scoring reference overlay
13. **src/screens/MenuScreen.ts** - Start screen with title
14. **src/screens/BattleScreen.ts** - Main gameplay screen
15. **src/screens/ShopScreen.ts** - Powerup selection after rounds
16. **src/screens/UpgradeScreen.ts** - Permanent upgrade selection
17. **src/screens/GameOverScreen.ts** - Defeat/victory screens
18. **src/assets/sprites.ts** - Pixel art sprite data
19. **src/assets/colors.ts** - Balatro-inspired color palette
20. **src/utils/helpers.ts** - Math, array, and game helpers
21. **src/utils/constants.ts** - Game balance constants
22. **src/index.ts** - Application entry point
23. **index.html** - HTML5 Canvas container
24. **style.css** - Basic page styling
25. **tsconfig.json** - TypeScript configuration
26. **package.json** - NPM dependencies
27. **webpack.config.js** - Build configuration

### Configuration Files
- **tsconfig.json**: Target ES2020, strict mode, module resolution node
- **package.json**: Dependencies: typescript, webpack, ts-loader, canvas (for development)
- **webpack.config.js**: Bundle TypeScript, output to dist/

## Functions

### Core Game Functions

#### Game.ts
- `constructor()` - Initialize game state and canvas
- `init()` - Set up initial game state, create enemies, powerups
- `gameLoop()` - Main game loop (requestAnimationFrame)
- `update(deltaTime: number)` - Update game logic
- `render()` - Render current screen
- `changePhase(newPhase: GameState['phase'])` - Transition between game phases
- `startBattle(enemy: Enemy)` - Begin a battle round
- `endBattle()` - Complete battle, calculate damage, award currency
- `playerTakeDamage(amount: number)` - Reduce player health
- `enemyTakeDamage(amount: number)` - Reduce enemy health based on score
- `checkGameOver()` - Check if player health <= 0
- `checkVictory()` - Check if all enemies defeated

#### Dice.ts
- `rollDice(indices?: number[])` - Roll selected or all dice
- `holdDie(index: number)` - Toggle hold state
- `getValues()` - Return array of die values
- `getHeldDice()` - Return indices of held dice
- `resetDice()` - Reset all dice to unheld state
- `applyPowerupModifiers()` - Apply powerup effects to dice

#### Scoring.ts
- `calculateScore(category: string, dice: DiceHand): number` - Calculate score for category
- `getAvailableCategories(): ScoringCategory[]` - Return unused categories
- `selectCategory(categoryId: string)` - Mark category as used and score
- `getUpperSectionBonus(): number` - Calculate upper section bonus
- `validateHand(hand: DiceHand): boolean` - Validate dice hand

##### Scoring Categories Implementation:
- **Ones through Sixes** - Sum of matching dice
- **One Pair** - Two dice with same value
- **Two Pairs** - Two different pairs
- **Three of a Kind** - Three matching dice
- **Four of a Kind** - Four matching dice
- **Small Straight** - 1-2-3-4-5 (15 points)
- **Large Straight** - 2-3-4-5-6 (20 points)
- **Full House** - Pair + Three of a Kind (sum of all dice)
- **Chance** - Sum of all dice
- **Yatzy** - Five of a kind (50 points)

#### PowerupSystem.ts
- `generatePowerups(): Powerup[]` - Create pool of 30+ powerups
- `getShopOptions(count: number): Powerup[]` - Random selection for shop
- `applyPowerup(powerup: Powerup)` - Activate powerup effect
- `removePowerup(powerup: Powerup)` - Remove powerup from active list
- `getPassiveEffects(): Powerup[]` - Return passive powerups

##### Powerup Examples (30+ total):
1. **Lucky Reroll** (Common) - Reroll one die without using a roll
2. **Double Score** (Common) - Double next category score
3. **Hold Master** (Common) - Start with all dice held
4. **Bonus Points** (Common) - Add +5 to any score
5. **Extra Roll** (Common) - Gain +1 roll this turn
6. **Number Booster** (Uncommon) - Add +1 to all dice showing specific number
7. **Category Saver** (Uncommon) - Don't use up a category if score is 0
8. **Straight Finder** (Uncommon) - Automatically arrange dice for straights
9. **Pair Finder** (Uncommon) - Highlight best pair combination
10. **Full House Helper** (Uncommon) - Reroll non-matching dice
11. **Yatzy Hunter** (Rare) - Reroll until you get Yatzy (once per battle)
12. **Score Multiplier** (Rare) - 1.5x score for next category
13. **Dice Lock** (Rare) - Lock in current dice values
14. **Critical Hit** (Rare) - Chance for 2x score
15. **Steal Health** (Rare) - Heal 2 HP on scoring 20+
16. **Ultimate Reroll** (Legendary) - Reroll all dice, keep best result
17. **Score Stealer** (Legendary) - Steal enemy's target score
18. **Invincibility** (Legendary) - Take no damage this round
19. **Jackpot** (Legendary) - Gain 50 currency
20. **Time Warp** (Legendary) - Go back to previous roll
21. **Dice Transformer** (Epic) - Change all dice to one value
22. **Score Explosion** (Epic) - Add dice values as bonus
23. **Phoenix** (Epic) - Revive with 1 HP if defeated
24. **Curse Breaker** (Epic) - Remove negative powerup
25. **Fortune Teller** (Epic) - See next 3 dice rolls
26. **Golden Dice** (Legendary) - All dice show 6 for one roll
27. **Mirror World** (Legendary) - Flip all dice values (1↔6, 2↔5, 3↔4)
28. **Quantum Dice** (Legendary) - Dice show all values simultaneously
29. **Infinity Gauntlet** (Legendary) - Unlimited rolls this turn
30. **Reality Warp** (Legendary) - Change scoring category rules
31. **Chaos Theory** (Legendary) - Random powerful effect
32. **Divine Intervention** (Legendary) - Auto-complete category

#### EnemySystem.ts
- `generateEnemies(): Enemy[]` - Create 10 enemies + boss
- `getEnemy(round: number): Enemy` - Get enemy for current round
- `calculateEnemyDamage(playerScore: number, enemy: Enemy): number` - Calculate damage based on score vs target
- `scaleEnemyDifficulty(round: number): number` - Increase target scores progressively

#### UpgradeSystem.ts
- `generateUpgrades(): PermanentUpgrade[]` - Create upgrade pool
- `generateDowngrades(): PermanentUpgrade[]` - Create downgrade pool
- `selectUpgrade(upgrade: PermanentUpgrade)` - Apply permanent upgrade
- `applyUpgradeEffect(upgrade: PermanentUpgrade)` - Modify game state

##### Permanent Upgrades:
- **Extra Health** - +5 max HP
- **Starting Currency** - Begin with 20 gold
- **Bonus Rolls** - Start each battle with 4 rolls instead of 3
- **Score Boost** - All scores +10%
- **Lucky Start** - First roll always has one 6
- **Powerup Discount** - Shop items 20% cheaper
- **Health Regen** - Heal 2 HP between rounds
- **Critical Eye** - 10% chance for double score
- **Dice Mastery** - Can hold 6 dice instead of 5
- **Second Chance** - Survive one defeat with 1 HP

##### Permanent Downgrades (rare):
- **Cursed Dice** - One die always shows 1
- **Heavy Pocket** - Start with -10 gold
- **Bad Luck** - All scores -10%
- **Fragile** - -3 max HP
- **Forgetful** - One random category starts used

### UI Functions

#### Renderer.ts
- `clearCanvas()` - Clear canvas with background color
- `drawDice(x, y, value, held, size)` - Draw pixel art die
- `drawButton(button: Button)` - Render interactive button
- `drawText(text, x, y, color, size)` - Render pixel-style text
- `drawHealthBar(current, max, x, y, width, height)` - HP display
- `drawScoreDisplay(score, x, y)` - Show current score
- `drawCurrency(amount, x, y)` - Display currency
- `drawEnemy(enemy: Enemy, x, y)` - Render enemy sprite
- `drawPowerupIcon(powerup: Powerup, x, y)` - Show powerup icon
- `drawParticleSystem()` - Render all active particles

#### ButtonManager.ts
- `createButton(config: ButtonConfig): Button` - Create button
- `handleClick(x, y)` - Process mouse/touch input
- `updateButtons(deltaTime)` - Animate buttons
- `removeButton(button: Button)` - Clean up button

#### ParticleSystem.ts
- `emitParticles(x, y, count, config)` - Create particle burst
- `updateParticles(deltaTime)` - Animate particles
- `renderParticles()` - Draw all particles

#### ScoreLegend.ts
- `showLegend()` - Display scoring reference overlay
- `hideLegend()` - Close overlay
- `renderLegend()` - Draw scoring table

## Classes

### Game Class
```typescript
class Game {
  canvas: HTMLCanvasElement;
  ctx: Canvas2DRenderingContext;
  state: GameState;
  renderer: Renderer;
  buttonManager: ButtonManager;
  particleSystem: ParticleSystem;
  
  constructor(canvasId: string);
  init(): void;
  gameLoop(): void;
  update(deltaTime: number): void;
  render(): void;
}
```

### DiceManager Class
```typescript
class DiceManager {
  dice: Die[];
  rollsRemaining: number;
  maxRolls: number;
  
  roll(indices?: number[]): DieValue[];
  hold(index: number): void;
  reset(): void;
  getValues(): DieValue[];
}
```

### ScoreManager Class
```typescript
class ScoreManager {
  categories: ScoringCategory[];
  
  constructor();
  calculateScore(categoryId: string, dice: DieValue[]): number;
  selectCategory(categoryId: string): number;
  getAvailableCategories(): ScoringCategory[];
  getTotalScore(): number;
}
```

### PowerupManager Class
```typescript
class PowerupManager {
  availablePowerups: Powerup[];
  activePowerups: Powerup[];
  
  constructor();
  generatePool(): void;
  getShopSelection(count: number): Powerup[];
  activate(powerup: Powerup): void;
  applyPassiveEffects(gameState: GameState): void;
}
```

### EnemyManager Class
```typescript
class EnemyManager {
  enemies: Enemy[];
  currentEnemy: Enemy | null;
  
  constructor();
  generateEnemies(): void;
  getNextEnemy(round: number): Enemy;
  calculateDamage(playerScore: number): number;
}
```

### UpgradeManager Class
```typescript
class UpgradeManager {
  upgrades: PermanentUpgrade[];
  appliedUpgrades: PermanentUpgrade[];
  
  constructor();
  generateUpgrades(): void;
  generateDowngrades(): void;
  applyUpgrade(upgrade: PermanentUpgrade): void;
  getUpgradeOptions(count: number): PermanentUpgrade[];
}
```

## Dependencies

### NPM Packages
- **typescript** - TypeScript compiler
- **webpack** & **webpack-cli** - Module bundler
- **ts-loader** - TypeScript loader for webpack
- **html-webpack-plugin** - Generate HTML file
- **css-loader** & **style-loader** - CSS handling

### No External Game Libraries
- Pure TypeScript/JavaScript with HTML5 Canvas API
- No game frameworks to keep it lightweight and educational

## Testing

### Unit Tests
- **Dice rolling tests** - Verify random distribution, hold mechanics
- **Scoring tests** - Test all Yatzy categories with known hands
- **Powerup tests** - Verify each powerup effect applies correctly
- **Enemy scaling tests** - Ensure difficulty progression is balanced

### Integration Tests
- **Battle flow tests** - Complete battle from start to finish
- **Shop tests** - Currency transactions, powerup activation
- **Upgrade tests** - Permanent upgrades persist between rounds

### Manual Testing Checklist
- [ ] Dice can be rolled and held correctly
- [ ] All 13 Yatzy categories score correctly
- [ ] Powerups activate and have intended effects
- [ ] Shop displays 2 random powerups after each round
- [ ] Currency is awarded based on performance
- [ ] 10 enemies with increasing difficulty
- [ ] Final boss is challenging but beatable
- [ ] Permanent upgrades appear every 3 rounds
- [ ] Rare downgrades occur occasionally
- [ ] Game over on 0 HP
- [ ] Victory screen after defeating boss
- [ ] Score legend displays all combinations
- [ ] Pixel art style renders correctly
- [ ] All UI buttons are responsive
- [ ] Particle effects enhance gameplay

## Implementation Order

### Phase 1: Foundation (Steps 1-5)
1. Set up project structure with TypeScript, webpack, and HTML5 Canvas
2. Create core type definitions in `src/types.ts`
3. Implement Dice class with rolling and holding mechanics
4. Implement Scoring system with all 13 Yatzy categories
5. Create basic Renderer with pixel art style drawing

### Phase 2: Core Gameplay (Steps 6-10)
6. Build BattleScreen with dice display, roll button, category selection
7. Implement Game class to manage state transitions
8. Create ButtonManager for interactive UI elements
9. Add ScoreLegend overlay showing all scoring combinations
10. Implement basic enemy system with target scores

### Phase 3: Powerup System (Steps 11-15)
11. Design and implement 30+ unique powerups with varied effects
12. Create PowerupManager to handle activation and passive effects
13. Build ShopScreen with 2 random powerup choices
14. Implement currency system and transactions
15. Add particle effects for powerup activation

### Phase 4: Enemy & Battle System (Steps 16-20)
16. Create 10 unique enemies with increasing target scores
17. Implement damage calculation based on score vs target
18. Add enemy sprites and battle UI
19. Create health bar system for player and enemies
20. Implement battle flow: roll → score → damage calculation

### Phase 5: Upgrade System (Steps 21-25)
21. Design permanent upgrades and downgrades
22. Implement UpgradeScreen with choice between 2 options
23. Add upgrade trigger every 3 rounds
24. Implement rare downgrade system (5% chance)
25. Make upgrades persist between rounds

### Phase 6: Polish & UI (Steps 26-30)
26. Create pixel art assets for dice, enemies, UI elements
27. Implement ParticleSystem for visual effects
28. Add animations for dice rolling, scoring, damage
29. Create MenuScreen and GameOverScreen
30. Implement Victory screen for boss defeat

### Phase 7: Final Boss & Balance (Steps 31-35)
31. Design challenging final boss with high target score
32. Balance enemy difficulty curve across 10 rounds
33. Balance powerup rarity and effectiveness
34. Balance upgrade/downgrade frequency and impact
35. Playtest and adjust game balance

### Phase 8: Testing & Deployment (Steps 36-40)
36. Write unit tests for scoring system
37. Write unit tests for powerup effects
38. Manual playtesting for game flow
39. Fix bugs and edge cases
40. Build final version and deploy to web