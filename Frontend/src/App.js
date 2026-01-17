// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Loading from "./pages/Loading";

import RankingIndividual from "./pages/ranking/Ranking_individual";
import RankingGroup from "./pages/ranking/Ranking_group";

import NicknameStep from "./pages/onboarding/NicknameStep";
import GroupSelectStep from "./pages/onboarding/GroupSelectStep";
import CompleteStep from "./pages/onboarding/CompleteStep";

import Mypage from "./pages/mypage/Mypage";

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

          {/* 온보딩 단계 */} 
          <Route path="/onboarding/nickname" element={<NicknameStep />} />
          <Route path="/onboarding/group" element={<GroupSelectStep />} />
          <Route path="/onboarding/complete" element={<CompleteStep />} />

          {/* 마이페이지 */}
          <Route path="/mypage" element={<Mypage />} />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
