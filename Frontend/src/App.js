// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import NaverMapTest from "./pages/ingame/NaverMapTest";
import KakaoMapTest from "./pages/ingame/KakaoMapTest";

import "./styles/global.css";

function App() {
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
          <Route path="/naver-map" element={<NaverMapTest />} />
          <Route path="/kakao-map" element={<KakaoMapTest />} />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
