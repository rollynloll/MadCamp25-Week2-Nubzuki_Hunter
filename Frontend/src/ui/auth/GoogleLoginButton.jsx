// src/ui/auth/GoogleLoginButton.jsx
import { supabase } from "../../lib/supabaseClient";

export default function GoogleLoginButton() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/loading`,
      },
    });
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
