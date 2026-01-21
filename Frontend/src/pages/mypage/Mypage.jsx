// src/pages/mypage/Mypage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import iconBack from "../../assets/icons/icon_back.svg";
import "../../styles/mypage.css";

import ProfileCard from "../../ui/mypage/ProfileCard";
import EmptyState from "../../ui/mypage/EmptyState";
import ScoreSummary from "../../ui/mypage/ScoreSummary";
import StatsGrid from "../../ui/mypage/StatsGrid";

import { apiGet } from "../../data/api";

const MODEL_URL =
  "https://pub-1475ab6767f74ade9449c1b0234209a4.r2.dev/Nupjuki-Idle_v2.glb";

export default function Mypage() {
  const navigate = useNavigate();
  const viewerRef = useRef(null);
  const viewerRendererRef = useRef(null);
  const viewerSceneRef = useRef(null);
  const viewerCameraRef = useRef(null);
  const viewerMixerRef = useRef(null);
  const viewerClockRef = useRef(new THREE.Clock());
  const [profile, setProfile] = useState({
    nickname: "",
    group: "미선택",
    members: 0,
  });
  const [status, setStatus] = useState([]);
  const [score, setScore] = useState({
    point: 0,
    totalRank: 0,
    groupRank: 0,
  });
  const [stats, setStats] = useState({
    distance: 0,
    found: 0,
    buildings: 0,
  });
  const [captures, setCaptures] = useState([]);
  const [selectedCapture, setSelectedCapture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadMypage = async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await apiGet("/users/me");
        if (!active) return;

        setProfile((prev) => ({
          ...prev,
          nickname: me.nickname || prev.nickname,
        }));

        const [scoreData, groupData] = await Promise.all([
          apiGet("/score/me"),
          apiGet("/groups/me").catch((err) => {
            const message = String(err?.message || "");
            if (message.includes("404")) return null;
            throw err;
          }),
        ]);
        if (!active) return;

        let groupSnapshot = null;
        if (groupData?.id) {
          groupSnapshot = await apiGet(`/groups/${groupData.id}/snapshot`);
        }

        setProfile((prev) => ({
          ...prev,
          group: groupData?.name || prev.group,
          members: groupSnapshot?.members?.length ?? prev.members,
        }));

        const foundCount = scoreData?.captures_count ?? 0;
        const capturesData = await apiGet("/users/me/captures");
        const uniqueBuildings = new Set(
          (capturesData?.captures || [])
            .map((capture) => capture.eyeball_id)
            .filter(Boolean)
        ).size;

        setCaptures((capturesData?.captures || []).filter((capture) => capture.image_url));

        setStats((prev) => ({
          ...prev,
          found: foundCount,
          buildings: uniqueBuildings,
        }));

        if (scoreData?.game_id) {
          const result = await apiGet(`/games/${scoreData.game_id}/result`);
          const totalRank =
            (result?.personal_leaderboard || []).findIndex(
              (row) => row.user_id === me.id
            ) + 1;
          const groupRank =
            (result?.group_leaderboard || []).findIndex(
              (row) => row.group_id === groupData?.id
            ) + 1;

          setScore({
            point: scoreData?.score ?? 0,
            totalRank: totalRank > 0 ? totalRank : 0,
            groupRank: groupRank > 0 ? groupRank : 0,
          });
        } else {
          setScore({
            point: scoreData?.score ?? 0,
            totalRank: 0,
            groupRank: 0,
          });
        }

        const nextStatus = [];
        if (foundCount === 0) nextStatus.push("탐색 대기");
        if (foundCount > 0 && foundCount < 5) nextStatus.push("초보 헌터");
        if (foundCount >= 5) nextStatus.push("열정 헌터");
        setStatus(nextStatus);
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMypage();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCapture || !viewerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 1.05, 2.2);
    camera.lookAt(0, 0.8, 0);
    viewerSceneRef.current = scene;
    viewerCameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0);
    viewerRef.current.appendChild(renderer.domElement);
    viewerRendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(2, 3, 2);
    scene.add(ambient, key);

    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 0.7 / maxDim;
        model.scale.setScalar(scale);
        model.rotation.y = 0;

        const scaledBox = new THREE.Box3().setFromObject(model);
        model.position.set(0, -scaledBox.min.y + 0.2, 0);

        scene.add(model);

        if (gltf.animations?.length) {
          const mixer = new THREE.AnimationMixer(model);
          viewerMixerRef.current = mixer;
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }
      },
      undefined,
      (loadErr) => {
        console.error(loadErr);
      }
    );

    let frameId;
    const renderLoop = () => {
      const delta = viewerClockRef.current.getDelta();
      if (viewerMixerRef.current) {
        viewerMixerRef.current.update(delta);
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(renderLoop);
    };

    const resize = () => {
      if (!viewerRef.current) return;
      const { clientWidth, clientHeight } = viewerRef.current;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(viewerRef.current);
    resize();
    renderLoop();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
      renderer.dispose();
      renderer.domElement.remove();
      viewerRendererRef.current = null;
      viewerSceneRef.current = null;
      viewerCameraRef.current = null;
      viewerMixerRef.current = null;
    };
  }, [selectedCapture]);

  return (
    <div className="mypage-wrapper">
      <button
        className="mypage-back"
        onClick={() => navigate("/ingame/map")}
        aria-label="뒤로가기"
      >
        <img src={iconBack} alt="" />
      </button>
      {loading && <div>로딩중...</div>}
      {error && <div>로그인이 필요해요.</div>}
      <ScoreSummary score={score} status={status} showRanks={false} />

      <div className="rank-strip" aria-label="랭킹 요약">
        <div className="rank-chip">
          <span>전체 순위</span>
          <strong>{score.totalRank ? `${score.totalRank}위` : "-"}</strong>
        </div>
        <div className="rank-chip">
          <span>분반 순위</span>
          <strong>{score.groupRank ? `${score.groupRank}위` : "-"}</strong>
        </div>
      </div>

      <ProfileCard profile={profile} />

      {stats.found === 0 && <EmptyState />}

      <StatsGrid stats={stats} />

      {captures.length > 0 && (
        <div className="capture-gallery">
          <div className="capture-gallery-title">내 갤러리</div>
          <div className="capture-gallery-subtitle">눈알 발견 기록</div>
          <div className="capture-grid">
            {captures.map((capture) => (
              <button
                key={capture.id}
                className="capture-card"
                type="button"
                onClick={() => setSelectedCapture(capture)}
              >
                <img src={capture.image_url} alt="capture" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCapture && (
        <div className="capture-modal">
          <div className="capture-modal-body">
            <button
              className="capture-modal-close"
              type="button"
              onClick={() => setSelectedCapture(null)}
            >
              닫기
            </button>
            <div className="capture-media">
              <img src={selectedCapture.image_url} alt="capture detail" />
              <div ref={viewerRef} className="capture-3d" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
