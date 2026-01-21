export default function RankCard({
  data,
  highlight = false,
  highlightLabel,
  gapText,
  scoreBelow = false,
}) {
  return (
    <div className={`rank-card ${highlight ? "highlight" : ""}`}>
      <div className="rank-rank">{data.rank}</div>

      <div className="rank-info">
        <div className="name">{data.name}</div>
        {highlight && gapText && data.rank > 1 && (
          <div className="rank-gap">{gapText}</div>
        )}
        {scoreBelow && <div className="rank-score below">{data.score}점</div>}
      </div>

      {!scoreBelow && (
        <div className="rank-score-wrap">
          <div className="rank-score">{data.score}점</div>
          {highlight && <span className="rank-you">YOU</span>}
        </div>
      )}
    </div>
  );
}
