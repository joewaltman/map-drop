import { readFileSync, writeFileSync } from 'fs';
import { feature, merge } from 'topojson-client';

// Load countries-110m from world-atlas
const topoPath = new URL('../node_modules/world-atlas/countries-110m.json', import.meta.url);
const topo = JSON.parse(readFileSync(topoPath, 'utf-8'));
const countries = feature(topo, topo.objects.countries);

// ISO 3166-1 numeric code → continent mapping
// Russia is placed in Asia since most of its landmass is there
const continentMap = {
  // North America
  '124': 'northAmerica', // Canada
  '840': 'northAmerica', // United States
  '484': 'northAmerica', // Mexico
  '192': 'northAmerica', // Cuba
  '332': 'northAmerica', // Haiti
  '214': 'northAmerica', // Dominican Republic
  '388': 'northAmerica', // Jamaica
  '780': 'northAmerica', // Trinidad and Tobago
  '044': 'northAmerica', // Bahamas
  '084': 'northAmerica', // Belize
  '320': 'northAmerica', // Guatemala
  '340': 'northAmerica', // Honduras
  '222': 'northAmerica', // El Salvador
  '558': 'northAmerica', // Nicaragua
  '188': 'northAmerica', // Costa Rica
  '591': 'northAmerica', // Panama
  '630': 'northAmerica', // Puerto Rico
  '659': 'northAmerica', // Saint Kitts and Nevis
  '660': 'northAmerica', // Anguilla
  '662': 'northAmerica', // Saint Lucia
  '670': 'northAmerica', // Saint Vincent
  '028': 'northAmerica', // Antigua and Barbuda
  '052': 'northAmerica', // Barbados
  '212': 'northAmerica', // Dominica
  '308': 'northAmerica', // Grenada
  '304': 'northAmerica', // Greenland
  '535': 'northAmerica', // Bonaire

  // South America
  '076': 'southAmerica', // Brazil
  '032': 'southAmerica', // Argentina
  '170': 'southAmerica', // Colombia
  '604': 'southAmerica', // Peru
  '862': 'southAmerica', // Venezuela
  '152': 'southAmerica', // Chile
  '218': 'southAmerica', // Ecuador
  '068': 'southAmerica', // Bolivia
  '600': 'southAmerica', // Paraguay
  '858': 'southAmerica', // Uruguay
  '328': 'southAmerica', // Guyana
  '740': 'southAmerica', // Suriname
  '254': 'southAmerica', // French Guiana
  '238': 'southAmerica', // Falkland Islands

  // Europe (Russia excluded — placed in Asia)
  '826': 'europe', // United Kingdom
  '250': 'europe', // France
  '276': 'europe', // Germany
  '724': 'europe', // Spain
  '380': 'europe', // Italy
  '528': 'europe', // Netherlands
  '056': 'europe', // Belgium
  '756': 'europe', // Switzerland
  '040': 'europe', // Austria
  '616': 'europe', // Poland
  '203': 'europe', // Czech Republic
  '703': 'europe', // Slovakia
  '348': 'europe', // Hungary
  '642': 'europe', // Romania
  '100': 'europe', // Bulgaria
  '300': 'europe', // Greece
  '620': 'europe', // Portugal
  '372': 'europe', // Ireland
  '208': 'europe', // Denmark
  '752': 'europe', // Sweden
  '578': 'europe', // Norway
  '246': 'europe', // Finland
  '352': 'europe', // Iceland
  '440': 'europe', // Lithuania
  '428': 'europe', // Latvia
  '233': 'europe', // Estonia
  '112': 'europe', // Belarus
  '804': 'europe', // Ukraine
  '498': 'europe', // Moldova
  '688': 'europe', // Serbia
  '191': 'europe', // Croatia
  '070': 'europe', // Bosnia and Herzegovina
  '499': 'europe', // Montenegro
  '807': 'europe', // North Macedonia
  '008': 'europe', // Albania
  '905': 'europe', // Kosovo
  '705': 'europe', // Slovenia
  '442': 'europe', // Luxembourg
  '470': 'europe', // Malta
  '196': 'europe', // Cyprus

  // Africa
  '012': 'africa', // Algeria
  '024': 'africa', // Angola
  '204': 'africa', // Benin
  '072': 'africa', // Botswana
  '854': 'africa', // Burkina Faso
  '108': 'africa', // Burundi
  '120': 'africa', // Cameroon
  '132': 'africa', // Cape Verde
  '140': 'africa', // Central African Republic
  '148': 'africa', // Chad
  '174': 'africa', // Comoros
  '178': 'africa', // Congo
  '180': 'africa', // DR Congo
  '262': 'africa', // Djibouti
  '818': 'africa', // Egypt
  '226': 'africa', // Equatorial Guinea
  '232': 'africa', // Eritrea
  '748': 'africa', // Eswatini
  '231': 'africa', // Ethiopia
  '266': 'africa', // Gabon
  '270': 'africa', // Gambia
  '288': 'africa', // Ghana
  '324': 'africa', // Guinea
  '624': 'africa', // Guinea-Bissau
  '384': 'africa', // Ivory Coast
  '404': 'africa', // Kenya
  '426': 'africa', // Lesotho
  '430': 'africa', // Liberia
  '434': 'africa', // Libya
  '450': 'africa', // Madagascar
  '454': 'africa', // Malawi
  '466': 'africa', // Mali
  '478': 'africa', // Mauritania
  '480': 'africa', // Mauritius
  '504': 'africa', // Morocco
  '508': 'africa', // Mozambique
  '516': 'africa', // Namibia
  '562': 'africa', // Niger
  '566': 'africa', // Nigeria
  '646': 'africa', // Rwanda
  '678': 'africa', // Sao Tome and Principe
  '686': 'africa', // Senegal
  '694': 'africa', // Sierra Leone
  '706': 'africa', // Somalia
  '710': 'africa', // South Africa
  '728': 'africa', // South Sudan
  '729': 'africa', // Sudan
  '834': 'africa', // Tanzania
  '768': 'africa', // Togo
  '788': 'africa', // Tunisia
  '800': 'africa', // Uganda
  '732': 'africa', // Western Sahara
  '894': 'africa', // Zambia
  '716': 'africa', // Zimbabwe

  // Asia (includes Russia)
  '643': 'asia', // Russia
  '004': 'asia', // Afghanistan
  '051': 'asia', // Armenia
  '031': 'asia', // Azerbaijan
  '048': 'asia', // Bahrain
  '050': 'asia', // Bangladesh
  '064': 'asia', // Bhutan
  '096': 'asia', // Brunei
  '104': 'asia', // Myanmar
  '116': 'asia', // Cambodia
  '156': 'asia', // China
  '268': 'asia', // Georgia
  '356': 'asia', // India
  '360': 'asia', // Indonesia
  '364': 'asia', // Iran
  '368': 'asia', // Iraq
  '376': 'asia', // Israel
  '392': 'asia', // Japan
  '400': 'asia', // Jordan
  '398': 'asia', // Kazakhstan
  '408': 'asia', // North Korea
  '410': 'asia', // South Korea
  '414': 'asia', // Kuwait
  '417': 'asia', // Kyrgyzstan
  '418': 'asia', // Laos
  '422': 'asia', // Lebanon
  '458': 'asia', // Malaysia
  '462': 'asia', // Maldives
  '496': 'asia', // Mongolia
  '524': 'asia', // Nepal
  '512': 'asia', // Oman
  '586': 'asia', // Pakistan
  '275': 'asia', // Palestine
  '608': 'asia', // Philippines
  '634': 'asia', // Qatar
  '682': 'asia', // Saudi Arabia
  '702': 'asia', // Singapore
  '144': 'asia', // Sri Lanka
  '760': 'asia', // Syria
  '762': 'asia', // Tajikistan
  '764': 'asia', // Thailand
  '626': 'asia', // Timor-Leste
  '792': 'asia', // Turkey
  '795': 'asia', // Turkmenistan
  '784': 'asia', // United Arab Emirates
  '860': 'asia', // Uzbekistan
  '704': 'asia', // Vietnam
  '887': 'asia', // Yemen
  '158': 'asia', // Taiwan
};

