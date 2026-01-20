// src/pages/ingame/Ingame_map.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import nubzukiImage from "../../assets/images/nubzuki.png";
import pinIcon from "../../assets/icons/icon_pin.png";
import iconTrophy from "../../assets/icons/icon_trophy.png";
import iconProfile from "../../assets/icons/icon_profile.png";
import { apiGet } from "../../data/api";
import "./Ingame_map.css";

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

const SPOT_NAME_ALIASES = {
  KRAFTON: "크래프톤 건물",
  문화관: "카이스트 도서관",
};

const SPOT_BY_NAME = SPOTS.reduce((acc, spot) => {
  acc[spot.name] = spot;
  return acc;
}, {});

Object.entries(SPOT_NAME_ALIASES).forEach(([alias, target]) => {
  if (SPOT_BY_NAME[target]) {
    SPOT_BY_NAME[alias] = SPOT_BY_NAME[target];
  }
});

const KAIST_BOUNDARY_PATH = [
  { lat: 36.3722536, lng: 127.3563062 },
  { lat: 36.3718705, lng: 127.3555366 },
  { lat: 36.3714004, lng: 127.3551775 },
  { lat: 36.3707423, lng: 127.3551755 },
  { lat: 36.3701119, lng: 127.3551416 },
  { lat: 36.3695194, lng: 127.35529 },
  { lat: 36.3686589, lng: 127.3558462 },
  { lat: 36.3680371, lng: 127.356276 },
  { lat: 36.3675306, lng: 127.3566346 },
  { lat: 36.3662289, lng: 127.3575073 },
  { lat: 36.364998, lng: 127.3583128 },
  { lat: 36.3641914, lng: 127.3588286 },
  { lat: 36.3632396, lng: 127.3594513 },
  { lat: 36.3638636, lng: 127.3604723 },
  { lat: 36.3645115, lng: 127.3617012 },
  { lat: 36.3654039, lng: 127.3635305 },
  { lat: 36.3664143, lng: 127.365721 },
  { lat: 36.3671878, lng: 127.3669117 },
  { lat: 36.3687475, lng: 127.3692388 },
  { lat: 36.3692864, lng: 127.3700431 },
  { lat: 36.3698521, lng: 127.369642 },
  { lat: 36.3705725, lng: 127.3685031 },
  { lat: 36.3711543, lng: 127.3679213 },
  { lat: 36.3721754, lng: 127.3676982 },
  { lat: 36.3734474, lng: 127.3672858 },
  { lat: 36.3745723, lng: 127.36667 },
  { lat: 36.3751044, lng: 127.3660923 },
  { lat: 36.3755371, lng: 127.36471 },
  { lat: 36.3757704, lng: 127.3635489 },
  { lat: 36.3761623, lng: 127.362135 },
  { lat: 36.3766876, lng: 127.3611065 },
  { lat: 36.3771518, lng: 127.3602607 },
  { lat: 36.3777336, lng: 127.3592843 },
  { lat: 36.3785319, lng: 127.3579868 },
  { lat: 36.3780782, lng: 127.3565453 },
  { lat: 36.3772436, lng: 127.356274 },
  { lat: 36.3760248, lng: 127.3562815 },
  { lat: 36.3746533, lng: 127.3562711 },
  { lat: 36.3730736, lng: 127.3562032 },
  { lat: 36.3722536, lng: 127.3563062 },
];

const DEFAULT_CENTER = { lat: 36.3703, lng: 127.3607 };
const KAIST_BOUNDS = {
  sw: { lat: 36.3605, lng: 127.3465 },
  ne: { lat: 36.3798, lng: 127.3742 },
};

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

const createPinImage = (size) =>
  new window.kakao.maps.MarkerImage(
    pinIcon,
    new window.kakao.maps.Size(size, size),
    { offset: new window.kakao.maps.Point(size / 2, size) }
  );

