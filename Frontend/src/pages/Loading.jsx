// src/pages/Loading.jsx
import "../styles/auth.css";
import loadingGif from "../assets/images/loading.gif";

export default function Loading() {
  return (
    <div className="loading-page">
      <img
        src={loadingGif}
        alt="loading"
        className="loading-gif"
      />
      <p className="loading-text">넙죽이가 준비 중이에요...</p>
    </div>
  );
}