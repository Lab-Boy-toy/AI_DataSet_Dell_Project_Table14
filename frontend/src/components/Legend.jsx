export default function Legend() {
  return (
    <div className="legend">
      <h3>Legend</h3>
      <ul>
        <li>
          <span className="legend-dot legend-dot--crossing" /> Low-water crossing
        </li>
        <li>
          <span className="legend-dot legend-dot--selected" /> Selected crossing
        </li>
        <li>
          <span className="legend-dot legend-dot--closed" /> Closed — <strong>SIMULATED</strong>
        </li>
        <li>
          <span className="legend-dot legend-dot--hospital" /> Hospital
        </li>
        <li>
          <span className="legend-dot legend-dot--hospital-closed" /> Hospital — closed (historical record)
        </li>
        <li>
          <span className="legend-line" /> Straight-line distance (not a route)
        </li>
      </ul>
    </div>
  );
}
