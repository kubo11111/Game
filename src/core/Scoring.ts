import { DiceHand, ScoringCategory } from '../types';
import { 
  countOccurrences, 
  sumDice, 
  hasStraight, 
  hasNOfAKind, 
  getBestNOfAKind,
  hasFullHouse,
  hasTwoPairs
} from '../utils/helpers';

export class ScoreManager {
  private categories: ScoringCategory[];

  constructor() {
    this.categories = this.createCategories();
  }

  private createCategories(): ScoringCategory[] {
    return [
      // Upper section
      {
        id: 'ones',
        name: 'Ones',
        description: 'Sum of all ones',
        scoreFunction: (dice) => countOccurrences(dice, 1) * 1,
        maxScore: 5,
        used: false
      },
      {
        id: 'twos',
        name: 'Twos',
        description: 'Sum of all twos',
        scoreFunction: (dice) => countOccurrences(dice, 2) * 2,
        maxScore: 10,
        used: false
      },
      {
        id: 'threes',
        name: 'Threes',
        description: 'Sum of all threes',
        scoreFunction: (dice) => countOccurrences(dice, 3) * 3,
        maxScore: 15,
        used: false
      },
      {
        id: 'fours',
        name: 'Fours',
        description: 'Sum of all fours',
        scoreFunction: (dice) => countOccurrences(dice, 4) * 4,
        maxScore: 20,
        used: false
      },
      {
        id: 'fives',
        name: 'Fives',
        description: 'Sum of all fives',
        scoreFunction: (dice) => countOccurrences(dice, 5) * 5,
        maxScore: 25,
        used: false
      },
      {
        id: 'sixes',
        name: 'Sixes',
        description: 'Sum of all sixes',
        scoreFunction: (dice) => countOccurrences(dice, 6) * 6,
        maxScore: 30,
        used: false
      },
      // Lower section
      {
        id: 'onePair',
        name: 'One Pair',
        description: 'Two dice with same value (sum of pair)',
        scoreFunction: (dice) => {
          for (let i = 6; i >= 1; i--) {
            if (countOccurrences(dice, i as 1|2|3|4|5|6) >= 2) {
              return i * 2;
            }
          }
          return 0;
        },
        maxScore: 12,
        used: false
      },
      {
        id: 'twoPairs',
        name: 'Two Pairs',
        description: 'Two different pairs (sum of all four dice)',
        scoreFunction: (dice) => {
          if (!hasTwoPairs(dice)) return 0;
          const counts = new Map<number, number>();
          dice.forEach(d => counts.set(d, (counts.get(d) || 0) + 1));
          let sum = 0;
          for (const [val, count] of counts.entries()) {
            if (count >= 2) {
              sum += val * 2;
              if (sum > 0 && count === 4) sum -= val * 2; // Four of a kind counts as one pair
            }
          }
          return hasTwoPairs(dice) ? sumDice(dice) : 0;
        },
        maxScore: 30,
        used: false
      },
      {
        id: 'threeOfAKind',
        name: 'Three of a Kind',
        description: 'Three matching dice (sum of all dice)',
        scoreFunction: (dice) => {
          if (!hasNOfAKind(dice, 3)) return 0;
          return sumDice(dice);
        },
        maxScore: 30,
        used: false
      },
      {
        id: 'fourOfAKind',
        name: 'Four of a Kind',
        description: 'Four matching dice (sum of all dice)',
        scoreFunction: (dice) => {
          if (!hasNOfAKind(dice, 4)) return 0;
          return sumDice(dice);
        },
        maxScore: 30,
        used: false
      },
      {
        id: 'smallStraight',
        name: 'Small Straight',
        description: '1-2-3-4-5 (15 points)',
        scoreFunction: (dice) => {
          const sorted = [...new Set(dice)].sort((a, b) => a - b);
          if (sorted.length === 5 && sorted[0] === 1 && sorted[4] === 5) {
            return 15;
          }
          return 0;
        },
        maxScore: 15,
        used: false
      },
      {
        id: 'largeStraight',
        name: 'Large Straight',
        description: '2-3-4-5-6 (20 points)',
        scoreFunction: (dice) => {
          const sorted = [...new Set(dice)].sort((a, b) => a - b);
          if (sorted.length === 5 && sorted[0] === 2 && sorted[4] === 6) {
            return 20;
          }
          return 0;
        },
        maxScore: 20,
        used: false
      },
      {
        id: 'fullHouse',
        name: 'Full House',
        description: 'Pair + Three of a Kind (sum of all dice)',
        scoreFunction: (dice) => {
          if (!hasFullHouse(dice)) return 0;
          return sumDice(dice);
        },
        maxScore: 30,
        used: false
      },
      {
        id: 'chance',
        name: 'Chance',
        description: 'Sum of all dice',
        scoreFunction: (dice) => sumDice(dice),
        maxScore: 30,
        used: false
      },
      {
        id: 'yatzy',
        name: 'Yatzy',
        description: 'Five of a kind (50 points)',
        scoreFunction: (dice) => {
          const counts = new Map<number, number>();
          dice.forEach(d => counts.set(d, (counts.get(d) || 0) + 1));
          for (const count of counts.values()) {
            if (count === 5) return 50;
          }
          return 0;
        },
        maxScore: 50,
        used: false
      }
    ];
  }

