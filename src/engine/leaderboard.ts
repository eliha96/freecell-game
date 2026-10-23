// Leaderboard storage and score management for FreeCell Classic

export interface FreeCellLeaderboardEntry {
  id: string;
  dealNumber: number;
  score: number;
  date: string; // Formatted date e.g. "23/10/2026 20:15"
  timestamp: number;
  elapsedSeconds: number;
  movesCount: number;
  isAllTimeRecord?: boolean;
}

export interface FreeCellLeaderboardData {
  topScores: FreeCellLeaderboardEntry[]; // Top 5 best scores
  recentGames: FreeCellLeaderboardEntry[]; // Last 5 completed games
  allTimeHighScore: number;
}

const LEADERBOARD_KEY = 'freecell_classic_leaderboard_v1';

export function getFormattedDate(date: Date = new Date()): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  const hr = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${d}/${m}/${y} ${hr}:${min}`;
}

export function calculateFreeCellScore(elapsedSeconds: number, movesCount: number): number {
  return Math.max(100, 10000 - elapsedSeconds * 10 - movesCount * 15);
}

let memoryStore: FreeCellLeaderboardData = {
  topScores: [],
  recentGames: [],
  allTimeHighScore: 0,
};

export function loadFreeCellLeaderboard(): FreeCellLeaderboardData {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryStore = {
          topScores: Array.isArray(parsed.topScores) ? parsed.topScores.slice(0, 5) : [],
          recentGames: Array.isArray(parsed.recentGames) ? parsed.recentGames.slice(0, 5) : [],
          allTimeHighScore: typeof parsed.allTimeHighScore === 'number' ? parsed.allTimeHighScore : 0,
        };
        return memoryStore;
      }
    }
  } catch (e) {
    console.error('Failed to load FreeCell leaderboard', e);
  }

  return memoryStore;
}

export function saveFreeCellLeaderboard(data: FreeCellLeaderboardData): void {
  memoryStore = {
    topScores: [...data.topScores],
    recentGames: [...data.recentGames],
    allTimeHighScore: data.allTimeHighScore,
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Failed to save FreeCell leaderboard', e);
  }
}

export interface RecordFreeCellResultOutcome {
  score: number;
  rank: number | null; // 1 to 5 if made it to top 5, otherwise null
  isNewRecord: boolean;
  allTimeHighScore: number;
  entry: FreeCellLeaderboardEntry;
}

/**
 * Records a FreeCell game win result, updates top 5 and recent games,
 * and checks if an all-time record or top 5 placement was achieved.
 */
export function recordFreeCellResult(
  dealNumber: number,
  elapsedSeconds: number,
  movesCount: number
): RecordFreeCellResultOutcome {
  const score = calculateFreeCellScore(elapsedSeconds, movesCount);
  const currentData = loadFreeCellLeaderboard();
  const previousRecord = currentData.allTimeHighScore;
  const isNewRecord = score > 0 && score > previousRecord;

  const entry: FreeCellLeaderboardEntry = {
    id: `freecell-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    dealNumber,
    score,
    date: getFormattedDate(),
    timestamp: Date.now(),
    elapsedSeconds,
    movesCount,
    isAllTimeRecord: isNewRecord,
  };

  // 1. Update Recent Games (keep last 5)
  const updatedRecent = [entry, ...currentData.recentGames].slice(0, 5);

  // 2. Update Top 5 Scores
  const combined = [...currentData.topScores, entry];
  combined.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.elapsedSeconds - b.elapsedSeconds;
  });

  const top5 = combined.slice(0, 5);
  const rankIndex = top5.findIndex((item) => item.id === entry.id);
  const rank = rankIndex !== -1 ? rankIndex + 1 : null;

  const newHighScore = Math.max(previousRecord, score);

  saveFreeCellLeaderboard({
    topScores: top5,
    recentGames: updatedRecent,
    allTimeHighScore: newHighScore,
  });

  return {
    score,
    rank,
    isNewRecord,
    allTimeHighScore: newHighScore,
    entry,
  };
}
