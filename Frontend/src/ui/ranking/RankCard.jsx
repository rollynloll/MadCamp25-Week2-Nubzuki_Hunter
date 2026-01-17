export default function RankCard({ data }) {
  return (
    <div className="rank-card">
      <div className="rank-num">{data.rank}</div>

      <div className="rank-info">
        <div className="name">{data.name}</div>
        <div className="meta">
          {data.group && `${data.group} · `}👁 {data.eye}
        </div>
      </div>

      <div className="rank-score">
        <span className="score-text">{data.score}점</span>
      </div>
    </div>
  );
}
