import { useState, useEffect } from 'react';
import Landing from './components/Landing';
import Game from './components/Game';
import ResultsScreen from './components/ResultsScreen';
import { getDailyPuzzle } from './utils/dailySeed';
import { getSavedResult } from './utils/storage';
import cities from './data/cities.json';
import './App.css';

function parseChallengeParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    const challenge = params.get('challenge');
    if (!challenge) return null;
    const [dayNumber, totalKm, elapsedMs] = challenge.split('_').map(Number);
    if (isNaN(totalKm)) return null;
    return { dayNumber, totalKm, elapsedMs: elapsedMs || 0 };
  } catch {
    return null;
  }
}

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [puzzle, setPuzzle] = useState(null);
  const [result, setResult] = useState(null);
  const [savedGame, setSavedGame] = useState(false);
  const [challengeScore, setChallengeScore] = useState(null);

  // One-per-day enforcement + challenge URL parsing
  useEffect(() => {
    const challenge = parseChallengeParams();
    if (challenge) {
      setChallengeScore(challenge);
      // Clear challenge from URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }

    // const saved = getSavedResult();
    // if (saved && saved.completed) {
    //   setResult(saved);
    //   setSavedGame(true);
    //   setScreen('results');
    // }
  }, []);

  const handlePlay = () => {
    const dailyPuzzle = getDailyPuzzle(cities);
    setPuzzle(dailyPuzzle);
    setScreen('game');
  };

  const handleGameComplete = (gameResult) => {
    setResult(gameResult);
    setScreen('results');
  };

  return (
    <div className="app-container">
      {screen === 'landing' && <Landing onPlay={handlePlay} />}
      {screen === 'game' && puzzle && (
        <Game puzzle={puzzle} onGameComplete={handleGameComplete} />
      )}
      {screen === 'results' && result && (
        <ResultsScreen
          result={result}
          onPlayAgain={savedGame ? null : handlePlay}
          challengeScore={challengeScore}
        />
      )}
    </div>
  );
}
