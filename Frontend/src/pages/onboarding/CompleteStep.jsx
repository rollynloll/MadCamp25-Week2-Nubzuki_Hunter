import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./OnboardingLayout";

export default function CompleteStep() {
  const navigate = useNavigate();

  return (
    <OnboardingLayout>
      <h1>준비 완료!</h1>
      <p>이제 눈알을 찾으러 가볼까?</p>

      <button onClick={() => navigate("/ranking/individual")}>
        게임 시작
      </button>
    </OnboardingLayout>
  );
}
