import { useRef, useCallback, useMemo } from 'react';
import { geoNaturalEarth1, geoPath, geoGraticule } from 'd3-geo';
import { feature } from 'topojson-client';
import topology from 'world-atlas/countries-110m.json';
import { countryToContinent, continentConfig } from '../data/continentMapping';

const MAP_WIDTH = 800;
const MAP_HEIGHT = 500;
const PADDING = 30;

// Earth-tone color palette
const OCEAN_FILL = '#1a2332';
const OCEAN_STROKE = '#2a3a4c';
const TARGET_FILL = '#8B6914';
const TARGET_STROKE = '#6b5010';
const CONTEXT_FILL = '#3d3d3d';
const CONTEXT_STROKE = '#2a2a2a';
const GRATICULE_STROKE = 'rgba(255,255,255,0.08)';

// Pre-compute GeoJSON features from topology (once, at module level)
const countries = feature(topology, topology.objects.countries);

// Pre-compute per-continent FeatureCollections for fitExtent
const continentFeatures = {};
for (const key of Object.keys(continentConfig)) {
  continentFeatures[key] = {
    type: 'FeatureCollection',
    features: countries.features.filter(
      (f) => countryToContinent[f.id] === key
    ),
  };
}

export default function ContinentMap({
  continentKey,
  guessCoords,
  actualCoords,
  onGuess,
  revealed,
}) {
  const svgRef = useRef(null);
  const config = continentConfig[continentKey];
  const continentGeoJSON = continentFeatures[continentKey];

  // Build projection and path generator
  // 1. Rotate only lambda (longitude) — keeps north perfectly up
  // 2. fitExtent auto-computes scale + translate to frame the continent
  //    (unless manualScale is set — used for Europe where overseas territories break fitExtent)
  const { projection, pathGen, graticule } = useMemo(() => {
    const proj = geoNaturalEarth1()
      .rotate([config.rotateLng, 0, 0]);

    if (config.manualScale) {
      proj
        .scale(config.manualScale)
        .center(config.manualCenter || [0, 0])
        .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
    } else {
      proj.fitExtent(
        [[PADDING, PADDING], [MAP_WIDTH - PADDING, MAP_HEIGHT - PADDING]],
        continentGeoJSON
      );
    }

    return {
      projection: proj,
      pathGen: geoPath(proj),
      graticule: geoGraticule()(),
    };
  }, [config, continentGeoJSON]);

  // Render country paths
  const countryPaths = useMemo(() => {
    return countries.features.map((feat) => {
      const d = pathGen(feat);
      if (!d) return null;
      const isTarget = countryToContinent[feat.id] === continentKey;
      return {
        id: feat.id,
        d,
        isTarget,
      };
    }).filter(Boolean);
  }, [pathGen, continentKey]);

  // Click handler: SVG coords → projection.invert → lat/lng
  const handleClick = useCallback(
    (e) => {
      if (revealed || !onGuess) return;
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (MAP_WIDTH / rect.width);
      const y = (e.clientY - rect.top) * (MAP_HEIGHT / rect.height);
      const coords = projection.invert([x, y]);
      if (coords) {
        onGuess({ lat: coords[1], lng: coords[0] });
      }
    },
    [projection, revealed, onGuess]
  );

  // Project a [lng, lat] pair to SVG [x, y]
  const project = useCallback(
    ([lng, lat]) => projection([lng, lat]),
    [projection]
  );

  const guessXY = guessCoords ? project([guessCoords.lng, guessCoords.lat]) : null;
  const actualXY = actualCoords ? project([actualCoords.lng, actualCoords.lat]) : null;

  return (
    <div className="continent-map">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        style={{ width: '100%', height: 'auto', cursor: revealed ? 'default' : 'crosshair' }}
        onClick={handleClick}
      >
        {/* Ocean (sphere background) */}
        <path
          d={pathGen({ type: 'Sphere' })}
          fill={OCEAN_FILL}
          stroke={OCEAN_STROKE}
          strokeWidth={1.5}
        />

        {/* Graticule grid */}
        <path
          d={pathGen(graticule)}
          fill="none"
          stroke={GRATICULE_STROKE}
          strokeWidth={0.5}
        />

        {/* Country paths — context land first, target on top */}
        {countryPaths.filter((c) => !c.isTarget).map((c) => (
          <path
            key={c.id}
            d={c.d}
            fill={CONTEXT_FILL}
            stroke={CONTEXT_STROKE}
            strokeWidth={0.3}
          />
        ))}
        {countryPaths.filter((c) => c.isTarget).map((c) => (
          <path
            key={c.id}
            d={c.d}
            fill={TARGET_FILL}
            stroke={TARGET_STROKE}
            strokeWidth={0.5}
            className="geography-target"
          />
        ))}

        {/* Guess pin */}
        {guessXY && (
          <circle
            cx={guessXY[0]}
            cy={guessXY[1]}
            r={6}
            fill="var(--pin-guess)"
            stroke="#fff"
            strokeWidth={2}
            className="pin-drop"
          />
        )}

        {/* Revealed: distance line + correct pin */}
        {revealed && guessXY && actualXY && (
          <>
            <line
              x1={guessXY[0]}
              y1={guessXY[1]}
              x2={actualXY[0]}
              y2={actualXY[1]}
              stroke="#fff"
              strokeWidth={2}
              strokeDasharray="6 3"
              className="distance-line"
            />
            <circle
              cx={actualXY[0]}
              cy={actualXY[1]}
              r={6}
              fill="var(--pin-correct)"
              stroke="#fff"
              strokeWidth={2}
              className="pin-drop"
            />
          </>
        )}
      </svg>
    </div>
  );
}
