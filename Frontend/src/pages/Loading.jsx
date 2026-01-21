// src/pages/Loading.jsx
import { useEffect } from "react";
import "../styles/auth.css";
import loadingGif from "../assets/images/loading.gif";

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
      <img src={loadingGif} alt="loading" className="loading-gif" />
      <p className="loading-text">넙죽이가 준비 중이에요...</p>
    </div>
  );
}
