import { useRef } from 'react';

function UploadButton({ label, accept, onFile, hint }) {
  const inputRef = useRef(null);
  return (
    <div className="upload-button">
      <button type="button" className="btn btn--ghost" onClick={() => inputRef.current?.click()}>
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      {hint && <p className="upload-button__hint">{hint}</p>}
    </div>
  );
}

export default function Sidebar({
  crossings,
  filteredCrossings,
  districts,
  search,
  onSearchChange,
  districtFilter,
  onDistrictFilterChange,
  selectedCrossingId,
  onSelectCrossing,
  simulatedClosures,
  onToggleClosure,
  onClearScenario,
  onUploadCrossings,
  onUploadHospitals,
  crossingsError,
  hospitalsError,
  hospitals,
  onExport,
}) {
  const selectedCrossing = crossings.find((c) => c.id === selectedCrossingId) || null;

  return (
    <aside className="sidebar">
      <section className="sidebar-section sidebar-section--search">
        <h3>Find a Crossing</h3>
        <input
          type="text"
          className="text-input"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <select
          className="select-input"
          value={districtFilter}
          onChange={(e) => onDistrictFilterChange(e.target.value)}
        >
          <option value="all">All council districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              District {d}
            </option>
          ))}
        </select>
        <div className="crossing-list">
          {filteredCrossings.length === 0 && (
            <p className="empty-note">No crossings match your search/filter.</p>
          )}
          {filteredCrossings.map((c) => {
            const isClosed = simulatedClosures.has(c.id);
            const isSelected = c.id === selectedCrossingId;
            return (
              <button
                key={c.id}
                type="button"
                className={`crossing-list__item ${isSelected ? 'is-selected' : ''} ${isClosed ? 'is-closed' : ''}`}
                onClick={() => onSelectCrossing(c.id)}
              >
                <span className="crossing-list__name">{c.name}</span>
                <span className="crossing-list__meta">
                  District {c.councilDistrict}
                  {isClosed && <span className="pill pill--amber">SIMULATED CLOSED</span>}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="sidebar-section sidebar-section--pinned">
        <h3>Selected Crossing</h3>
        {!selectedCrossing && <p className="empty-note">Click a crossing on the map or list to see details.</p>}
        {selectedCrossing && (
          <div className="detail-card">
            <div className="detail-card__title">{selectedCrossing.name}</div>
            <dl>
              <dt>CartID</dt>
              <dd>{selectedCrossing.cartId}</dd>
              <dt>Council District</dt>
              <dd>{selectedCrossing.councilDistrict}</dd>
              <dt>Coordinates</dt>
              <dd>
                {selectedCrossing.lat.toFixed(5)}, {selectedCrossing.lng.toFixed(5)}
              </dd>
            </dl>
            <div className="scenario-controls">
              {simulatedClosures.has(selectedCrossing.id) ? (
                <button className="btn btn--amber" onClick={() => onToggleClosure(selectedCrossing.id)}>
                  Clear Simulated Closure
                </button>
              ) : (
                <button className="btn btn--primary" onClick={() => onToggleClosure(selectedCrossing.id)}>
                  Mark as Closed (Simulated)
                </button>
              )}
            </div>
            {hospitals.length === 0 && (
              <p className="empty-note">Upload hospital data below to see straight-line distances.</p>
            )}
          </div>
        )}
      </section>

      <section className="sidebar-section sidebar-section--pinned">
        <h3>Scenario</h3>
        <p className="scenario-count">
          {simulatedClosures.size} crossing{simulatedClosures.size === 1 ? '' : 's'} marked closed{' '}
          <span className="pill pill--amber">SIMULATED</span>
        </p>
        <div className="scenario-actions">
          <button className="btn btn--ghost" onClick={onClearScenario} disabled={simulatedClosures.size === 0}>
            Clear Scenario
          </button>
          <button className="btn btn--primary" onClick={onExport} disabled={crossings.length === 0}>
            Export Scenario JSON
          </button>
        </div>
      </section>

      <section className="sidebar-section">
        <h3>Data Sources</h3>
        <UploadButton
          label="Upload Crossings GeoJSON"
          accept=".geojson,.json,application/geo+json,application/json"
          onFile={onUploadCrossings}
          hint="FeatureCollection of Point features (Name, CartID, CouncilDistrict)."
        />
        {crossingsError && <p className="error-note">{crossingsError}</p>}
        <UploadButton
          label="Upload Hospitals (GeoJSON or CSV)"
          accept=".geojson,.json,.csv,application/geo+json,application/json,text/csv"
          onFile={onUploadHospitals}
          hint="CSV columns: name, latitude, longitude. GeoJSON: Point features with a name property."
        />
        {hospitalsError && <p className="error-note">{hospitalsError}</p>}
      </section>
    </aside>
  );
}
