// src/pages/ranking/Ranking_layout.jsx
import "../../styles/ranking.css";
import TopBar from "../../ui/ranking/TopBar";
import TabSwitch from "../../ui/ranking/TabSwitch";

export default function RankingLayout({ activeTab, onTabChange, children }) {
  return (
    <div className="ranking-wrapper">
      <TopBar />
      <TabSwitch active={activeTab} onChange={onTabChange} />
      <div className="ranking-content">{children}</div>
    </div>
  );
}
