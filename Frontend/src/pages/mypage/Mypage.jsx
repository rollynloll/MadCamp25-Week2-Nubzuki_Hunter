// src/pages/mypage/Mypage.jsx
import "../../styles/mypage.css";

import ProfileCard from "../../ui/mypage/ProfileCard";
import StatusBadge from "../../ui/mypage/StatusBadge";
import EmptyState from "../../ui/mypage/EmptyState";
import ScoreSummary from "../../ui/mypage/ScoreSummary";
import StatsGrid from "../../ui/mypage/StatsGrid";

import { mypageData, emptyStatsMock } from "../../data/mypage.mock";

export default function Mypage() {
  // 테스트: emptyStatsMock으로 변경해서 EmptyState 확인
  const data = emptyStatsMock;
  const { profile, status, score, stats } = data;

  return (
    <div className="mypage-wrapper">
      <ProfileCard profile={profile} />

      {stats.found === 0 && <EmptyState />}

      <StatusBadge status={status} />

      <ScoreSummary score={score} />

      <StatsGrid stats={stats} />
    </div>
  );
}
