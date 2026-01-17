// src/ui/auth/LoginCard.jsx
export default function LoginCard({ title, subtitle, children }) {
  return (
    <div className="login-card">
      <img
        src="/assets/images/nubzuki.png"
        alt="nubzuki"
        className="login-character"
      />

      <h1 className="login-title">{title}</h1>
      <p className="login-subtitle">{subtitle}</p>

      <div className="login-actions">{children}</div>
    </div>
  );
}
