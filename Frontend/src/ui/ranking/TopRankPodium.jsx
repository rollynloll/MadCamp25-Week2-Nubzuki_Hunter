export default function TopRankPodium({ top3, highlightId }) {
  // rank 기준으로 먼저 정렬
  const podiumOrder = [2, 1, 3];
  const topEye = top3.find((item) => item.rank === 1)?.eye ?? null;

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
        const gapEye = topEye !== null ? Math.max(topEye - item.eye, 0) : 0;
        const neededEyes = gapEye + 1;
        const gapLabel =
          item.rank === 1
            ? null
            : neededEyes <= 1
              ? "눈알 1개만 더 찾으면 1위"
              : `눈알 ${neededEyes}개 더 찾으면 1위`;
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
              {isHighlight && gapLabel && <div className="podium-gap">{gapLabel}</div>}
              {isHighlight && <div className="podium-you">YOU</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
