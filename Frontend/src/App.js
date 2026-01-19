// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Loading from "./pages/Loading";

import RankingIndividual from "./pages/ranking/Ranking_individual";
import RankingGroup from "./pages/ranking/Ranking_group";

import GroupSelectStep from "./pages/onboarding/GroupSelectStep";
import CompleteStep from "./pages/onboarding/CompleteStep";

import Mypage from "./pages/mypage/Mypage";
import ActiveGame from "./pages/ingame/ActiveGame";
import IngameMap from "./pages/ingame/Ingame_map";
import QrScan from "./pages/ingame/QrScan";
import QrFound from "./pages/ingame/QrFound";

import "./styles/global.css";

function App() {
  const [loadingCount, setLoadingCount] = useState(0);

  useEffect(() => {
    const handler = (event) => {
      const delta = event?.detail?.delta ?? 0;
      setLoadingCount((prev) => Math.max(0, prev + delta));
    };
    window.addEventListener("api-loading", handler);
    return () => window.removeEventListener("api-loading", handler);
  }, []);

  return (
    <div className="app-wrapper">
      <BrowserRouter>
        <Routes>
          {/* 기본 진입 → 로그인 */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 로딩 화면 */}
          <Route path="/loading" element={<Loading />} />

          {/* 랭킹 */}
          <Route path="/ranking/individual" element={<RankingIndividual />} />
          <Route path="/ranking/group" element={<RankingGroup />} />

          {/* 온보딩 단계 */} 
          <Route path="/onboarding/group" element={<GroupSelectStep />} />
          <Route path="/onboarding/complete" element={<CompleteStep />} />

          {/* 마이페이지 */}
          <Route path="/mypage" element={<Mypage />} />

          {/* 인게임 테스트 */}
          <Route path="/ingame/active" element={<ActiveGame />} />
          <Route path="/ingame/map" element={<IngameMap />} />
          <Route path="/ingame/scan" element={<QrScan />} />
          <Route path="/ingame/found" element={<QrFound />} />

        </Routes>
      </BrowserRouter>

      {loadingCount > 0 && (
        <div className="loading-overlay" role="status" aria-live="polite">
          <Loading />
        </div>
      )}
    </div>
  );
}

export default App;
