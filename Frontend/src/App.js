import { BrowserRouter, Routes, Route } from "react-router-dom";
import RankingGroup from "./pages/ranking/Ranking_group";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/ranking/group" element={<RankingGroup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
