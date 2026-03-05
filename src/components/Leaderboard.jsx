import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchLeaderboard, fetchAlltimeLeaderboard, fetchMyRank, submitClientResult } from '../utils/auth';
import { formatDistance, formatTime } from '../utils/scoring';
import AuthModal from './AuthModal';

export default function Leaderboard({ dayNumber, result }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('daily');
  const [data, setData] = useState(null);
  const [alltimeData, setAlltimeData] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Auto-submit client-side result when user is authenticated
  useEffect(() => {
    if (!user || !result || submitted) return;

    submitClientResult({
      guesses: result.guesses,
      totalKm: result.totalKm,
      elapsedMs: result.elapsedMs || 0,
    })
      .then(() => setSubmitted(true))
      .catch(() => {});
  }, [user, result, submitted]);

  // Fetch daily leaderboard data (re-fetch after submission)
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
  }, [dayNumber, user, submitted]);

  // Fetch all-time leaderboard when tab switches or user changes
  useEffect(() => {
    if (tab !== 'alltime') return;
    setLoading(true);
    fetchAlltimeLeaderboard()
      .then((res) => setAlltimeData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, user, submitted]);

  const handleNameSaved = () => {
    setShowNameModal(false);
  };

  if (loading) {
    return (
      <div className="leaderboard">
        <h3 className="leaderboard-title">Leaderboard</h3>
        <div className="leaderboard-tabs">
          <button className={`leaderboard-tab ${tab === 'daily' ? 'leaderboard-tab-active' : ''}`} onClick={() => setTab('daily')}>Today</button>
          <button className={`leaderboard-tab ${tab === 'alltime' ? 'leaderboard-tab-active' : ''}`} onClick={() => setTab('alltime')}>All-Time</button>
        </div>
        <p className="leaderboard-loading">Loading...</p>
      </div>
    );
  }

  const currentData = tab === 'daily' ? data : alltimeData;
  const isEmpty = !currentData || currentData.leaderboard.length === 0;

  if (isEmpty) {
    return (
      <div className="leaderboard">
        <h3 className="leaderboard-title">Leaderboard</h3>
        <div className="leaderboard-tabs">
          <button className={`leaderboard-tab ${tab === 'daily' ? 'leaderboard-tab-active' : ''}`} onClick={() => setTab('daily')}>Today</button>
          <button className={`leaderboard-tab ${tab === 'alltime' ? 'leaderboard-tab-active' : ''}`} onClick={() => setTab('alltime')}>All-Time</button>
        </div>
        <p className="leaderboard-empty">
          {tab === 'alltime' ? 'No players with 3+ games yet.' : 'No scores yet. Be the first!'}
        </p>
        {!user && (
          <div className="leaderboard-sign-in">
            <p className="leaderboard-cta">Sign in to compete on the leaderboard.</p>
            <button className="btn btn-primary btn-leaderboard-sign-in" onClick={() => setShowAuthModal(true)}>
              Sign In
            </button>
          </div>
        )}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">
          Leaderboard
          {user && (
            <button className="btn-edit-name" onClick={() => setShowNameModal(true)} title="Edit display name">&#9998;</button>
          )}
        </h3>
      </div>

      <div className="leaderboard-tabs">
        <button className={`leaderboard-tab ${tab === 'daily' ? 'leaderboard-tab-active' : ''}`} onClick={() => setTab('daily')}>Today</button>
        <button className={`leaderboard-tab ${tab === 'alltime' ? 'leaderboard-tab-active' : ''}`} onClick={() => setTab('alltime')}>All-Time</button>
      </div>

      {tab === 'daily' && (
        <>
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
        </>
      )}

      {tab === 'alltime' && alltimeData && (
        <div className="leaderboard-list">
          {alltimeData.leaderboard.map((entry) => {
            const isMe = user && entry.displayName === user.displayName;
            return (
              <div key={entry.rank} className={`leaderboard-row ${isMe ? 'leaderboard-row-me' : ''}`}>
                <span className="leaderboard-rank">#{entry.rank}</span>
                <span className="leaderboard-name">{entry.displayName}</span>
                <span className="leaderboard-score">
                  {formatDistance(entry.avgKm)} km avg
                  <span className="leaderboard-games">{entry.gamesPlayed} games</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!user && (
        <div className="leaderboard-sign-in">
          <p className="leaderboard-cta">Sign in to compete on the leaderboard.</p>
          <button className="btn btn-primary btn-leaderboard-sign-in" onClick={() => setShowAuthModal(true)}>
            Sign In
          </button>
        </div>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showNameModal && <AuthModal isDisplayNamePrompt onClose={handleNameSaved} />}
    </div>
  );
}
