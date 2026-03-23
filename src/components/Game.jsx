import { useState, useRef, useEffect, useCallback } from 'react';
import MapRound from './MapRound';
import { saveResult } from '../utils/storage';
import { isMuted, toggleMute } from '../utils/sound';
import { useAuth } from '../contexts/AuthContext';
import { startServerGame, fetchTodayResult } from '../utils/auth';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export default function Game({ puzzle, onGameComplete, serverGameId, setServerGameId }) {
  const { user } = useAuth();
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState([]);
  const [muted, setMuted] = useState(isMuted());
  const [serverPuzzle, setServerPuzzle] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const startTime = useRef(null);
  const retriesAttempted = useRef(0);

  // Initialize start time on mount
  useEffect(() => {
    startTime.current = Date.now();
  }, []);

  // Start server game with automatic retry logic
  const attemptServerStart = useCallback(async () => {
    setIsRetrying(true);
    setServerError(null);

    while (retriesAttempted.current < MAX_RETRIES) {
      try {
        const data = await startServerGame();
        setServerGameId(data.gameId);
        setServerPuzzle(data.puzzle);
        setServerReady(true);
        setIsRetrying(false);
        // Resume from where they left off if reconnecting
        if (data.currentRound > 0 && data.guesses.length > 0) {
          setCurrentRound(data.currentRound);
          setResults(data.guesses);
        }
        return;
      } catch (err) {
        if (err.message === "Already completed today's puzzle") {
          // Fetch existing result from server and show results screen
          try {
            const data = await fetchTodayResult();
            if (data && data.completed) {
              saveResult({ guesses: data.guesses, totalKm: data.totalKm, elapsedMs: data.elapsedMs });
              onGameComplete({ guesses: data.guesses, totalKm: data.totalKm, elapsedMs: data.elapsedMs });
            }
          } catch {
            // If we can't fetch the result, show generic error
            setServerError('Unable to load your completed game. Please refresh the page.');
          }
          setIsRetrying(false);
          return;
        }

        retriesAttempted.current++;
        if (retriesAttempted.current < MAX_RETRIES) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }

    // All retries exhausted
    setIsRetrying(false);
    setServerError('Unable to connect to the game server. Please check your connection and try again.');
  }, [setServerGameId, onGameComplete]);

  // For authenticated users, start a server game session
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid async data fetch pattern
    attemptServerStart();
  }, [user, attemptServerStart]);

  const handleRetry = () => {
    retriesAttempted.current = 0;
    attemptServerStart();
  };

  const handleToggleMute = () => {
    const nowMuted = toggleMute();
    setMuted(nowMuted);
  };

  const handleRoundComplete = (result) => {
    const newResults = [...results, result];
    setResults(newResults);

    if (newResults.length === 5) {
      const totalKm = newResults.reduce((sum, r) => sum + r.distanceKm, 0);
      const elapsedMs = startTime.current ? Date.now() - startTime.current : 0;
      const gameResult = { guesses: newResults, totalKm, elapsedMs };
      saveResult(gameResult);
      onGameComplete(gameResult);
    } else {
      setCurrentRound(currentRound + 1);
    }
  };

  // For authenticated users, must wait for server connection
  // For anonymous users, use client-side puzzle directly
  const useServer = !!(user && serverGameId && serverPuzzle && serverReady);

  // Authenticated user: show loading while connecting to server
  if (user && !serverReady && !serverError) {
    return (
      <div className="game">
        <div className="game-loading">
          <p>{isRetrying ? 'Connecting to game server...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // Authenticated user: show error if server connection failed
  if (user && serverError) {
    return (
      <div className="game">
        <div className="game-error">
          <h2>Connection Error</h2>
          <p>{serverError}</p>
          <button className="btn btn-primary" onClick={handleRetry} disabled={isRetrying}>
            {isRetrying ? 'Retrying...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Ready to play (server mode for authenticated users, client mode for anonymous)
  const activePuzzle = useServer ? serverPuzzle : puzzle;

  return (
    <div className="game">
      <MapRound
        key={currentRound}
        round={activePuzzle[currentRound]}
        roundNumber={currentRound + 1}
        totalRounds={5}
        onRoundComplete={handleRoundComplete}
        muteButton={
          <button className="btn-mute" onClick={handleToggleMute} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? '🔇' : '🔊'}
          </button>
        }
        serverGameId={useServer ? serverGameId : null}
        roundIndex={currentRound}
      />
    </div>
  );
}
