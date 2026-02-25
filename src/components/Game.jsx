import { useState } from 'react';
import MapRound from './MapRound';
import { saveResult } from '../utils/storage';

export default function Game({ puzzle, onGameComplete }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState([]);

  const handleRoundComplete = (result) => {
    const newResults = [...results, result];
    setResults(newResults);

    if (newResults.length === 5) {
      const totalKm = newResults.reduce((sum, r) => sum + r.distanceKm, 0);
      const gameResult = { guesses: newResults, totalKm };
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
      />
    </div>
  );
}
