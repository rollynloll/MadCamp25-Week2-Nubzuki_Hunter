// src/pages/ingame/Ingame_map.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import nubzukiImage from "../../assets/images/nubzuki.png";
import pinIcon from "../../assets/icons/icon_pin.png";
import iconTropy from "../../assets/icons/icon_tropy.png";
import "../../styles/Ingame_map.css";

const SPOTS = [
  {
    id: "kaimaru",
    name: "카이마루",
    lat: 36.373935895420914,
    lng: 127.35917617437451,
    eyeballCount: 1,
  },
  {
    id: "library",
    name: "카이스트 도서관",
    lat: 36.369644848295096,
    lng: 127.36253254114752,
    eyeballCount: 1,
  },
  {
    id: "duckpond",
    name: "오리연못",
    lat: 36.3678157769514,
    lng: 127.36290511376632,
    eyeballCount: 1,
  },
  {
    id: "sports-complex",
    name: "스포츠 컴플렉스",
    lat: 36.37248232970725,
    lng: 127.36152667140567,
    eyeballCount: 1,
  },
  {
    id: "krafton",
    name: "크래프톤 건물",
    lat: 36.36828661090938,
    lng: 127.36489400888212,
    eyeballCount: 1,
  },
  {
    id: "natural-science",
    name: "자연과학동",
    lat: 36.37081865447142,
    lng: 127.36497647525277,
    eyeballCount: 1,
  },
];

const toRad = (value) => (value * Math.PI) / 180;

