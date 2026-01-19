import { useEffect, useRef, useState } from "react";
import { apiGet } from "../../data/api";

export default function NaverMapTest() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [clientId, setClientId] = useState("");
  const [naverReady, setNaverReady] = useState(false);
  const [status, setStatus] = useState("loading client id");
  const [error, setError] = useState("");
  const [scriptUrl, setScriptUrl] = useState("");
  const [validateResult, setValidateResult] = useState(null);
  const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };

  useEffect(() => {
    let active = true;

    const loadClientId = async () => {
      setStatus("loading client id");
      try {
        const data = await apiGet("/system/naver-map");
        if (!active) return;
        const id = data?.client_id || "";
        setClientId(id);
        setStatus(id ? "client id loaded" : "client id missing");
      } catch (err) {
        if (!active) return;
        setError("failed to load client id");
        setStatus("client id error");
        console.warn("naver map client id fetch failed", err);
      }
    };

    loadClientId();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const previous = window.navermap_authFailure;
    window.navermap_authFailure = () => {
      setError("auth failure");
      setStatus("auth failure");
      console.error("naver map auth failure");
    };
    return () => {
      window.navermap_authFailure = previous;
    };
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let active = true;

    const loadValidate = async () => {
      try {
        const data = await apiGet(
          `/system/naver-map/validate?url=${encodeURIComponent(window.location.href)}`
        );
        if (!active) return;
        setValidateResult(data || { error: "empty response" });
      } catch (err) {
        if (!active) return;
        setValidateResult({ error: "validate request failed" });
        console.warn("naver map validate failed", err);
      }
    };

    loadValidate();

    return () => {
      active = false;
    };
  }, [clientId]);

  useEffect(() => {
    if (window.naver?.maps) {
      setNaverReady(true);
      return;
    }

    const id = clientId || process.env.REACT_APP_NAVER_MAP_CLIENT_ID;
    if (!id) {
      setStatus("missing client id");
      return;
    }

    const existingScript = document.querySelector(
      'script[src^="https://oapi.map.naver.com/openapi/v3/maps.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => setNaverReady(true));
      setStatus("waiting for sdk");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?clientId=${id}`;
    setScriptUrl(script.src);
    script.async = true;
    script.onload = () => {
      setStatus("sdk loaded");
      setNaverReady(true);
    };
    script.onerror = () => {
      setError("sdk load failed");
      setStatus("sdk error");
    };
    document.head.appendChild(script);
    setStatus("loading sdk");
  }, [clientId]);

  useEffect(() => {
    if (!mapRef.current || map || !naverReady || !window.naver?.maps) return;
    const naverMap = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      zoom: 15,
    });
    setMap(naverMap);
    setStatus("map ready");
  }, [map, naverReady]);

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
          maxWidth: 320,
        }}
      >
        <div>status: {status}</div>
        <div>client id: {clientId || "(empty)"}</div>
        <div>url: {window.location.href}</div>
        <div>script: {scriptUrl || "(pending)"}</div>
        {error && <div>error: {error}</div>}
        {validateResult && <div>validate: {JSON.stringify(validateResult)}</div>}
      </div>
    </div>
  );
}
