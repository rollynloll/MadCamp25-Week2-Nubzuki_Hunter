// src/pages/auth/Login.jsx
import { useState } from "react";
import "../../styles/auth.css";
import LoginCard from "../../ui/auth/LoginCard";
import { apiGet, apiPost } from "../../data/api";

export default function Login() {
  

  // 이메일 입력값 상태
  const [email, setEmail] = useState("");
  // 비밀번호 입력값 상태
  const [password, setPassword] = useState("");
  // 로그인 중 상태 (중복 클릭 방지용)
  const [loading, setLoading] = useState(false);

  // 일반 로그인 처리 함수
  const handleLogin = async () => {
    console.log("🔥 handleLogin 실행");
    
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해줘");
      return;
    }

    try {
      setLoading(true);

      // 백엔드 일반 로그인 API 호출
      const data = await apiPost("/auth/login", { email, password });

      // JWT 토큰 저장 (현재 구조에서는 localStorage 방식 사용)
      if (!data?.session?.access_token) {
        alert("토큰이 발급되지 않았어");
        return;
      }
      localStorage.setItem("access_token", data.session.access_token);

      // 로그인 성공 후 기존 분반 여부에 따라 이동
      try {
        await apiGet("/groups/me");
        window.location.href = "/ingame/map";
      } catch (err) {
        window.location.href = "/onboarding/group";
      }
    } catch (error) {
      console.error(error);
      alert("로그인 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <LoginCard
        title="넙죽이 헌터"
        subtitle="캠퍼스 곳곳을 탐험해봐"
      >
        {/* 일반 로그인 입력 폼 */}
        <div className="login-field">
          <label className="login-label" htmlFor="login-email">
            이메일
          </label>
          <input
            id="login-email"
            className="login-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="login-field">
          <label className="login-label" htmlFor="login-password">
            비밀번호
          </label>
          <input
            id="login-password"
            className="login-input"
            type="password"
            placeholder="비밀번호를 입력해줘"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <button
          className="signup-text"
          type="button"
          onClick={() => (window.location.href = "/signup")}
        >
          회원가입
        </button>

      </LoginCard>
    </div>
  );
}
