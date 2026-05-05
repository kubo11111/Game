import { Renderer } from '../ui/Renderer';
import { DiceManager } from './Dice';
import { ScoreManager } from './Scoring';
import { ParticleSystem } from '../ui/ParticleSystem';
import { PowerupSystem, powerupSystem, RARITY_CONFIG } from './PowerupSystem';
import { GameState, Powerup, Die, PowerupRarity } from '../types';
import { 
  INITIAL_ROLLS, 
  TOTAL_CATEGORIES,
  COLORS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../utils/constants';
import { isPointInRect } from '../utils/helpers';

type GamePhase = 'menu' | 'player_start' | 'rolling' | 'scoring' | 'powerup_select' | 'ai_start' | 'ai_rolling' | 'ai_scoring' | 'gameover' | 'powerups_gallery';

interface ExtendedGameState extends GameState {
  phase: GamePhase;
  aiRollPhase: number;
  aiRollsRemaining: number;
  aiDice: Die[];
  usedPowerupIds: string[];
}

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private diceManager: DiceManager;
  private aiDiceManager: DiceManager; // Separate dice manager for AI
  private scoreManager: ScoreManager;
  private aiScoreManager: ScoreManager;
  private particleSystem: ParticleSystem;
  private powerupSystem: PowerupSystem;
  
  private state: ExtendedGameState;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private boundHandleInput: (event: MouseEvent | TouchEvent) => void;
  private powerupOptions: Powerup[] = [];
  private hoveredCategory: string | null = null;
  private galleryFilter: PowerupRarity | 'all' = 'all';
  private powerupNotification: { powerup: any; timer: number; applied: boolean; effectText: string } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.diceManager = new DiceManager();
    this.aiDiceManager = new DiceManager(); // Separate AI dice
    this.scoreManager = new ScoreManager();
    this.aiScoreManager = new ScoreManager();
    this.particleSystem = new ParticleSystem(canvas);
    this.powerupSystem = new PowerupSystem();
    
    this.state = this.createInitialState();
    this.boundHandleInput = this.handleInput.bind(this);

    this.canvas.addEventListener('mousedown', this.boundHandleInput);
    this.canvas.addEventListener('touchstart', this.boundHandleInput);
  }

  private createInitialState(): ExtendedGameState {
    return {
      phase: 'menu',
      dice: this.diceManager.getDice(),
      rollsRemaining: INITIAL_ROLLS,
      totalScore: 0,
      player: {
        health: 3,
        maxHealth: 3,
        currentScore: 0,
        gamesWon: 0,
        gamesPlayed: 0,
      },
      scoringCategories: this.scoreManager.getCategories(),
      aiScoringCategories: this.aiScoreManager.getCategories(),
      aiTotalScore: 0,
      currentTurn: 'player',
      gameWinner: null,
      selectedCategory: null,
      powerups: [],
      activePowerups: [],
      permanentUpgrades: [],
      score: 0,
      aiScore: 0,
      aiRollPhase: 0,
      aiRollsRemaining: INITIAL_ROLLS,
      aiDice: this.aiDiceManager.getDice(),
      usedPowerupIds: [] // Track all used powerup ids this game
    };
  }

  public start(): void {
    this.lastTime = Date.now();
    this.update();
  }

  private update = (): void => {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.renderer.update();
    this.render();
    this.animationFrameId = requestAnimationFrame(this.update);
  };

  private render(): void {
    this.renderer.clear();

    switch (this.state.phase) {
      case 'menu':
        this.renderMenu();
        break;
      case 'player_start':
        this.renderPlayerStart();
        break;
      case 'rolling':
      case 'scoring':
        this.renderGame();
        break;
      case 'powerup_select':
        this.renderPowerupSelect();
        break;
      case 'powerups_gallery':
        this.renderPowerupsGallery();
        break;
      case 'ai_start':
        this.renderAIStart();
        break;
      case 'ai_rolling':
      case 'ai_scoring':
        this.renderAITurn();
        break;
      case 'gameover':
        this.renderGameOver();
        break;
      default:
        this.renderGame();
    }
    
    // Always render powerup notification on top
    this.renderPowerupNotification();
  }

  private renderMenu(): void {
    const ctx = (this.renderer as any).ctx;
    
    // Title with glow
    this.renderer.drawGlow(CANVAS_WIDTH / 2, 180, 200, 'rgba(52, 152, 219, 0.4)', 0.5);
    this.renderer.drawText('YATZY', CANVAS_WIDTH / 2, 180, '#3498db', 72, true);
    this.renderer.drawText('DUEL', CANVAS_WIDTH / 2, 250, '#f39c12', 72, true);
    
    this.renderer.drawText('Player vs AI', CANVAS_WIDTH / 2, 320, '#888888', 24, true);
    
    // Decorative line
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2 - 150, 350);
    ctx.lineTo(CANVAS_WIDTH / 2 + 150, 350);
    ctx.stroke();
    
    this.renderer.drawButton(CANVAS_WIDTH / 2 - 100, 420, 200, 60, 'START GAME', true, COLORS.accent);
    
    // Powerups button
    this.renderer.drawButton(CANVAS_WIDTH / 2 - 100, 500, 200, 50, 'POWERUPS', true, '#9b59b6');
    
    // Instructions
    this.renderer.drawText('Roll 3 times per turn', CANVAS_WIDTH / 2, 600, '#666666', 18, true);
    this.renderer.drawText('Click dice to hold • Click category to score', CANVAS_WIDTH / 2, 630, '#666666', 16, true);
  }

  private renderPowerupsGallery(): void {
    const ctx = (this.renderer as any).ctx;
    const allPowerups = this.powerupSystem.getAllPowerups();
    
    // Filter powerups by rarity
    const filtered = this.galleryFilter === 'all' 
      ? allPowerups 
      : allPowerups.filter(p => p.rarity === this.galleryFilter);
    
    // Header
    this.renderer.drawGlow(CANVAS_WIDTH / 2, 40, 150, 'rgba(155, 89, 182, 0.4)', 0.5);
    this.renderer.drawText('POWERUPS', CANVAS_WIDTH / 2, 40, '#ffffff', 32, true);
    
    // Back button
    this.renderer.drawButton(20, 20, 80, 35, 'BACK', true, '#e74c3c');
    
    // Filter buttons
    const filters: { key: PowerupRarity | 'all'; label: string; color: string }[] = [
      { key: 'all', label: 'All', color: '#3498db' },
      { key: 'common', label: 'Common', color: RARITY_CONFIG.common.color },
      { key: 'uncommon', label: 'Uncommon', color: RARITY_CONFIG.uncommon.color },
      { key: 'rare', label: 'Rare', color: RARITY_CONFIG.rare.color },
      { key: 'epic', label: 'Epic', color: RARITY_CONFIG.epic.color },
      { key: 'legendary', label: 'Legendary', color: RARITY_CONFIG.legendary.color }
    ];
    
    const filterY = 70;
    const filterWidth = 90;
    const filterHeight = 30;
    const filterGap = 5;
    let filterX = 30;
    
    filters.forEach(f => {
      const isActive = this.galleryFilter === f.key;
      this.renderer.drawButton(filterX, filterY, filterWidth, filterHeight, f.label, true, isActive ? f.color : '#444444');
      filterX += filterWidth + filterGap;
    });
    
    // Powerup cards - grid layout
    const cardWidth = 140;
    const cardHeight = 90;
    const startX = 30;
    const startY = 115;
    const cols = 6;
    const gapX = 10;
    const gapY = 10;
    
    filtered.forEach((powerup, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const cardX = startX + col * (cardWidth + gapX);
      const cardY = startY + row * (cardHeight + gapY);
      
      if (cardY > CANVAS_HEIGHT - 100) return; // Skip if off screen
      
      // Card background with rarity color
      const rarityColor = RARITY_CONFIG[powerup.rarity].color;
      ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
      this.renderer.drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 8);
      ctx.fill();
      
      // Card border
      ctx.strokeStyle = rarityColor;
      ctx.lineWidth = 2;
      this.renderer.drawRoundedRect(cardX, cardY, cardWidth, cardHeight, 8);
      ctx.stroke();
      
      // Glow effect
      this.renderer.drawGlow(cardX + cardWidth / 2, cardY + cardHeight / 2, cardWidth * 0.6, RARITY_CONFIG[powerup.rarity].glowColor, 0.4);
      
      // Icon
      ctx.fillStyle = rarityColor;
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(powerup.icon, cardX + cardWidth / 2, cardY + 25);
      
      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Arial';
      ctx.fillText(powerup.name, cardX + cardWidth / 2, cardY + 45);
      
      // Rarity badge
      ctx.fillStyle = rarityColor;
      ctx.font = '9px Arial';
      ctx.fillText(powerup.rarity.toUpperCase(), cardX + cardWidth / 2, cardY + 60);
      
      // Description
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '8px Arial';
      const desc = powerup.description.length > 22 ? powerup.description.substring(0, 20) + '..' : powerup.description;
      ctx.fillText(desc, cardX + cardWidth / 2, cardY + 75);
    });
    
    // Total count
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Total: ${filtered.length} / ${allPowerups.length} powerups`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  }

  private renderPlayerStart(): void {
    this.renderer.drawText('YOUR TURN', CANVAS_WIDTH / 2, 300, '#2ecc71', 48, true);
    this.renderer.drawText('Click anywhere to start', CANVAS_WIDTH / 2, 360, '#888888', 20, true);
  }

  private renderGame(): void {
    const ctx = (this.renderer as any).ctx;
    
    // Header
    this.renderer.drawText('YATZY DUEL', CANVAS_WIDTH / 2, 40, '#ffffff', 28, true);
    
    // Turn indicator
    const turnText = this.state.currentTurn === 'player' ? 'YOUR TURN' : 'AI TURN';
    const turnColor = this.state.currentTurn === 'player' ? '#2ecc71' : '#e74c3c';
    this.renderer.drawText(turnText, CANVAS_WIDTH / 2, 75, turnColor, 20, true);
    
    // Score cards - shorter and more compact to fit all categories
    this.renderer.drawScoreCard('PLAYER', this.state.scoringCategories, this.state.totalScore, 30, 110, 180, 370, true);
    this.renderer.drawScoreCard('AI', this.state.aiScoringCategories, this.state.aiTotalScore, CANVAS_WIDTH - 210, 110, 180, 370, false);
    
    // Dice area
    this.renderer.drawDice(this.state.dice, this.state.rollsRemaining, false);
    
    // Show category panel ONLY in scoring phase
    if (this.state.phase === 'scoring') {
      this.renderCategoryPanel();
      this.renderer.drawButton(CANVAS_WIDTH / 2 - 80, 520, 160, 50, 'SCORE', true, '#2ecc71');
    } else {
      // Rolling phase - show roll button
      const canRoll = this.state.rollsRemaining > 0;
      this.renderer.drawButton(CANVAS_WIDTH / 2 - 80, 520, 160, 50, canRoll ? 'ROLL' : 'AUTO SCORE', canRoll, COLORS.accent);
    }
  }

  private renderCategoryPanel(): void {
    const ctx = (this.renderer as any).ctx;
    const panelX = 250;
    const panelY = 100;
    const panelWidth = 480;
    const panelHeight = 450;
    
    // Panel background - glass effect
    ctx.fillStyle = 'rgba(20, 20, 40, 0.7)';
    this.renderer.drawRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    ctx.fill();
    
    // Panel border - subtle glow
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    this.renderer.drawRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Title
    this.renderer.drawText('SELECT CATEGORY', panelX + panelWidth / 2, panelY + 15, '#ffffff', 12, true);
    
    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + 20, panelY + 28);
    ctx.lineTo(panelX + panelWidth - 20, panelY + 28);
    ctx.stroke();
    
    // Category buttons - compact
    const categoryHeight = 22;
    const startY = panelY + 35;
    const padding = 2;
    
    this.state.scoringCategories.forEach((category, index) => {
      if (category.used) return;
      
      const btnY = startY + index * (categoryHeight + padding);
      const isHovered = this.hoveredCategory === category.id;
      
      // Button background
      ctx.fillStyle = isHovered ? 'rgba(52, 152, 219, 0.5)' : 'rgba(52, 152, 219, 0.2)';
      this.renderer.drawRoundedRect(panelX + 10, btnY, panelWidth - 20, categoryHeight, 5);
      ctx.fill();
      
      // Category name
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(category.name, panelX + 18, btnY + categoryHeight / 2 + 3);
      
      // Max score
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f39c12';
      ctx.fillText(`(${category.maxScore})`, panelX + panelWidth - 18, btnY + categoryHeight / 2 + 3);
    });
    
    // Show dice values for reference
    const diceValues = this.diceManager.getValues();
    ctx.fillStyle = '#666666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Dice: [${diceValues.join(', ')}]`, panelX + panelWidth / 2, panelY + panelHeight - 12);
  }

  private renderPowerupSelect(): void {
    // Brief flash then transition
    this.renderer.drawText('POWERUP!', CANVAS_WIDTH / 2, 200, '#f39c12', 36, true);
    this.renderer.drawText('Choose one for your next turn', CANVAS_WIDTH / 2, 250, '#888888', 18, true);
    
    const cardWidth = 180;
    const cardHeight = 220;
    const startX = (CANVAS_WIDTH - (this.powerupOptions.length * cardWidth + 40 * 2)) / 2;
    const startY = 300;
    
    this.powerupOptions.forEach((powerup: any, index: number) => {
      const cardX = startX + index * (cardWidth + 40);
      this.renderer.drawPowerupCard(powerup, cardX, startY, cardWidth, cardHeight);
    });
    
    this.renderer.drawText('Click a powerup to continue', CANVAS_WIDTH / 2, 560, '#666666', 16, true);
  }

  private renderAIStart(): void {
    this.renderer.drawText('AI TURN', CANVAS_WIDTH / 2, 300, '#e74c3c', 48, true);
    this.renderer.drawText('AI is thinking...', CANVAS_WIDTH / 2, 360, '#888888', 20, true);
  }

  private renderAITurn(): void {
    const ctx = (this.renderer as any).ctx;
    
    // Header
    this.renderer.drawText('YATZY DUEL', CANVAS_WIDTH / 2, 40, '#ffffff', 28, true);
    this.renderer.drawText('AI TURN', CANVAS_WIDTH / 2, 75, '#e74c3c', 20, true);
    
    // Score cards - shorter and more compact to fit all categories
    this.renderer.drawScoreCard('PLAYER', this.state.scoringCategories, this.state.totalScore, 30, 110, 180, 370, true);
    this.renderer.drawScoreCard('AI', this.state.aiScoringCategories, this.state.aiTotalScore, CANVAS_WIDTH - 210, 110, 180, 370, false);
    
    // AI dice display
    this.renderer.drawDice(this.state.aiDice, this.state.aiRollsRemaining, true);
    
    // AI status
    const statusText = this.state.aiRollsRemaining > 0 ? `AI rolling... (${3 - this.state.aiRollsRemaining + 1}/3)` : 'AI scoring...';
    this.renderer.drawText(statusText, CANVAS_WIDTH / 2, 520, '#e74c3c', 18, true);
  }

  private renderGameOver(): void {
    const ctx = (this.renderer as any).ctx;
    const winner = this.state.gameWinner === 'player';
    const winnerText = winner ? 'YOU WIN!' : 'AI WINS!';
    const winnerColor = winner ? '#2ecc71' : '#e74c3c';
    
    // Background overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Winner announcement
    this.renderer.drawGlow(CANVAS_WIDTH / 2, 250, 150, winnerColor, 0.4);
    this.renderer.drawText(winnerText, CANVAS_WIDTH / 2, 250, winnerColor, 56, true);
    
    // Final scores
    this.renderer.drawText(`Your Score: ${this.state.totalScore}`, CANVAS_WIDTH / 2, 330, '#2ecc71', 28, true);
    this.renderer.drawText(`AI Score: ${this.state.aiTotalScore}`, CANVAS_WIDTH / 2, 370, '#e74c3c', 28, true);
    
    // Score difference
    const diff = this.state.totalScore - this.state.aiTotalScore;
    const diffText = diff > 0 ? `+${diff}` : (diff < 0 ? `${diff}` : 'TIE');
    this.renderer.drawText(`Difference: ${diffText}`, CANVAS_WIDTH / 2, 420, '#f39c12', 24, true);
    
    // Play again button
    this.renderer.drawButton(CANVAS_WIDTH / 2 - 100, 480, 200, 50, 'PLAY AGAIN', true, COLORS.accent);
  }

  private handleInput = (event: MouseEvent | TouchEvent): void => {
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const x = event instanceof MouseEvent ? event.clientX - rect.left : event.touches[0].clientX - rect.left;
    const y = event instanceof MouseEvent ? event.clientY - rect.top : event.touches[0].clientY - rect.top;

    switch (this.state.phase) {
      case 'menu':
        this.handleMenuInput(x, y);
        break;
      case 'player_start':
        this.handlePlayerStartInput(x, y);
        break;
      case 'rolling':
        this.handleRollingInput(x, y);
        break;
      case 'scoring':
        this.handleScoringInput(x, y);
        break;
      case 'powerup_select':
        this.handlePowerupSelectInput(x, y);
        break;
      case 'powerups_gallery':
        this.handlePowerupsGalleryInput(x, y);
        break;
      case 'ai_start':
        // Auto transition
        break;
      case 'ai_rolling':
      case 'ai_scoring':
        // AI turn - no input
        break;
      case 'gameover':
        this.handleGameOverInput(x, y);
        break;
    }
  };

  private handleMenuInput(x: number, y: number): void {
    if (isPointInRect(x, y, CANVAS_WIDTH / 2 - 100, 420, 200, 60)) {
      this.startPlayerTurn();
    }
    // Powerups button
    if (isPointInRect(x, y, CANVAS_WIDTH / 2 - 100, 500, 200, 50)) {
      this.state.phase = 'powerups_gallery';
      this.galleryFilter = 'all';
    }
  }

  private handlePowerupsGalleryInput(x: number, y: number): void {
    // Back button
    if (isPointInRect(x, y, 20, 20, 80, 35)) {
      this.state.phase = 'menu';
      return;
    }
    
    // Filter buttons
    const filterY = 70;
    const filterWidth = 90;
    const filterHeight = 30;
    const filterGap = 5;
    let filterX = 30;
    
    const filters: (PowerupRarity | 'all')[] = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'];
    
    filters.forEach((f, index) => {
      if (isPointInRect(x, y, filterX, filterY, filterWidth, filterHeight)) {
        this.galleryFilter = f;
      }
      filterX += filterWidth + filterGap;
    });
  }

  private handlePlayerStartInput(x: number, y: number): void {
    this.state.phase = 'rolling';
    this.diceManager.reset();
    this.state.rollsRemaining = INITIAL_ROLLS;
    // Sync dice from diceManager to state
    this.state.dice = this.diceManager.getDice();
  }

  private handleRollingInput(x: number, y: number): void {
    // Check dice clicks for hold
    const totalWidth = (60 * 5) + (10 * 4);
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const diceY = 280;

    for (let i = 0; i < 5; i++) {
      const dieX = startX + i * (60 + 10);
      if (isPointInRect(x, y, dieX, diceY, 60, 60)) {
        // Toggle hold state directly in state.dice
        this.state.dice[i].held = !this.state.dice[i].held;
        // Also update diceManager to keep in sync
        this.diceManager.setHold(i, this.state.dice[i].held);
        return;
      }
    }

    // Check roll button
    if (isPointInRect(x, y, CANVAS_WIDTH / 2 - 80, 520, 160, 50)) {
      if (this.state.rollsRemaining > 0) {
        // Roll only unheld dice
        const unheldIndices: number[] = [];
        for (let i = 0; i < 5; i++) {
          if (!this.state.dice[i].held) {
            unheldIndices.push(i);
          }
        }
        this.diceManager.roll(unheldIndices);
        this.state.rollsRemaining = this.diceManager.getRollsRemaining();
        // Update state dice with new values
        this.state.dice = this.diceManager.getDice();
      } else {
        // No rolls left - go to scoring
        this.state.phase = 'scoring';
      }
    }
  }

  private handleScoringInput(x: number, y: number): void {
    // Only handle scoring input in scoring phase
    if (this.state.phase !== 'scoring') return;
    
    // Check category panel clicks
    const panelX = 250;
    const panelY = 100;
    const panelWidth = 480;
    const panelHeight = 450;
    
    // Only process clicks inside the category panel
    if (!isPointInRect(x, y, panelX, panelY, panelWidth, panelHeight)) {
      // Clicked outside - do nothing, wait for valid selection
      return;
    }
    
    const categoryHeight = 22;
    const startY = panelY + 35;
    const padding = 2;
    
    for (let i = 0; i < this.state.scoringCategories.length; i++) {
      const category = this.state.scoringCategories[i];
      if (category.used) continue;
      
      const btnY = startY + i * (categoryHeight + padding);
      if (isPointInRect(x, y, panelX + 10, btnY, panelWidth - 20, categoryHeight)) {
        this.selectCategory(category.id);
        return;
      }
    }
    
    // Clicked inside panel but not on a category - do nothing
  }

  private handlePowerupSelectInput(x: number, y: number): void {
    const cardWidth = 180;
    const cardHeight = 220;
    const startX = (CANVAS_WIDTH - (this.powerupOptions.length * cardWidth + 40 * 2)) / 2;
    const startY = 300;
    
    this.powerupOptions.forEach((powerup: any, index: number) => {
      const cardX = startX + index * (cardWidth + 40);
      if (isPointInRect(x, y, cardX, startY, cardWidth, cardHeight)) {
        this.selectPowerup(powerup);
      }
    });
  }

  private handleGameOverInput(x: number, y: number): void {
    if (isPointInRect(x, y, CANVAS_WIDTH / 2 - 100, 480, 200, 50)) {
      this.state = this.createInitialState();
    }
  }

  private startPlayerTurn(): void {
    this.state.phase = 'player_start';
    this.state.currentTurn = 'player';
    this.diceManager.reset();
    this.state.rollsRemaining = INITIAL_ROLLS;
    // Sync dice from diceManager to state
    this.state.dice = this.diceManager.getDice();
  }

  private autoSelectBestCategory(): void {
    const availableCategories = this.state.scoringCategories.filter(cat => !cat.used);
    if (availableCategories.length === 0) return;

    const diceValues = this.diceManager.getValues();
    let bestCategory = availableCategories[0];
    let bestScore = this.scoreManager.calculateScore(bestCategory.id, diceValues);

    availableCategories.forEach(category => {
      const score = this.scoreManager.calculateScore(category.id, diceValues);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    });

    this.selectCategory(bestCategory.id);
  }

  private selectCategory(categoryId: string): void {
    const category = this.state.scoringCategories.find(c => c.id === categoryId);
    if (!category || category.used) return;

    let score = this.scoreManager.calculateScore(categoryId, this.diceManager.getValues());
    
    // Apply score multipliers from powerups
    const multiplier = (this.state as any).scoreMultiplier || 1;
    score = Math.floor(score * multiplier);
    
    // Apply balanced bonus
    const balancedBonus = (this.state as any).balancedBonus || 0;
    score += balancedBonus;
    
    // Apply category master bonus
    const categoryMaster = (this.state as any).categoryMaster || 0;
    score += categoryMaster;
    
    // Apply insurance (minimum score)
    const insurance = (this.state as any).insurance || 0;
    if (insurance > 0 && score < insurance) {
      score = insurance;
    }
    
    // Apply safe bet (minimum 10)
    if ((this.state as any).safeBet && score < 10) {
      score = 10;
    }
    
    category.score = score;
    category.used = true;

    this.state.totalScore += score;
    this.checkGameEnd();

    if (this.state.gameWinner === null) {
      // Show powerup selection - use the new PowerupSystem
      this.state.phase = 'powerup_select';
      this.powerupOptions = this.powerupSystem.getRandomPowerups(3, this.state.usedPowerupIds);
      
      // Clear used one-time powerups (but keep persistent ones)
      if ((this.state as any).scoreMultiplier && !['u2', 'u3', 'r10', 'e8', 'l8'].includes((this.state as any).lastMultiplier)) {
        delete (this.state as any).scoreMultiplier;
      }
      // Keep balanced bonus and category master for future turns
    }
  }

  private selectPowerup(powerup: any): void {
    const powerupId = powerup.id;
    let effectText = '';
    
    // Apply powerup effect directly based on ID
    // IMPORTANT: Add to totalScore so it shows in the UI!
    switch (powerupId) {
      // === COMMON POINT BONUSES ===
      case 'c1': // Lucky Charm +10
        this.state.totalScore += 10;
        effectText = '+10 points added!';
        break;
      case 'c2': // Small Win +15
        this.state.totalScore += 15;
        effectText = '+15 points added!';
        break;
      case 'c3': // Quick Points +20
        this.state.totalScore += 20;
        effectText = '+20 points added!';
        break;
      case 'c8': // Focus +25
        this.state.totalScore += 25;
        effectText = '+25 points added!';
        break;
      case 'c9': // Warm Up +30
        this.state.totalScore += 30;
        effectText = '+30 points added!';
        break;
      case 'c10': // Backup +35
        this.state.totalScore += 35;
        effectText = '+35 points added!';
        break;
      case 'c14': // Insight +40
        this.state.totalScore += 40;
        effectText = '+40 points added!';
        break;
      case 'c15': // Flash +45
        this.state.totalScore += 45;
        effectText = '+45 points added!';
        break;
      case 'c12': // Patience +50
        this.state.totalScore += 50;
        effectText = '+50 points added!';
        break;
        
      // === UNCOMMON POINT BONUSES ===
      case 'u1': // Lucky Streak +60
        this.state.totalScore += 60;
        effectText = '+60 points added!';
        break;
      case 'u3': // Bounty +70
        this.state.totalScore += 70;
        effectText = '+70 points added!';
        break;
      case 'u6': // Surge +80
        this.state.totalScore += 80;
        effectText = '+80 points added!';
        break;
      case 'u8': // Fortune +90
        this.state.totalScore += 90;
        effectText = '+90 points added!';
        break;
      case 'u10': // Midas +100
        this.state.totalScore += 100;
        effectText = '+100 points added!';
        break;
      case 'u14': // Predict +110
        this.state.totalScore += 110;
        effectText = '+110 points added!';
        break;
        
      // === RARE POINT BONUSES ===
      case 'r1': // Jackpot +150
        this.state.totalScore += 150;
        effectText = '+150 points added!';
        break;
      case 'r3': // Golden Touch +175
        this.state.totalScore += 175;
        effectText = '+175 points added!';
        break;
      case 'r6': // Lucky 13 +200
        this.state.totalScore += 200;
        effectText = '+200 points added!';
        break;
      case 'r10': // Chaos +225
        this.state.totalScore += 225;
        effectText = '+225 points added!';
        break;
      case 'r11': // Mind Reader +250
        this.state.totalScore += 250;
        effectText = '+250 points added!';
        break;
        
      // === EPIC POINT BONUSES ===
      case 'e1': // Lucky Streak+ +300
        this.state.totalScore += 300;
        effectText = '+300 points added!';
        break;
      case 'e5': // Perfect Game +350
        this.state.totalScore += 350;
        effectText = '+350 points added!';
        break;
      case 'e7': // Omniscient +400
        this.state.totalScore += 400;
        effectText = '+400 points added!';
        break;
        
      // === LEGENDARY POINT BONUSES ===
      case 'l1': // GOD MODE +500
        this.state.totalScore += 500;
        effectText = '+500 points added!';
        break;
      case 'l5': // Destiny - set to 500
        this.state.totalScore = 500;
        effectText = 'Score set to 500!';
        break;
        
      // === SCORE MULTIPLIERS ===
      case 'u2': // Double Points 2x
        (this.state as any).scoreMultiplier = 2;
        (this.state as any).lastMultiplier = 'u2';
        effectText = '2x score multiplier active!';
        break;
      case 'u7': // Triple Points 3x
        (this.state as any).scoreMultiplier = 3;
        (this.state as any).lastMultiplier = 'u7';
        effectText = '3x score multiplier active!';
        break;
      case 'r2': // Multiplier 4x
        (this.state as any).scoreMultiplier = 4;
        (this.state as any).lastMultiplier = 'r2';
        effectText = '4x score multiplier active!';
        break;
      case 'e2': // Power Surge 5x
        (this.state as any).scoreMultiplier = 5;
        (this.state as any).lastMultiplier = 'e2';
        effectText = '5x score multiplier active!';
        break;
      case 'l3': // Score Multiplier 10x
        (this.state as any).scoreMultiplier = 10;
        (this.state as any).lastMultiplier = 'l3';
        effectText = '10x score multiplier active!';
        break;
        
      // === STEAL FROM AI ===
      case 'c7': // Opportunist - steal 5
        this.state.totalScore += 5;
        this.state.aiTotalScore = Math.max(0, this.state.aiTotalScore - 5);
        effectText = 'Stole 5 points from AI!';
        break;
      case 'u5': // Vampiric - steal 10
        this.state.totalScore += 10;
        this.state.aiTotalScore = Math.max(0, this.state.aiTotalScore - 10);
        effectText = 'Stole 10 points from AI!';
        break;
      case 'r8': // Steal Power - steal 50
        this.state.totalScore += 50;
        this.state.aiTotalScore = Math.max(0, this.state.aiTotalScore - 50);
        effectText = 'Stole 50 points from AI!';
        break;
      case 'r12': // Absorb - steal 60
        this.state.totalScore += 60;
        this.state.aiTotalScore = Math.max(0, this.state.aiTotalScore - 60);
        effectText = 'Stole 60 points from AI!';
        break;
      case 'e6': // Score Steal - steal 100
        this.state.totalScore += 100;
        this.state.aiTotalScore = Math.max(0, this.state.aiTotalScore - 100);
        effectText = 'Stole 100 points from AI!';
        break;
      case 'l4': // Absolute Win - steal 200
        this.state.totalScore += 200;
        this.state.aiTotalScore = Math.max(0, this.state.aiTotalScore - 200);
        effectText = 'Stole 200 points from AI!';
        break;
        
      // === SET AI SCORE TO 0 ===
      case 'e8': // Game Breaker
        this.state.aiTotalScore = 0;
        effectText = 'AI score set to 0!';
        break;
        
      // === PASSIVE BUFFS ===
      case 'c11': // Balanced +5 to all
        (this.state as any).balancedBonus = 5;
        effectText = '+5 to all category scores!';
        break;
      case 'c6': // Safe Bet - min 10
        (this.state as any).safeBet = true;
        effectText = 'Minimum 10 points guaranteed!';
        break;
      case 'u9': // Insurance - min 20
        (this.state as any).insurance = 20;
        effectText = '+20 to all category scores!';
        break;
      case 'e3': // Category Master +15
        (this.state as any).categoryMaster = 15;
        effectText = '+15 to all category scores!';
        break;
      case 'r9': // Fortress +10
        (this.state as any).categoryMaster = 10;
        effectText = '+10 to all category scores!';
        break;
        
      // === EXTRA ROLLS ===
      case 'c4': // Momentum +1 roll
        (this.state as any).extraRolls = ((this.state as any).extraRolls || 0) + 1;
        effectText = '+1 extra roll next turn!';
        break;
      case 'c5': // Steady Hand +1 roll
        (this.state as any).extraRolls = ((this.state as any).extraRolls || 0) + 1;
        effectText = '+1 extra roll next turn!';
        break;
      case 'c13': // Second Wind +1 roll if bust
        (this.state as any).secondWind = true;
        effectText = '+1 extra roll if you bust!';
        break;
      case 'u4': // Extra Roll +2 rolls
        (this.state as any).extraRolls = ((this.state as any).extraRolls || 0) + 2;
        effectText = '+2 extra rolls next turn!';
        break;
      case 'u15': // Lock In +2 rolls
        (this.state as any).extraRolls = ((this.state as any).extraRolls || 0) + 2;
        effectText = '+2 extra rolls next turn!';
        break;
      case 'r4': // Momentum Boost +3 rolls
        (this.state as any).extraRolls = ((this.state as any).extraRolls || 0) + 3;
        effectText = '+3 extra rolls next turn!';
        break;
      case 'l2': // Infinity Dice +5 rolls
        (this.state as any).extraRolls = ((this.state as any).extraRolls || 0) + 5;
        effectText = '+5 extra rolls next turn!';
        break;
        
      // === AI BLOCKING ===
      case 'r5': // Time Stop - AI skips 1 turn
        (this.state as any).aiSkipTurn = 1;
        effectText = 'AI skips next turn!';
        break;
      case 'e4': // Time Freeze - AI skips 2 turns
        (this.state as any).aiSkipTurn = 2;
        effectText = 'AI skips 2 turns!';
        break;
        
      // === SPECIAL ===
      case 'r7': // Score Hacker - set to 300
        this.state.totalScore = 300;
        effectText = 'Score set to 300!';
        break;
        
      default:
        // For powerups without specific effects, add a small bonus
        this.state.totalScore += 25;
        effectText = powerup.description || '+25 bonus points!';
    }
    
    // Store in active powerups for tracking
    this.state.activePowerups.push(powerup);
    // Mark as used for this game
    if (!this.state.usedPowerupIds.includes(powerup.id)) {
      this.state.usedPowerupIds.push(powerup.id);
    }
    
    // Show visual feedback with the effect text
    this.showPowerupNotification(powerup, effectText);
    
    // Start AI turn after a short delay to show the effect
    setTimeout(() => {
      this.state.phase = 'ai_start';
      this.state.currentTurn = 'ai';
      this.playAITurn();
    }, 1500);
  }

  private showPowerupNotification(powerup: any, effectText: string = ''): void {
    // This will be rendered in the game loop
    this.powerupNotification = {
      powerup: powerup,
      effectText: effectText || powerup.description,
      timer: 120, // frames (~2 seconds)
      applied: true
    };
  }

  private renderPowerupNotification(): void {
    if (!this.powerupNotification) return;
    
    const ctx = (this.renderer as any).ctx;
    const notif = this.powerupNotification;
    
    // Background
    const x = CANVAS_WIDTH / 2 - 150;
    const y = 150;
    const width = 300;
    const height = 60;
    
    // Fade out effect
    const alpha = Math.min(1, notif.timer / 30);
    ctx.globalAlpha = alpha;
    
    // Background with glow
    const rarityKey = notif.powerup.rarity as keyof typeof RARITY_CONFIG;
    const rarityColor = RARITY_CONFIG[rarityKey]?.color || '#3498db';
    this.renderer.drawGlow(CANVAS_WIDTH / 2, y + 30, 150, rarityColor, 0.4);
    
    ctx.fillStyle = 'rgba(20, 20, 40, 0.9)';
    this.renderer.drawRoundedRect(x, y, width, height, 12);
    ctx.fill();
    
    ctx.strokeStyle = rarityColor;
    ctx.lineWidth = 2;
    this.renderer.drawRoundedRect(x, y, width, height, 12);
    ctx.stroke();
    
    // Icon
    ctx.fillStyle = rarityColor;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(notif.powerup.icon, x + 40, y + 40);
    
    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(notif.powerup.name, x + 100, y + 30);
    
    // Effect description - use the actual effect text
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(notif.effectText || notif.powerup.description, x + 100, y + 50);
    
    ctx.globalAlpha = 1;
    
    // Decrease timer
    notif.timer--;
    if (notif.timer <= 0) {
      this.powerupNotification = null;
    }
  }

  private playAITurn(): void {
    // Check if AI should skip turn (due to Time Stop/Freeze)
    if ((this.state as any).aiSkipTurn && (this.state as any).aiSkipTurn > 0) {
      (this.state as any).aiSkipTurn--;
      // Show notification
      this.powerupNotification = {
        powerup: { name: 'AI Skipped', icon: '⏸️', rarity: 'rare', description: 'AI skips turn!' },
        effectText: 'AI skips this turn!',
        timer: 90,
        applied: true
      };
      setTimeout(() => {
        this.startPlayerTurn();
      }, 1200);
      return;
    }
    // Use AI's own dice manager
    this.aiDiceManager.reset();
    this.state.aiDice = this.aiDiceManager.getDice();
    this.state.aiDice.forEach(d => d.held = false);
    this.state.aiRollsRemaining = INITIAL_ROLLS;
    // AI rolling sequence
    this.runAIRollSequence();
  }

  private runAIRollSequence(): void {
    if (this.state.aiRollsRemaining <= 0) {
      // Done rolling, now score
      this.state.phase = 'ai_scoring';
      setTimeout(() => this.aiSelectCategory(), 1500);
      return;
    }
    
    this.state.phase = 'ai_rolling';
    
    // Simulate AI rolling
    setTimeout(() => {
      // Use AI's dice manager
      this.aiDiceManager.roll();
      this.state.aiDice = this.aiDiceManager.getDice();
      
      // AI holds pairs and triples
      const values = this.aiDiceManager.getValues();
      const counts: { [key: number]: number } = {};
      values.forEach(v => counts[v] = (counts[v] || 0) + 1);
      
      this.state.aiDice.forEach((d, i) => {
        d.held = counts[values[i]] >= 2;
      });
      
      this.state.aiRollsRemaining = this.aiDiceManager.getRollsRemaining();
      
      // Continue rolling
      setTimeout(() => this.runAIRollSequence(), 800);
    }, 600);
  }

  private aiSelectCategory(): void {
    const availableCategories = this.state.aiScoringCategories.filter(cat => !cat.used);
    if (availableCategories.length === 0) {
      this.checkGameEnd();
      return;
    }

    // Use AI's dice values
    const diceValues = this.aiDiceManager.getValues();
    let bestCategory = availableCategories[0];
    let bestScore = this.aiScoreManager.calculateScore(bestCategory.id, diceValues);

    availableCategories.forEach(category => {
      const score = this.aiScoreManager.calculateScore(category.id, diceValues);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    });

    // Apply score
    bestCategory.score = bestScore;
    bestCategory.used = true;
    this.state.aiTotalScore += bestScore;

    this.checkGameEnd();

    if (this.state.gameWinner === null) {
      // AI gets a unique powerup, random among all unused
      const unused = this.powerupSystem.getAllPowerups().filter(p => !this.state.usedPowerupIds.includes(p.id));
      if (unused.length === 0) {
        setTimeout(() => { this.startPlayerTurn(); }, 1000);
        return;
      }
      const randomIndex = Math.floor(Math.random() * unused.length);
      const aiPowerup = unused[randomIndex];
      this.state.usedPowerupIds.push(aiPowerup.id);
      this.state.activePowerups.push(aiPowerup);
      this.showAIPowerupNotification(aiPowerup);
      setTimeout(() => {
        this.startPlayerTurn();
      }, 1500);
    }
  }

  private applyAIPowerup(powerup: any): void {
    const powerupId = powerup.id;
    
    // Apply powerup effect for AI
    switch (powerupId) {
      // === POINT BONUSES ===
      case 'c1': this.state.aiTotalScore += 10; break;
      case 'c2': this.state.aiTotalScore += 15; break;
      case 'c3': this.state.aiTotalScore += 20; break;
      case 'c8': this.state.aiTotalScore += 25; break;
      case 'c9': this.state.aiTotalScore += 30; break;
      case 'c10': this.state.aiTotalScore += 35; break;
      case 'c14': this.state.aiTotalScore += 40; break;
      case 'c15': this.state.aiTotalScore += 45; break;
      case 'c12': this.state.aiTotalScore += 50; break;
      case 'u1': this.state.aiTotalScore += 60; break;
      case 'u3': this.state.aiTotalScore += 70; break;
      case 'u6': this.state.aiTotalScore += 80; break;
      case 'u8': this.state.aiTotalScore += 90; break;
      case 'u10': this.state.aiTotalScore += 100; break;
      case 'u11': this.state.aiTotalScore += 110; break;
      case 'r1': this.state.aiTotalScore += 150; break;
      case 'r3': this.state.aiTotalScore += 175; break;
      case 'r6': this.state.aiTotalScore += 200; break;
      case 'r10': this.state.aiTotalScore += 225; break;
      case 'r11': this.state.aiTotalScore += 250; break;
      case 'e1': this.state.aiTotalScore += 300; break;
      case 'e5': this.state.aiTotalScore += 350; break;
      case 'e7': this.state.aiTotalScore += 400; break;
      case 'l1': this.state.aiTotalScore += 500; break;
      case 'l5': this.state.aiTotalScore = 500; break;
      
      // === STEAL FROM PLAYER ===
      case 'c7': // Opportunist
        this.state.aiTotalScore += 5;
        this.state.totalScore = Math.max(0, this.state.totalScore - 5);
        break;
      case 'u5': // Vampiric
        this.state.aiTotalScore += 10;
        this.state.totalScore = Math.max(0, this.state.totalScore - 10);
        break;
      case 'r8': // Steal Power
        this.state.aiTotalScore += 50;
        this.state.totalScore = Math.max(0, this.state.totalScore - 50);
        break;
      case 'r12': // Absorb
        this.state.aiTotalScore += 60;
        this.state.totalScore = Math.max(0, this.state.totalScore - 60);
        break;
      case 'e6': // Score Steal
        this.state.aiTotalScore += 100;
        this.state.totalScore = Math.max(0, this.state.totalScore - 100);
        break;
      case 'l4': // Absolute Win
        this.state.aiTotalScore += 200;
        this.state.totalScore = Math.max(0, this.state.totalScore - 200);
        break;
        
      // === SET PLAYER SCORE TO 0 ===
      case 'e8': // Game Breaker
        this.state.totalScore = 0;
        break;
        
      // === EXTRA ROLLS (stored for AI's next turn) ===
      case 'c4': case 'c5':
        (this.state as any).aiExtraRolls = ((this.state as any).aiExtraRolls || 0) + 1;
        break;
      case 'u4': case 'u15':
        (this.state as any).aiExtraRolls = ((this.state as any).aiExtraRolls || 0) + 2;
        break;
      case 'r4':
        (this.state as any).aiExtraRolls = ((this.state as any).aiExtraRolls || 0) + 3;
        break;
      case 'l2':
        (this.state as any).aiExtraRolls = ((this.state as any).aiExtraRolls || 0) + 5;
        break;
        
      // === AI SKIP (block player turns) ===
      case 'r5': // Time Stop
        (this.state as any).playerSkipTurn = 1;
        break;
      case 'e4': // Time Freeze
        (this.state as any).playerSkipTurn = 2;
        break;
        
      default:
        // Other powerups - just add small bonus
        this.state.aiTotalScore += 25;
    }
    
    // Show AI powerup notification briefly
    this.showAIPowerupNotification(powerup);
    
    // After showing AI's powerup, start player turn
    setTimeout(() => {
      this.startPlayerTurn();
    }, 1500);
  }

  private showAIPowerupNotification(powerup: any): void {
    const ctx = (this.renderer as any).ctx;
    
    // Brief notification that AI got a powerup
    this.powerupNotification = {
      powerup: powerup,
      effectText: `AI used ${powerup.name}!`,
      timer: 90,
      applied: true
    };
  }

  private checkGameEnd(): void {
    const playerComplete = this.state.scoringCategories.filter(c => c.used).length === TOTAL_CATEGORIES;
    const aiComplete = this.state.aiScoringCategories.filter(c => c.used).length === TOTAL_CATEGORIES;

    if (playerComplete || aiComplete) {
      this.state.phase = 'gameover';
      if (this.state.totalScore > this.state.aiTotalScore) {
        this.state.gameWinner = 'player';
      } else if (this.state.aiTotalScore > this.state.totalScore) {
        this.state.gameWinner = 'ai';
      } else {
        // Tie - player wins
        this.state.gameWinner = 'player';
      }
    }
  }

  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.canvas.removeEventListener('mousedown', this.boundHandleInput);
    this.canvas.removeEventListener('touchstart', this.boundHandleInput);
  }
}
