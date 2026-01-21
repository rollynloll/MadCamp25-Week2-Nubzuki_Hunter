import { useNavigate } from "react-router-dom";
import "./Tutorial.css";

export default function TutorialStep1() {
  const navigate = useNavigate();

  return (
    <div className="tutorial-page tutorial-step-1">
      <div className="tutorial-card">
        <button
          className="tutorial-close"
          onClick={() => navigate("/ingame/map")}
          aria-label="튜토리얼 닫기"
          type="button"
        >
          ×
        </button>
        <div className="tutorial-header">
          <span className="tutorial-icon" aria-hidden="true">📍</span>
          <span className="tutorial-mission">MISSION 1</span>
        </div>
        <div className="tutorial-title">캠퍼스 헌팅 시작</div>
        <div className="tutorial-desc">
          이 지도는 이제 게임 필드야. 핀을 따라 움직이면서 첫 눈알을 찾아보자.
        </div>
        <ul className="tutorial-list">
          <li>
            <span className="tutorial-bullet">✦</span>
            핀을 터치하면 숨겨진 장소가 열린다
          </li>
          <li>
            <span className="tutorial-bullet">✦</span>
            가까이 갈수록 보너스 눈알이 커진다
          </li>
          <li>
            <span className="tutorial-bullet">✦</span>
            탐험 → 이동 → 발견이 핵심 루프
          </li>
        </ul>
        <div className="tutorial-actions">
          <button
            className="tutorial-button tutorial-button--secondary"
            onClick={() => navigate("/ingame/map")}
            type="button"
          >
            건너뛰기
          </button>
          <button
            className="tutorial-button"
            onClick={() => navigate("/tutorial/2")}
            type="button"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
