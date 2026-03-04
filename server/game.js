import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from './db/index.js';
import { getDailyPuzzle, getDayNumber } from './utils/dailySeed.js';
import { haversineDistance, getQuality } from './utils/scoring.js';
import { requireAuth } from './middleware/auth.js';

const router = Router();

// POST /api/game/start — create game session, return puzzle without coordinates
router.post('/start', requireAuth, (req, res) => {
  const dayNumber = getDayNumber();
  const userId = req.user.id;

  // Check if user already has a completed game for today
  const existingScore = db.prepare(
    'SELECT id FROM scores WHERE user_id = ? AND day_number = ?'
  ).get(userId, dayNumber);

  if (existingScore) {
    return res.status(409).json({ error: 'Already completed today\'s puzzle' });
  }

  // Check for existing session
  const existingSession = db.prepare(
    'SELECT * FROM game_sessions WHERE user_id = ? AND day_number = ?'
  ).get(userId, dayNumber);

  if (existingSession && !existingSession.completed) {
    // Resume existing session
    const puzzle = getDailyPuzzle(dayNumber);
    const guesses = JSON.parse(existingSession.guesses);
    return res.json({
      gameId: existingSession.id,
      currentRound: existingSession.current_round,
      guesses,
      puzzle: puzzle.map((c) => ({ name: c.name, continent: c.continent })),
    });
  }

  // Create new session
  const gameId = nanoid(16);
  const puzzle = getDailyPuzzle(dayNumber);

  db.prepare(
    'INSERT INTO game_sessions (id, user_id, day_number) VALUES (?, ?, ?)'
  ).run(gameId, userId, dayNumber);

  res.json({
    gameId,
    currentRound: 0,
    guesses: [],
    puzzle: puzzle.map((c) => ({ name: c.name, continent: c.continent })),
  });
});

// POST /api/game/:gameId/guess — submit a guess for the current round
router.post('/:gameId/guess', requireAuth, (req, res) => {
  const { gameId } = req.params;
  const { roundIndex, guessLat, guessLng } = req.body;

  if (typeof guessLat !== 'number' || typeof guessLng !== 'number' ||
      guessLat < -90 || guessLat > 90 || guessLng < -180 || guessLng > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(gameId);
  if (!session) {
    return res.status(404).json({ error: 'Game session not found' });
  }
  if (session.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your game session' });
  }
  if (session.completed) {
    return res.status(400).json({ error: 'Game already completed' });
  }
  if (roundIndex !== session.current_round) {
    return res.status(400).json({ error: `Expected round ${session.current_round}, got ${roundIndex}` });
  }

  // Get today's puzzle and find the target for this round
  const puzzle = getDailyPuzzle(session.day_number);
  const target = puzzle[roundIndex];

  // Server computes distance
  const distanceKm = haversineDistance(guessLat, guessLng, target.latitude, target.longitude);
  const color = getQuality(distanceKm, target.continent);

  // Update session
  const guesses = JSON.parse(session.guesses);
  guesses.push({
    continent: target.continent,
    city: target.name,
    guessLat,
    guessLng,
    targetLat: target.latitude,
    targetLng: target.longitude,
    distanceKm,
  });

  const nextRound = session.current_round + 1;
  const isComplete = nextRound >= 5;

  if (isComplete) {
    const totalKm = guesses.reduce((sum, g) => sum + g.distanceKm, 0);
    const elapsedMs = (Math.floor(Date.now() / 1000) - session.started_at) * 1000;

    // Finalize game session
    db.prepare(
      'UPDATE game_sessions SET current_round = ?, guesses = ?, completed = 1 WHERE id = ?'
    ).run(nextRound, JSON.stringify(guesses), gameId);

    // Insert score
    db.prepare(
      'INSERT OR IGNORE INTO scores (user_id, day_number, total_km, elapsed_ms, guesses) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, session.day_number, totalKm, elapsedMs, JSON.stringify(guesses));

    return res.json({
      targetLat: target.latitude,
      targetLng: target.longitude,
      distanceKm,
      color,
      complete: true,
      totalKm,
      elapsedMs,
      guesses,
    });
  }

  // Update session for next round
  db.prepare(
    'UPDATE game_sessions SET current_round = ?, guesses = ? WHERE id = ?'
  ).run(nextRound, JSON.stringify(guesses), gameId);

  res.json({
    targetLat: target.latitude,
    targetLng: target.longitude,
    distanceKm,
    color,
    complete: false,
  });
});

// POST /api/game/submit — submit a client-side result (for users who sign in after playing)
router.post('/submit', requireAuth, (req, res) => {
  const { guesses, totalKm, elapsedMs } = req.body;
  const dayNumber = getDayNumber();
  const userId = req.user.id;

  if (!Array.isArray(guesses) || guesses.length !== 5) {
    return res.status(400).json({ error: 'Invalid guesses' });
  }
  if (typeof totalKm !== 'number' || totalKm < 0 || totalKm > 100000) {
    return res.status(400).json({ error: 'Invalid totalKm' });
  }
  if (typeof elapsedMs !== 'number' || elapsedMs < 0 || elapsedMs > 3600000) {
    return res.status(400).json({ error: 'Invalid elapsedMs' });
  }

  // Check if already submitted for today
  const existing = db.prepare(
    'SELECT id FROM scores WHERE user_id = ? AND day_number = ?'
  ).get(userId, dayNumber);

  if (existing) {
    return res.json({ ok: true, alreadySubmitted: true });
  }

  // Verify guesses against today's puzzle for basic sanity
  const puzzle = getDailyPuzzle(dayNumber);
  for (let i = 0; i < 5; i++) {
    const g = guesses[i];
    const target = puzzle[i];
    if (g.city !== target.name || g.continent !== target.continent) {
      return res.status(400).json({ error: 'Guess data does not match today\'s puzzle' });
    }
    // Re-compute distance server-side from the guess coordinates
    const serverDist = haversineDistance(g.guessLat, g.guessLng, target.latitude, target.longitude);
    // Allow small rounding differences
    if (Math.abs(serverDist - g.distanceKm) > 2) {
      guesses[i] = { ...g, distanceKm: serverDist, targetLat: target.latitude, targetLng: target.longitude };
    }
  }

  const serverTotalKm = guesses.reduce((sum, g) => sum + g.distanceKm, 0);

  db.prepare(
    'INSERT OR IGNORE INTO scores (user_id, day_number, total_km, elapsed_ms, guesses) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, dayNumber, serverTotalKm, elapsedMs, JSON.stringify(guesses));

  res.json({ ok: true, totalKm: serverTotalKm });
});

// GET /api/game/:gameId/results — get full results after completion
router.get('/:gameId/results', requireAuth, (req, res) => {
  const { gameId } = req.params;
  const session = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(gameId);

  if (!session) {
    return res.status(404).json({ error: 'Game session not found' });
  }
  if (session.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your game session' });
  }
  if (!session.completed) {
    return res.status(400).json({ error: 'Game not yet completed' });
  }

  const guesses = JSON.parse(session.guesses);
  const totalKm = guesses.reduce((sum, g) => sum + g.distanceKm, 0);
  const elapsedMs = (Math.floor(Date.now() / 1000) - session.started_at) * 1000;

  res.json({ guesses, totalKm, elapsedMs });
});

export default router;
