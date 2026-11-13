import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SAN_ANTONIO_CENTER, haversineMiles, formatMiles } from '../utils/geo';

function divIcon(className, html) {
  return L.divIcon({
    className: `map-icon ${className}`,
    html,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

const crossingIcon = divIcon('map-icon--crossing', '');
const selectedIcon = divIcon('map-icon--selected', '');
const closedIcon = divIcon('map-icon--closed', '✕');
const hospitalIcon = L.divIcon({
  className: 'map-icon map-icon--hospital',
  html: '+',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});
const hospitalClosedIcon = L.divIcon({
  className: 'map-icon map-icon--hospital-closed',
  html: '+',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

function isHospitalClosed(h) {
  return typeof h.status === 'string' && h.status.toUpperCase() === 'CLOSED';
}

function FitBounds({ crossings, hospitals }) {
  const map = useMap();
  const didFit = useRef(false);

  useEffect(() => {
    const points = [
      ...crossings.map((c) => [c.lat, c.lng]),
      ...hospitals.map((h) => [h.lat, h.lng]),
    ];
    if (points.length === 0 || didFit.current) return;
    didFit.current = true;
    map.fitBounds(points, { padding: [40, 40], maxZoom: 13 });
  }, [crossings, hospitals, map]);

  return null;
}

export default function MapView({
  crossings,
  hospitals,
  selectedCrossingId,
  onSelectCrossing,
  simulatedClosures,
}) {
  const selectedCrossing = crossings.find((c) => c.id === selectedCrossingId) || null;

  const openHospitals = useMemo(() => hospitals.filter((h) => !isHospitalClosed(h)), [hospitals]);
  const excludedClosedCount = hospitals.length - openHospitals.length;

  const hospitalLines = useMemo(() => {
    if (!selectedCrossing || openHospitals.length === 0) return [];
    return openHospitals.map((h) => ({
      hospital: h,
      distance: haversineMiles(selectedCrossing.lat, selectedCrossing.lng, h.lat, h.lng),
    }));
  }, [selectedCrossing, openHospitals]);

  return (
    <div className="map-wrap">
      <MapContainer
        center={SAN_ANTONIO_CENTER}
        zoom={11}
        scrollWheelZoom
        className="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds crossings={crossings} hospitals={hospitals} />

        {crossings.map((c) => {
          const isClosed = simulatedClosures.has(c.id);
          const isSelected = c.id === selectedCrossingId;
          const icon = isClosed ? closedIcon : isSelected ? selectedIcon : crossingIcon;
          return (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={icon}
              eventHandlers={{ click: () => onSelectCrossing(c.id) }}
            >
              <Popup>
                <div className="popup">
                  <strong>{c.name}</strong>
                  {isClosed && <div className="pill pill--amber">SIMULATED CLOSED</div>}
                  <div>District {c.councilDistrict}</div>
                  <div>CartID: {c.cartId}</div>
                  <div className="popup__coords">
                    {c.lat.toFixed(5)}, {c.lng.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {hospitals.map((h) => {
          const closed = isHospitalClosed(h);
          return (
            <Marker key={h.id} position={[h.lat, h.lng]} icon={closed ? hospitalClosedIcon : hospitalIcon}>
              <Popup>
                <div className="popup">
                  <strong>{h.name}</strong>
                  {closed && <div className="pill pill--muted">STATUS: CLOSED (historical record)</div>}
                  {h.type && <div>{h.type}</div>}
                  {h.trauma && <div>Trauma: {h.trauma}</div>}
                  {h.beds != null && !Number.isNaN(h.beds) && <div>Beds: {h.beds}</div>}
                  {h.address && <div className="popup__coords">{h.address}</div>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {hospitalLines.map(({ hospital, distance }) => (
          <Polyline
            key={hospital.id}
            positions={[[selectedCrossing.lat, selectedCrossing.lng], [hospital.lat, hospital.lng]]}
            pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '6 6' }}
          >
            <Tooltip sticky>
              {formatMiles(distance)} straight-line to {hospital.name} (not a travel time)
            </Tooltip>
          </Polyline>
        ))}
      </MapContainer>

      {selectedCrossing && hospitalLines.length > 0 && (
        <div className="map-distance-panel">
          <h4>Straight-line distances from “{selectedCrossing.name}”</h4>
          <p className="map-distance-panel__caveat">
            Straight-line only — NOT travel time and NOT confirmed road access.
            {excludedClosedCount > 0 &&
              ` (${excludedClosedCount} hospital${excludedClosedCount === 1 ? '' : 's'} marked closed in the source data excluded.)`}
          </p>
          <ul className="map-distance-panel__list">
            {hospitalLines
              .slice()
              .sort((a, b) => a.distance - b.distance)
              .map(({ hospital, distance }) => (
                <li key={hospital.id}>
                  <span>{hospital.name}</span>
                  <span>{formatMiles(distance)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
