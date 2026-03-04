// Server-side copy of haversine distance calculation
// Must stay in sync with src/utils/scoring.js

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Continent scale factors (for color computation)
const CONTINENT_SCALE = {
  europe: 0.4,
  northAmerica: 0.8,
  southAmerica: 0.7,
  africa: 0.85,
  asia: 1.2,
};

export function getQuality(km, continent) {
  const s = CONTINENT_SCALE[continent] || 1;
  if (km < 100 * s) return 'green';
  if (km < 500 * s) return 'yellow';
  if (km < 1000 * s) return 'orange';
  return 'red';
}
