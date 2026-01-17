// src/ui/mypage/ScoreSummary.jsx
export default function ScoreSummary({ score }) {
  return (
    <div className="score-summary">
      <div>내 점수: {score.point}점</div>
      <div>전체 순위: {score.totalRank}위</div>
      <div>분반 순위: {score.groupRank}위</div>
    </div>
  );
}
