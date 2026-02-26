// Haversine distance between two lat/lng points, returns km (rounded)
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

// Linearly interpolate between two hex colors
function lerpColor(color1, color2, t) {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Scale factors per continent — smaller continents have tighter thresholds
const CONTINENT_SCALE = {
  europe: 0.4,
  northAmerica: 0.8,
  southAmerica: 0.7,
  africa: 0.85,
  asia: 1.2,
};

// Base thresholds (applied to the largest continents)
const BASE = { green: 100, yellow: 500, orange: 1000, red: 2000 };

function getThresholds(continent) {
  const s = (continent && CONTINENT_SCALE[continent]) || 1;
  return {
    green: BASE.green * s,
    yellow: BASE.yellow * s,
    orange: BASE.orange * s,
    red: BASE.red * s,
  };
}

// Smooth color based on distance, scaled to continent size
export function distanceToColor(km, continent) {
  const green = '#22c55e';
  const yellow = '#eab308';
  const orange = '#f97316';
  const red = '#ef4444';

  const t = getThresholds(continent);

  if (km < t.green) return green;
  if (km < t.yellow) return lerpColor(green, yellow, (km - t.green) / (t.yellow - t.green));
  if (km < t.orange) return lerpColor(yellow, orange, (km - t.yellow) / (t.orange - t.yellow));
  if (km < t.red) return lerpColor(orange, red, (km - t.orange) / (t.red - t.orange));
  return red;
}

// Text label for distance quality, scaled to continent size
export function distanceToLabel(km, continent) {
  const t = getThresholds(continent);
  if (km < t.green) return 'Excellent';
  if (km < t.yellow) return 'Good';
  if (km < t.orange) return 'Fair';
  return 'Far';
}

// Emoji based on distance, scaled to continent size
export function distanceToEmoji(km, continent) {
  const t = getThresholds(continent);
  if (km < t.green) return '\u{1F7E2}';
  if (km < t.yellow) return '\u{1F7E1}';
  if (km < t.orange) return '\u{1F7E0}';
  return '\u{1F534}';
}

// Format number with commas
export function formatDistance(km) {
  return km.toLocaleString('en-US');
}

// Format milliseconds as "M:SS" (e.g., "1:23" or "0:45")
export function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
