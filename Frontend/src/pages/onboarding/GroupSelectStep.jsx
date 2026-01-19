import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./OnboardingLayout";
import GroupCard from "../../ui/onboarding/GroupCard";
import { groups } from "../../data/group.mock";

export default function GroupSelectStep() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  return (
    <OnboardingLayout>
      <h1 className="login-title">분반을 선택해줘</h1>
      <p className="login-subtitle">선택한 분반의 점수가 누적돼</p>

      <div className="login-actions">
        <div className="group-grid">
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              selected={selected === g.id}
              onSelect={setSelected}
            />
          ))}
        </div>

        <button
          className="login-button"
          disabled={!selected}
          onClick={() => navigate("/onboarding/complete")}
        >
          선택 완료
        </button>
      </div>
    </OnboardingLayout>
  );
}
