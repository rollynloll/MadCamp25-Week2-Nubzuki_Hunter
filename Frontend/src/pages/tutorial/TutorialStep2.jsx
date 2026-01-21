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
        <div className="tutorial-title">핀과 상호작용</div>
        <div className="tutorial-desc">
          핀은 그냥 표시가 아니야. 다가가면 이벤트가 살아난다.
        </div>
        <ul className="tutorial-list">
          <li>
            <span className="tutorial-bullet">✦</span>
            핀은 게임 오브젝트, 눌러서 확인
          </li>
          <li>
            <span className="tutorial-bullet">✦</span>
            가까워질수록 탐험 보너스가 상승
          </li>
          <li>
            <span className="tutorial-bullet">✦</span>
            내 위치는 캐릭터로 표시된다
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
