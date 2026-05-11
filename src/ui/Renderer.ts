import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, DICE_SIZE, DICE_GAP, FONT_FAMILY } from '../utils/constants';
import { Die, Particle } from '../types';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrame: number = 0;
  private particles: Particle[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = true;
  }

  clear(): void {
    // Create gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Add subtle grid pattern
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT);
      this.ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
      this.ctx.stroke();
    }
  }

  public drawGlow(x: number, y: number, radius: number, color: string, intensity: number = 0.3): void {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    this.ctx.globalAlpha = intensity;
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    this.ctx.globalAlpha = 1;
  }

  public drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  drawDie(die: Die, x: number, y: number, size: number, held: boolean, rolling: boolean = false): void {
    const ctx = this.ctx;
    const bounce = rolling ? Math.sin(this.animationFrame * 0.2 + x * 0.01) * 5 : 0;
    const dieY = y + bounce;
    
    // Glow effect for held dice
    if (held) {
      this.drawGlow(x + size / 2, dieY + size / 2, size, 'rgba(243, 156, 18, 0.4)', 0.5);
    }
    
    // Die shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.drawRoundedRect(x + 4, dieY + 4, size, size, 10);
    
    // Die background with gradient
    const dieGradient = ctx.createLinearGradient(x, dieY, x + size, dieY + size);
    if (held) {
      dieGradient.addColorStop(0, '#f5b041');
      dieGradient.addColorStop(1, '#f39c12');
    } else {
      dieGradient.addColorStop(0, '#ffffff');
      dieGradient.addColorStop(1, '#ecf0f1');
    }
    ctx.fillStyle = dieGradient;
    this.drawRoundedRect(x, dieY, size, size, 10);
    ctx.fill();
    
    // Die border
    ctx.strokeStyle = held ? '#e67e22' : '#2c3e50';
    ctx.lineWidth = held ? 3 : 2;
    this.drawRoundedRect(x, dieY, size, size, 10);
    ctx.stroke();
    
    // Draw pips
    const value = die.value;
    const dotSize = size * 0.13;
    const padding = size * 0.2;
    const centerX = x + size / 2;
    const centerY = dieY + size / 2;
    
    ctx.fillStyle = held ? '#1a1a2e' : '#2c3e50';
    
    const positions: Record<number, [number, number][]> = {
      1: [[0, 0]],
      2: [[-1, -1], [1, 1]],
      3: [[0, 0], [-1, -1], [1, 1]],
      4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
      5: [[0, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]],
      6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
    };
    
    const pos = positions[value] || [];
    pos.forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.arc(centerX + ox * (size * 0.25), centerY + oy * (size * 0.25), dotSize, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawDice(dice: Die[], rollsRemaining: number, isAITurn: boolean = false): void {
    const totalWidth = (DICE_SIZE * 5) + (DICE_GAP * 4);
    const startX = (CANVAS_WIDTH - totalWidth) / 2;
    const y = 280;
    
    // Dice container - subtle background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.drawRoundedRect(startX - 15, y - 15, totalWidth + 30, DICE_SIZE + 50, 16);
    this.ctx.fill();
    
    dice.forEach((die, index) => {
      const x = startX + index * (DICE_SIZE + DICE_GAP);
      this.drawDie(die, x, y, DICE_SIZE, die.held, isAITurn);
    });
    
    // Rolls remaining badge - sleek design
    const badgeX = CANVAS_WIDTH / 2;
    const badgeY = y + DICE_SIZE + 25;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.drawRoundedRect(badgeX - 50, badgeY - 12, 100, 24, 12);
    this.ctx.fill();
    
    this.ctx.strokeStyle = COLORS.accent;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.5;
    this.drawRoundedRect(badgeX - 50, badgeY - 12, 100, 24, 12);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`ROLLS: ${rollsRemaining}`, badgeX, badgeY + 5);
  }

  drawButton(x: number, y: number, width: number, height: number, text: string, enabled: boolean, color?: string): void {
    const ctx = this.ctx;
    const btnColor = color || COLORS.accent;
    
    if (!enabled) {
      ctx.fillStyle = 'rgba(60, 60, 60, 0.4)';
      this.drawRoundedRect(x, y, width, height, 10);
      ctx.fill();
      ctx.fillStyle = '#666';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(text, x + width / 2, y + height / 2 + 5);
      return;
    }
    
    // Subtle glow
    this.drawGlow(x + width / 2, y + height / 2, Math.max(width, height) * 0.6, btnColor, 0.2);
    
    // Button background - gradient
    const btnGradient = ctx.createLinearGradient(x, y, x, y + height);
    btnGradient.addColorStop(0, btnColor);
    btnGradient.addColorStop(1, this.darkenColor(btnColor, 40));
    ctx.fillStyle = btnGradient;
    this.drawRoundedRect(x, y, width, height, 10);
    ctx.fill();
    
    // Button border - subtle
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    this.drawRoundedRect(x, y, width, height, 10);
    ctx.stroke();
    
    // Button text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + width / 2, y + height / 2 + 5);
  }

  drawText(text: string, x: number, y: number, color: string, size: number, centered: boolean = false, shadow: boolean = true): void {
    const ctx = this.ctx;
    
    if (shadow) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.font = `bold ${size}px ${FONT_FAMILY}`;
      ctx.textAlign = centered ? 'center' : 'left';
      ctx.fillText(text, x + 2, y + 2);
    }
    
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px ${FONT_FAMILY}`;
    ctx.textAlign = centered ? 'center' : 'left';
    ctx.fillText(text, x, y);
  }

  drawScoreCard(name: string, categories: any[], totalScore: number, x: number, y: number, width: number, height: number, isPlayer: boolean = true): void {
    const ctx = this.ctx;
    const accentColor = isPlayer ? COLORS.player : COLORS.enemy;
    
    // Card glow - subtle ambient
    this.drawGlow(x + width / 2, y + height / 2, width * 0.8, accentColor, 0.1);
    
    // Card background - glass effect
    ctx.fillStyle = 'rgba(20, 20, 40, 0.6)';
    this.drawRoundedRect(x, y, width, height, 12);
    ctx.fill();
    
    // Inner glow border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    this.drawRoundedRect(x + 1, y + 1, width - 2, height - 2, 11);
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Title
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, x + width / 2, y + 18);
    
    // Total score - larger and prominent
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${totalScore}`, x + width / 2, y + 40);
    
    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 50);
    ctx.lineTo(x + width - 10, y + 50);
    ctx.stroke();
    
    // Categories - much tighter spacing and smaller font to fit all
    const categoryHeight = (height - 60) / 15;
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const categoryY = y + 55 + i * categoryHeight;
      // Category name
      ctx.fillStyle = category.used ? 'rgba(255,255,255,0.35)' : '#ffffff';
      // Allow up to 14 chars, ellipsis if longer
      let displayName = category.name;
      if (displayName.length > 14) displayName = displayName.substring(0, 13) + '…';
      ctx.fillText(displayName, x + 8, categoryY + categoryHeight * 0.7);
      // Score
      ctx.textAlign = 'right';
      if (category.used) {
        ctx.fillStyle = category.score > 0 ? '#2ecc71' : '#e74c3c';
        ctx.fillText(category.score.toString(), x + width - 8, categoryY + categoryHeight * 0.7);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillText('-', x + width - 8, categoryY + categoryHeight * 0.7);
      }
      ctx.textAlign = 'left';
    }
  }

  drawScoreCardWithPreview(name: string, categories: any[], totalScore: number, x: number, y: number, width: number, height: number, isPlayer: boolean = true, diceValues: number[] = [], scoreCalculator: ((categoryId: string, diceValues: number[]) => number) | null = null, isClickable: boolean = false): void {
    const ctx = this.ctx;
    const accentColor = isPlayer ? COLORS.player : COLORS.enemy;
    
    // Card glow - subtle ambient
    this.drawGlow(x + width / 2, y + height / 2, width * 0.8, accentColor, 0.1);
    
    // Card background - glass effect
    ctx.fillStyle = 'rgba(20, 20, 40, 0.6)';
    this.drawRoundedRect(x, y, width, height, 12);
    ctx.fill();
    
    // Inner glow border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    this.drawRoundedRect(x + 1, y + 1, width - 2, height - 2, 11);
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Title
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(name, x + width / 2, y + 18);
    
    // Total score - larger and prominent
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${totalScore}`, x + width / 2, y + 40);
    
    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 50);
    ctx.lineTo(x + width - 10, y + 50);
    ctx.stroke();
    
    // Categories - BIGGER boxes with score preview
    const categoryHeight = (height - 60) / 15;
    const categoryBoxHeight = Math.max(categoryHeight, 20);
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const categoryY = y + 55 + i * categoryHeight;
      
      // Category background box - darker if used
      if (category.used) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      } else {
        ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
      }
      ctx.fillRect(x + 4, categoryY - 4, width - 8, categoryBoxHeight - 2);
      
      // Category name
      ctx.fillStyle = category.used ? 'rgba(255,255,255,0.35)' : '#ffffff';
      let displayName = category.name;
      if (displayName.length > 12) displayName = displayName.substring(0, 11) + '…';
      ctx.fillText(displayName, x + 8, categoryY + categoryHeight * 0.65);
      
      // Score
      ctx.textAlign = 'right';
      if (category.used) {
        // Show actual score in green or red
        ctx.fillStyle = category.score > 0 ? '#2ecc71' : '#e74c3c';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(category.score.toString(), x + width - 8, categoryY + categoryHeight * 0.65);
      } else if (diceValues.length > 0 && scoreCalculator) {
        // Show preview score
        const previewScore = scoreCalculator(category.id, diceValues);
        ctx.fillStyle = previewScore > 0 ? '#f39c12' : 'rgba(255,255,255,0.2)';
        ctx.font = '11px Arial';
        ctx.fillText(previewScore > 0 ? previewScore.toString() : '-', x + width - 8, categoryY + categoryHeight * 0.65);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '11px Arial';
        ctx.fillText('-', x + width - 8, categoryY + categoryHeight * 0.65);
      }
      ctx.textAlign = 'left';
    }
  }

  drawCategoryButtons(categories: any[], x: number, y: number, width: number, height: number): void {
    const ctx = this.ctx;
    // Compact category buttons for panel
    const categoryHeight = 22;
    const padding = 2;
    let visibleIndex = 0;
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (category.used) continue;
      const btnY = y + visibleIndex * (categoryHeight + padding);
      visibleIndex++;
      const isHovered = false;
      // Button background
      ctx.fillStyle = isHovered ? 'rgba(52, 152, 219, 0.8)' : 'rgba(52, 152, 219, 0.4)';
      this.drawRoundedRect(x, btnY, width, categoryHeight, 8);
      ctx.fill();
      ctx.strokeStyle = COLORS.accent;
      ctx.lineWidth = 1;
      this.drawRoundedRect(x, btnY, width, categoryHeight, 8);
      ctx.stroke();
      // Category name and potential score
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      let displayName = category.name;
      if (displayName.length > 14) displayName = displayName.substring(0, 13) + '…';
      ctx.fillText(displayName, x + 12, btnY + categoryHeight * 0.7);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#f39c12';
      ctx.fillText(`(${category.maxScore})`, x + width - 12, btnY + categoryHeight * 0.7);
    }
  }

  drawPowerupCard(powerup: any, x: number, y: number, width: number, height: number, selected: boolean = false): void {
    const ctx = this.ctx;
    const rarityColors: Record<string, string> = {
      common: '#95a5a6',
      uncommon: '#27ae60',
      rare: '#3498db',
      epic: '#9b59b6',
      legendary: '#f39c12',
      mythic: '#e74c3c'
    };
    const borderColor = rarityColors[powerup.rarity] || COLORS.button;
    
    // Card glow - stronger for higher rarities
    const glowIntensity = powerup.rarity === 'mythic' ? 0.8 : powerup.rarity === 'legendary' ? 0.6 : powerup.rarity === 'epic' ? 0.5 : 0.3;
    if (selected) {
      this.drawGlow(x + width / 2, y + height / 2, Math.max(width, height), borderColor, glowIntensity);
    }
    
    // Card background - gradient based on rarity
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, 'rgba(30, 30, 50, 0.9)');
    gradient.addColorStop(1, 'rgba(10, 10, 30, 0.95)');
    ctx.fillStyle = gradient;
    this.drawRoundedRect(x, y, width, height, 16);
    ctx.fill();
    
    // Card border - glow effect for rare+ powerups
    if (['rare', 'epic', 'legendary', 'mythic'].includes(powerup.rarity)) {
      ctx.shadowColor = borderColor;
      ctx.shadowBlur = powerup.rarity === 'mythic' ? 20 : powerup.rarity === 'legendary' ? 15 : 10;
    }
    ctx.strokeStyle = selected ? '#ffffff' : borderColor;
    ctx.lineWidth = selected ? 3 : powerup.rarity === 'mythic' ? 3 : 2;
    this.drawRoundedRect(x, y, width, height, 16);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Icon - larger for better powerups
    const iconSize = powerup.rarity === 'mythic' ? 48 : powerup.rarity === 'legendary' ? 42 : 36;
    ctx.fillStyle = borderColor;
    ctx.font = `bold ${iconSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(powerup.icon || '⚡', x + width / 2, y + 50);
    
    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(powerup.name, x + width / 2, y + 80);
    
    // Description
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '12px Arial';
    ctx.fillText(powerup.description, x + width / 2, y + 105);
    
    // Rarity badge with glow
    ctx.fillStyle = borderColor;
    ctx.font = 'bold 11px Arial';
    ctx.fillText(powerup.rarity.toUpperCase(), x + width / 2, y + 130);
    
    // Stack info if stackable
    if (powerup.stackable && powerup.maxStack) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px Arial';
      ctx.fillText(`Max: ${powerup.maxStack}`, x + width / 2, y + 150);
    }
  }

  private darkenColor(color: string, amount: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * amount);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
  }

  update(): void {
    this.animationFrame++;
  }
}
