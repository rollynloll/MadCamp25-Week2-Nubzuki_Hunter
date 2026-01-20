// src/ui/mypage/StatsGrid.jsx
export default function StatsGrid({ stats }) {
  const distanceGoal = 5;
  const foundGoal = 5;
  const buildingGoal = 5;

  const distanceProgress = Math.min(stats.distance / distanceGoal, 1);
  const foundProgress = Math.min(stats.found / foundGoal, 1);
  const buildingProgress = Math.min(stats.buildings / buildingGoal, 1);

  return (
    <div className="stats-grid">
      <div className="stats-card">
        <div className="stats-header">
          <span>총 이동 거리</span>
          <strong>{stats.distance}km</strong>
        </div>
        <div className="stats-progress">
          <span style={{ width: `${distanceProgress * 100}%` }} />
        </div>
        <p className="stats-hint">다음 목표 · {distanceGoal}km</p>
      </div>
      <div className="stats-card">
        <div className="stats-header">
          <span>찾은 눈알</span>
          <strong>{stats.found}개</strong>
        </div>
        <div className="stats-progress">
          <span style={{ width: `${foundProgress * 100}%` }} />
        </div>
        <p className="stats-hint">다음 보상 · {foundGoal}개</p>
      </div>
      <div className="stats-card">
        <div className="stats-header">
          <span>방문한 건물</span>
          <strong>{stats.buildings}개</strong>
        </div>
        <div className="stats-progress">
          <span style={{ width: `${buildingProgress * 100}%` }} />
        </div>
        <p className="stats-hint">다음 목표 · {buildingGoal}곳</p>
      </div>
    </div>
  );
}
