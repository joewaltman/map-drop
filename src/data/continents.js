// Continent metadata — SVG path data removed (now rendered via react-simple-maps)
// Bounds kept for reference/backward compatibility

const continents = {
  northAmerica: {
    name: 'North America',
    key: 'northAmerica',
    bounds: { minLat: 5, maxLat: 84, minLng: -170, maxLng: -50 },
  },
  southAmerica: {
    name: 'South America',
    key: 'southAmerica',
    bounds: { minLat: -56, maxLat: 13, minLng: -82, maxLng: -34 },
  },
  europe: {
    name: 'Europe',
    key: 'europe',
    bounds: { minLat: 35, maxLat: 72, minLng: -25, maxLng: 45 },
  },
  africa: {
    name: 'Africa',
    key: 'africa',
    bounds: { minLat: -35, maxLat: 38, minLng: -18, maxLng: 52 },
  },
  asia: {
    name: 'Asia',
    key: 'asia',
    bounds: { minLat: -10, maxLat: 77, minLng: 25, maxLng: 180 },
  },
};

export default continents;
