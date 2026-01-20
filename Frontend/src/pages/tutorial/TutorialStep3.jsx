import { useNavigate } from "react-router-dom";
import "./Tutorial.css";

export default function TutorialStep3() {
  const navigate = useNavigate();

  return (
    <div className="tutorial-page">
      <div className="tutorial-card">
        <div className="tutorial-title">랭킹과 보상</div>
        <div className="tutorial-desc">
          눈알은 기록이고, 점수는 경쟁입니다. 더 많이 발견할수록 상위권에 가까워져요.
        </div>
        <ul className="tutorial-list">
          <li>랭킹은 점수 기준으로 정렬됩니다.</li>
          <li>첫 발견 보너스 같은 추가 점수가 있습니다.</li>
          <li>지금 바로 핀을 찾고 출발해보세요.</li>
        </ul>
        <div className="tutorial-actions">
          <button className="tutorial-link" onClick={() => navigate("/tutorial/2")}>
            이전
          </button>
          <button className="tutorial-button" onClick={() => navigate("/ingame/map")}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
