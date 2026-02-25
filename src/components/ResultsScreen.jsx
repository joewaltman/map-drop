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
import { distanceToColor, distanceToEmoji, formatDistance, formatTime } from '../utils/scoring';
import { getDayNumber } from '../utils/dailySeed';
import { getStreakData } from '../utils/storage';
import { playComplete } from '../utils/sound';
import StatsModal from './StatsModal';

const CONTINENT_KEYS = ['northAmerica', 'southAmerica', 'europe', 'africa', 'asia'];
const ROW_DELAY = 200; // ms between each row reveal
const COUNT_DURATION = 1000; // ms for count-up animation

export default function ResultsScreen({ result, onPlayAgain, challengeScore }) {
  const [copied, setCopied] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [displayedTotal, setDisplayedTotal] = useState(0);
  const [totalRevealed, setTotalRevealed] = useState(false);
  const [challengeCopied, setChallengeCopied] = useState(false);
  const dayNumber = getDayNumber();
  const streakData = getStreakData();

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

  const handleShare = async () => {
    // Build richer share text with per-continent breakdown
    const lines = result.guesses.map((g) => {
      const emoji = distanceToEmoji(g.distanceKm, g.continent);
      const name = (continentConfig[g.continent]?.name || g.continent).padEnd(12);
      return `${emoji} ${name} ${formatDistance(g.distanceKm)} km`;
    });

    const timeStr = result.elapsedMs ? ` ⏱ ${formatTime(result.elapsedMs)}` : '';
    const streakLine = streakData.currentStreak >= 2 ? `\n🔥 ${streakData.currentStreak}-day streak` : '';

    const text = `🌍 MapDrop #${dayNumber} — ${formatDistance(result.totalKm)} km${timeStr}\n\n${lines.join('\n')}${streakLine}\nmapdrop.io`;

    try {
      if (navigator.share) {
        await navigator.share({ text });
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

  const handleFacebookShare = () => {
    const lines = result.guesses.map((g) => {
      const emoji = distanceToEmoji(g.distanceKm, g.continent);
      const name = (continentConfig[g.continent]?.name || g.continent).padEnd(12);
      return `${emoji} ${name} ${formatDistance(g.distanceKm)} km`;
    });

    const timeStr = result.elapsedMs ? ` ⏱ ${formatTime(result.elapsedMs)}` : '';
    const streakLine = streakData.currentStreak >= 2 ? `\n🔥 ${streakData.currentStreak}-day streak` : '';

    const quote = `🌍 MapDrop #${dayNumber} — ${formatDistance(result.totalKm)} km${timeStr}\n\n${lines.join('\n')}${streakLine}\nmapdrop.io`;
    const shareUrl = 'https://mapdrop.io';

    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(quote)}`,
      '_blank',
      'width=600,height=400'
    );
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
        <h1 className="results-title">MapDrop #{dayNumber}</h1>
        <button className="btn-icon" onClick={() => setShowStats(true)} title="Statistics">
          📊
        </button>
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
          <Sphere fill="#1a3a5c" stroke="#2a5a8c" strokeWidth={0.5} />
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
                        stroke: '#1a3a5c',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      hover: {
                        fill: color,
                        stroke: '#1a3a5c',
                        strokeWidth: 0.5,
                        outline: 'none',
                      },
                      pressed: {
                        fill: color,
                        stroke: '#1a3a5c',
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
              <span
                className="result-distance"
                style={{ color: distanceToColor(g.distanceKm, g.continent) }}
              >
                {formatDistance(g.distanceKm)} km
              </span>
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

      <div className="results-actions">
        <button className="btn btn-primary" onClick={handleShare}>
          {copied ? 'Copied!' : 'Share'}
        </button>
        <button className="btn btn-facebook" onClick={handleFacebookShare}>
          Share to Facebook
        </button>
        <button className="btn btn-secondary" onClick={handleChallenge}>
          {challengeCopied ? 'Link Copied!' : 'Challenge a Friend'}
        </button>
        {onPlayAgain && (
          <button className="btn btn-secondary" onClick={onPlayAgain}>
            Play Again
          </button>
        )}
      </div>

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </div>
  );
}
