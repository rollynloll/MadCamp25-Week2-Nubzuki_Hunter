// src/ui/mypage/StatusBadge.jsx
export default function StatusBadge({ status }) {
  return (
    <div className="status-badges">
      {status.map((s) => (
        <span key={s} className="badge">
          {s}
        </span>
      ))}
    </div>
  );
}
