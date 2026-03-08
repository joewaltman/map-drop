import { useState } from 'react';
import ContinentMap from './ContinentMap';
import { continentConfig } from '../data/continentMapping';
import { haversineDistance, distanceToColor, distanceToLabel, formatDistance } from '../utils/scoring';
import { playPinDrop, playReveal } from '../utils/sound';
import { submitGuess } from '../utils/auth';

export default function MapRound({ round, roundNumber, totalRounds, onRoundComplete, muteButton, serverGameId, roundIndex }) {
  const [guessCoords, setGuessCoords] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [distance, setDistance] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [actualCoords, setActualCoords] = useState(
    // Only set coords if available (client-side flow has them, server flow does not)
    round.latitude != null ? { lat: round.latitude, lng: round.longitude } : null
  );

  const continent = continentConfig[round.continent];

  const getQuality = (km) => {
    const scale = { europe: 0.4, northAmerica: 0.8, southAmerica: 0.7, africa: 0.85, asia: 1.2 };
    const s = scale[round.continent] || 1;
    if (km < 100 * s) return 'green';
    if (km < 500 * s) return 'yellow';
    if (km < 1000 * s) return 'orange';
    return 'red';
  };

  const handleGuess = async (coords) => {
    if (revealed) return;

    setGuessCoords(coords);
    playPinDrop();

    if (serverGameId) {
      // Server-validated flow: send guess to server, get target + distance back
      try {
        const result = await submitGuess(serverGameId, roundIndex, coords.lat, coords.lng);
        const km = result.distanceKm;
        setDistance(km);
        setActualCoords({ lat: result.targetLat, lng: result.targetLng });
        setRevealed(true);
        setTimeout(() => playReveal(getQuality(km)), 400);
        setTimeout(() => setShowNext(true), 1500);
      } catch (err) {
        console.error('Server guess failed:', err.message);
        // Fall back to client-side if we have coords
        if (round.latitude != null) {
          const km = haversineDistance(coords.lat, coords.lng, round.latitude, round.longitude);
          setDistance(km);
          setActualCoords({ lat: round.latitude, lng: round.longitude });
          setRevealed(true);
          setTimeout(() => playReveal(getQuality(km)), 400);
          setTimeout(() => setShowNext(true), 1500);
        }
      }
    } else {
      // Client-side flow (non-auth users)
      const km = haversineDistance(coords.lat, coords.lng, round.latitude, round.longitude);
      setDistance(km);
      setRevealed(true);
      setTimeout(() => playReveal(getQuality(km)), 400);
      setTimeout(() => setShowNext(true), 1500);
    }
  };

  const handleNext = () => {
    onRoundComplete({
      continent: round.continent,
      city: round.name,
      guessLat: guessCoords.lat,
      guessLng: guessCoords.lng,
      targetLat: actualCoords?.lat,
      targetLng: actualCoords?.lng,
      distanceKm: distance,
    });
  };

  return (
    <div className="map-round">
      <div className="round-header">
        <span className="round-number">Round {roundNumber}/{totalRounds}</span>
        <span className="continent-name">{continent.name}</span>
        {muteButton}
      </div>

      <h2 className="city-prompt">
        Where is <strong>{round.name}</strong>?
      </h2>

      <ContinentMap
        continentKey={round.continent}
        guessCoords={guessCoords}
        actualCoords={actualCoords}
        onGuess={handleGuess}
        revealed={revealed}
      />

      {revealed && distance !== null && (
        <div className="round-result fade-in">
          <p className="distance-display" style={{ color: distanceToColor(distance, round.continent) }}>
            {formatDistance(distance)} km away
            <span className="distance-label"> — {distanceToLabel(distance, round.continent)}</span>
          </p>
        </div>
      )}

      {showNext && (
        <div className="next-button-float fade-in">
          <button className="btn btn-primary" onClick={handleNext}>
            {roundNumber === totalRounds ? 'See Results' : 'Next'}
          </button>
        </div>
      )}

      {!revealed && (
        <p className="hint-text">Tap the map to place your guess</p>
      )}
    </div>
  );
}
