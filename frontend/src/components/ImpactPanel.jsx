export default function ImpactPanel() {
  return (
    <section className="impact-panel">
      <h3>Potential Impact on Emergency Medical Access</h3>
      <p>
        When a low-water crossing floods and closes, nearby residents may lose their most
        direct route to a hospital. This tool lets planners mark crossings as hypothetically
        closed and see straight-line distances to known hospitals, as a rough first screen for
        which areas might warrant closer study.
      </p>
      <h4>What this demo does <em>not</em> know</h4>
      <ul>
        <li>Actual road network connectivity, alternate routes, or detours around a closure</li>
        <li>Real driving or emergency-response travel times</li>
        <li>Current or forecasted flood levels, gauge readings, or rainfall data</li>
        <li>Live crossing status — all closures shown here are user-selected simulations</li>
        <li>
          Current hospital capacity, diversion status, or facility changes since the loaded dataset's
          2021 last-edit date (new, closed, or relocated facilities may not be reflected)
        </li>
      </ul>
      <h4>Additional data needed for a production tool</h4>
      <ul>
        <li>A routable road network graph (e.g., OSM road data with turn restrictions)</li>
        <li>A travel-time / isochrone engine incorporating the road graph</li>
        <li>Real-time or historical flood gauge and low-water crossing sensor data</li>
        <li>Verified hospital locations, capacity, and EMS routing agreements</li>
        <li>Validation from City of San Antonio Public Works / TxDOT data owners</li>
      </ul>
      <p className="impact-panel__disclaimer">
        This is a planning and screening aid, not a real-time navigation or emergency
        response system. Do not use it to make live routing or dispatch decisions.
      </p>
    </section>
  );
}
