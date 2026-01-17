// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Loading from "./pages/Loading";

import RankingIndividual from "./pages/ranking/Ranking_individual";
import RankingGroup from "./pages/ranking/Ranking_group";

import "./styles/global.css";

function App() {
  return (
    <div className="app-wrapper">
      <BrowserRouter>
        <Routes>
          {/* 기본 진입 → 로그인 */}
          <Route path="/" element={<Login />} />

          {/* 로딩 화면 */}
          <Route path="/loading" element={<Loading />} />

          {/* 랭킹 */}
          <Route path="/ranking/individual" element={<RankingIndividual />} />
          <Route path="/ranking/group" element={<RankingGroup />} />

          {/* 잘못된 경로 → 로그인으로 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
