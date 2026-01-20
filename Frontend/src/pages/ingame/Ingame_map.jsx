// src/pages/ingame/Ingame_map.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import nubzukiImage from "../../assets/images/nubzuki.png";
import pinIcon from "../../assets/icons/icon_pin.png";
import iconTrophy from "../../assets/icons/icon_trophy.svg";
import iconProfile from "../../assets/icons/icon_profile.svg";
import iconGame from "../../assets/icons/icon_game.svg";
import iconBack from "../../assets/icons/icon_back.svg";
import iconFront from "../../assets/icons/icon_front.svg";
import { apiGet } from "../../data/api";
import "./Ingame_map.css";

const SPOTS = [
  {
    id: "kaimaru",
    name: "카이마루",
    lat: 36.3739,
    lng: 127.3592,
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

const normalizeName = (value) =>
  value
    ? value
        .trim()
        .replace(/[\u200b\u200c\u200d\uFEFF]/g, "")
        .normalize("NFC")
    : "";

const SPOT_BY_NAME = SPOTS.reduce((acc, spot) => {
  acc[normalizeName(spot.name)] = spot;
  return acc;
}, {});

Object.entries(SPOT_NAME_ALIASES).forEach(([alias, target]) => {
  const normalizedAlias = normalizeName(alias);
  const normalizedTarget = normalizeName(target);
  if (SPOT_BY_NAME[normalizedTarget]) {
    SPOT_BY_NAME[normalizedAlias] = SPOT_BY_NAME[normalizedTarget];
  }
});

const normalizeTypeName = (value) => normalizeName(value);

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

const DEFAULT_CENTER = { lat: 36.369644848295096, lng: 127.36253254114752 };
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

const TUTORIAL_STEPS = [
  {
    title: "캠퍼스 헌팅 시작",
    desc: "지도 위에 표시된 핀을 찾아 이동하고, QR을 스캔해 눈알을 모아보세요.",
    items: [
      "지도에서 핀을 눌러 정보를 확인하세요.",
      "가까운 핀일수록 보너스가 커집니다.",
      "탐험 → 이동 → 발견이 핵심 루프입니다.",
    ],
  },
  {
    title: "핀과 상호작용",
    desc: "핀을 누르면 그 장소의 이벤트와 눈알 정보를 확인할 수 있어요.",
    items: [
      "핀은 게임 오브젝트입니다.",
      "가까워질수록 탐험 보너스가 증가합니다.",
      "현재 위치는 캐릭터 마커로 표시됩니다.",
    ],
  },
  {
    title: "랭킹과 보상",
    desc: "눈알은 기록이고, 점수는 경쟁입니다. 더 많이 발견할수록 상위권에 가까워져요.",
    items: [
      "랭킹은 점수 기준으로 정렬됩니다.",
      "첫 발견 보너스 같은 추가 점수가 있습니다.",
      "지금 바로 핀을 찾고 출발해보세요.",
    ],
  },
];

export default function IngameMap() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const spotMarkersRef = useRef([]);
  const nearestOverlayRef = useRef(null);
  const infoOverlayRef = useRef(null);
  const maskOverlayRef = useRef(null);
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);
  const [eyeballs, setEyeballs] = useState([]);
  const [kakaoReady, setKakaoReady] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const tutorial = TUTORIAL_STEPS[tutorialStep];

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
      level: 2,
      draggable: true,
      zoomable: false,
      disableDoubleClickZoom: true,
    });

    const bounds = new window.kakao.maps.LatLngBounds(
      new window.kakao.maps.LatLng(KAIST_BOUNDS.sw.lat, KAIST_BOUNDS.sw.lng),
      new window.kakao.maps.LatLng(KAIST_BOUNDS.ne.lat, KAIST_BOUNDS.ne.lng)
    );
    kakaoMap.setBounds(bounds);
    kakaoMap.setLevel(5);
    kakaoMap.setZoomable(false);

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

        const counts = await apiGet(
          `/eyeballs/active/counts?game_id=${active.game.id}`
        );
        console.log(
          "counts keys:",
          Object.keys(counts || {}).map((k) => ({
            raw: k,
            normalized: normalizeTypeName(k),
            length: k.length,
          }))
        );
        console.log(
          "SPOT_BY_NAME has kaimaru:",
          Boolean(SPOT_BY_NAME[normalizeTypeName("카이마루")])
        );
        const mapped = Object.entries(counts || {})
          .map(([typeName, count]) => {
            const spot = SPOT_BY_NAME[normalizeTypeName(typeName)];
            if (!spot) return null;
            return {
              ...spot,
              eyeballCount: count,
              typeName,
            };
          })
          .filter(Boolean);
        const mappedById = mapped.reduce((acc, item) => {
          acc[item.id] = item;
          return acc;
        }, {});
        const merged = SPOTS.map((spot) => ({
          ...spot,
          eyeballCount: mappedById[spot.id]?.eyeballCount ?? 0,
          typeName: mappedById[spot.id]?.typeName ?? spot.name,
        }));
        console.log(
          "merged:",
          merged.map((s) => ({
            id: s.id,
            name: s.name,
            count: s.eyeballCount,
          }))
        );

        if (!cancelled) {
          setEyeballs(merged);
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

  // 2.2️⃣ 카이스트 경계 마스크 (마커보다 아래 zIndex)
  useEffect(() => {
    if (!map || !window.kakao?.maps || !mapRef.current) return;

    const container = mapRef.current;

    const updateMask = () => {
      const projection = map.getProjection?.();
      if (!projection) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;

      const points = KAIST_BOUNDARY_PATH.map((point) => {
        const latLng = new window.kakao.maps.LatLng(point.lat, point.lng);
        const pt = projection.containerPointFromCoords(latLng);
        return `${pt.x},${pt.y}`;
      }).join(" ");

      const content = `
        <div style="width:${width}px;height:${height}px;">
          <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="kaist-mask">
                <rect width="${width}" height="${height}" fill="white" />
                <polygon points="${points}" fill="black" />
              </mask>
            </defs>
            <rect width="${width}" height="${height}" fill="rgba(201, 205, 214, 0.55)" mask="url(#kaist-mask)" />
          </svg>
        </div>
      `;

      if (!maskOverlayRef.current) {
        maskOverlayRef.current = new window.kakao.maps.CustomOverlay({
          position: map.getCenter(),
          content,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 1,
        });
        maskOverlayRef.current.setMap(map);
      } else {
        maskOverlayRef.current.setContent(content);
        maskOverlayRef.current.setPosition(map.getCenter());
      }
    };

    updateMask();
    window.kakao.maps.event.addListener(map, "idle", updateMask);

    return () => {
      window.kakao.maps.event.removeListener(map, "idle", updateMask);
      if (maskOverlayRef.current) {
        maskOverlayRef.current.setMap(null);
        maskOverlayRef.current = null;
      }
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
    if (infoOverlayRef.current) {
      infoOverlayRef.current.setMap(null);
      infoOverlayRef.current = null;
    }

    eyeballs.forEach((spot) => {
      if (spot.id === "kaimaru") {
        console.log("kaimaru marker data:", spot);
      }
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(spot.lat, spot.lng),
        image: createPinImage(24),
        zIndex: 100,
      });
      window.kakao.maps.event.addListener(marker, "click", () => {
        console.log("marker click:", spot.id, spot.name);
        const content = `
          <div class="pin-info" style="padding:8px 10px; font-size:12px; line-height:1.4; background:#ffffff; border:1px solid rgba(15,23,42,0.2); border-radius:10px; box-shadow:0 8px 16px rgba(15,23,42,0.15); color:#1f2937;">
            <div class="pin-info-title">${spot.name}</div>
            <div>눈알 ${spot.eyeballCount}개</div>
          </div>
        `;
        if (infoOverlayRef.current) {
          infoOverlayRef.current.setMap(null);
          infoOverlayRef.current = null;
        }
        infoOverlayRef.current = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(spot.lat, spot.lng),
          content,
          xAnchor: 0.5,
          yAnchor: 1.15,
          zIndex: 220,
        });
        infoOverlayRef.current.setMap(map);
      });
      spotMarkersRef.current.push(marker);
    });

    if (nearestSpot) {
      const overlayContent = `
        <div class="pin-overlay" style="pointer-events:none;">
          <span class="pin-pulse"></span>
        </div>
      `;
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(nearestSpot.lat, nearestSpot.lng),
        content: overlayContent,
        xAnchor: 0.5,
        yAnchor: 1,
        zIndex: 150,
      });
      overlay.setMap(map);
      nearestOverlayRef.current = overlay;
    }
  }, [map, nearestSpot, eyeballs]);

  // 3️⃣ 내 위치 마커 및 지도 중심 이동
  useEffect(() => {
    if (!map || !position || !window.kakao?.maps) return;
    const next = new window.kakao.maps.LatLng(position.lat, position.lng);
    map.setCenter(new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng));

    if (!markerRef.current) {
      const size = new window.kakao.maps.Size(64, 64);
      const offset = new window.kakao.maps.Point(32, 64);
      const image = new window.kakao.maps.MarkerImage(nubzukiImage, size, { offset });
      markerRef.current = new window.kakao.maps.Marker({
        position: next,
        image,
        zIndex: 30,
        clickable: false,
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
          onClick={() => {
            setTutorialStep(0);
            setTutorialOpen(true);
          }}
          aria-label="튜토리얼 열기"
        >
          <img src={iconGame} alt="튜토리얼" />
        </button>
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

      <div className="map-frame">
        <div className="map-wrapper">
          <div ref={mapRef} className="map-base" />
          <div className="map-vignette" aria-hidden="true" />
        </div>
      </div>

      {nearestSpot && (
        <button
          className="qr-main-button"
          onClick={() => navigate("/ingame/scan")}
        >
          {`보너스 눈알 받기 · ${Math.round(nearestSpot.distance)}m`}
        </button>
      )}

      {tutorialOpen && (
        <div className="map-modal" role="dialog" aria-modal="true">
          <div className="map-modal-card">
            <div className="map-modal-title">{tutorial.title}</div>
            <p className="map-modal-desc">{tutorial.desc}</p>
            <ul className="map-modal-list">
              {tutorial.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="map-modal-actions">
              <button
                type="button"
                className="tutorial-skip"
                onClick={() => setTutorialOpen(false)}
              >
                건너뛰기
              </button>
              <div className="tutorial-nav">
                <button
                  type="button"
                  className="tutorial-icon-button"
                  onClick={() =>
                    setTutorialStep((prev) => Math.max(0, prev - 1))
                  }
                  aria-label="이전"
                >
                  <img src={iconBack} alt="이전" />
                </button>
                <button
                  type="button"
                  className="tutorial-icon-button"
                  onClick={() => {
                    if (tutorialStep >= TUTORIAL_STEPS.length - 1) {
                      setTutorialOpen(false);
                    } else {
                      setTutorialStep((prev) => Math.min(TUTORIAL_STEPS.length - 1, prev + 1));
                    }
                  }}
                  aria-label={tutorialStep >= TUTORIAL_STEPS.length - 1 ? "완료" : "다음"}
                >
                  <img src={iconFront} alt="다음" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
