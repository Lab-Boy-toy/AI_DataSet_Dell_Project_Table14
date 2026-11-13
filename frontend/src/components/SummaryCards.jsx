export default function SummaryCards({ crossingCount, hospitalCount, simulatedClosureCount }) {
  const cards = [
    { label: 'Low-Water Crossings Loaded', value: crossingCount, accent: 'teal' },
    { label: 'Hospitals Loaded', value: hospitalCount, accent: 'white' },
    { label: 'Crossings Marked Closed (Simulated)', value: simulatedClosureCount, accent: 'amber' },
  ];

  return (
    <div className="summary-cards">
      {cards.map((card) => (
        <div key={card.label} className={`summary-card summary-card--${card.accent}`}>
          <div className="summary-card__value">{card.value}</div>
          <div className="summary-card__label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
