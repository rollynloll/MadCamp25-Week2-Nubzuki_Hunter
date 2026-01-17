// src/pages/auth/Login.jsx
import "../../styles/auth.css";
import LoginCard from "../../ui/auth/LoginCard";
import GoogleLoginButton from "../../ui/auth/GoogleLoginButton";

export default function Login() {
  return (
    <div className="login-page">
      <LoginCard
        title="넙죽이 헌터"
        subtitle="로그인하고 게임에 참여해봐!"
      >
        <GoogleLoginButton />
      </LoginCard>
    </div>
  );
}
