const API_BASE = '/api/auth';

export async function loginWithEmail(email) {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Login failed');
  }
  return res.json();
}

export async function fetchCurrentUser() {
  const res = await fetch(`${API_BASE}/me`, {
    credentials: 'include',
  });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function logout() {
  await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function updateDisplayName(displayName) {
  const res = await fetch(`${API_BASE}/display-name`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ displayName }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Update failed');
  }
  return res.json();
}

export async function startServerGame() {
  const res = await fetch('/api/game/start', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to start game');
  }
  return res.json();
}

export async function submitGuess(gameId, roundIndex, guessLat, guessLng) {
  const res = await fetch(`/api/game/${gameId}/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ roundIndex, guessLat, guessLng }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to submit guess');
  }
  return res.json();
}

export async function submitClientResult(result) {
  const res = await fetch('/api/game/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(result),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to submit result');
  }
  return res.json();
}

export async function fetchLeaderboard(dayNumber) {
  const res = await fetch(`/api/leaderboard/${dayNumber}`);
  if (!res.ok) return { leaderboard: [], totalPlayers: 0 };
  return res.json();
}

export async function fetchAlltimeLeaderboard() {
  const res = await fetch('/api/leaderboard/alltime/top');
  if (!res.ok) return { leaderboard: [] };
  return res.json();
}

export async function fetchMyRank(dayNumber) {
  const res = await fetch(`/api/leaderboard/${dayNumber}/me`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function subscribeReminders(timezone) {
  const res = await fetch('/api/reminders/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ timezone }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to subscribe');
  }
  return res.json();
}

export async function unsubscribeReminders() {
  const res = await fetch('/api/reminders/unsubscribe', {
    method: 'POST',
    credentials: 'include',
  });
  return res.json();
}