// Continent definitions with bounding boxes
const continentDefs = {
  northAmerica: {
    name: 'North America',
    bounds: { minLat: 5, maxLat: 84, minLng: -170, maxLng: -50 },
    viewBoxWidth: 1200,
    viewBoxHeight: 790,
  },
  southAmerica: {
    name: 'South America',
    bounds: { minLat: -56, maxLat: 13, minLng: -82, maxLng: -34 },
    viewBoxWidth: 960,
    viewBoxHeight: 690,
  },
  europe: {
    name: 'Europe',
    bounds: { minLat: 35, maxLat: 72, minLng: -25, maxLng: 45 },
    viewBoxWidth: 1120,
    viewBoxHeight: 592,
  },
  africa: {
    name: 'Africa',
    bounds: { minLat: -35, maxLat: 38, minLng: -18, maxLng: 52 },
    viewBoxWidth: 1120,
    viewBoxHeight: 730,
  },
  asia: {
    name: 'Asia',
    bounds: { minLat: -10, maxLat: 77, minLng: 25, maxLng: 180 },
    viewBoxWidth: 1550,
    viewBoxHeight: 870,
  },
};

// Clamp a value to a range
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Project [lng, lat] to SVG viewBox coordinates, clamped to viewBox
function projectCoord(lng, lat, bounds, vbWidth, vbHeight) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * vbWidth;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * vbHeight;
  return [
    Math.round(clamp(x, 0, vbWidth) * 10) / 10,
    Math.round(clamp(y, 0, vbHeight) * 10) / 10,
  ];
}

