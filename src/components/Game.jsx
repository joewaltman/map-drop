import { useState, useRef } from 'react';
import MapRound from './MapRound';
import { saveResult } from '../utils/storage';
import { isMuted, toggleMute } from '../utils/sound';

export default function Game({ puzzle, onGameComplete }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState([]);
  const [muted, setMuted] = useState(isMuted());
  const startTime = useRef(Date.now());

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

  return (
    <div className="game">
      <MapRound
        key={currentRound}
        round={puzzle[currentRound]}
        roundNumber={currentRound + 1}
        totalRounds={5}
        onRoundComplete={handleRoundComplete}
        muteButton={
          <button className="btn-mute" onClick={handleToggleMute} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? '🔇' : '🔊'}
          </button>
        }
      />
    </div>
  );
}
