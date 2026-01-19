import { useLocation, useNavigate } from "react-router-dom";
import nubzukiImage from "../../assets/images/nubzuki.png";

export default function QrFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const code = location.state?.code;

  return (
    <div className="qr-found-page">
      <div className="qr-found-card">
        <span className="found-badge">발견!</span>
        <img src={nubzukiImage} alt="Nubzuki" />
        <h1>눈알을 찾았어!</h1>
        <p>넙죽이가 눈알을 회수했어. 바로 점수에 반영돼!</p>
        {code && <div className="found-code">QR: {code}</div>}
        <button className="qr-primary" onClick={() => navigate("/ingame/map")}>
          인게임으로 돌아가기
        </button>
      </div>
    </div>
  );
}
