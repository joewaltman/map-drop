import { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from '@vnedyalk0v/react19-simple-maps';
import topology from 'world-atlas/countries-110m.json';
import { countryToContinent, continentConfig } from '../data/continentMapping';
import { distanceToColor, distanceToEmoji, distanceToLabel, formatDistance, formatTime } from '../utils/scoring';
import { getDayNumber } from '../utils/dailySeed';
import { getStreakData } from '../utils/storage';
import { playComplete } from '../utils/sound';
import { useAuth } from '../contexts/AuthContext';
import Leaderboard from './Leaderboard';
import ReminderOptIn from './ReminderOptIn';
import StatsModal from './StatsModal';

const CONTINENT_KEYS = ['northAmerica', 'southAmerica', 'europe', 'africa', 'asia'];
const ROW_DELAY = 200; // ms between each row reveal
const COUNT_DURATION = 1000; // ms for count-up animation

export default function ResultsScreen({ result, onPlayAgain, challengeScore }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [displayedTotal, setDisplayedTotal] = useState(0);
  const [totalRevealed, setTotalRevealed] = useState(false);
  const [challengeCopied, setChallengeCopied] = useState(false);
  const [countdown, setCountdown] = useState('');
  const dayNumber = getDayNumber();
  const streakData = getStreakData();

  // Countdown timer to next puzzle
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Build a lookup: continent key → guess result
  const guessByContinent = {};
  for (const g of result.guesses) {
    guessByContinent[g.continent] = g;
  }

  // Play completion sound and animate total count-up
  useEffect(() => {
    playComplete();

    // Start count-up after all rows have revealed
    const rowsDelay = result.guesses.length * ROW_DELAY + 300;

    const timer = setTimeout(() => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / COUNT_DURATION, 1);
        // Ease-out curve
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(eased * result.totalKm);
        setDisplayedTotal(value);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setTotalRevealed(true);
        }
      };
      requestAnimationFrame(animate);
    }, rowsDelay);

    return () => clearTimeout(timer);
  }, [result.totalKm, result.guesses.length]);

  const SITE_URL = 'https://dailypin.net';

  const getShareText = () => {
    const lines = result.guesses.map((g) => {
      const emoji = distanceToEmoji(g.distanceKm, g.continent);
      const name = (continentConfig[g.continent]?.name || g.continent).padEnd(12);
      return `${emoji} ${name} ${formatDistance(g.distanceKm)} km`;
    });

    const timeStr = result.elapsedMs ? ` ⏱ ${formatTime(result.elapsedMs)}` : '';
    const streakLine = streakData.currentStreak >= 2 ? `\n🔥 ${streakData.currentStreak}-day streak` : '';

    return `🌍 DailyPin #${dayNumber} — ${formatDistance(result.totalKm)} km${timeStr}\n\n${lines.join('\n')}${streakLine}\n${SITE_URL}`;
  };

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleShare = async () => {
    const text = getShareText();
    try {
      if (navigator.share) {
        await navigator.share({ text, url: SITE_URL });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // silent fail
      }
    }
  };

  const [fbCopied, setFbCopied] = useState(false);

  const handleFacebookShare = async () => {
    const text = getShareText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // non-fatal
    }
    setFbCopied(true);
    setTimeout(() => setFbCopied(false), 4000);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleTwitterShare = () => {
    const text = getShareText();
    if (isMobile) {
      // Use twitter:// URL scheme to open X app directly
      window.location.href = `twitter://post?message=${encodeURIComponent(text)}`;
    } else {
      window.open(
        `https://x.com/intent/post?text=${encodeURIComponent(text)}`,
        '_blank',
        'width=600,height=400'
      );
    }
  };

  const handleChallenge = async () => {
    const params = `${dayNumber}_${result.totalKm}_${result.elapsedMs || 0}`;
    const url = `${window.location.origin}${window.location.pathname}?challenge=${params}`;
    try {
      await navigator.clipboard.writeText(url);
      setChallengeCopied(true);
      setTimeout(() => setChallengeCopied(false), 2000);
    } catch {
      // silent fail
    }
  };

  const isGreatScore = result.totalKm < 1000;

  return (
    <div className="results-screen fade-in">
      <div className="results-header-bar">
        <h1 className="results-title">DailyPin #{dayNumber}</h1>
      </div>

      <div className="total-distance">
        <span className="total-label">Total Distance</span>
        <span className={`total-value ${totalRevealed ? 'total-revealed' : ''} ${isGreatScore && totalRevealed ? 'confetti-burst' : ''}`}>
          {formatDistance(displayedTotal)} km
        </span>
        {result.elapsedMs > 0 && (
          <span className="total-time">⏱ {formatTime(result.elapsedMs)}</span>
        )}
      </div>

      {streakData.currentStreak >= 2 && (
        <div className="streak-badge">🔥 {streakData.currentStreak}-day streak</div>
      )}

      <div className="mini-world">
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 140 }}
          width={800}
          height={400}
          style={{ width: '100%', height: 'auto' }}
        >
          <Sphere fill="#1a2332" stroke="#2a3a4c" strokeWidth={0.5} />
          <Graticule stroke="rgba(255,255,255,0.08)" strokeWidth={0.3} />
          <Geographies geography={topology}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const continent = countryToContinent[geo.id];
                const guess = continent ? guessByContinent[continent] : null;
                const color = guess
                  ? distanceToColor(guess.distanceKm, continent)
                  : '#3d3d3d';
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: color,
                        stroke: '#1a2332',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      hover: {
                        fill: color,
                        stroke: '#1a2332',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      pressed: {
                        fill: color,
                        stroke: '#1a2332',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      <div className="results-breakdown">
        {result.guesses.map((g, i) => {
          const config = continentConfig[g.continent];
          return (
            <div
              key={i}
              className="result-row result-row-reveal"
              style={{ animationDelay: `${i * ROW_DELAY}ms` }}
            >
              <div className="result-info">
                <span className="result-city">{g.city}</span>
                <span className="result-continent">{config?.name || g.continent}</span>
              </div>
              <div className="result-distance-group">
                <span
                  className="result-distance"
                  style={{ color: distanceToColor(g.distanceKm, g.continent) }}
                >
                  {formatDistance(g.distanceKm)} km
                </span>
                <span className="result-quality">{distanceToLabel(g.distanceKm, g.continent)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Challenge comparison */}
      {challengeScore && (
        <div className="challenge-comparison">
          <h3 className="challenge-title">Challenge Result</h3>
          <div className="challenge-row">
            <div className="challenge-player">
              <span className="challenge-label">Challenger</span>
              <span className="challenge-km">{formatDistance(challengeScore.totalKm)} km</span>
              {challengeScore.elapsedMs > 0 && (
                <span className="challenge-time">⏱ {formatTime(challengeScore.elapsedMs)}</span>
              )}
            </div>
            <div className="challenge-vs">VS</div>
            <div className="challenge-player">
              <span className="challenge-label">You</span>
              <span className="challenge-km">{formatDistance(result.totalKm)} km</span>
              {result.elapsedMs > 0 && (
                <span className="challenge-time">⏱ {formatTime(result.elapsedMs)}</span>
              )}
            </div>
          </div>
          <div className="challenge-result">
            {result.totalKm < challengeScore.totalKm
              ? '🏆 You win!'
              : result.totalKm > challengeScore.totalKm
                ? '😤 Challenger wins!'
                : '🤝 It\'s a tie!'}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <Leaderboard dayNumber={dayNumber} result={result} />

      {/* Reminder opt-in for authenticated users */}
      <ReminderOptIn />

      <div className="results-actions">
        {isMobile ? (
          <>
            <button className="btn btn-primary" onClick={handleShare}>
              {copied ? 'Shared!' : 'Share'}
            </button>
            <button className="btn btn-twitter" onClick={handleTwitterShare}>
              Share on X
            </button>
            <button className="btn btn-secondary" onClick={handleChallenge}>
              {challengeCopied ? 'Link Copied!' : 'Challenge a Friend'}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-twitter" onClick={handleTwitterShare}>
              Share on X
            </button>
            <button className="btn btn-facebook" onClick={handleFacebookShare}>
              {fbCopied ? 'Copied! Paste into your post' : 'Share on Facebook'}
            </button>
            <button className="btn btn-secondary" onClick={handleChallenge}>
              {challengeCopied ? 'Link Copied!' : 'Challenge a Friend'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowStats(true)}>
              View Statistics
            </button>
          </>
        )}
      </div>

      <div className="countdown-timer">
        <span className="countdown-label">Next puzzle in</span>
        <span className="countdown-value">{countdown}</span>
      </div>

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </div>
  );
}
