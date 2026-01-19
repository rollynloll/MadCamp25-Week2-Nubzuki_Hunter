// src/pages/ingame/Ingame_map.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MapOverlay from "../../ui/ingame/MapOverlay";
import UserMarker from "../../ui/ingame/UserMarker";
import MapHUD from "../../ui/ingame/MapHUD";

export default function IngameMap() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);
  const [kakaoReady, setKakaoReady] = useState(false);
  const DEFAULT_CENTER = { lat: 36.3703, lng: 127.3607 };
  const KAIST_BOUNDS = {
    sw: { lat: 36.3605, lng: 127.3465 },
    ne: { lat: 36.3798, lng: 127.3742 },
  };

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

  // 1.5️⃣ 카카오 지도 SDK 로드
  useEffect(() => {
    if (window.kakao?.maps) {
      setKakaoReady(true);
      return;
    }

    const appKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;
    console.log("KAKAO MAP KEY:", appKey);
    if (!appKey) {
      console.error("REACT_APP_KAKAO_MAP_API_KEY가 설정되지 않았습니다.");
      return;
    }

    const existingScript = document.querySelector(
      'script[src^="https://dapi.kakao.com/v2/maps/sdk.js"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.kakao?.maps) {
          window.kakao.maps.load(() => setKakaoReady(true));
        }
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    console.log("SCRIPT URL", script.src);
    script.async = true;
    script.onload = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => setKakaoReady(true));
      }
    };
    script.onerror = () => {
      console.error("카카오 지도 SDK 로드에 실패했습니다.");
    };
    document.head.appendChild(script);
  }, []);

  // 2️⃣ 지도 생성
  useEffect(() => {
    if (!mapRef.current || map || !kakaoReady || !window.kakao?.maps) return;
    const initialCenter = position ?? DEFAULT_CENTER;

    const kakaoMap = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(initialCenter.lat, initialCenter.lng),
      level: 4,
      draggable: true,
      zoomable: false,
    });

    const bounds = new window.kakao.maps.LatLngBounds(
      new window.kakao.maps.LatLng(KAIST_BOUNDS.sw.lat, KAIST_BOUNDS.sw.lng),
      new window.kakao.maps.LatLng(KAIST_BOUNDS.ne.lat, KAIST_BOUNDS.ne.lng)
    );
    kakaoMap.setBounds(bounds);
    kakaoMap.setZoomable(false);

    setMap(kakaoMap);
  }, [position, map, kakaoReady]);

  // 3️⃣ 내 위치 갱신 시 지도 중심 이동
  useEffect(() => {
    if (!map || !position || !window.kakao?.maps) return;
    const bounds = new window.kakao.maps.LatLngBounds(
      new window.kakao.maps.LatLng(KAIST_BOUNDS.sw.lat, KAIST_BOUNDS.sw.lng),
      new window.kakao.maps.LatLng(KAIST_BOUNDS.ne.lat, KAIST_BOUNDS.ne.lng)
    );
    const next = new window.kakao.maps.LatLng(position.lat, position.lng);
    map.setCenter(bounds.contain(next) ? next : new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng));
  }, [map, position]);

  return (
    <div className="ingame-map-container">
      <div className="map-top-actions">
        <button
          className="map-icon-button"
          onClick={() => navigate("/ranking/group")}
          aria-label="랭킹으로 이동"
        >
          🏆
        </button>
        <button
          className="map-icon-button"
          onClick={() => navigate("/mypage")}
          aria-label="마이페이지로 이동"
        >
          👤
        </button>
      </div>

      <div className="map-window">
        <div ref={mapRef} className="map-base" />

        {/* 캠퍼스 맵 오버레이 */}
        <MapOverlay />

        {/* 내 위치 (넙죽이) */}
        {position && <UserMarker position={position} />}
      </div>

      {/* 하단 UI */}
      <MapHUD />
    </div>
  );
}
