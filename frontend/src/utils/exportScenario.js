export function buildScenarioExport({ crossings, hospitals, simulatedClosures, selectedCrossingId }) {
  const closedCrossings = crossings.filter((c) => simulatedClosures.has(c.id));
  const selected = crossings.find((c) => c.id === selectedCrossingId) || null;

  return {
    tool: 'FloodSafe SA — screening demo',
    disclaimer:
      'All closure statuses in this export are HYPOTHETICAL / SIMULATED planning scenarios, not real-time flood or closure reports. Distances are straight-line only, not travel times or confirmed road access.',
    generatedAt: new Date().toISOString(),
    counts: {
      crossingsLoaded: crossings.length,
      hospitalsLoaded: hospitals.length,
      crossingsMarkedClosedSimulated: closedCrossings.length,
    },
    selectedCrossing: selected
      ? {
          name: selected.name,
          cartId: selected.cartId,
          councilDistrict: selected.councilDistrict,
          lat: selected.lat,
          lng: selected.lng,
        }
      : null,
    simulatedClosures: closedCrossings.map((c) => ({
      name: c.name,
      cartId: c.cartId,
      councilDistrict: c.councilDistrict,
      lat: c.lat,
      lng: c.lng,
      status: 'SIMULATED_CLOSED',
    })),
  };
}

export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
