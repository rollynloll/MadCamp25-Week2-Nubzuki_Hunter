// src/pages/ingame/Ingame_map.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import nubzukiImage from "../../assets/images/nubzuki.png";
import "./Ingame_map.css";

const DEFAULT_CENTER = { lat: 36.3703, lng: 127.3607 };
const KAIST_BOUNDS = {
  sw: { lat: 36.3605, lng: 127.3465 },
  ne: { lat: 36.3798, lng: 127.3742 },
};

export default function IngameMap() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);
  const [kakaoReady, setKakaoReady] = useState(false);

  // 1️⃣ 내 위치 가져오기
  useEffect(() => {
    console.log("mapRef:", mapRef.current);
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
      console.log("kakao:", window.kakao);
      console.log("kakao.maps:", window.kakao?.maps);
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
      console.log("kakao:", window.kakao);
      console.log("kakao.maps:", window.kakao?.maps);
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
    console.log("kakaoReady:", kakaoReady);
    console.log("mapRef.current:", mapRef.current);
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

  // 3️⃣ 내 위치 마커 및 지도 중심 이동
  useEffect(() => {
    if (!map || !position || !window.kakao?.maps) return;
    const bounds = new window.kakao.maps.LatLngBounds(
      new window.kakao.maps.LatLng(KAIST_BOUNDS.sw.lat, KAIST_BOUNDS.sw.lng),
      new window.kakao.maps.LatLng(KAIST_BOUNDS.ne.lat, KAIST_BOUNDS.ne.lng)
    );
    const next = new window.kakao.maps.LatLng(position.lat, position.lng);
    map.setCenter(bounds.contain(next) ? next : new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng));

    if (!markerRef.current) {
      const size = new window.kakao.maps.Size(52, 52);
      const offset = new window.kakao.maps.Point(26, 52);
      const image = new window.kakao.maps.MarkerImage(nubzukiImage, size, { offset });
      markerRef.current = new window.kakao.maps.Marker({
        position: next,
        image,
      });
      markerRef.current.setMap(map);
      return;
    }

    markerRef.current.setPosition(next);
  }, [map, position]);

  return (
    <div className="ingame-map">
      <div className="top-buttons">
        <button
          className="top-button"
          onClick={() => navigate("/ranking/group")}
          aria-label="랭킹으로 이동"
        >
          🏆
        </button>
        <button
          className="top-button"
          onClick={() => navigate("/mypage")}
          aria-label="마이페이지로 이동"
        >
          👤
        </button>
      </div>

      <div ref={mapRef} className="map-base" />

      <button
        className="qr-main-button"
        onClick={() => navigate("/ingame/scan")}
      >
        QR 스캔하러 가기
      </button>
    </div>
  );
}
