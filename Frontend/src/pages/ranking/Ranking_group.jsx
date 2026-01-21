import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RankingLayout from "./Ranking_layout";
import TopRankPodium from "../../ui/ranking/TopRankPodium";
import RankCard from "../../ui/ranking/RankCard";
import { apiFetch } from "../../lib/apiClient";

export default function RankingGroup() {
  const navigate = useNavigate();
  const [groupRows, setGroupRows] = useState([]);
  const [personalRows, setPersonalRows] = useState([]);
  const [myGroupId, setMyGroupId] = useState(null);
  const [me, setMe] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setStatus("loading");
      try {
        const [activeGame, meRes, myGroup] = await Promise.all([
          apiFetch("/games/active"),
          apiFetch("/users/me"),
          apiFetch("/groups/me").catch((error) =>
            error?.status === 404 ? null : Promise.reject(error)
          ),
        ]);
        const game = activeGame?.game;
        if (!game) {
          if (active) {
            setGroupRows([]);
            setPersonalRows([]);
            setMyGroupId(null);
            setMe(meRes || null);
            setStatus("empty");
          }
          return;
        }

        const [leaderboard, result] = await Promise.all([
          apiFetch(`/games/${game.id}/leaderboard`),
          apiFetch(`/games/${game.id}/result`),
        ]);

        const groupItems = (leaderboard?.leaderboard || []).map((entry, index) => ({
          id: entry.group_id,
          rank: index + 1,
          name: entry.name || "group",
          eye: entry.captures_count ?? 0,
          score: entry.score ?? 0,
        }));

        const personal = result?.personal_leaderboard || [];
        const personalItems = personal
          .reduce((acc, entry) => {
            if (!entry?.user_id || acc.some((u) => u.user_id === entry.user_id)) {
              return acc;
            }
            acc.push(entry);
            return acc;
          }, [])
          .map((entry, index) => ({
            id: entry.user_id,
            rank: index + 1,
            name: entry.nickname || "player",
            eye: entry.captures_count ?? 0,
            score: entry.score ?? 0,
          }));

        const enrichWithGaps = (items) => {
          if (!items.length) return [];
          return items.map((item, index) => {
            if (index === 0) {
              return { ...item, gapText: null };
            }
            const prevEye = items[index - 1]?.eye ?? item.eye;
            const neededEyes = Math.max(prevEye - item.eye, 0) + 1;
            const gapText =
              neededEyes <= 1
                ? "눈알 1개만 찾아도 순위 변동 가능"
                : `눈알 ${neededEyes}개 더 찾으면 다음 순위`;
            return { ...item, gapText };
          });
        };

        const groupItemsWithGaps = enrichWithGaps(groupItems);
        const personalItemsWithGaps = enrichWithGaps(personalItems);

        if (active) {
          setGroupRows(groupItemsWithGaps);
          setPersonalRows(personalItemsWithGaps);
          setMyGroupId(myGroup?.id ?? null);
          setMe(meRes || null);
          setStatus(
            groupItemsWithGaps.length || personalItemsWithGaps.length ? "ready" : "empty"
          );
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
  const groupTopCount = Math.min(groupRows.length, 3);
  const personalTopCount = Math.min(personalRows.length, 3);
  const groupTop3 = groupRows.slice(0, groupTopCount);
  const groupRest = groupRows.slice(groupTopCount);
  const personalTop3 = personalRows.slice(0, personalTopCount);
  const personalRest = personalRows.slice(personalTopCount);

  return (
    <RankingLayout activeTab="group" showTabs={false}>
      {status === "loading" && <p>랭킹 불러오는 중...</p>}
      {status === "empty" && <p>진행 중인 게임이 없어요.</p>}
      {status === "error" && <p>랭킹을 불러오지 못했어요.</p>}

      {status === "ready" && (
        <>
          <section className="ranking-section ranking-section--group">
            <h2 className="ranking-section-title">분반 랭킹</h2>
            <p className="ranking-section-subtitle">다음 눈알로 순위가 바뀔 수 있어요.</p>
            {groupRows.length ? (
              <>
                <TopRankPodium top3={groupTop3} highlightId={myGroupId} />
                <div className="ranking-divider" aria-hidden="true" />
                {groupRest.map((group) => (
                  <RankCard
                    key={group.id}
                    data={group}
                    highlight={group.id === myGroupId}
                    highlightLabel={group.id === myGroupId ? "내 분반" : undefined}
                    gapText={group.id === myGroupId ? group.gapText : null}
                  />
                ))}
              </>
            ) : (
              <p>분반 랭킹 데이터가 없어요.</p>
            )}
          </section>

          <section className="ranking-section ranking-section--personal">
            <h2 className="ranking-section-title">개인 랭킹</h2>
            <p className="ranking-section-subtitle">지금 이동하면 순위를 올릴 수 있어요.</p>
            {personalRows.length ? (
              <>
                <TopRankPodium top3={personalTop3} highlightId={myId} />
                <div className="ranking-divider" aria-hidden="true" />
                {personalRest.map((player) => (
                  <RankCard
                    key={player.id}
                    data={player}
                    highlight={player.id === myId}
                    highlightLabel={player.id === myId ? "내 랭킹" : undefined}
                    gapText={player.id === myId ? player.gapText : null}
                  />
                ))}
              </>
            ) : (
              <p>개인 랭킹 데이터가 없어요.</p>
            )}
          </section>
          <div className="ranking-cta-wrap">
            <button
              type="button"
              className="ranking-cta-button"
              onClick={() => navigate("/ingame/map")}
            >
              지도에서 선점하러 가기
            </button>
          </div>
        </>
      )}
    </RankingLayout>
  );
}
