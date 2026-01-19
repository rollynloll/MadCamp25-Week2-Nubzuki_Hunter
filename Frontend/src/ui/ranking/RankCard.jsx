export default function RankCard({
  data,
  highlight = false,
  highlightLabel,
  scoreBelow = false,
}) {
  return (
    <div className={`rank-card ${highlight ? "highlight" : ""}`}>
      <div className="rank-num">{data.rank}</div>

      <div className="rank-info">
        {highlightLabel && <span className="rank-badge">{highlightLabel}</span>}
        <div className="name">{data.name}</div>
        <div className="meta">
          {data.group && `${data.group} · `}👁 {data.eye}
        </div>
        {scoreBelow && (
          <div className="rank-score below">{data.score}점</div>
        )}
      </div>

      {!scoreBelow && (
        <div className="rank-score">
          <span className="score-text">{data.score}점</span>
        </div>
      )}
    </div>
  );
}
