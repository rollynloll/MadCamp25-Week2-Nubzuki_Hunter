import { useNavigate } from "react-router-dom";
import "./Tutorial.css";

export default function TutorialStep3() {
  const navigate = useNavigate();

  return (
    <div className="tutorial-page tutorial-step-3">
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
          <span className="tutorial-icon" aria-hidden="true">🏆</span>
          <span className="tutorial-mission">MISSION 3</span>
        </div>
        <div className="tutorial-title">분반 순위 경쟁</div>
        <div className="tutorial-desc">
          분반 점수로 순위가 결정돼. 내가 움직이면 승부가 바뀐다.
        </div>
        <ul className="tutorial-list">
          <li>
            <span className="tutorial-bullet">✦</span>
            우리 팀 순위는 내 발견으로 바뀜
          </li>
          <li>
            <span className="tutorial-bullet">✦</span>
            눈알 차이가 순위를 가른다
          </li>
          <li>
            <span className="tutorial-bullet">✦</span>
            지금 출발해서 순위를 올리자
          </li>
        </ul>
        <div className="tutorial-actions">
          <button
            className="tutorial-button tutorial-button--secondary"
            onClick={() => navigate("/tutorial/2")}
            type="button"
          >
            이전
          </button>
          <button
            className="tutorial-button"
            onClick={() => navigate("/ingame/map")}
            type="button"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
