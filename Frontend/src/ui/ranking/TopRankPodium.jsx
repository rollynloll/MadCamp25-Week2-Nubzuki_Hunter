export default function TopRankPodium({ top3, highlightId }) {
  // rank 기준으로 먼저 정렬
  const podiumOrder = [2, 1, 3];
  const topScore = top3.find((item) => item.rank === 1)?.score ?? null;

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
        const highlightKey = highlightId ? String(highlightId) : null;
        const isHighlight = highlightKey ? String(item.id) === highlightKey : false;
        const gapScore = topScore !== null ? Math.max(topScore - item.score, 0) : 0;
        const neededScore = gapScore + 1;
        const gapLabel =
          item.rank === 1 ? null : `${neededScore}점 더 얻으면 순위 상승 가능`;
        const gapClass = item.rank === 1 ? "" : ` ${gapToneClass(gapScore)}`;
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
