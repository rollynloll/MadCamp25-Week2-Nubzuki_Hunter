// src/pages/mypage/Mypage.jsx
import { useEffect, useState } from "react";
import "../../styles/mypage.css";

import ProfileCard from "../../ui/mypage/ProfileCard";
import StatusBadge from "../../ui/mypage/StatusBadge";
import EmptyState from "../../ui/mypage/EmptyState";
import ScoreSummary from "../../ui/mypage/ScoreSummary";
import StatsGrid from "../../ui/mypage/StatsGrid";

import { apiGet } from "../../data/api";
import { emptyStatsMock } from "../../data/mypage.mock";

export default function Mypage() {
  // 테스트: emptyStatsMock으로 변경해서 EmptyState 확인
  const data = emptyStatsMock;
  const { status, score, stats } = data;
  const [profile, setProfile] = useState(data.profile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGet("/users/me")
      .then((me) => {
        setProfile((prev) => ({
          ...prev,
          nickname: me.nickname || prev.nickname,
        }));
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="mypage-wrapper">
      {loading && <div>로딩중...</div>}
      {error && <div>로그인이 필요해요.</div>}
      <ProfileCard profile={profile} />

      {stats.found === 0 && <EmptyState />}

      <StatusBadge status={status} />

      <ScoreSummary score={score} />

      <StatsGrid stats={stats} />
    </div>
  );
}
