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
        <div className="tutorial-title">랭킹과 보상</div>
        <div className="tutorial-desc">
          눈알은 기록이고, 점수는 경쟁이다. 이제 진짜 게임이 시작된다.
        </div>
        <ul className="tutorial-list">
          <li>
            <span className="tutorial-bullet">✦</span>
            랭킹은 점수 기준으로 승부
          </li>
          <li>
            <span className="tutorial-bullet">✦</span>
            첫 발견 보너스가 승부를 바꾼다
          </li>
          <li>
            <span className="tutorial-bullet">✦</span>
            지금 바로 핀을 찾아 출발하자
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
