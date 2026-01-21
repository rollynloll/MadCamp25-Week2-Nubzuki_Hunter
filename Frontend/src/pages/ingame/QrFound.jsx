import { useLocation, useNavigate } from "react-router-dom";
import nubzukiImage from "../../assets/images/nubzuki.png";

export default function QrFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const code = location.state?.code;
  const eyeball = location.state?.eyeball;
  const points = location.state?.points;
  const rewardPoints =
    typeof points === "number" ? `+${points}` : "+0";

  return (
    <div className="qr-found-page">
      <div className="qr-found-card">
        <span className="found-badge">발견!</span>
        <div className="reward-points">
          {rewardPoints}
          <span className="reward-unit">점</span>
        </div>
        <img src={nubzukiImage} alt="Nubzuki" className="reward-mascot" />
        <h1>보너스 점수 획득!</h1>
        <p>지금 바로 다음 눈알을 찾으러 가자!</p>
        <button className="qr-primary" onClick={() => navigate("/ingame/map")}>
          다음 눈알 찾으러 가기
        </button>
      </div>
    </div>
  );
}
