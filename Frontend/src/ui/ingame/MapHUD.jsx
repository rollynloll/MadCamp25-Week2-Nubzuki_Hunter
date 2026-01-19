// src/ui/ingame/MapHUD.jsx
export default function MapHUD() {
  return (
    <div className="map-hud">
      <div className="stats">
        <div>5/10 Found</div>
        <div>450 Points</div>
        <div>2d 5h</div>
      </div>

      <button className="qr-button">
        Scan QR Code
      </button>
    </div>
  );
}
