// src/pages/ingame/Ingame_map.jsx
import { useEffect, useRef, useState } from "react";
import MapOverlay from "../../ui/ingame/MapOverlay";
import UserMarker from "../../ui/ingame/UserMarker";
import MapHUD from "../../ui/ingame/MapHUD";
import "../../styles/ingame_map.css";

export default function IngameMap() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);

  // 1️⃣ 내 위치 가져오기
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        alert("위치 권한이 필요합니다.");
      }
    );
  }, []);

  // 2️⃣ 지도 생성
  useEffect(() => {
    if (!position || map) return;

    const kakaoMap = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(position.lat, position.lng),
      level: 3,
    });

    setMap(kakaoMap);
  }, [position, map]);

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
