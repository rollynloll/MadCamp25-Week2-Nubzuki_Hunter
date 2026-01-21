// src/ui/ranking/TopBar.jsx
import { useNavigate } from "react-router-dom";
import iconBack from "../../assets/icons/icon_back.svg";
import iconProfile from "../../assets/icons/icon_profile.svg";

export default function TopBar() {
  const navigate = useNavigate();

  return (
    <div className="ranking-topbar">
      <button
        className="icon-btn"
        aria-label="뒤로가기"
        onClick={() => navigate("/ingame/map")}
      >
        <img src={iconBack} alt="" />
      </button>
      <div className="title">실시간 랭킹</div>
      <button
        className="icon-btn"
        aria-label="마이페이지"
        onClick={() => navigate("/mypage")}
      >
        <img src={iconProfile} alt="" />
      </button>
    </div>
  );
}
