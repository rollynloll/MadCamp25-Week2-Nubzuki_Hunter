// src/ui/mypage/StatsGrid.jsx
export default function StatsGrid({ stats }) {
  const distanceProgress = Math.min(stats.distance / 5, 1);
  const foundProgress = Math.min(stats.found / 5, 1);
  const buildingProgress = Math.min(stats.buildings / 5, 1);

  return (
    <div className="stats-grid">
      <div className="stats-card stats-card--primary">
        <div className="stats-header">
          <span>찾은 눈알</span>
          <strong>{stats.found}개</strong>
        </div>
        <div className="stats-progress">
          <span style={{ width: `${foundProgress * 100}%` }} />
        </div>
      </div>
      <div className="stats-card stats-card--muted">
        <div className="stats-header">
          <span>방문한 건물</span>
          <strong>{stats.buildings}개</strong>
        </div>
        <div className="stats-progress">
          <span style={{ width: `${buildingProgress * 100}%` }} />
        </div>
      </div>
      <div className="stats-card stats-card--muted">
        <div className="stats-header">
          <span>총 이동 거리</span>
          <strong>{stats.distance}km</strong>
        </div>
        <div className="stats-progress">
          <span style={{ width: `${distanceProgress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
