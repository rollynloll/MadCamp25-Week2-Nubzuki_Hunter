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
        <div className="tutorial-title">움직이면 눈알 획득</div>
        <div className="tutorial-desc">
          내가 움직인 만큼 눈알이 쌓여. 지금 바로 첫 발견을 해보자.
        </div>
        <ul className="tutorial-list">
          <li>
            <span className="tutorial-bullet">✦</span>
            핀으로 이동하면 눈알을 얻을 수 있어
          </li>
          <li>
            <span className="tutorial-bullet">✦</span>
            가까울수록 보너스가 커져
          </li>
          <li>
            <span className="tutorial-bullet">✦</span>
            지도에서 바로 움직여 보자
          </li>
        </ul>
        <div className="tutorial-actions tutorial-actions--single">
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
