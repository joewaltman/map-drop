import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from '@vnedyalk0v/react19-simple-maps';
import topology from 'world-atlas/countries-110m.json';
import { countryToContinent, continentConfig } from '../data/continentMapping';
import { distanceToColor, distanceToEmoji, formatDistance } from '../utils/scoring';
import { getDayNumber } from '../utils/dailySeed';
import ShareCard from './ShareCard';

const CONTINENT_KEYS = ['northAmerica', 'southAmerica', 'europe', 'africa', 'asia'];

export default function ResultsScreen({ result, onPlayAgain }) {
  const [copied, setCopied] = useState(false);
  const [fbShareStatus, setFbShareStatus] = useState(null); // null | 'generating' | 'uploading'
  const shareCardRef = useRef(null);
  const dayNumber = getDayNumber();

  // Build a lookup: continent key → guess result
  const guessByContinent = {};
  for (const g of result.guesses) {
    guessByContinent[g.continent] = g;
  }

  const handleShare = async () => {
    const emojis = result.guesses.map((g) => distanceToEmoji(g.distanceKm, g.continent)).join('');
    const text = `\u{1F30D} MapDrop #${dayNumber} \u{2014} ${formatDistance(result.totalKm)} km\n${emojis}\nmapdrop.io`;

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

  const handleFacebookShare = async () => {
    if (!shareCardRef.current) return;

    try {
      // Generate image
      setFbShareStatus('generating');
      const dataUrl = await toPng(shareCardRef.current, {
        width: 1200,
        height: 630,
        pixelRatio: 1,
      });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Build spoiler-free breakdown for OG description
      const breakdown = result.guesses
        .map((g) => {
          const name = continentConfig[g.continent]?.name || g.continent;
          return `${name}: ${formatDistance(g.distanceKm)} km`;
        })
        .join(' | ');

      // Upload to server
      setFbShareStatus('uploading');
      const formData = new FormData();
      formData.append('image', blob, 'share.png');
      formData.append('dayNumber', String(dayNumber));
      formData.append('totalKm', String(result.totalKm));
      formData.append('breakdown', breakdown);

      const uploadRes = await fetch('/api/share', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      const { shareUrl } = await uploadRes.json();

      // Open Facebook share dialog
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        '_blank',
        'width=600,height=400'
      );
    } catch (err) {
      console.error('Facebook share failed:', err);
    } finally {
      setFbShareStatus(null);
    }
  };

  const fbButtonLabel =
    fbShareStatus === 'generating'
      ? 'Generating...'
      : fbShareStatus === 'uploading'
        ? 'Uploading...'
        : 'Share to Facebook';

  return (
    <div className="results-screen fade-in">
      <h1 className="results-title">MapDrop #{dayNumber}</h1>

      <div className="total-distance">
        <span className="total-label">Total Distance</span>
        <span className="total-value">{formatDistance(result.totalKm)} km</span>
      </div>

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
            <div key={i} className="result-row">
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

      <div className="results-actions">
        <button className="btn btn-primary" onClick={handleShare}>
          {copied ? 'Copied!' : 'Share'}
        </button>
        <button
          className="btn btn-facebook"
          onClick={handleFacebookShare}
          disabled={fbShareStatus !== null}
        >
          {fbButtonLabel}
        </button>
        {onPlayAgain && (
          <button className="btn btn-secondary" onClick={onPlayAgain}>
            Play Again
          </button>
        )}
      </div>

      {/* Off-screen ShareCard for html-to-image capture */}
      <div className="share-card-container">
        <ShareCard ref={shareCardRef} result={result} dayNumber={dayNumber} />
      </div>
    </div>
  );
}
