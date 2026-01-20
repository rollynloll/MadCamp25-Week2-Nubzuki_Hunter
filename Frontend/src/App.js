// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useRef, useState } from "react";


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
import QRCodeGenerator from "./pages/dev/QRCodeGenerator";
import QRScanner from "./pages/dev/QRScanner";
import QrScan from "./pages/ingame/QrScan";
import QrFound from "./pages/ingame/QrFound";
import ARHunt from "./pages/ar/ARHunt";
import TutorialStep1 from "./pages/tutorial/TutorialStep1";
import TutorialStep2 from "./pages/tutorial/TutorialStep2";
import TutorialStep3 from "./pages/tutorial/TutorialStep3";

import "./styles/global.css";
import mainBgm from "./assets/music/main_bgm.mp3";

function App() {
  const [loadingCount, setLoadingCount] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      const delta = event?.detail?.delta ?? 0;
      setLoadingCount((prev) => Math.max(0, prev + delta));
    };
    window.addEventListener("api-loading", handler);
    return () => window.removeEventListener("api-loading", handler);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = 0.4;

    const tryPlay = () => {
      audio.play().catch(() => {});
    };

    const unlock = () => {
      tryPlay();
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        audio.pause();
      } else {
        tryPlay();
      }
    };

    tryPlay();
    window.addEventListener("click", unlock);
    window.addEventListener("touchstart", unlock);
    window.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div className="app-wrapper">
      <audio ref={audioRef} src={mainBgm} preload="auto" />
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
          <Route path="/ar" element={<ARHunt />} />

          {/* 튜토리얼 */}
          <Route path="/tutorial/1" element={<TutorialStep1 />} />
          <Route path="/tutorial/2" element={<TutorialStep2 />} />
          <Route path="/tutorial/3" element={<TutorialStep3 />} />
          <Route path="/dev/qr" element={<QRCodeGenerator />} />
          <Route path="/scan" element={<QRScanner />} />

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
