import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RankingLayout from "./Ranking_layout";
import TopRankPodium from "../../ui/ranking/TopRankPodium";
import RankCard from "../../ui/ranking/RankCard";
import { apiFetch } from "../../lib/apiClient";

export default function RankingGroup() {
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

        const [leaderboard, myGroup] = await Promise.all([
          apiFetch(`/games/${game.id}/leaderboard`),
          apiFetch("/groups/me").catch((error) =>
            error?.status === 404 ? null : Promise.reject(error)
          ),
        ]);

        const items = (leaderboard?.leaderboard || []).map((entry, index) => ({
          id: entry.group_id,
          rank: index + 1,
          name: entry.name || "group",
          group: "분반",
          eye: entry.captures_count ?? 0,
          score: entry.score ?? 0,
        }));

        const mine =
          myGroup && items.find((item) => item.id === myGroup.id)
            ? items.find((item) => item.id === myGroup.id)
            : null;

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
    <RankingLayout activeTab="group">
      {status === "loading" && <p>랭킹 불러오는 중...</p>}
      {status === "empty" && <p>진행 중인 게임이 없어요.</p>}
      {status === "error" && <p>랭킹을 불러오지 못했어요.</p>}

      {status === "ready" && (
        <>
          <TopRankPodium top3={rows.slice(0, 3)} />

          {rows.slice(3).map((group) => (
            <RankCard key={group.id} data={group} />
          ))}

          {myRank && (
            <div className="my-rank">
              <RankCard data={myRank} highlight />
            </div>
          )}
        </>
      )}
    </RankingLayout>
  );
}
