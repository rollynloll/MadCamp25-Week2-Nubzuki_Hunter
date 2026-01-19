// src/pages/ingame/Ingame_map.jsx
import { useEffect, useRef, useState } from "react";
import MapOverlay from "../../ui/ingame/MapOverlay";
import UserMarker from "../../ui/ingame/UserMarker";
import MapHUD from "../../ui/ingame/MapHUD";

export default function IngameMap() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);
  const [naverReady, setNaverReady] = useState(false);
  const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 };

  // 1️⃣ 내 위치 가져오기
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (error) => {
        console.warn("현재 위치를 가져오지 못해 기본 위치로 표시합니다.", error);
        setPosition(DEFAULT_CENTER);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // 1.5️⃣ 네이버 지도 SDK 로드
  useEffect(() => {
    if (window.naver?.maps) {
      setNaverReady(true);
      return;
    }

    const clientId = process.env.REACT_APP_NAVER_MAP_CLIENT_ID;
    console.log("NAVER MAP KEY:", clientId);
    if (!clientId) {
      console.error("REACT_APP_NAVER_MAP_CLIENT_ID가 설정되지 않았습니다.");
      return;
    }

    const existingScript = document.querySelector(
      'script[src^="https://oapi.map.naver.com/openapi/v3/maps.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => setNaverReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    console.log("SCRIPT URL", script.src);
    script.async = true;
    script.onload = () => setNaverReady(true);
    script.onerror = () => {
      console.error("네이버 지도 SDK 로드에 실패했습니다.");
    };
    document.head.appendChild(script);
  }, []);

  // 2️⃣ 지도 생성
  useEffect(() => {
    if (!mapRef.current || map || !naverReady) return;
    const initialCenter = position ?? DEFAULT_CENTER;

    const naverMap = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(initialCenter.lat, initialCenter.lng),
      zoom: 15,
    });

    setMap(naverMap);
  }, [position, map, naverReady]);

  // 3️⃣ 내 위치 갱신 시 지도 중심 이동
  useEffect(() => {
    if (!map || !position) return;
    map.setCenter(new window.naver.maps.LatLng(position.lat, position.lng));
  }, [map, position]);

  return (
    <div className="ingame-map-container">
      <div ref={mapRef} className="map-base" />

      {/* 캠퍼스 맵 오버레이 */}
      <MapOverlay />

      {/* 내 위치 (넙죽이) */}
      {position && <UserMarker position={position} />}

      {/* 하단 UI */}
      <MapHUD />
    </div>
  );
}
