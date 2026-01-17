// src/pages/ranking/Ranking_individual.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RankingLayout from "./Ranking_layout";
import TopRankPodium from "../../ui/ranking/TopRankPodium";
import RankCard from "../../ui/ranking/RankCard";
import { apiFetch } from "../../lib/apiClient";

export default function RankingIndividual() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus("loading");
      try {
        const activeGame = await apiFetch("/games/active");
        const game = activeGame?.game;
        if (!game) {
          if (active) {
            setRows([]);
            setMyRank(null);
            setStatus("empty");
          }
          return;
        }

        const result = await apiFetch(`/games/${game.id}/result`);
        const leaderboard = result?.personal_leaderboard || [];
        const items = leaderboard.map((entry, index) => ({
          id: entry.user_id,
          rank: index + 1,
          name: entry.nickname || "player",
          eye: entry.captures_count ?? 0,
          score: entry.score ?? 0,
        }));

        const userId = localStorage.getItem("nh_user_id");
        const mine = items.find((item) => item.id === userId) || null;

        if (active) {
          setRows(items);
          setMyRank(mine);
          setStatus("ready");
        }
      } catch (error) {
        if (!active) return;
        if (error?.status === 401) {
          localStorage.removeItem("nh_access_token");
          navigate("/");
          return;
        }
        setStatus("error");
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <RankingLayout activeTab="individual">
      {status === "loading" && <p>랭킹 불러오는 중...</p>}
      {status === "empty" && <p>진행 중인 게임이 없어요.</p>}
      {status === "error" && <p>랭킹을 불러오지 못했어요.</p>}

      {status === "ready" && (
        <>
          <TopRankPodium top3={rows.slice(0, 3)} />

          {rows.slice(3).map((u) => (
            <RankCard key={u.id} data={u} />
          ))}

          {myRank && <RankCard data={myRank} highlight />}
        </>
      )}
    </RankingLayout>
  );
}
