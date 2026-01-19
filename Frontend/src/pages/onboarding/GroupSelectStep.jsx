import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "./OnboardingLayout";
import GroupCard from "../../ui/onboarding/GroupCard";
import { apiGet, apiPost } from "../../data/api";

export default function GroupSelectStep() {
  const [selected, setSelected] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const loadGroups = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/groups/active");
        if (!active) return;
        const mapped = (data?.groups || []).map((group) => ({
          ...group,
          eye: group.captures_count ?? 0,
          score: group.total_score ?? 0,
          members: group.member_count ?? 0,
        }));
        setGroups(mapped);
        setSelected(null);
      } catch (err) {
        if (!active) return;
        console.error(err);
        setGroups([]);
        setError("분반 정보를 불러오지 못했어");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadGroups();

    return () => {
      active = false;
    };
  }, []);

  const handleComplete = async () => {
    const selectedGroup = groups.find((group) => group.id === selected);
    if (!selectedGroup) return;

    try {
      setSubmitting(true);
      await apiPost("/groups/join", { code: selectedGroup.code });
      navigate("/onboarding/complete");
    } catch (err) {
      console.error(err);
      alert("분반 선택 중 오류가 발생했어");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingLayout>
      <h1 className="login-title">분반을 선택해줘</h1>
      <p className="login-subtitle">선택한 분반의 점수가 누적돼</p>
      {error && <p className="login-subtitle">{error}</p>}

      <div className="login-actions">
        <div className="group-grid">
          {loading ? (
            <p className="login-subtitle">불러오는 중...</p>
          ) : groups.length ? (
            groups.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                selected={selected === g.id}
                onSelect={setSelected}
              />
            ))
          ) : (
            <p className="login-subtitle">참여 가능한 분반이 없어</p>
          )}
        </div>

        <button
          className="login-button"
          disabled={!selected || loading || submitting}
          onClick={handleComplete}
        >
          {submitting ? "선택 중..." : "선택 완료"}
        </button>
      </div>
    </OnboardingLayout>
  );
}
