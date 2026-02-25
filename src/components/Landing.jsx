import { getDayNumber } from '../utils/dailySeed';
import { getStats } from '../utils/storage';

export default function Landing({ onPlay }) {
  const dayNumber = getDayNumber();
  const stats = getStats();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="landing fade-in">
      <div className="landing-header">
        <h1 className="landing-title">MapDrop</h1>
        <span className="landing-day">#{dayNumber}</span>
      </div>

      <p className="landing-date">{today}</p>

      <div className="landing-about">
        <p>
          5 rounds. 5 continents. Guess the city on a blank map.
        </p>
        <p>
          Your score is the total distance in km — lower is better, like golf.
        </p>
      </div>

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
        </div>
      )}

      <button className="btn btn-primary btn-play" onClick={onPlay}>
        Play
      </button>
    </div>
  );
}

function formatDistance(km) {
  return km.toLocaleString('en-US');
}
