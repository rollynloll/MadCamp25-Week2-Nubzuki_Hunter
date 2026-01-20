import { useNavigate } from "react-router-dom";
import "./Tutorial.css";

export default function TutorialStep1() {
  const navigate = useNavigate();

  return (
    <div className="tutorial-page">
      <div className="tutorial-card">
        <div className="tutorial-title">캠퍼스 헌팅 시작</div>
        <div className="tutorial-desc">
          지도 위에 표시된 핀을 찾아 이동하고, QR을 스캔해 눈알을 모아보세요.
        </div>
        <ul className="tutorial-list">
          <li>지도에서 핀을 눌러 정보를 확인하세요.</li>
          <li>가까운 핀일수록 보너스가 커집니다.</li>
          <li>탐험 → 이동 → 발견이 핵심 루프입니다.</li>
        </ul>
        <div className="tutorial-actions">
          <button className="tutorial-link" onClick={() => navigate("/ingame/map")}>
            건너뛰기
          </button>
          <button className="tutorial-button" onClick={() => navigate("/tutorial/2")}>
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
