import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './components/Landing';
import Game from './components/Game';
import ResultsScreen from './components/ResultsScreen';
import AuthModal from './components/AuthModal';
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

function AppContent() {
  const { user, isLoading } = useAuth();
  const [screen, setScreen] = useState('landing');
  const [puzzle, setPuzzle] = useState(null);
  const [result, setResult] = useState(null);
  const [savedGame, setSavedGame] = useState(false);
  const [challengeScore, setChallengeScore] = useState(null);
  const [showDisplayNamePrompt, setShowDisplayNamePrompt] = useState(false);
  const [serverGameId, setServerGameId] = useState(null);

  // One-per-day enforcement + challenge URL parsing + new user detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const challenge = parseChallengeParams();
    if (challenge) {
      setChallengeScore(challenge);
    }

    // Check for new user redirect from magic link
    if (params.get('newUser') === '1') {
      setShowDisplayNamePrompt(true);
    }

    // Clear query params from URL without reload
    if (params.toString()) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    const saved = getSavedResult();
    if (saved && saved.completed) {
      setResult(saved);
      setSavedGame(true);
      setScreen('results');
    }
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

  if (isLoading) {
    return <div className="app-container" />;
  }

  return (
    <div className="app-container">
      {screen === 'landing' && <Landing onPlay={handlePlay} />}
      {screen === 'game' && puzzle && (
        <Game
          puzzle={puzzle}
          onGameComplete={handleGameComplete}
          serverGameId={serverGameId}
          setServerGameId={setServerGameId}
        />
      )}
      {screen === 'results' && result && (
        <ResultsScreen
          result={result}
          onPlayAgain={savedGame ? null : handlePlay}
          challengeScore={challengeScore}
        />
      )}
      {showDisplayNamePrompt && (
        <AuthModal
          onClose={() => setShowDisplayNamePrompt(false)}
          isDisplayNamePrompt
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
