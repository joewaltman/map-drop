const STORAGE_KEY = 'mapdrop';

export function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
      completed: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // silently fail
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
