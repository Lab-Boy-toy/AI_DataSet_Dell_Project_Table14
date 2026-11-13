// Straight-line (great-circle) distance helpers.
// IMPORTANT: these are NOT travel times and do NOT account for roads, bridges,
// or flooding. They are a rough screening measure only.

const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(a)));
  return EARTH_RADIUS_MILES * c;
}

export function formatMiles(miles) {
  return `${miles.toFixed(2)} mi`;
}

// San Antonio, TX approximate city-center coordinates.
export const SAN_ANTONIO_CENTER = [29.4241, -98.4936];
