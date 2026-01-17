export default function GroupCard({ group, selected, onSelect }) {
  return (
    <div
      className={`group-card ${selected ? "selected" : ""}`}
      onClick={() => onSelect(group.id)}
    >
      <h2>{group.name}</h2>

      <div className="meta">
        <div>👁 {group.eye}</div>
        <div>⭐ {group.score}점</div>
        <div>👥 {group.members}명</div>
      </div>
    </div>
  );
}
