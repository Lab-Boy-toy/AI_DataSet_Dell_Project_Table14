export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__mark" aria-hidden="true">⌁</span>
        <div>
          <h1>FloodSafe SA</h1>
          <p className="app-header__tagline">
            Low-water crossing closure &amp; emergency access screening tool — San Antonio, TX
          </p>
        </div>
      </div>
      <div className="app-header__badge">
        Dell Social Impact AI Datathon · UT San Antonio
      </div>
    </header>
  );
}
