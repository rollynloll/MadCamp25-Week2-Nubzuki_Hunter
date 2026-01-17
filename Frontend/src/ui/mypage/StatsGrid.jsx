// src/ui/mypage/StatsGrid.jsx
export default function StatsGrid({ stats }) {
  return (
    <div className="stats-grid">
      <div>
        <span>총 이동 거리</span>
        <strong>{stats.distance}km</strong>
      </div>
      <div>
        <span>찾은 눈알</span>
        <strong>{stats.found}개</strong>
      </div>
      <div>
        <span>방문한 건물</span>
        <strong>{stats.buildings}개</strong>
      </div>
    </div>
  );
}
