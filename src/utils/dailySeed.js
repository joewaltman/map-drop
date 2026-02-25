// Mulberry32 seeded PRNG
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Days since launch date (2026-02-23)
export function getDayNumber() {
  const launch = new Date('2026-02-23T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

// Returns 5 cities for today's puzzle (one per continent)
export function getDailyPuzzle(cities) {
  const dayNumber = getDayNumber();
  const rng = mulberry32(dayNumber);

  const continentKeys = ['northAmerica', 'southAmerica', 'europe', 'africa', 'asia'];
  const shuffledContinents = seededShuffle(continentKeys, rng);
  const difficulties = seededShuffle(['easy', 'medium', 'medium', 'medium', 'hard'], rng);

  const puzzle = [];

  for (let i = 0; i < 5; i++) {
    const continent = shuffledContinents[i];
    const difficulty = difficulties[i];

    // Find cities matching continent + difficulty
    let pool = cities.filter(
      (c) => c.continent === continent && c.difficulty === difficulty
    );

    // Fallback: any city in that continent
    if (pool.length === 0) {
      pool = cities.filter((c) => c.continent === continent);
    }

    // Pick a random city from the pool
    const idx = Math.floor(rng() * pool.length);
    puzzle.push(pool[idx]);
  }

  return puzzle;
}
