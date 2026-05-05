import { Die, DieValue, DiceHand } from '../types';
import { rollDie, rollDice } from '../utils/helpers';

export class DiceManager {
  private dice: Die[] = [];
  private rollsRemaining: number = 0;
  private maxRolls: number;

  constructor() {
    this.maxRolls = 3;
    this.reset();
  }

  /**
   * Reset dice to initial state
   */
  reset(): void {
    this.dice = Array.from({ length: 5 }, (_, i) => ({
      value: rollDie(),
      held: false,
      id: i
    }));
    this.rollsRemaining = this.maxRolls;
  }

  /**
   * Roll selected dice (or all if no indices provided)
   */
  roll(indices?: number[]): DieValue[] {
    if (this.rollsRemaining <= 0) {
      return this.getValues();
    }

    // If no indices provided, roll all unheld dice
    if (!indices || indices.length === 0) {
      indices = this.dice
        .map((die, i) => (!die.held ? i : -1))
        .filter(i => i !== -1);
    }

    // Roll selected dice
    indices.forEach(index => {
      if (index >= 0 && index < this.dice.length) {
        this.dice[index].value = rollDie();
      }
    });

    this.rollsRemaining--;
    return this.getValues();
  }

  /**
   * Toggle hold state for a die
   */
  hold(index: number): void {
    if (index >= 0 && index < this.dice.length) {
      this.dice[index].held = !this.dice[index].held;
    }
  }

  /**
   * Set hold state for a die
   */
  setHold(index: number, held: boolean): void {
    if (index >= 0 && index < this.dice.length) {
      this.dice[index].held = held;
    }
  }

  /**
   * Get current die values
   */
  getValues(): DieValue[] {
    return this.dice.map(die => die.value);
  }

  /**
   * Get held dice indices
   */
  getHeldDice(): number[] {
    return this.dice
      .map((die, i) => (die.held ? i : -1))
      .filter(i => i !== -1);
  }

  /**
   * Get die objects
   */
  getDice(): Die[] {
    return this.dice;
  }

  /**
   * Check if all dice are held
   */
  allHeld(): boolean {
    return this.dice.every(die => die.held);
  }

  /**
   * Get remaining rolls
   */
  getRollsRemaining(): number {
    return this.rollsRemaining;
  }

  /**
   * Check if out of rolls
   */
  outOfRolls(): boolean {
    return this.rollsRemaining <= 0;
  }

  /**
   * Set number of rolls (for powerups)
   */
  setRolls(rolls: number): void {
    this.rollsRemaining = Math.max(0, rolls);
  }

  /**
   * Add rolls (for powerups)
   */
  addRolls(rolls: number): void {
    this.rollsRemaining = Math.max(0, this.rollsRemaining + rolls);
  }

  /**
   * Set die value (for powerups)
   */
  setDieValue(index: number, value: DieValue): void {
    if (index >= 0 && index < this.dice.length) {
      this.dice[index].value = value;
    }
  }

  /**
   * Transform all dice to specific value (for powerups)
   */
  transformDice(value: DieValue): void {
    this.dice.forEach(die => {
      die.value = value;
    });
  }

  /**
   * Mirror dice values (1↔6, 2↔5, 3↔4)
   */
  mirrorDice(): void {
    this.dice.forEach(die => {
      die.value = (7 - die.value) as DieValue;
    });
  }

  /**
   * Get dice state for saving
   */
  getState() {
    return {
      dice: this.dice.map(die => ({ ...die })),
      rollsRemaining: this.rollsRemaining
    };
  }

  /**
   * Restore dice state from save
   */
  restoreState(state: any): void {
    if (state.dice && state.rollsRemaining !== undefined) {
      this.dice = state.dice.map((die: any) => ({ ...die }));
      this.rollsRemaining = state.rollsRemaining as unknown as number;
    }
  }
}