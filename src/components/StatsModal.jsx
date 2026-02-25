import { getDetailedStats } from '../utils/storage';
import { formatDistance, formatTime } from '../utils/scoring';

export default function StatsModal({ onClose }) {
  const stats = getDetailedStats();

  if (!stats) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>&times;</button>
          <h2 className="modal-title">Statistics</h2>
          <p className="modal-empty">Play a game to see your stats!</p>
        </div>
      </div>
    );
  }

  const { gamesPlayed, averageKm, bestKm, fastestTime, currentStreak, maxStreak, brackets } = stats;

  // Find max bracket value for scaling bars
  const maxBracket = Math.max(brackets.under1000, brackets['1000_3000'], brackets['3000_5000'], brackets.over5000, 1);

  const bracketData = [
    { label: '<1,000', value: brackets.under1000 },
    { label: '1-3k', value: brackets['1000_3000'] },
    { label: '3-5k', value: brackets['3000_5000'] },
    { label: '5k+', value: brackets.over5000 },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="modal-title">Statistics</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-card-value">{gamesPlayed}</span>
            <span className="stat-card-label">Played</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value">{formatDistance(averageKm)}</span>
            <span className="stat-card-label">Avg km</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value">{formatDistance(bestKm)}</span>
            <span className="stat-card-label">Best km</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-value">{fastestTime ? formatTime(fastestTime) : '—'}</span>
            <span className="stat-card-label">Fastest</span>
          </div>
        </div>

        <div className="stats-streaks">
          <div className="streak-item">
            <span className="streak-value">{currentStreak}</span>
            <span className="streak-label">Current Streak</span>
          </div>
          <div className="streak-item">
            <span className="streak-value">{maxStreak}</span>
            <span className="streak-label">Max Streak</span>
          </div>
        </div>

        <div className="stats-histogram">
          <h3 className="histogram-title">Score Distribution</h3>
          {bracketData.map((b) => (
            <div key={b.label} className="histogram-row">
              <span className="histogram-label">{b.label}</span>
              <div className="histogram-bar-bg">
                <div
                  className="histogram-bar"
                  style={{ width: `${(b.value / maxBracket) * 100}%` }}
                />
              </div>
              <span className="histogram-count">{b.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
