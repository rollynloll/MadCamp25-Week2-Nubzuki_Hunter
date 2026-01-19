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
  const [me, setMe] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus("loading");
      try {
        const [activeGame, meRes] = await Promise.all([
          apiFetch("/games/active"),
          apiFetch("/users/me"),
        ]);
        const game = activeGame?.game;
        if (!game) {
          if (active) {
            setRows([]);
            setMe(meRes || null);
            setStatus("empty");
          }
          return;
        }

        const result = await apiFetch(`/games/${game.id}/result`);
        const personal = result?.personal_leaderboard || [];
        const items = personal.map((entry, index) => ({
          id: entry.user_id,
          rank: index + 1,
          name: entry.nickname || "player",
          eye: entry.captures_count ?? 0,
          score: entry.score ?? 0,
        }));

        if (active) {
          setRows(items);
          setMe(meRes || null);
          setStatus(items.length ? "ready" : "empty");
        }
      } catch (error) {
        if (!active) return;
        if (error?.status === 401) {
          localStorage.removeItem("access_token");
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

  const myId = me?.id;

  return (
    <RankingLayout activeTab="individual">
      {status === "loading" && <p>랭킹 불러오는 중...</p>}
      {status === "empty" && <p>진행 중인 게임이 없거나 랭킹 데이터가 없어요.</p>}
      {status === "error" && <p>랭킹을 불러오지 못했어요.</p>}

      {status === "ready" && (
        <>
          <TopRankPodium top3={rows.slice(0, 3)} />

          {rows.slice(3).map((u) => (
            <RankCard
              key={u.id}
              data={u}
              highlight={u.id === myId}
              highlightLabel={u.id === myId ? "내 랭킹" : undefined}
            />
          ))}
        </>
      )}
    </RankingLayout>
  );
}
