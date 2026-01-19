import { useEffect, useRef, useState } from "react";
import { apiGet } from "../../data/api";

export default function KakaoMapTest() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [kakaoReady, setKakaoReady] = useState(false);
  const [status, setStatus] = useState("loading sdk");
  const [error, setError] = useState("");
  const [scriptUrl, setScriptUrl] = useState("");
  const [pingStatus, setPingStatus] = useState("pending");
  const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };

  useEffect(() => {
    let active = true;
    const ping = async () => {
      try {
        await apiGet("/system/kakao-map");
        if (!active) return;
        setPingStatus("ok");
      } catch (err) {
        if (!active) return;
        setPingStatus("failed");
        console.warn("kakao map ping failed", err);
      }
    };
    ping();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (window.kakao?.maps) {
      setKakaoReady(true);
      setStatus("sdk ready");
      return;
    }

    const appKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;
    if (!appKey) {
      setStatus("missing app key");
      setError("REACT_APP_KAKAO_MAP_API_KEY not set");
      return;
    }

    const existingScript = document.querySelector(
      'script[src^="https://dapi.kakao.com/v2/maps/sdk.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.kakao?.maps) {
          window.kakao.maps.load(() => {
            setKakaoReady(true);
            setStatus("sdk ready");
          });
        }
      });
      setStatus("waiting for sdk");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    setScriptUrl(script.src);
    script.async = true;
    script.onload = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => {
          setKakaoReady(true);
          setStatus("sdk ready");
        });
      }
    };
    script.onerror = () => {
      setStatus("sdk error");
      setError("sdk load failed");
    };
    document.head.appendChild(script);
    setStatus("loading sdk");
  }, []);

  useEffect(() => {
    if (!mapRef.current || map || !kakaoReady || !window.kakao?.maps) return;
    const kakaoMap = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      level: 4,
    });
    setMap(kakaoMap);
    setStatus("map ready");
  }, [map, kakaoReady]);

  const appKey = process.env.REACT_APP_KAKAO_MAP_API_KEY || "";
  const maskedKey = appKey ? `${appKey.slice(0, 4)}***` : "(empty)";

  return (
    <div className="ingame-map-container">
      <div ref={mapRef} className="map-base" />
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 3,
          padding: "10px 12px",
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(148,163,184,0.4)",
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 700,
          color: "#1f2937",
          boxShadow: "0 6px 14px rgba(15,23,42,0.12)",
          maxWidth: 340,
        }}
      >
        <div>status: {status}</div>
        <div>ping: {pingStatus}</div>
        <div>app key: {maskedKey}</div>
        <div>url: {window.location.href}</div>
        <div>script: {scriptUrl || "(pending)"}</div>
        {error && <div>error: {error}</div>}
      </div>
    </div>
  );
}
