import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./OnboardingLayout";

export default function NicknameStep() {
  const [nickname, setNickname] = useState("");
  const navigate = useNavigate();

  const handleNext = () => {
    if (!nickname.trim()) return;
    navigate("/onboarding/group");
  };

  return (
    <OnboardingLayout>
      <h1>닉네임을 입력해줘</h1>
      <p>게임에서 사용될 이름이야</p>

      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="닉네임 입력"
      />

      <button onClick={handleNext}>다음</button>
    </OnboardingLayout>
  );
}
