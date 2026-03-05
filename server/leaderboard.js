import { Router } from 'express';
import db from './db/index.js';
import { requireAuth } from './middleware/auth.js';

const router = Router();

// GET /api/leaderboard/alltime/top — top 50 by average km (min 3 games)
// Must be defined before /:dayNumber to avoid the wildcard matching "alltime"
router.get('/alltime/top', (req, res) => {
  const rows = db.prepare(`
    SELECT u.display_name, AVG(s.total_km) as avg_km, COUNT(*) as games_played
    FROM scores s
    JOIN users u ON u.id = s.user_id
    GROUP BY s.user_id
    HAVING games_played >= 3
    ORDER BY avg_km ASC
    LIMIT 50
  `).all();

  const leaderboard = rows.map((row, i) => ({
    rank: i + 1,
    displayName: row.display_name,
    avgKm: Math.round(row.avg_km),
    gamesPlayed: row.games_played,
  }));

  res.json({ leaderboard });
});

// GET /api/leaderboard/:dayNumber — top 50 scores for a day
router.get('/:dayNumber', (req, res) => {
  const dayNumber = parseInt(req.params.dayNumber, 10);
  if (isNaN(dayNumber) || dayNumber < 1) {
    return res.status(400).json({ error: 'Invalid day number' });
  }

  const rows = db.prepare(`
    SELECT u.display_name, s.total_km, s.elapsed_ms
    FROM scores s
    JOIN users u ON u.id = s.user_id
    WHERE s.day_number = ?
    ORDER BY s.total_km ASC, s.elapsed_ms ASC
    LIMIT 50
  `).all(dayNumber);

  const leaderboard = rows.map((row, i) => ({
    rank: i + 1,
    displayName: row.display_name,
    totalKm: row.total_km,
    elapsedMs: row.elapsed_ms,
  }));

  const totalPlayers = db.prepare(
    'SELECT COUNT(*) as cnt FROM scores WHERE day_number = ?'
  ).get(dayNumber).cnt;

  res.json({ leaderboard, totalPlayers });
});

// GET /api/leaderboard/:dayNumber/me — current user's rank
router.get('/:dayNumber/me', requireAuth, (req, res) => {
  const dayNumber = parseInt(req.params.dayNumber, 10);
  if (isNaN(dayNumber) || dayNumber < 1) {
    return res.status(400).json({ error: 'Invalid day number' });
  }

  const score = db.prepare(
    'SELECT total_km, elapsed_ms FROM scores WHERE user_id = ? AND day_number = ?'
  ).get(req.user.id, dayNumber);

  if (!score) {
    return res.json({ rank: null, totalPlayers: 0 });
  }

  // Count players who scored better (lower km, or same km but faster time)
  const betterCount = db.prepare(`
    SELECT COUNT(*) as cnt FROM scores
    WHERE day_number = ?
      AND (total_km < ? OR (total_km = ? AND elapsed_ms < ?))
  `).get(dayNumber, score.total_km, score.total_km, score.elapsed_ms).cnt;

  const totalPlayers = db.prepare(
    'SELECT COUNT(*) as cnt FROM scores WHERE day_number = ?'
  ).get(dayNumber).cnt;

  res.json({
    rank: betterCount + 1,
    totalPlayers,
    totalKm: score.total_km,
    elapsedMs: score.elapsed_ms,
  });
});

export default router;
