// src/pages/Loading.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import { apiFetch } from "../lib/apiClient";
import { supabase } from "../lib/supabaseClient";

export default function Loading() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const routeAfterAuth = async (session) => {
      if (!session) {
        navigate("/");
        return;
      }

      localStorage.setItem("nh_access_token", session.access_token);
      if (session.user?.id) {
        localStorage.setItem("nh_user_id", session.user.id);
      }

      try {
        await apiFetch("/users/me");
        if (mounted) {
          navigate("/ranking/individual");
        }
      } catch (error) {
        if (!mounted) return;
        if (error?.status === 404) {
          navigate("/onboarding/nickname");
          return;
        }
        navigate("/");
      }
    };

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data?.session) {
        await routeAfterAuth(data.session);
        return;
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!mounted) return;
          routeAfterAuth(session);
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    const cleanupPromise = init();

    return () => {
      mounted = false;
      if (cleanupPromise && typeof cleanupPromise.then === "function") {
        cleanupPromise.then((cleanup) => {
          if (typeof cleanup === "function") {
            cleanup();
          }
        });
      }
    };
  }, [navigate]);

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
