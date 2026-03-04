import { useState } from 'react';
import { getDayNumber } from '../utils/dailySeed';
import { getStats, getStreakData } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import StatsModal from './StatsModal';

export default function Landing({ onPlay }) {
  const [showStats, setShowStats] = useState(false);
  const { user } = useAuth();
  const dayNumber = getDayNumber();
  const stats = getStats();
  const isNewPlayer = !stats;
  const streakData = getStreakData();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="landing fade-in">
      <div className="landing-top-bar">
        <div className="landing-top-spacer" />
        <UserMenu />
      </div>

      <div className="landing-header">
        <h1 className="landing-title">DailyPin</h1>
        <span className="landing-day">#{dayNumber}</span>
        {stats && (
          <button className="btn-icon" onClick={() => setShowStats(true)} title="Statistics">
            📊
          </button>
        )}
      </div>

      <p className="landing-date">{today}</p>

      {isNewPlayer ? (
        <div className="landing-how-to-play">
          <h2 className="how-to-play-title">How to Play</h2>
          <div className="how-to-play-steps">
            <div className="step">
              <span className="step-number">1</span>
              <p>You'll see a city name and a blank map of its continent</p>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <p>Tap where you think the city is located</p>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <p>Score is your total distance off — lower is better, like golf</p>
            </div>
          </div>
          <p className="how-to-play-sub">5 rounds across 5 continents. New cities every day.</p>
        </div>
      ) : (
        <div className="landing-about">
          <p>
            5 rounds. 5 continents. Guess the city on a blank map.
          </p>
        </div>
      )}

      {stats && (
        <div className="landing-stats">
          <div className="stat">
            <span className="stat-value">{stats.gamesPlayed}</span>
            <span className="stat-label">Games Played</span>
          </div>
          <div className="stat">
            <span className="stat-value">{formatDistance(stats.averageKm)}</span>
            <span className="stat-label">Avg. km</span>
          </div>
          {streakData.currentStreak >= 2 && (
            <div className="stat">
              <span className="stat-value">🔥 {streakData.currentStreak}</span>
              <span className="stat-label">Streak</span>
            </div>
          )}
        </div>
      )}

      <button className="btn btn-primary btn-play" onClick={onPlay}>
        Play
      </button>

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </div>
  );
}

function formatDistance(km) {
  return km.toLocaleString('en-US');
}
