// src/ui/ingame/MapOverlay.jsx
import campusMap from "../../assets/images/campus_map.png";

export default function MapOverlay() {
  return (
    <div className="map-overlay">
      <img src={campusMap} alt="Campus Map" />
    </div>
  );
}
