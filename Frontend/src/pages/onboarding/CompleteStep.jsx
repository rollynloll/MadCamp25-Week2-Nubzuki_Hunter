import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./OnboardingLayout";

export default function CompleteStep() {
  const navigate = useNavigate();

  return (
    <OnboardingLayout>
      <h1 className="login-title">준비 완료!</h1>
      <p className="login-subtitle">이제 눈알을 찾으러 가볼까?</p>

      <div className="login-actions">
        <button
          className="login-button"
          onClick={() => navigate("/ingame/map")}
        >
          게임 시작
        </button>
      </div>
    </OnboardingLayout>
  );
}
