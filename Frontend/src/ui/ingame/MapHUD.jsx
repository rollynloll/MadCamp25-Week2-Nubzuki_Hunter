// src/ui/ingame/MapHUD.jsx
import { useNavigate } from "react-router-dom";
import nubzukiImage from "../../assets/images/nubzuki.png";

export default function MapHUD() {
  const navigate = useNavigate();

  return (
    <div className="map-hud">
      <div className="hud-center">
        <img src={nubzukiImage} alt="Nubzuki" className="hud-character" />
        <p className="hud-line">근처에 눈알 발견!</p>
      </div>

      <button className="qr-button" onClick={() => navigate("/ingame/scan")}>
        QR 스캔하러 가기
      </button>
    </div>
  );
}
