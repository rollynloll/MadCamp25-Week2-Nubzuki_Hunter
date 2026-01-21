// src/pages/Loading.jsx
import { useEffect } from "react";
import "../styles/auth.css";

export default function Loading() {
  useEffect(() => {
    if (document.querySelector('script[data-model-viewer="true"]')) return;
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    script.dataset.modelViewer = "true";
    document.head.appendChild(script);
  }, []);

  return (
    <div className="loading-page">
      <model-viewer
        className="loading-model"
        src="https://pub-1475ab6767f74ade9449c1b0234209a4.r2.dev/Nupjuki-Idle_v2.glb"
        alt="Nupjuki"
        autoplay
        auto-rotate
        disable-zoom
        disable-pan
        shadow-intensity="0.6"
      />
      <p className="loading-text">넙죽이가 준비 중이에요...</p>
    </div>
  );
}
