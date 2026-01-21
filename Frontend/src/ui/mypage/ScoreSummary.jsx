// src/ui/mypage/ScoreSummary.jsx
const tierFromStatus = (status) => {
  if (!status?.length) return { label: "헌터 준비중", tone: "tier-idle" };
  if (status.includes("열정 헌터")) return { label: "열정 헌터", tone: "tier-elite" };
  if (status.includes("초보 헌터")) return { label: "초보 헌터", tone: "tier-newbie" };
  if (status.includes("탐색 대기")) return { label: "탐색 대기", tone: "tier-idle" };
  return { label: status[0], tone: "tier-idle" };
};

export default function ScoreSummary({ score, status, showRanks = true }) {
  const tier = tierFromStatus(status);

  return (
    <section className={`score-summary ${tier.tone}`}>
      <div className="score-hero">
        <div className="score-label">현재 점수</div>
        <div className="score-value">
          {score.point}
          <span>점</span>
        </div>
        <div className="score-tier">{tier.label}</div>
      </div>
      {showRanks && (
        <div className="score-ranks">
          <div className="rank-item">
            <span>전체 순위</span>
            <strong>{score.totalRank ? `${score.totalRank}위` : "-"}</strong>
          </div>
          <div className="rank-item">
            <span>분반 순위</span>
            <strong>{score.groupRank ? `${score.groupRank}위` : "-"}</strong>
          </div>
        </div>
      )}
    </section>
  );
}
