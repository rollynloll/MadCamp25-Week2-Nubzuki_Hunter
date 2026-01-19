// src/ui/ingame/MapHUD.jsx
export default function MapHUD() {
  return (
    <div className="map-hud">
      <div className="hud-card">
        <div className="hud-stats">
          <div className="stat-pill">
            <span className="stat-label">Found</span>
            <span className="stat-value">5/10</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Points</span>
            <span className="stat-value">450</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">Time</span>
            <span className="stat-value">2d 5h</span>
          </div>
        </div>

        <button className="qr-button">Scan QR Code</button>
      </div>
    </div>
  );
}
