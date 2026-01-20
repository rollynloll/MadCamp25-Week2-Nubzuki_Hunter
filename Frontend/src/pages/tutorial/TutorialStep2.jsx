import { useNavigate } from "react-router-dom";
import "./Tutorial.css";

export default function TutorialStep2() {
  const navigate = useNavigate();

  return (
    <div className="tutorial-page">
      <div className="tutorial-card">
        <div className="tutorial-title">핀과 상호작용</div>
        <div className="tutorial-desc">
          핀을 누르면 그 장소의 이벤트와 눈알 정보를 확인할 수 있어요.
        </div>
        <ul className="tutorial-list">
          <li>핀은 게임 오브젝트입니다.</li>
          <li>가까워질수록 탐험 보너스가 증가합니다.</li>
          <li>현재 위치는 캐릭터 마커로 표시됩니다.</li>
        </ul>
        <div className="tutorial-actions">
          <button className="tutorial-link" onClick={() => navigate("/tutorial/1")}>
            이전
          </button>
          <button className="tutorial-button" onClick={() => navigate("/tutorial/3")}>
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