// Convert a polygon ring to SVG path segment
function ringToPath(ring, bounds, vbWidth, vbHeight) {
  const points = ring.map(([lng, lat]) => projectCoord(lng, lat, bounds, vbWidth, vbHeight));
  if (points.length === 0) return '';
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    d += `L${points[i][0]} ${points[i][1]}`;
  }
  d += 'Z';
  return d;
}

// Check if a ring crosses the antimeridian (consecutive points >180° apart in longitude)
function crossesAntimeridian(ring) {
  for (let i = 0; i < ring.length - 1; i++) {
    if (Math.abs(ring[i][0] - ring[i + 1][0]) > 180) return true;
  }
  return false;
}

// Check if the centroid of a ring falls within the bounding box
function ringCentroidInBounds(ring, bounds) {
  let sumLng = 0, sumLat = 0;
  for (const [lng, lat] of ring) {
    sumLng += lng;
    sumLat += lat;
  }
  const cLng = sumLng / ring.length;
  const cLat = sumLat / ring.length;
  return (
    cLng >= bounds.minLng && cLng <= bounds.maxLng &&
    cLat >= bounds.minLat && cLat <= bounds.maxLat
  );
}

// Build continent paths
const continentPaths = {};

for (const [contKey, contDef] of Object.entries(continentDefs)) {
  const pathSegments = [];

  for (const countryFeature of countries.features) {
    const countryContinent = continentMap[countryFeature.id];
    if (countryContinent !== contKey) continue;

    const geom = countryFeature.geometry;
    let polygons = [];

    if (geom.type === 'Polygon') {
      polygons = [geom.coordinates];
    } else if (geom.type === 'MultiPolygon') {
      polygons = geom.coordinates;
    }

    for (const polygon of polygons) {
      for (const ring of polygon) {
        // Skip rings that cross the antimeridian (they create horizontal lines)
        if (crossesAntimeridian(ring)) continue;

        // Only include rings whose centroid is within the bounding box
        if (ringCentroidInBounds(ring, contDef.bounds)) {
          const segment = ringToPath(ring, contDef.bounds, contDef.viewBoxWidth, contDef.viewBoxHeight);
          if (segment) pathSegments.push(segment);
        }
      }
    }
  }

  continentPaths[contKey] = pathSegments.join(' ');
}

// Generate the per-continent output JS module
let output = `// Auto-generated from Natural Earth 110m data via world-atlas
// Each continent: SVG path in viewBox coordinates, with geographic bounding box.
// Equirectangular projection: x=0 → minLng, x=width → maxLng, y=0 → maxLat, y=height → minLat.

const continents = {\n`;

