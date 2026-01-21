export default function TopRankPodium({ top3, highlightId }) {
  // rank 기준으로 먼저 정렬
  const podiumOrder = [2, 1, 3];
  const gapToneClass = (gap) => {
    if (gap >= 6) return "gap-strong";
    if (gap >= 3) return "gap-mid";
    return "gap-soft";
  };

  const ordered = podiumOrder
    .map((rank) => top3.find((item) => item.rank === rank))
    .filter(Boolean);

  return (
    <div className="podium">
      {ordered.map((item) => {
        const isHighlight = highlightId && item.id === highlightId;
        const gapEye = Math.max(
          (top3.find((entry) => entry.rank === 1)?.eye ?? 0) - item.eye,
          0
        );
        const gapClass = item.rank === 1 ? "" : ` ${gapToneClass(gapEye)}`;
        return (
          <div key={item.rank} className="podium-item-wrap">
            <div
              className={`podium-card rank-${item.rank}${gapClass}${
                isHighlight ? " highlight" : ""
              }`}
            >
              <div className="rank-badge">{item.rank === 1 ? "👑" : item.rank}</div>
              <div className="name">{item.name}</div>
              <div className="score">{item.score}점</div>
              {isHighlight && <div className="podium-me">me</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
