// Server-side copy of client PRNG + puzzle generation
// Must stay in sync with src/utils/dailySeed.js

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cities = JSON.parse(readFileSync(join(__dirname, '..', '..', 'src', 'data', 'cities.json'), 'utf-8'));

// Mulberry32 seeded PRNG (identical to client)
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Days since launch date (2026-02-23), using UTC so client and server always agree
export function getDayNumber() {
  const launch = Date.UTC(2026, 1, 23); // Feb 23, 2026 00:00 UTC
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - launch) / 86400000) + 1;
}

// Fisher-Yates shuffle using seeded RNG
function seededShuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Returns 5 cities for a given day's puzzle (one per continent)
export function getDailyPuzzle(dayNumber) {
  const rng = mulberry32(dayNumber);

  const continentKeys = ['northAmerica', 'southAmerica', 'europe', 'africa', 'asia'];
  const shuffledContinents = seededShuffle(continentKeys, rng);
  const difficulties = seededShuffle(['easy', 'medium', 'medium', 'hard', 'hard'], rng);

  const puzzle = [];

  for (let i = 0; i < 5; i++) {
    const continent = shuffledContinents[i];
    const difficulty = difficulties[i];

    let pool = cities.filter(
      (c) => c.continent === continent && c.difficulty === difficulty
    );

    if (pool.length === 0) {
      pool = cities.filter((c) => c.continent === continent);
    }

    const idx = Math.floor(rng() * pool.length);
    puzzle.push(pool[idx]);
  }

  return puzzle;
}
