export default function GroupCard({ group, selected, onSelect }) {
  return (
    <div
      className={`group-card ${selected ? "selected" : ""}`}
      onClick={() => onSelect(group.id)}
    >
      <div className="group-card-header">
        <h2 className="group-name">{group.name}</h2>
      </div>

      <div className="group-score">
        <span className="group-score-value">{group.score}</span>
        <span className="group-score-unit">점</span>
      </div>

      <div className="group-meta">
        <span className="group-meta-item">👁 {group.eye}</span>
        <span className="group-meta-item">👥 {group.members}명</span>
      </div>
    </div>
  );
}
