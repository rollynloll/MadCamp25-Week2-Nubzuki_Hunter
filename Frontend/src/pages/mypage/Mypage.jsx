// src/pages/mypage/Mypage.jsx
import { useEffect, useState } from "react";
import "../../styles/mypage.css";

import ProfileCard from "../../ui/mypage/ProfileCard";
import StatusBadge from "../../ui/mypage/StatusBadge";
import EmptyState from "../../ui/mypage/EmptyState";
import ScoreSummary from "../../ui/mypage/ScoreSummary";
import StatsGrid from "../../ui/mypage/StatsGrid";

import { apiGet } from "../../data/api";

export default function Mypage() {
  const [profile, setProfile] = useState({
    nickname: "",
    group: "미선택",
    members: 0,
  });
  const [status, setStatus] = useState([]);
  const [score, setScore] = useState({
    point: 0,
    totalRank: 0,
    groupRank: 0,
  });
  const [stats, setStats] = useState({
    distance: 0,
    found: 0,
    buildings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadMypage = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await apiGet("/users/me");
        if (!active) return;

        setProfile((prev) => ({
          ...prev,
          nickname: me.nickname || prev.nickname,
        }));

        const [scoreData, groupData] = await Promise.all([
          apiGet("/score/me"),
          apiGet("/groups/me").catch((err) => {
            const message = String(err?.message || "");
            if (message.includes("404")) return null;
            throw err;
          }),
        ]);
        if (!active) return;

        let groupSnapshot = null;
        if (groupData?.id) {
          groupSnapshot = await apiGet(`/groups/${groupData.id}/snapshot`);
        }

        setProfile((prev) => ({
          ...prev,
          group: groupData?.name || prev.group,
          members: groupSnapshot?.members?.length ?? prev.members,
        }));

        const foundCount = scoreData?.captures_count ?? 0;
        const capturesData = await apiGet("/users/me/captures");
        const uniqueBuildings = new Set(
          (capturesData?.captures || [])
            .map((capture) => capture.location_name)
            .filter(Boolean)
        ).size;

        setStats((prev) => ({
          ...prev,
          found: foundCount,
          buildings: uniqueBuildings,
        }));

        if (scoreData?.game_id) {
          const result = await apiGet(`/games/${scoreData.game_id}/result`);
          const totalRank =
            (result?.personal_leaderboard || []).findIndex(
              (row) => row.user_id === me.id
            ) + 1;
          const groupRank =
            (result?.group_leaderboard || []).findIndex(
              (row) => row.group_id === groupData?.id
            ) + 1;

          setScore({
            point: scoreData?.score ?? 0,
            totalRank: totalRank > 0 ? totalRank : 0,
            groupRank: groupRank > 0 ? groupRank : 0,
          });
        } else {
          setScore({
            point: scoreData?.score ?? 0,
            totalRank: 0,
            groupRank: 0,
          });
        }

        const nextStatus = [];
        if (foundCount === 0) nextStatus.push("탐색 대기");
        if (foundCount > 0 && foundCount < 5) nextStatus.push("초보 헌터");
        if (foundCount >= 5) nextStatus.push("열정 헌터");
        setStatus(nextStatus);
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMypage();

    return () => {
      active = false;
    };
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
