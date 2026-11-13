# FloodSafe SA — Frontend

Interactive React + Leaflet dashboard for exploring how closures of known low-water crossings
could affect straight-line access to hospitals in San Antonio, TX. Built for the Dell Social
Impact AI Datathon at UT San Antonio. Frontend-only: no backend, database, auth, or paid APIs
(OpenStreetMap tiles, no API key required).

## Installation

```bash
cd frontend
npm install
```

## Run

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Other scripts: `npm run build` (production build to `dist/`), `npm run preview`, `npm run lint`
(oxlint).

## Data sources

- **Low-water crossings** — `public/data/low_water_crossings.geojson`: 156 real San Antonio
  low-water crossing locations (`Name`, `CartID`, `CouncilDistrict`), auto-loaded on startup.
- **Hospitals** — `public/data/hospitals.geojson`: 45 real San Antonio hospital records (name,
  type, status, trauma level, beds, coordinates) pulled from a public HIFLD-derived ArcGIS
  FeatureServer. This is a **static, historical snapshot** — the source layer was last edited
  2021-08-30, which the app surfaces as an in-app "HISTORICAL DATA" banner. One record is flagged
  `CLOSED` in the source data; it's shown on the map but excluded from distance calculations.
- Both datasets can be overridden at any time via the sidebar's GeoJSON/CSV upload controls
  (useful for a more current hospital dataset, for example).

## Features

- Interactive Leaflet map centered on San Antonio with all 156 crossings plotted
- Search crossings by name and filter by city council district
- Click any crossing for its name, district, coordinates, and CartID
- Scenario mode: mark a crossing as hypothetically **closed** (always labeled "SIMULATED") and
  clear the scenario at any time
- Hospital markers with straight-line distances from a selected crossing, explicitly labeled as
  straight-line only — never travel times or confirmed road access
- Summary cards (crossings loaded, hospitals loaded, crossings marked closed)
- Export the current scenario (selected crossing + simulated closures) as JSON
- Data attribution and limitations shown in-app (footer + "Potential Impact" panel)

## Limitations

This is a planning/screening aid, **not** a real-time navigation or emergency response system:

- No real road network, routing, or driving/EMS travel times — all distances are straight-line
  (haversine) estimates
- No live flood data, gauge readings, or crossing closure feeds — closures are user-selected
  simulations only
- Hospital data is a 2021 historical snapshot; current status, capacity, and new/closed facilities
  since then are not reflected
- Everything here is meant to prompt further investigation with real road and flood data, not to
  be used for live decisions
