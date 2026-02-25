import { forwardRef } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from '@vnedyalk0v/react19-simple-maps';
import topology from 'world-atlas/countries-110m.json';
import { countryToContinent, continentConfig } from '../data/continentMapping';
import { distanceToColor, formatDistance, formatTime } from '../utils/scoring';

const ShareCard = forwardRef(function ShareCard({ result, dayNumber }, ref) {
  // Build lookup: continent key → guess result
  const guessByContinent = {};
  for (const g of result.guesses) {
    guessByContinent[g.continent] = g;
  }

  const timeStr = result.elapsedMs ? `⏱ ${formatTime(result.elapsedMs)}` : '';

  return (
    <div
      ref={ref}
      style={{
        width: 1200,
        height: 630,
        background: '#0f172a',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 40px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>
          MapDrop #{dayNumber}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          {timeStr && (
            <div style={{ fontSize: 22, fontWeight: 600, color: '#94a3b8' }}>
              {timeStr}
            </div>
          )}
          <div style={{ fontSize: 32, fontWeight: 700 }}>
            {formatDistance(result.totalKm)} km
          </div>
        </div>
      </div>

      {/* Map + Breakdown row */}
      <div style={{ display: 'flex', flex: 1, gap: 32, minHeight: 0 }}>
        {/* World map */}
        <div
          style={{
            flex: 1,
            borderRadius: 12,
            overflow: 'hidden',
            background: '#1a3a5c',
          }}
        >
          <ComposableMap
            projection="geoNaturalEarth1"
            projectionConfig={{ scale: 160 }}
            width={800}
            height={420}
            style={{ width: '100%', height: '100%' }}
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

        {/* Breakdown: continent name + distance only (no city names) */}
        <div
          style={{
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          {result.guesses.map((g, i) => {
            const config = continentConfig[g.continent];
            const color = distanceToColor(g.distanceKm, g.continent);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#1e293b',
                  borderRadius: 10,
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>
                  {config?.name || g.continent}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color }}>
                  {formatDistance(g.distanceKm)} km
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 16,
          textAlign: 'center',
          fontSize: 18,
          fontWeight: 600,
          color: '#64748b',
          letterSpacing: 1,
        }}
      >
        mapdrop.io
      </div>
    </div>
  );
});

export default ShareCard;
