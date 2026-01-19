// src/ui/ranking/TopBar.jsx
import { useNavigate } from "react-router-dom";

export default function TopBar() {
  const navigate = useNavigate();

  return (
    <div className="ranking-topbar">
      <button
        className="icon-btn"
        aria-label="뒤로가기"
        onClick={() => navigate("/ingame/map")}
      >
        ←
      </button>
      <div className="title">실시간 랭킹</div>
      <button
        className="icon-btn"
        aria-label="새로고침"
        onClick={() => window.location.reload()}
      >
        ⟳
      </button>
    </div>
  );
}
