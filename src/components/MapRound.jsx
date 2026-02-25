import { useState } from 'react';
import ContinentMap from './ContinentMap';
import { continentConfig } from '../data/continentMapping';
import { haversineDistance, distanceToColor, formatDistance } from '../utils/scoring';

export default function MapRound({ round, roundNumber, totalRounds, onRoundComplete }) {
  const [guessCoords, setGuessCoords] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [distance, setDistance] = useState(null);
  const [showNext, setShowNext] = useState(false);

  const continent = continentConfig[round.continent];
  const actualCoords = { lat: round.latitude, lng: round.longitude };

  const handleGuess = (coords) => {
    if (revealed) return;
    const km = haversineDistance(coords.lat, coords.lng, round.latitude, round.longitude);
    setGuessCoords(coords);
    setDistance(km);
    setRevealed(true);

    setTimeout(() => setShowNext(true), 1500);
  };

  const handleNext = () => {
    onRoundComplete({
      continent: round.continent,
      city: round.name,
      guessLat: guessCoords.lat,
      guessLng: guessCoords.lng,
      targetLat: round.latitude,
      targetLng: round.longitude,
      distanceKm: distance,
    });
  };

  return (
    <div className="map-round">
      <div className="round-header">
        <span className="round-number">Round {roundNumber}/{totalRounds}</span>
        <span className="continent-name">{continent.name}</span>
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
          </p>

          {showNext && (
            <button className="btn btn-primary fade-in" onClick={handleNext}>
              {roundNumber === totalRounds ? 'See Results' : 'Next'}
            </button>
          )}
        </div>
      )}

      {!revealed && (
        <p className="hint-text">Tap the map to place your guess</p>
      )}
    </div>
  );
}
