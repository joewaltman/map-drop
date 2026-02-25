// ISO 3166-1 numeric code → continent key mapping
// Extracted from scripts/generate-continents.js for runtime use
export const countryToContinent = {
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

// Per-continent projection configuration
// rotateLng: longitude to center the projection on (only lambda rotation — keeps north up)
// fitExtent + the continent's GeoJSON handles scale and vertical centering automatically
export const continentConfig = {
  northAmerica: {
    name: 'North America',
    rotateLng: 100,
  },
  southAmerica: {
    name: 'South America',
    rotateLng: 58,
  },
  europe: {
    name: 'Europe',
    rotateLng: -15,
    // Manual projection: fitExtent doesn't work because France includes French Guiana
    // and Norway includes Svalbard, stretching the bounding box far beyond Europe.
    // These values frame continental Europe + UK at MAP_WIDTH=800, MAP_HEIGHT=500.
    manualScale: 900,
    manualCenter: [0, 50],  // [lng, lat] in rotated coords — 50°N = central Europe
  },
  africa: {
    name: 'Africa',
    rotateLng: -20,
  },
  asia: {
    name: 'Asia',
    rotateLng: -80,
  },
};
