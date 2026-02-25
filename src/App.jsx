import { useState, useEffect } from 'react';
import Landing from './components/Landing';
import Game from './components/Game';
import ResultsScreen from './components/ResultsScreen';
import { getDailyPuzzle } from './utils/dailySeed';
import { getSavedResult } from './utils/storage';
import cities from './data/cities.json';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [puzzle, setPuzzle] = useState(null);
  const [result, setResult] = useState(null);

  // TODO: re-enable once-per-day check for production
  // useEffect(() => {
  //   const saved = getSavedResult();
  //   if (saved && saved.completed) {
  //     setResult(saved);
  //     setScreen('results');
  //   }
  // }, []);

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
        <ResultsScreen result={result} onPlayAgain={handlePlay} />
      )}
    </div>
  );
}