const distanceMeters = (from, to) => {
  const earthRadius = 6371000;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const createMarkerImage = (size) =>
  new window.kakao.maps.MarkerImage(
    pinIcon,
    new window.kakao.maps.Size(size, size),
    {
      offset: new window.kakao.maps.Point(size / 2, size),
    }
  );

const DEFAULT_CENTER = { lat: 36.3703, lng: 127.3607 };
const KAIST_BOUNDS = {
  sw: { lat: 36.3605, lng: 127.3465 },
  ne: { lat: 36.3798, lng: 127.3742 },
};

export default function IngameMap() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const spotMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const nearestOverlayRef = useRef(null);
  const watchIdRef = useRef(null);
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);
  const [kakaoReady, setKakaoReady] = useState(false);

  // 1️⃣ 내 위치 가져오기 (실시간)
  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition(DEFAULT_CENTER);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
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
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 2000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // 1.5️⃣ 카카오 지도 SDK 로드
  useEffect(() => {
    if (window.kakao?.maps) {
      setKakaoReady(true);
      return;
    }

    const appKey = process.env.REACT_APP_KAKAO_MAP_API_KEY;
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

  // 2️⃣ 지도 생성 + 경계선
  useEffect(() => {
    if (!mapRef.current || map || !kakaoReady || !window.kakao?.maps) return;
    const initialCenter = position ?? DEFAULT_CENTER;

    const kakaoMap = new window.kakao.maps.Map(mapRef.current, {
      center: new window.kakao.maps.LatLng(initialCenter.lat, initialCenter.lng),
      level: 5,
      draggable: true,
      zoomable: true,
    });

    const zoomControl = new window.kakao.maps.ZoomControl();
    kakaoMap.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

    const centerLat = DEFAULT_CENTER.lat;
    const centerLng = DEFAULT_CENTER.lng;
    const radiusKm = 50;
    const deltaLat = radiusKm / 111;
    const deltaLng = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));
    const outerBounds = new window.kakao.maps.LatLngBounds(
      new window.kakao.maps.LatLng(centerLat - deltaLat, centerLng - deltaLng),
      new window.kakao.maps.LatLng(centerLat + deltaLat, centerLng + deltaLng)
    );
    const outerPath = [
      new window.kakao.maps.LatLng(centerLat - deltaLat, centerLng - deltaLng),
      new window.kakao.maps.LatLng(centerLat - deltaLat, centerLng + deltaLng),
      new window.kakao.maps.LatLng(centerLat + deltaLat, centerLng + deltaLng),
      new window.kakao.maps.LatLng(centerLat + deltaLat, centerLng - deltaLng),
    ];

    let lastCenter = kakaoMap.getCenter();
    const enforceBounds = () => {
      const center = kakaoMap.getCenter();
      if (!outerBounds.contain(center)) {
        kakaoMap.setCenter(lastCenter);
      } else {
        lastCenter = center;
      }
    };
    window.kakao.maps.event.addListener(kakaoMap, "dragend", enforceBounds);

    setMap(kakaoMap);
  }, [position, map, kakaoReady]);

  const nearestSpot = useMemo(() => {
    if (!position) return null;
    let nearest = null;
    SPOTS.forEach((spot) => {
      const dist = distanceMeters(position, spot);
      if (!nearest || dist < nearest.distance) {
        nearest = { ...spot, distance: dist };
      }
    });
    return nearest;
  }, [position]);

  useEffect(() => {
    if (!map || !window.kakao?.maps) return;
    spotMarkersRef.current.forEach((marker) => marker.setMap(null));
    spotMarkersRef.current = [];
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
    if (nearestOverlayRef.current) {
      nearestOverlayRef.current.setMap(null);
      nearestOverlayRef.current = null;
    }

    const spotsWithDistance = SPOTS.map((spot) => ({
      ...spot,
      distance: position ? distanceMeters(position, spot) : null,
    }));

    spotsWithDistance.forEach((spot) => {
      const isNearest = nearestSpot?.id === spot.id;
      const markerSize = isNearest ? 32 : 26;
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(spot.lat, spot.lng),
        image: createMarkerImage(markerSize),
      });
      marker.setMap(map);
      spotMarkersRef.current.push(marker);

      window.kakao.maps.event.addListener(marker, "click", () => {
        const distanceText =
          spot.distance !== null ? `${Math.round(spot.distance)}m` : "거리 계산중";
        const content = `
          <div style="padding:8px 10px; font-size:12px; line-height:1.4;">
            <div style="font-weight:700; margin-bottom:2px;">${spot.name}</div>
            <div>눈알 ${spot.eyeballCount}개 · ${distanceText}</div>
          </div>
        `;

        if (!infoWindowRef.current) {
          infoWindowRef.current = new window.kakao.maps.InfoWindow({
            content,
          });
        } else {
          infoWindowRef.current.setContent(content);
        }
        infoWindowRef.current.open(map, marker);
      });
    });

    if (nearestSpot) {
      const overlayContent = `
        <div class="pin-overlay">
          <span class="pin-pulse"></span>
          <img src="${pinIcon}" alt="" />
        </div>
      `;
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(nearestSpot.lat, nearestSpot.lng),
        content: overlayContent,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: 5,
      });
      overlay.setMap(map);
      nearestOverlayRef.current = overlay;
    }
  }, [map, position, nearestSpot]);

  // 3️⃣ 내 위치 마커 갱신
  useEffect(() => {
    if (!map || !position || !window.kakao?.maps) return;
    const next = new window.kakao.maps.LatLng(position.lat, position.lng);

    if (!markerRef.current) {
      const size = new window.kakao.maps.Size(56, 56);
      const offset = new window.kakao.maps.Point(28, 56);
      const image = new window.kakao.maps.MarkerImage(nubzukiImage, size, { offset });
      markerRef.current = new window.kakao.maps.Marker({
        position: next,
        image,
      });
      markerRef.current.setMap(map);
      window.kakao.maps.event.addListener(markerRef.current, "click", () => {
        navigate("/mypage");
      });
      return;
    }

    markerRef.current.setPosition(next);
  }, [map, position]);

  return (
    <div className="ingame-map">
      <div className="map-hud">
        <div className="hud-item" aria-label="현재 눈알 개수">
          👁 <span>{eyeballCount}</span>
        </div>
        <button
          className="top-action-button hud-item hud-button"
          onClick={() => navigate("/ranking/group")}
          aria-label="랭킹으로 이동"
        >
          <img src={iconTropy} alt="랭킹" />
        </button>
      </div>
      <div className="map-wrapper">
        <div ref={mapRef} className="map-base map-full" />
        <div className="map-mask" aria-hidden="true">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <mask id="kaist-mask">
                <rect width="100" height="100" fill="white" />
                <polygon
                  points="14.8 17, 22.5 12.6, 36.8 14.8, 52.2 25.8, 61 36.8, 58.8 52.2, 48.9 65.4, 34.6 72, 23.6 63.2, 14.8 47.8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100"
              height="100"
              fill="rgba(233,229,221,0.7)"
              mask="url(#kaist-mask)"
            />
          </svg>
        </div>
      </div>

      <button
        className="qr-main-button"
        onClick={() => navigate("/ingame/scan")}
      >
        {nearestSpot
          ? `가까운 핀 탐색하기 (+보너스 · ${Math.round(nearestSpot.distance)}m)`
          : "핀 탐색하러 가기"}
      </button>
    </div>
  );
}
