const STORAGE_KEY = 'dailypin';

// Migrate data from old key if present
try {
  const old = localStorage.getItem('mapdrop');
  if (old && !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, old);
    localStorage.removeItem('mapdrop');
  }
} catch {
  // silent fail
}

export function getTodayKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

export function getSavedResult() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const todayKey = getTodayKey();
    return data[todayKey] || null;
  } catch {
    return null;
  }
}

export function saveResult(result) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const todayKey = getTodayKey();
    data[todayKey] = {
      date: todayKey,
      guesses: result.guesses,
      totalKm: result.totalKm,
      elapsedMs: result.elapsedMs || 0,
      completed: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // silently fail
  }
}

export function getAllResults() {
  try {
    const launch = Date.UTC(2026, 1, 23); // Feb 23, 2026 00:00 UTC
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return Object.entries(data)
      .filter(([, v]) => v && v.completed && Array.isArray(v.guesses))
      .map(([dateKey, v]) => {
        const [y, m, d] = dateKey.split('-').map(Number);
        const dayMS = Date.UTC(y, m - 1, d);
        const dayNumber = Math.floor((dayMS - launch) / 86400000) + 1;
        return {
          dayNumber,
          guesses: v.guesses,
          totalKm: v.totalKm,
          elapsedMs: v.elapsedMs || 0,
        };
      })
      .filter((r) => r.dayNumber >= 1);
  } catch {
    return [];
  }
}

export function getStats() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const entries = Object.values(data).filter((d) => d.completed);
    if (entries.length === 0) return null;
    const totalKm = entries.reduce((sum, e) => sum + e.totalKm, 0);
    return {
      gamesPlayed: entries.length,
      averageKm: Math.round(totalKm / entries.length),
    };
  } catch {
    return null;
  }
}

export function getStreakData() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const entries = Object.values(data).filter((d) => d.completed);
    if (entries.length === 0) return { currentStreak: 0, maxStreak: 0 };

    // Get all completed dates sorted ascending
    const dates = entries
      .map((e) => e.date)
      .sort();

    // Helper: get the date string for a Date object (UTC)
    const toKey = (d) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

    // Helper: add days to a date (UTC)
    const addDays = (dateStr, n) => {
      const d = new Date(dateStr + 'T12:00:00Z');
      d.setUTCDate(d.getUTCDate() + n);
      return toKey(d);
    };

    const dateSet = new Set(dates);

    // Calculate max streak
    let maxStreak = 1;
    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
      if (addDays(dates[i - 1], 1) === dates[i]) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
    }

    // Calculate current streak: walk backwards from today (or yesterday if today not played)
    const todayKey = getTodayKey();
    let currentStreak = 0;
    let checkDate = todayKey;

    if (!dateSet.has(todayKey)) {
      // If today not played, start from yesterday
      checkDate = addDays(todayKey, -1);
    }

    while (dateSet.has(checkDate)) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    }

    return { currentStreak, maxStreak: Math.max(maxStreak, currentStreak) };
  } catch {
    return { currentStreak: 0, maxStreak: 0 };
  }
}

export function getDetailedStats() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const entries = Object.values(data).filter((d) => d.completed);
    if (entries.length === 0) return null;

    const totalKmArr = entries.map((e) => e.totalKm);
    const totalKmSum = totalKmArr.reduce((a, b) => a + b, 0);
    const bestKm = Math.min(...totalKmArr);
    const avgKm = Math.round(totalKmSum / entries.length);

    // Fastest time (only count entries with recorded time)
    const times = entries.filter((e) => e.elapsedMs > 0).map((e) => e.elapsedMs);
    const fastestTime = times.length > 0 ? Math.min(...times) : null;

    // Performance histogram brackets
    const brackets = { under1000: 0, '1000_3000': 0, '3000_5000': 0, over5000: 0 };
    for (const km of totalKmArr) {
      if (km < 1000) brackets.under1000++;
      else if (km < 3000) brackets['1000_3000']++;
      else if (km < 5000) brackets['3000_5000']++;
      else brackets.over5000++;
    }

    const streaks = getStreakData();

    return {
      gamesPlayed: entries.length,
      averageKm: avgKm,
      bestKm,
      fastestTime,
      currentStreak: streaks.currentStreak,
      maxStreak: streaks.maxStreak,
      brackets,
    };
  } catch {
    return null;
  }
}
