import { useNavigate } from "react-router-dom";
import "./Tutorial.css";

export default function TutorialStep2() {
  const navigate = useNavigate();

  return (
    <div className="tutorial-page tutorial-step-2">
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
          <span className="tutorial-icon" aria-hidden="true">👁️</span>
          <span className="tutorial-mission">MISSION 2</span>
        </div>
        <div className="tutorial-title">우리 팀 점수 합산</div>
        <div className="tutorial-desc">
          내가 모은 눈알이 분반 점수로 바로 합산돼.
        </div>
        <ul className="tutorial-list">
          <li>
            <span className="tutorial-bullet">✦</span>
            눈알 = 우리 팀 점수
          </li>
          <li>
            <span className="tutorial-bullet">✦</span>
            한 번 더 찾으면 우리 팀이 앞서
          </li>
          <li>
            <span className="tutorial-bullet">✦</span>
            내 행동이 팀 순위를 움직여
          </li>
        </ul>
        <div className="tutorial-actions">
          <button
            className="tutorial-button tutorial-button--secondary"
            onClick={() => navigate("/tutorial/1")}
            type="button"
          >
            이전
          </button>
          <button
            className="tutorial-button"
            onClick={() => navigate("/tutorial/3")}
            type="button"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
