import { useLocation, useNavigate } from "react-router-dom";
import nubzukiImage from "../../assets/images/nubzuki.png";
import "./QrFound.css";

export default function QrFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const points = location.state?.points;
  const rewardLabel =
    typeof points === "number" ? `+${points}점 획득!` : "보너스 점수 획득!";

  return (
    <div className="qr-found-page">
      <div className="qr-found-card">
        <span className="found-badge">발견!</span>
        <div className="reward-title">{rewardLabel}</div>
        <img src={nubzukiImage} alt="Nubzuki" className="reward-mascot" />
        <p className="reward-desc">지금 바로 다음 눈알을 찾으러 가자!</p>
        <button className="qr-primary" onClick={() => navigate("/ingame/map")}>
          다음 눈알 찾으러 가기
        </button>
      </div>
    </div>
  );
}
