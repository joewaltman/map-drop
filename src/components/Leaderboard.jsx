import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchLeaderboard, fetchMyRank } from '../utils/auth';
import { formatDistance, formatTime } from '../utils/scoring';

export default function Leaderboard({ dayNumber }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('daily');
  const [data, setData] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const promises = [fetchLeaderboard(dayNumber)];
    if (user) {
      promises.push(fetchMyRank(dayNumber));
    }
    Promise.all(promises)
      .then(([lb, rank]) => {
        setData(lb);
        if (rank) setMyRank(rank);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dayNumber, user]);

  if (loading) {
    return (
      <div className="leaderboard">
        <h3 className="leaderboard-title">Leaderboard</h3>
        <p className="leaderboard-loading">Loading...</p>
      </div>
    );
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <div className="leaderboard">
        <h3 className="leaderboard-title">Leaderboard</h3>
        <p className="leaderboard-empty">No scores yet. Be the first!</p>
        {!user && <p className="leaderboard-cta">Sign in to compete on the leaderboard.</p>}
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h3 className="leaderboard-title">Leaderboard</h3>

      <div className="leaderboard-list">
        {data.leaderboard.map((entry) => {
          const isMe = user && entry.displayName === user.displayName;
          return (
            <div key={entry.rank} className={`leaderboard-row ${isMe ? 'leaderboard-row-me' : ''}`}>
              <span className="leaderboard-rank">#{entry.rank}</span>
              <span className="leaderboard-name">{entry.displayName}</span>
              <span className="leaderboard-score">
                {formatDistance(Math.round(entry.totalKm))} km
                <span className="leaderboard-time">{formatTime(entry.elapsedMs)}</span>
              </span>
            </div>
          );
        })}
      </div>

      {user && myRank && myRank.rank && myRank.rank > 50 && (
        <div className="leaderboard-my-rank">
          You placed <strong>#{myRank.rank}</strong> of {formatDistance(myRank.totalPlayers)} players
        </div>
      )}

      {!user && (
        <p className="leaderboard-cta">Sign in to compete on the leaderboard.</p>
      )}
    </div>
  );
}