export default function IngameMap() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const spotMarkersRef = useRef([]);
  const nearestOverlayRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);
  const [eyeballs, setEyeballs] = useState([]);
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
      zoomable: true,
    });

    const bounds = new window.kakao.maps.LatLngBounds(
      new window.kakao.maps.LatLng(KAIST_BOUNDS.sw.lat, KAIST_BOUNDS.sw.lng),
      new window.kakao.maps.LatLng(KAIST_BOUNDS.ne.lat, KAIST_BOUNDS.ne.lng)
    );
    kakaoMap.setBounds(bounds);
    kakaoMap.setZoomable(true);

    setMap(kakaoMap);
  }, [position, map, kakaoReady]);

  // 2.1️⃣ 백엔드 핀 목록 로드
  useEffect(() => {
    let cancelled = false;

    const loadEyeballs = async () => {
      try {
        const active = await apiGet("/games/active");
        if (!active?.game?.id) {
          setEyeballs([]);
          return;
        }

        const data = await apiGet(`/games/${active.game.id}/eyeballs`);
        const mapped = (data.eyeballs || [])
          .map((eyeball) => {
            const spot = SPOT_BY_NAME[eyeball.type_name];
            if (!spot) return null;
            return {
              ...spot,
              id: eyeball.id,
              typeId: eyeball.type_id,
              points: eyeball.points,
              isActive: eyeball.is_active,
              typeName: eyeball.type_name,
            };
          })
          .filter(Boolean);

        if (!cancelled) {
          setEyeballs(mapped);
        }
      } catch (error) {
        console.error("핀 목록 로드 실패:", error);
        if (!cancelled) {
          setEyeballs([]);
        }
      }
    };

    loadEyeballs();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2.25️⃣ 카이스트 경계 밖 마스크 (Polygon)
  useEffect(() => {
    if (!map || !window.kakao?.maps) return;

    // 큰 바운더리 (대전 전체/충분히 큰 영역)
    const outerPath = [
      new window.kakao.maps.LatLng(36.5, 127.2),
      new window.kakao.maps.LatLng(36.5, 127.5),
      new window.kakao.maps.LatLng(36.2, 127.5),
      new window.kakao.maps.LatLng(36.2, 127.2),
    ];

    // 내부 구멍 (KAIST)
    const innerPath = KAIST_BOUNDARY_PATH.map(
      (p) => new window.kakao.maps.LatLng(p.lat, p.lng)
    );

    // 폴리곤 생성 (Outer -> Inner Hole)
    const polygon = new window.kakao.maps.Polygon({
      map: map,
      path: [outerPath, innerPath],
      strokeWeight: 0,
      fillColor: "#C8C8C8",
      fillOpacity: 0.8,
      zIndex: 1, // 오버레이 중 낮은 순서
    });

    return () => {
      polygon.setMap(null);
    };
  }, [map]);

  const nearestSpot = useMemo(() => {
    if (!position || eyeballs.length === 0) return null;
    let nearest = null;
    eyeballs.forEach((spot) => {
      const dist = distanceMeters(position, spot);
      if (!nearest || dist < nearest.distance) {
        nearest = { ...spot, distance: dist };
      }
    });
    return nearest;
  }, [position, eyeballs]);

  // 2.5️⃣ 장소 핀 표시
  useEffect(() => {
    if (!map || !window.kakao?.maps) return;

    spotMarkersRef.current.forEach((marker) => marker.setMap(null));
    spotMarkersRef.current = [];
    if (nearestOverlayRef.current) {
      nearestOverlayRef.current.setMap(null);
      nearestOverlayRef.current = null;
    }
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    eyeballs.forEach((spot) => {
      const isNearest = nearestSpot?.id === spot.id;
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(spot.lat, spot.lng),
        image: createPinImage(isNearest ? 36 : 28),
      });
      window.kakao.maps.event.addListener(marker, "click", () => {
        const content = `
          <div style="padding:8px 10px; font-size:12px; line-height:1.4;">
            <div style="font-weight:700; margin-bottom:2px;">${spot.name}</div>
            <div>눈알 ${spot.eyeballCount}개</div>
          </div>
        `;
        if (!infoWindowRef.current) {
          infoWindowRef.current = new window.kakao.maps.InfoWindow({ content });
        } else {
          infoWindowRef.current.setContent(content);
        }
        infoWindowRef.current.open(map, marker);
      });
      spotMarkersRef.current.push(marker);
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
        zIndex: 12,
      });
      overlay.setMap(map);
      nearestOverlayRef.current = overlay;
    }
  }, [map, nearestSpot, eyeballs]);

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
          className="top-button trophy-button"
          onClick={() => navigate("/ranking/group")}
          aria-label="랭킹으로 이동"
        >
          <img src={iconTrophy} alt="랭킹" />
        </button>
        <button
          className="top-button"
          onClick={() => navigate("/mypage")}
          aria-label="마이페이지로 이동"
        >
          <img src={iconProfile} alt="마이페이지" />
        </button>
      </div>

      <div className="map-wrapper">
        <div ref={mapRef} className="map-base" />
      </div>
      <div className="zoom-controls" aria-label="지도 확대/축소">
        <button
          type="button"
          className="zoom-button"
          onClick={() => map && map.setLevel(Math.max(1, map.getLevel() - 1))}
          aria-label="확대"
        >
          +
        </button>
        <div className="zoom-track" aria-hidden="true" />
        <button
          type="button"
          className="zoom-button"
          onClick={() => map && map.setLevel(Math.min(14, map.getLevel() + 1))}
          aria-label="축소"
        >
          −
        </button>
      </div>

      {nearestSpot && (
        <button
          className="qr-main-button"
          onClick={() => navigate("/ingame/scan")}
        >
          {`가까운 핀 탐색하기 (+보너스 · ${Math.round(nearestSpot.distance)}m)`}
        </button>
      )}
    </div>
  );
}