for (const [contKey, contDef] of Object.entries(continentDefs)) {
  output += `  ${contKey}: {
    name: '${contDef.name}',
    key: '${contKey}',
    bounds: { minLat: ${contDef.bounds.minLat}, maxLat: ${contDef.bounds.maxLat}, minLng: ${contDef.bounds.minLng}, maxLng: ${contDef.bounds.maxLng} },
    viewBox: '0 0 ${contDef.viewBoxWidth} ${contDef.viewBoxHeight}',
    path: '${continentPaths[contKey]}',
  },\n`;
}

output += `};\n\nexport default continents;\n`;

const outPath = new URL('../src/data/continents.js', import.meta.url);
writeFileSync(outPath, output, 'utf-8');

console.log('--- Per-continent maps ---');
for (const [key, path] of Object.entries(continentPaths)) {
  console.log(`${key}: ${(path.length / 1024).toFixed(1)} KB, ${(path.match(/M/g) || []).length} polygons`);
}
console.log('Wrote src/data/continents.js');

// -------------------------------------------------------------------
// Generate a single world map using 50m data + topojson.merge
// merge() dissolves shared country borders → clean continent outlines
// -------------------------------------------------------------------
const topo50Path = new URL('../node_modules/world-atlas/countries-50m.json', import.meta.url);
const topo50 = JSON.parse(readFileSync(topo50Path, 'utf-8'));

const WORLD = {
  minLng: -180, maxLng: 180,
  minLat: -60, maxLat: 85,
  width: 1800,
  height: 725,
};

function projectWorld(lng, lat) {
  const x = ((lng - WORLD.minLng) / (WORLD.maxLng - WORLD.minLng)) * WORLD.width;
  const y = ((WORLD.maxLat - lat) / (WORLD.maxLat - WORLD.minLat)) * WORLD.height;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

function ringToWorldPath(ring) {
  const points = ring.map(([lng, lat]) => projectWorld(lng, lat));
  if (points.length === 0) return '';
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    d += `L${points[i][0]} ${points[i][1]}`;
  }
  d += 'Z';
  return d;
}

const worldPaths = {};
const continentKeys = Object.keys(continentDefs);

for (const contKey of continentKeys) {
  // Collect TopoJSON geometry objects for this continent
  const geoms = topo50.objects.countries.geometries.filter(
    (g) => continentMap[g.id] === contKey
  );

  // merge() dissolves shared borders, returning a single GeoJSON MultiPolygon
  const merged = merge(topo50, geoms);

  const segments = [];
  const polygons = merged.type === 'Polygon'
    ? [merged.coordinates]
    : merged.coordinates;

  for (const polygon of polygons) {
    for (const ring of polygon) {
      if (crossesAntimeridian(ring)) continue;
      segments.push(ringToWorldPath(ring));
    }
  }

  worldPaths[contKey] = segments.join(' ');
}

let worldOutput = `// Auto-generated world map from Natural Earth 50m data
// Country borders dissolved via topojson.merge — only coastlines + continent edges remain
// Equirectangular projection, viewBox 0 0 ${WORLD.width} ${WORLD.height}
// lng ${WORLD.minLng}..${WORLD.maxLng}, lat ${WORLD.minLat}..${WORLD.maxLat}

export const worldViewBox = '0 0 ${WORLD.width} ${WORLD.height}';\n\n`;

worldOutput += `const worldContinents = {\n`;
for (const key of continentKeys) {
  worldOutput += `  ${key}: '${worldPaths[key]}',\n`;
}
worldOutput += `};\n\nexport default worldContinents;\n`;

const worldOutPath = new URL('../src/data/worldMap.js', import.meta.url);
writeFileSync(worldOutPath, worldOutput, 'utf-8');

console.log('\n--- World map (50m, merged) ---');
for (const key of continentKeys) {
  console.log(`${key}: ${(worldPaths[key].length / 1024).toFixed(1)} KB, ${(worldPaths[key].match(/M/g) || []).length} polygons`);
}
console.log('Wrote src/data/worldMap.js');
