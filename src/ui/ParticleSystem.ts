import { Particle } from '../types';
import { COLORS } from '../utils/constants';

export class ParticleSystem {
  private particles: Particle[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  /**
   * Emit particles at a specific location
   */
  emitParticles(x: number, y: number, count: number, config: Partial<Particle> = {}): void {
    for (let i = 0; i < count; i++) {
      const particle: Particle = {
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 60,
        maxLife: 60,
        color: config.color || COLORS.accent,
        size: config.size || 4
      };
      this.particles.push(particle);
    }
  }

  /**
   * Emit dice roll particles
   */
  emitDiceRoll(x: number, y: number): void {
    this.emitParticles(x, y, 15, {
      color: COLORS.dice,
      size: 3
    });
  }

  /**
   * Emit scoring particles
   */
  emitScore(x: number, y: number): void {
    this.emitParticles(x, y, 20, {
      color: COLORS.gold,
      size: 5
    });
  }

  /**
   * Emit damage particles
   */
  emitDamage(x: number, y: number): void {
    this.emitParticles(x, y, 10, {
      color: COLORS.health,
      size: 6
    });
  }

  /**
   * Emit powerup activation particles
   */
  emitPowerup(x: number, y: number): void {
    this.emitParticles(x, y, 25, {
      color: COLORS.accent,
      size: 4
    });
  }

  /**
   * Update all particles
   */
  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Apply gravity
      particle.vy += 0.2;
      
      // Update life
      particle.life--;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Draw all particles
   */
  draw(): void {
    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.life / particle.maxLife;
      this.ctx.fillStyle = particle.color;
      this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      this.ctx.globalAlpha = 1.0;
    });
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
  }

  /**
   * Get particle count
   */
  getParticleCount(): number {
    return this.particles.length;
  }
}