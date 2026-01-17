// src/pages/ranking/Ranking_individual.jsx
import RankingLayout from "./Ranking_layout";
import TopRankPodium from "../../ui/ranking/TopRankPodium";
import RankCard from "../../ui/ranking/RankCard";
import { individualRanks, myRank } from "../../data/ranking.mock";

export default function RankingIndividual() {
  return (
    <RankingLayout activeTab="individual">
      <TopRankPodium top3={individualRanks.slice(0, 3)} />

      {individualRanks.slice(3).map((u) => (
        <RankCard key={u.id} data={u} />
      ))}

      <div className="my-rank">
        <div>{myRank.rank}</div>
        <div>{myRank.name}</div>
        <div>{myRank.score}점</div>
      </div>
    </RankingLayout>
  );
}
