// src/pages/Loading.jsx
import "../styles/auth.css";

export default function Loading() {
  return (
    <div className="loading-page">
      <img
        src="/assets/images/loading.gif"
        alt="loading"
        className="loading-gif"
      />
      <p className="loading-text">넙죽이가 준비 중이에요...</p>
    </div>
  );
}
