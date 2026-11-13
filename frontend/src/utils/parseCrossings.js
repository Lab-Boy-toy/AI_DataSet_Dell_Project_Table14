// Parses a low-water-crossing GeoJSON FeatureCollection into normalized
// crossing records. Expected properties: Name, CartID, CouncilDistrict.
// Property lookup is case/underscore tolerant so minor schema variations
// in the source dataset don't break loading.

function findProp(properties, candidates) {
  if (!properties) return undefined;
  const keys = Object.keys(properties);
  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase().replace(/[_\s]/g, '');
    const match = keys.find(
      (k) => k.toLowerCase().replace(/[_\s]/g, '') === normalizedCandidate
    );
    if (match !== undefined && properties[match] !== undefined && properties[match] !== null) {
      return properties[match];
    }
  }
  return undefined;
}

export class CrossingParseError extends Error {}

export function parseCrossingsGeoJSON(geojson, sourceLabel = 'uploaded file') {
  if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new CrossingParseError(
      `${sourceLabel} is not a valid GeoJSON FeatureCollection.`
    );
  }

  const crossings = [];
  const skipped = [];

  geojson.features.forEach((feature, index) => {
    const geometry = feature?.geometry;
    if (!geometry || geometry.type !== 'Point' || !Array.isArray(geometry.coordinates)) {
      skipped.push(index);
      return;
    }
    const [lng, lat] = geometry.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
      skipped.push(index);
      return;
    }

    const props = feature.properties || {};
    const name = findProp(props, ['Name', 'NAME', 'CrossingName']) ?? `Unnamed Crossing ${index + 1}`;
    const cartId = findProp(props, ['CartID', 'CART_ID', 'CartId', 'ID']) ?? `N/A`;
    const councilDistrict = findProp(props, ['CouncilDistrict', 'COUNCIL_DIST', 'Council_District', 'District']) ?? 'Unknown';

    crossings.push({
      id: `crossing-${cartId}-${index}`,
      name: String(name),
      cartId: String(cartId),
      councilDistrict: String(councilDistrict),
      lat,
      lng,
    });
  });

  if (crossings.length === 0) {
    throw new CrossingParseError(
      `${sourceLabel} did not contain any usable Point features.`
    );
  }

  return { crossings, skippedCount: skipped.length };
}
