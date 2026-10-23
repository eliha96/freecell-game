import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadFreeCellLeaderboard,
  saveFreeCellLeaderboard,
  recordFreeCellResult,
  calculateFreeCellScore,
} from '../leaderboard';

describe('FreeCell Leaderboard Engine', () => {
  beforeEach(() => {
    // Clear leaderboard store before each test
    saveFreeCellLeaderboard({
      topScores: [],
      recentGames: [],
      allTimeHighScore: 0,
    });
  });

  it('calculates score dynamically based on time and moves', () => {
    // Score = max(100, 10000 - elapsedSeconds * 10 - movesCount * 15)
    expect(calculateFreeCellScore(60, 40)).toBe(10000 - 600 - 600); // 8800
    expect(calculateFreeCellScore(1000, 1000)).toBe(100); // Minimum clamped score
  });

  it('records initial game as new all-time high score and rank 1', () => {
    const outcome = recordFreeCellResult(11982, 120, 50);
    expect(outcome.isNewRecord).toBe(true);
    expect(outcome.rank).toBe(1);
    expect(outcome.score).toBe(calculateFreeCellScore(120, 50));
    expect(outcome.allTimeHighScore).toBe(outcome.score);

    const data = loadFreeCellLeaderboard();
    expect(data.topScores).toHaveLength(1);
    expect(data.topScores[0].dealNumber).toBe(11982);
    expect(data.recentGames).toHaveLength(1);
  });

  it('correctly ranks top 5 scores and recent games', () => {
    // Record 5 distinct games with decreasing performance
    recordFreeCellResult(1, 100, 50); // High
    recordFreeCellResult(2, 200, 60);
    recordFreeCellResult(3, 300, 70);
    recordFreeCellResult(4, 400, 80);
    recordFreeCellResult(5, 500, 90); // Low

    // 6th game with very poor score (should not make top 5)
    const lowOutcome = recordFreeCellResult(6, 800, 120);
    expect(lowOutcome.rank).toBe(null);
    expect(lowOutcome.isNewRecord).toBe(false);

    // 7th game with stellar score (should take rank 1 and break record)
    const bestOutcome = recordFreeCellResult(7, 50, 30);
    expect(bestOutcome.rank).toBe(1);
    expect(bestOutcome.isNewRecord).toBe(true);

    const data = loadFreeCellLeaderboard();
    expect(data.topScores).toHaveLength(5);
    expect(data.topScores[0].dealNumber).toBe(7);
    expect(data.recentGames).toHaveLength(5);
    expect(data.recentGames[0].dealNumber).toBe(7);
  });

  it('detects when record is beaten', () => {
    const first = recordFreeCellResult(100, 200, 80);
    expect(first.isNewRecord).toBe(true);

    const second = recordFreeCellResult(101, 250, 90);
    expect(second.isNewRecord).toBe(false);

    const recordBreaker = recordFreeCellResult(102, 60, 40);
    expect(recordBreaker.isNewRecord).toBe(true);
    expect(recordBreaker.allTimeHighScore).toBe(recordBreaker.score);
  });
});
