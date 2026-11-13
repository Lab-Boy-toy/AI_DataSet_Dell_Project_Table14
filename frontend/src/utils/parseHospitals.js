// Parses hospital location data from either GeoJSON (Point features) or CSV
// (name/latitude/longitude columns). Only real uploaded data is accepted —
// this app never fabricates hospital records.

export class HospitalParseError extends Error {}

function findProp(properties, candidates) {
  if (!properties) return undefined;
  const keys = Object.keys(properties);
  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase().replace(/[_\s]/g, '');
    const match = keys.find(
      (k) => k.toLowerCase().replace(/[_\s]/g, '') === normalizedCandidate
    );
    if (match !== undefined && properties[match] !== undefined && properties[match] !== null && properties[match] !== '') {
      return properties[match];
    }
  }
  return undefined;
}

export function parseHospitalsGeoJSON(geojson, sourceLabel = 'uploaded file') {
  if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new HospitalParseError(`${sourceLabel} is not a valid GeoJSON FeatureCollection.`);
  }

  const hospitals = [];
  geojson.features.forEach((feature, index) => {
    const geometry = feature?.geometry;
    if (!geometry || geometry.type !== 'Point' || !Array.isArray(geometry.coordinates)) return;
    const [lng, lat] = geometry.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) return;

    const props = feature.properties || {};
    const name = findProp(props, ['Name', 'NAME', 'HospitalName', 'FACILITY']) ?? `Unnamed Hospital ${index + 1}`;
    const type = findProp(props, ['Type', 'TYPE', 'FacilityType']);
    const status = findProp(props, ['Status', 'STATUS']);
    const address = findProp(props, ['Address', 'ADDRESS']);
    const county = findProp(props, ['County', 'COUNTY']);
    const trauma = findProp(props, ['Trauma', 'TRAUMA']);
    const beds = findProp(props, ['Beds', 'BEDS']);
    const telephone = findProp(props, ['Telephone', 'TELEPHONE', 'Phone']);
    const website = findProp(props, ['Website', 'WEBSITE']);

    hospitals.push({
      id: `hospital-${index}`,
      name: String(name),
      lat,
      lng,
      type: type !== undefined ? String(type) : null,
      status: status !== undefined ? String(status) : null,
      address: address !== undefined ? String(address) : null,
      county: county !== undefined ? String(county) : null,
      trauma: trauma !== undefined ? String(trauma) : null,
      beds: beds !== undefined ? Number(beds) : null,
      telephone: telephone !== undefined ? String(telephone) : null,
      website: website !== undefined ? String(website) : null,
    });
  });

  if (hospitals.length === 0) {
    throw new HospitalParseError(`${sourceLabel} did not contain any usable Point features.`);
  }

  const metadata = geojson.metadata && typeof geojson.metadata === 'object' ? geojson.metadata : null;

  return { hospitals, metadata };
}

// Minimal CSV parser (handles quoted fields and commas inside quotes).
function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

export function parseHospitalsCSV(text, sourceLabel = 'uploaded file') {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    throw new HospitalParseError(`${sourceLabel} does not have a header row plus at least one data row.`);
  }

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/[_\s]/g, ''));
  const nameIdx = header.findIndex((h) => ['name', 'hospitalname', 'facility', 'facilityname'].includes(h));
  const latIdx = header.findIndex((h) => ['lat', 'latitude', 'y'].includes(h));
  const lngIdx = header.findIndex((h) => ['lng', 'lon', 'long', 'longitude', 'x'].includes(h));
  const typeIdx = header.findIndex((h) => ['type', 'facilitytype'].includes(h));
  const statusIdx = header.findIndex((h) => ['status'].includes(h));

  if (nameIdx === -1 || latIdx === -1 || lngIdx === -1) {
    throw new HospitalParseError(
      `${sourceLabel} must have columns for name, latitude, and longitude (e.g. "name,latitude,longitude").`
    );
  }

  const hospitals = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const lat = parseFloat(r[latIdx]);
    const lng = parseFloat(r[lngIdx]);
    const name = (r[nameIdx] || '').trim();
    if (!name || Number.isNaN(lat) || Number.isNaN(lng)) continue;
    hospitals.push({
      id: `hospital-${i}`,
      name,
      lat,
      lng,
      type: typeIdx !== -1 ? (r[typeIdx] || '').trim() || null : null,
      status: statusIdx !== -1 ? (r[statusIdx] || '').trim() || null : null,
      address: null,
      county: null,
      trauma: null,
      beds: null,
      telephone: null,
      website: null,
    });
  }

  if (hospitals.length === 0) {
    throw new HospitalParseError(`${sourceLabel} did not contain any valid rows with name, latitude, and longitude.`);
  }

  return { hospitals, metadata: null };
}
