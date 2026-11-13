import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import Legend from './components/Legend';
import ImpactPanel from './components/ImpactPanel';
import { parseCrossingsGeoJSON, CrossingParseError } from './utils/parseCrossings';
import { parseHospitalsGeoJSON, parseHospitalsCSV, HospitalParseError } from './utils/parseHospitals';
import { buildScenarioExport, downloadJSON } from './utils/exportScenario';
import './App.css';

const CROSSINGS_AUTO_LOAD_PATH = '/data/low_water_crossings.geojson';
const HOSPITALS_AUTO_LOAD_PATH = '/data/hospitals.geojson';

export default function App() {
  const [crossings, setCrossings] = useState([]);
  const [crossingsStatus, setCrossingsStatus] = useState('loading'); // loading | auto-loaded | empty | error
  const [crossingsError, setCrossingsError] = useState(null);

  const [hospitals, setHospitals] = useState([]);
  const [hospitalsMeta, setHospitalsMeta] = useState(null);
  const [hospitalsStatus, setHospitalsStatus] = useState('loading'); // loading | auto-loaded | empty
  const [hospitalsError, setHospitalsError] = useState(null);

  const [selectedCrossingId, setSelectedCrossingId] = useState(null);
  const [simulatedClosures, setSimulatedClosures] = useState(() => new Set());

  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    fetch(CROSSINGS_AUTO_LOAD_PATH)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const { crossings: parsed } = parseCrossingsGeoJSON(json, CROSSINGS_AUTO_LOAD_PATH);
        setCrossings(parsed);
        setCrossingsStatus('auto-loaded');
      })
      .catch(() => {
        if (cancelled) return;
        setCrossingsStatus('empty');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(HOSPITALS_AUTO_LOAD_PATH)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const { hospitals: parsed, metadata } = parseHospitalsGeoJSON(json, HOSPITALS_AUTO_LOAD_PATH);
        setHospitals(parsed);
        setHospitalsMeta(metadata);
        setHospitalsStatus('auto-loaded');
      })
      .catch(() => {
        // Expected when no hospital dataset has been placed yet — manual upload remains available.
        if (cancelled) return;
        setHospitalsStatus('empty');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const districts = useMemo(() => {
    const set = new Set(crossings.map((c) => c.councilDistrict));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [crossings]);

  const filteredCrossings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return crossings.filter((c) => {
      const matchesSearch = q === '' || c.name.toLowerCase().includes(q);
      const matchesDistrict = districtFilter === 'all' || c.councilDistrict === districtFilter;
      return matchesSearch && matchesDistrict;
    });
  }, [crossings, search, districtFilter]);

  function handleUploadCrossings(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        const { crossings: parsed } = parseCrossingsGeoJSON(json, file.name);
        setCrossings(parsed);
        setCrossingsStatus('auto-loaded');
        setCrossingsError(null);
        setSelectedCrossingId(null);
        setSimulatedClosures(new Set());
      } catch (err) {
        setCrossingsError(err instanceof CrossingParseError ? err.message : `Could not read ${file.name} as GeoJSON.`);
      }
    };
    reader.readAsText(file);
  }

  function handleUploadHospitals(file) {
    const reader = new FileReader();
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    reader.onload = () => {
      try {
        const { hospitals: parsed, metadata } = isCsv
          ? parseHospitalsCSV(reader.result, file.name)
          : parseHospitalsGeoJSON(JSON.parse(reader.result), file.name);
        setHospitals(parsed);
        setHospitalsMeta(metadata);
        setHospitalsStatus('auto-loaded');
        setHospitalsError(null);
      } catch (err) {
        setHospitalsError(err instanceof HospitalParseError ? err.message : `Could not read ${file.name}.`);
      }
    };
    reader.readAsText(file);
  }

  function toggleClosure(crossingId) {
    setSimulatedClosures((prev) => {
      const next = new Set(prev);
      if (next.has(crossingId)) next.delete(crossingId);
      else next.add(crossingId);
      return next;
    });
  }

  function clearScenario() {
    setSimulatedClosures(new Set());
  }

  function handleExport() {
    const data = buildScenarioExport({ crossings, hospitals, simulatedClosures, selectedCrossingId });
    downloadJSON(data, `floodsafe-sa-scenario-${Date.now()}.json`);
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <div className="app-intro">
          <p>
            Explore how closing known low-water crossings during flooding could affect straight-line
            access to hospitals across San Antonio. Load real crossing and hospital data, simulate a
            closure scenario, and export your findings for further analysis.
          </p>
        </div>

        <SummaryCards
          crossingCount={crossings.length}
          hospitalCount={hospitals.length}
          simulatedClosureCount={simulatedClosures.size}
        />

        <div className="app-body">
          <Sidebar
            crossings={crossings}
            filteredCrossings={filteredCrossings}
            districts={districts}
            search={search}
            onSearchChange={setSearch}
            districtFilter={districtFilter}
            onDistrictFilterChange={setDistrictFilter}
            selectedCrossingId={selectedCrossingId}
            onSelectCrossing={setSelectedCrossingId}
            simulatedClosures={simulatedClosures}
            onToggleClosure={toggleClosure}
            onClearScenario={clearScenario}
            onUploadCrossings={handleUploadCrossings}
            onUploadHospitals={handleUploadHospitals}
            crossingsError={crossingsError}
            hospitalsError={hospitalsError}
            hospitals={hospitals}
            onExport={handleExport}
          />

          <div className="app-map-col">
            {crossingsStatus === 'empty' && crossings.length === 0 && (
              <div className="banner banner--info">
                No crossing data found at <code>public/data/low_water_crossings.geojson</code>. Upload a
                GeoJSON file from the sidebar to get started.
              </div>
            )}
            {hospitalsStatus === 'empty' && hospitals.length === 0 && (
              <div className="banner banner--muted">
                No hospital data loaded. Upload a GeoJSON or CSV of hospitals to see straight-line
                distances from a selected crossing.
              </div>
            )}
            {hospitals.length > 0 && hospitalsMeta?.historical && (
              <div className="banner banner--amber">
                <span className="pill pill--amber">HISTORICAL DATA</span> Hospital locations last edited{' '}
                <strong>{hospitalsMeta.datasetLastEditDate?.slice(0, 10) || '2021-08-30'}</strong> (HIFLD-derived,
                via public ArcGIS FeatureServer). Status and capacity may have changed since — verify before
                operational use.
              </div>
            )}
            <MapView
              crossings={crossings}
              hospitals={hospitals}
              selectedCrossingId={selectedCrossingId}
              onSelectCrossing={setSelectedCrossingId}
              simulatedClosures={simulatedClosures}
            />
            <Legend />
          </div>
        </div>

        <ImpactPanel />

        <footer className="app-footer">
          <h4>Data Attribution &amp; Limitations</h4>
          <ul>
            <li>Map tiles &amp; road geometry: &copy; OpenStreetMap contributors (openstreetmap.org/copyright)</li>
            <li>Low-water crossing locations: user-provided GeoJSON (expected source: City of San Antonio open data)</li>
            <li>
              Hospital locations: {hospitalsMeta?.historical
                ? `HIFLD-derived dataset via public ArcGIS FeatureServer, last edited ${
                    hospitalsMeta.datasetLastEditDate?.slice(0, 10) || '2021-08-30'
                  } — historical snapshot, not live`
                : 'user-provided upload only — none are bundled or fabricated by this demo'}
            </li>
            <li>Distances shown are straight-line (haversine) estimates, not driving routes or travel times</li>
            <li>Closure statuses are simulated planning scenarios chosen by the user, not live flood reports</li>
            <li>Built for the Dell Social Impact AI Datathon at UT San Antonio — not a production emergency system</li>
          </ul>
        </footer>
      </main>
    </div>
  );
}
