// src/pages/before-game/Start.jsx
import React from "react";
import "../../styles/start.css";

export default function Start({ onStart }) {
  const handleStart = () => {
    // 라우터 붙이기 전이면 onStart 콜백으로 화면 전환
    if (typeof onStart === "function") onStart();
  };

  return (
    <main className="start-screen" role="main" aria-label="Nupzuki Hunter Start">
      {/* Corner pixel stamps (arcade vibe) */}
      <div className="pixel-stamp pixel-stamp--tl" aria-hidden="true" />
      <div className="pixel-stamp pixel-stamp--br" aria-hidden="true" />

      <section className="start-hero">
        {/* Character */}
        <div className="nupzuki-wrap" aria-label="넙죽이">
          <img
            className="nupzuki-img"
            src="/assets/images/nupzuki/nupzuki_idle.png"
            alt="넙죽이"
            draggable="false"
          />
          <div className="nupzuki-shadow" aria-hidden="true" />
        </div>

        {/* Catchphrase */}
        <h1 className="start-title">
          <span className="start-title__top">카이스트 눈알 떼기</span>
          <span className="start-title__bottom">총장님을 도와라!</span>
        </h1>

        {/* Primary CTA */}
        <button className="pixel-btn pixel-btn--primary" type="button" onClick={handleStart}>
          <span className="pixel-btn__text">START</span>
          <span className="pixel-btn__icon" aria-hidden="true">▶</span>
        </button>

        <p className="start-hint">Tap START to begin</p>
      </section>

      {/* Footer micro */}
      <footer className="start-footer" aria-label="footer">
        <span className="start-footer__badge">NUPZUKI HUNTER</span>
        <span className="start-footer__meta">v0.1 • KAIST</span>
      </footer>
    </main>
  );
}
