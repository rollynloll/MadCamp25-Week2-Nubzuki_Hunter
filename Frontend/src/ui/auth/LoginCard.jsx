// src/ui/auth/LoginCard.jsx
import nubzukiImg from "../../assets/images/nubzuki.png";

export default function LoginCard({ title, subtitle, children }) {
  return (
    <div className="login-card">
      <img
        src={nubzukiImg}
        alt="nubzuki"
        className="login-character"
      />

      <h1 className="login-title">{title}</h1>
      <p className="login-subtitle">{subtitle}</p>

      <div className="login-actions">{children}</div>
    </div>
  );
}
