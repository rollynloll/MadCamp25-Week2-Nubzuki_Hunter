import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../data/api";

export default function EntryGate() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    apiGet("/games/active")
      .then((data) => {
        if (data.game) {
          navigate("/ingame", { replace: true });
          return;
        }
        navigate("/ingame/select", { replace: true });
      })
      .catch(() => {
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  return <div>로딩중...</div>;
}