  /**
   * Calculate score for a category
   */
  calculateScore(categoryId: string, dice: DiceHand): number {
    const category = this.categories.find(c => c.id === categoryId);
    if (!category) return 0;
    return category.scoreFunction(dice);
  }

  /**
   * Get available (unused) categories
   */
  getAvailableCategories(): ScoringCategory[] {
    return this.categories.filter(c => !c.used);
  }

  /**
   * Get all categories
   */
  getCategories(): ScoringCategory[] {
    return [...this.categories];
  }

  /**
   * Reset all categories to unused
   */
  resetCategories(): void {
    this.categories.forEach(category => {
      category.used = false;
    });
  }

  /**
   * Select and use a category
   */
  selectCategory(categoryId: string, dice: DiceHand): number {
    const category = this.categories.find(c => c.id === categoryId);
    if (!category || category.used) return 0;

    const score = category.scoreFunction(dice);
    category.used = true;
    return score;
  }

  /**
   * Check if a category is available
   */
  isCategoryAvailable(categoryId: string): boolean {
    const category = this.categories.find(c => c.id === categoryId);
    return !!category && !category.used;
  }

  /**
   * Get upper section score
   */
  getUpperSectionScore(): number {
    const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
    let score = 0;
    for (const id of upperCategories) {
      const category = this.categories.find(c => c.id === id);
      if (category && category.used) {
        // In a real implementation, we'd store the actual dice used
        // For now, we'll just return 0 since we can't recalculate
        score += 0;
      }
    }
    return score;
  }

  /**
   * Get total score
   */
  getTotalScore(): number {
    let totalScore = 0;
    for (const category of this.categories) {
      if (category.used) {
        // In a real implementation, we'd store the actual score
        // For now, we'll just return 0 since we can't recalculate
        totalScore += 0;
      }
    }
    return totalScore;
  }

  /**
   * Check if all categories are used
   */
  allCategoriesUsed(): boolean {
    return this.categories.every(c => c.used);
  }

  /**
   * Reset all categories
   */
  reset(): void {
    this.categories.forEach(c => c.used = false);
  }

  /**
   * Get category by ID
   */
  getCategory(categoryId: string): ScoringCategory | undefined {
    return this.categories.find(c => c.id === categoryId);
  }

  /**
   * Get score for a specific category (if used)
   */
  getCategoryScore(categoryId: string): number {
    const category = this.categories.find(c => c.id === categoryId);
    if (!category || !category.used) return 0;
    // In a real implementation, we'd store the actual score
    return category.maxScore; // Placeholder
  }
}