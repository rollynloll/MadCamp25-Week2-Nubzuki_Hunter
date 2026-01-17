// src/ui/auth/GoogleLoginButton.jsx
export default function GoogleLoginButton() {
  const handleLogin = () => {
    console.log("구글 로그인 클릭");
    // TODO: Firebase GoogleAuthProvider 연결
  };

  return (
    <button className="google-login-btn" onClick={handleLogin}>
      <img
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="google"
      />
      Google로 로그인
    </button>
  );
}
