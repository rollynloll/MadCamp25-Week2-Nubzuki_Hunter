import "../../styles/ranking.css";
import { useNavigate } from "react-router-dom";
import TabSwitch from "../../ui/ranking/TabSwitch";
import TopBar from "../../ui/ranking/TopBar";

export default function RankingLayout({ activeTab, children }) {
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    if (tab === "individual") navigate("/ranking/individual");
    if (tab === "group") navigate("/ranking/group");
  };

  return (
    <div className="ranking-layout">
      <TopBar />
      <TabSwitch value={activeTab} onChange={handleTabChange} />
      <div className="ranking-content">{children}</div>
    </div>
  );
}
