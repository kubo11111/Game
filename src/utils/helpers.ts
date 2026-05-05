import { DieValue, DiceHand } from '../types';

/**
 * Utility functions for dice and game logic
 */

// Random number generator
export function rollDie(): DieValue {
  return (Math.floor(Math.random() * 6) + 1) as DieValue;
}

export function rollDice(count: number = 5): DiceHand {
  const dice: DiceHand = [];
  for (let i = 0; i < count; i++) {
    dice.push(rollDie());
  }
  return dice;
}

// Array utilities
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function countOccurrences(dice: DiceHand, value: DieValue): number {
  return dice.filter(die => die === value).length;
}

export function getUniqueValues(dice: DiceHand): DieValue[] {
  return [...new Set(dice)] as DieValue[];
}

export function getDiceCounts(dice: DiceHand): Map<DieValue, number> {
  const counts = new Map<DieValue, number>();
  for (let i = 1; i <= 6; i++) {
    counts.set(i as DieValue, countOccurrences(dice, i as DieValue));
  }
  return counts;
}

export function sumDice(dice: DiceHand): number {
  return dice.reduce((sum, die) => sum + die, 0);
}

export function hasStraight(dice: DiceHand, length: number): boolean {
  const sorted = [...new Set(dice)].sort((a, b) => a - b);
  let currentLength = 1;
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      currentLength++;
      if (currentLength >= length) return true;
    } else {
      currentLength = 1;
    }
  }
  
  return currentLength >= length;
}

export function hasNOfAKind(dice: DiceHand, n: number): boolean {
  const counts = getDiceCounts(dice);
  for (const count of counts.values()) {
    if (count >= n) return true;
  }
  return false;
}

export function getBestNOfAKind(dice: DiceHand): number {
  const counts = getDiceCounts(dice);
  let best = 0;
  
  for (const [value, count] of counts.entries()) {
    if (count > best) {
      best = count;
    }
  }
  
  return best;
}

export function hasFullHouse(dice: DiceHand): boolean {
  const counts = getDiceCounts(dice);
  let hasThree = false;
  let hasPair = false;
  
  for (const count of counts.values()) {
    if (count === 3) hasThree = true;
    if (count === 2) hasPair = true;
  }
  
  return hasThree && hasPair;
}

export function hasTwoPairs(dice: DiceHand): boolean {
  const counts = getDiceCounts(dice);
  let pairCount = 0;
  
  for (const count of counts.values()) {
    if (count === 2) pairCount++;
  }
  
  return pairCount >= 2;
}

// Weighted random selection
export function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    if (random <= weights[i]) {
      return items[i];
    }
    random -= weights[i];
  }
  
  return items[items.length - 1];
}

// String utilities
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Color utilities
export function lerpColor(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  
  if (!c1 || !c2) return color1;
  
  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));
  
  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Canvas utilities
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawPixelatedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelSize: number = 4
): void {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, width, height);
}

// Input utilities
export function isPointInRect(
  x: number, y: number, 
  rectX: number, rectY: number, 
  rectWidth: number, rectHeight: number
): boolean {
  return x >= rectX && x <= rectX + rectWidth && 
         y >= rectY && y <= rectY + rectHeight;
}