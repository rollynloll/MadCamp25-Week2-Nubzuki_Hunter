import RankingLayout from "./Ranking_layout";
import TopRankPodium from "../../ui/ranking/TopRankPodium";
import RankCard from "../../ui/ranking/RankCard";
import { groupRanks, myGroupRank } from "../../data/ranking.mock";

export default function RankingGroup() {
  return (
    <RankingLayout activeTab="group">
      {/* Top 3 분반 포디움 */}
      <TopRankPodium top3={groupRanks.slice(0, 3)} />

      {/* 4등 이후 */}
      {groupRanks.slice(3).map((group) => (
        <RankCard
          key={group.id}
          data={{
            rank: group.rank,
            name: group.name,
            group: "분반",
            eye: group.eye,
            score: group.score,
          }}
        />
      ))}

      {/* 내 분반 */}
      <div className="my-rank">
        <div className="my-rank-inner">
          <div className="rank-num">{myGroupRank.rank}</div>
          <div className="info">
            <div className="name">{myGroupRank.name}</div>
            <div className="meta">👁 {myGroupRank.eye}</div>
          </div>
          <div className="score">{myGroupRank.score}점</div>
        </div>
      </div>
    </RankingLayout>
  );
}
