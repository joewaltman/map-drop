import { useState, useRef, useEffect } from 'react';
import MapRound from './MapRound';
import { saveResult } from '../utils/storage';
import { isMuted, toggleMute } from '../utils/sound';
import { useAuth } from '../contexts/AuthContext';
import { startServerGame, submitGuess } from '../utils/auth';

export default function Game({ puzzle, onGameComplete, serverGameId, setServerGameId }) {
  const { user } = useAuth();
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState([]);
  const [muted, setMuted] = useState(isMuted());
  const [serverPuzzle, setServerPuzzle] = useState(null);
  const [serverError, setServerError] = useState(null);
  const startTime = useRef(Date.now());

  // For authenticated users, start a server game session
  useEffect(() => {
    if (!user) return;

    startServerGame()
      .then((data) => {
        setServerGameId(data.gameId);
        setServerPuzzle(data.puzzle);
        // Resume from where they left off if reconnecting
        if (data.currentRound > 0 && data.guesses.length > 0) {
          setCurrentRound(data.currentRound);
          setResults(data.guesses);
        }
      })
      .catch((err) => {
        // If already completed, or any error, fall back to client-side
        console.warn('Server game start failed, using client-side flow:', err.message);
        setServerError(err.message);
      });
  }, [user, setServerGameId]);

  const handleToggleMute = () => {
    const nowMuted = toggleMute();
    setMuted(nowMuted);
  };

  const handleRoundComplete = (result) => {
    const newResults = [...results, result];
    setResults(newResults);

    if (newResults.length === 5) {
      const totalKm = newResults.reduce((sum, r) => sum + r.distanceKm, 0);
      const elapsedMs = Date.now() - startTime.current;
      const gameResult = { guesses: newResults, totalKm, elapsedMs };
      saveResult(gameResult);
      onGameComplete(gameResult);
    } else {
      setCurrentRound(currentRound + 1);
    }
  };

  // Determine which puzzle to show: server puzzle (names only) or client puzzle (full coords)
  const activePuzzle = (user && serverPuzzle && !serverError) ? serverPuzzle : puzzle;
  const useServer = !!(user && serverGameId && serverPuzzle && !serverError);

  return (
    <div className="game">
      <MapRound
        key={currentRound}
        round={useServer ? activePuzzle[currentRound] : puzzle[currentRound]}
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
