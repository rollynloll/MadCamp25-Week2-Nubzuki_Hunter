import { useState } from "react";
import "../../styles/auth.css";
import LoginCard from "../../ui/auth/LoginCard";
import { apiPost } from "../../data/api";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해줘");
      return;
    }

    try {
      setLoading(true);

      await apiPost("/auth/signup", {
        email,
        password,
      });

      alert("회원가입 성공! 로그인해줘");
      window.location.href = "/login";
    } catch (e) {
      console.error(e);
      alert("회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <LoginCard title="회원가입" subtitle="넙죽이 헌터에 참여해봐!">
        <input
          className="login-input"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="login-input"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="button"
          className="login-button"
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </LoginCard>
    </div>
  );
}
