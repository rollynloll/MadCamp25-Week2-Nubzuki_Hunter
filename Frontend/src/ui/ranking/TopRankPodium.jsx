export default function TopRankPodium({ top3 }) {
  // rank 기준으로 먼저 정렬
  const podiumOrder = [2, 1, 3];

  const ordered = podiumOrder
    .map((rank) => top3.find((item) => item.rank === rank))
    .filter(Boolean);

  return (
    <div className="podium">
      {ordered.map((item) => (
        <div key={item.rank} className={`podium-item rank-${item.rank}`}>
          <div className="crown">👑</div>
          <div className="name">{item.name}</div>
          <div className="eye">👁 {item.eye}</div>
          <div className="score">{item.score}점</div>
        </div>
      ))}
    </div>
  );
}
