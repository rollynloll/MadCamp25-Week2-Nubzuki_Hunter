// src/ui/ingame/UserMarker.jsx
import nubzuki from "../../assets/images/nubzuki.png";

export default function UserMarker({ position }) {
  // 실제 좌표 → 화면 좌표는 나중에 매핑
  return (
    <div className="user-marker">
      <img src={nubjuki} alt="me" />
      <div className="marker-label">현재 위치</div>
    </div>
  );
}
