import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { apiGet, apiPost } from "../../data/api";
import "./ARHunt.css";

const R2_BASE_URL = "https://pub-1475ab6767f74ade9449c1b0234209a4.r2.dev";
const DEFAULT_MODEL_FILE = "Nupjuki-Idle_v2.glb";
const normalizeTypeName = (value) =>
  value
    ? value
        .trim()
        .replace(/[\u200b\u200c\u200d\uFEFF]/g, "")
        .normalize("NFC")
        .toLowerCase()
    : "";
const MODEL_FILE_BY_TYPE = {
  [normalizeTypeName("KRAFTON")]: "Nupjuki-Krafton.glb",
  [normalizeTypeName("크래프톤 건물")]: "Nupjuki-Krafton.glb",
  [normalizeTypeName("krafton")]: "Nupjuki-Krafton.glb",
  [normalizeTypeName("library")]: "Nupjuki-Library.glb",
  [normalizeTypeName("카이스트 도서관")]: "Nupjuki-Library.glb",
  [normalizeTypeName("natural-science")]: "Nupjuki-Science.glb",
  [normalizeTypeName("자연과학동")]: "Nupjuki-Science.glb",
  [normalizeTypeName("sports-complex")]: "Nupjuki-Sports.glb",
  [normalizeTypeName("스포츠 컴플렉스")]: "Nupjuki-Sports.glb",
  [normalizeTypeName("duckpond")]: "Nupjuki-oripond.glb",
  [normalizeTypeName("오리연못")]: "Nupjuki-oripond.glb",
  [normalizeTypeName("kaimaru")]: "nupjuki-kaimaru.glb",
  [normalizeTypeName("카이마루")]: "nupjuki-kaimaru.glb",
};
const resolveModelUrl = (typeName) => {
  const key = normalizeTypeName(typeName);
  const fileName = MODEL_FILE_BY_TYPE[key] || DEFAULT_MODEL_FILE;
  return `${R2_BASE_URL}/${fileName}`;
};
const CAPTURE_BUCKET = "capture-images";
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ARHunt() {
  const query = useQuery();
  const huntId = query.get("huntId");
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const mixerRef = useRef(null);
  const actionsRef = useRef([]);
  const clockRef = useRef(new THREE.Clock());
  const [cameraActive, setCameraActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [eyeball, setEyeball] = useState(null);
  const [captureStatus, setCaptureStatus] = useState("");
  const [gifCapturing, setGifCapturing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadEyeball = async () => {
      if (!huntId) return;
      try {
        const data = await apiGet(
          `/eyeballs/qr/resolve?value=${encodeURIComponent(huntId)}`
        );
        if (active) setEyeball(data);
      } catch (err) {
        console.error(err);
        if (active) setError("QR 정보를 불러오지 못했어");
      }
    };
    loadEyeball();
    return () => {
      active = false;
    };
  }, [huntId]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 1.25, 3);
    camera.lookAt(0, 0.9, 0);
    sceneRef.current = scene;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(2, 3, 2);
    scene.add(ambient, key);

    let frameId;
    const renderLoop = () => {
      const delta = clockRef.current.getDelta();
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(renderLoop);
    };

    const resize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    resize();
    renderLoop();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const modelUrl = resolveModelUrl(eyeball?.type_name);

  useEffect(() => {
    if (!sceneRef.current) return;
    let active = true;
    setModelReady(false);
    setError("");

    const scene = sceneRef.current;
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        if (!active) return;
        if (modelRef.current) {
          scene.remove(modelRef.current);
        }

        if (mixerRef.current) {
          mixerRef.current.stopAllAction();
        }
        mixerRef.current = null;
        actionsRef.current = [];

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
        modelRef.current = model;

        if (gltf.animations?.length) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          actionsRef.current = gltf.animations.map((clip) => {
            const action = mixer.clipAction(clip);
            action.clampWhenFinished = true;
            return action;
          });
          actionsRef.current[0].play();
        }

        setModelReady(true);
      },
      undefined,
      (loadErr) => {
        if (!active) return;
        console.error(loadErr);
        setError("3D 모델 로드 실패");
      }
    );

    return () => {
      active = false;
    };
  }, [modelUrl]);

  useEffect(() => {
    const videoEl = videoRef.current;
    return () => {
      const stream = videoEl?.srcObject;
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.error(err);
      setError("카메라 권한이 필요해");
    }
  };

  const playAnimation = () => {
    if (!actionsRef.current.length) return;
    const action = actionsRef.current.length > 1 ? actionsRef.current[1] : actionsRef.current[0];
    action.reset();
    action.time = 0;
    action.setLoop(THREE.LoopOnce, 1);
    action.play();
  };

  const captureStill = async ({ scale = 0.85 } = {}) => {
    if (gifCapturing || !videoRef.current) {
      return;
    }

    setGifCapturing(true);

    const video = videoRef.current;
    const stream = video.srcObject;
    const overlay = rendererRef.current?.domElement;
    const prevVisibility = overlay?.style.visibility;
    if (overlay) overlay.style.visibility = "hidden";

    try {
      if (stream instanceof MediaStream) {
        const [track] = stream.getVideoTracks();
        if (track && "ImageCapture" in window) {
          const imageCapture = new window.ImageCapture(track);
          const bitmap = await imageCapture.grabFrame();
          const width = Math.round(bitmap.width * scale);
          const height = Math.round(bitmap.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0, width, height);
            const blob = await new Promise((resolve) =>
              canvas.toBlob(resolve, "image/png")
            );
            setGifCapturing(false);
            if (overlay) overlay.style.visibility = prevVisibility || "";
            return blob;
          }
        }
      }
    } catch (err) {
      console.error(err);
    }

    const width = Math.round(video.videoWidth * scale);
    const height = Math.round(video.videoHeight * scale);
    if (!width || !height) {
      setGifCapturing(false);
      if (overlay) overlay.style.visibility = prevVisibility || "";
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setGifCapturing(false);
      setCaptureStatus("");
      if (overlay) overlay.style.visibility = prevVisibility || "";
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    ctx.drawImage(video, 0, 0, width, height);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );

    setGifCapturing(false);
    if (overlay) overlay.style.visibility = prevVisibility || "";
    return blob;
  };

  const uploadCapture = async (blob) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase env missing");
    }
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No auth token");

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const filePath = `captures/${huntId || "unknown"}/${fileName}`;
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${CAPTURE_BUCKET}/${filePath}`;

    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "image/png",
        "x-upsert": "true",
      },
      body: blob,
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Upload failed ${res.status}: ${detail}`);
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${CAPTURE_BUCKET}/${filePath}`;
  };

  const handleSummon = async () => {
    if (!cameraActive || gifCapturing || !modelReady) return;
    setCaptureStatus("");
    playAnimation();

    try {
      setCaptureStatus("사진 저장 중...");
      const blob = await captureStill({ scale: 0.85 });
      if (!blob) throw new Error("Capture failed");
      const imageUrl = await uploadCapture(blob);

      if (!eyeball?.id) return;
      setCaptureStatus("점수 반영 중...");
      const data = await apiPost("/captures", {
        eyeball_id: eyeball.id,
        image_url: imageUrl,
      });
      setCaptureStatus(`+${data?.points ?? 0}점 획득!`);
      setTimeout(() => navigate("/mypage"), 800);
    } catch (err) {
      console.error(err);
      setCaptureStatus("사진 저장 실패");
    }
  };

  return (
    <div className="ar-page">
      <video
        ref={videoRef}
        className="ar-video"
        playsInline
        muted
        autoPlay
      />
      <div ref={containerRef} className="ar-canvas" />

      <div className="ar-topbar">
        <span className="ar-badge">AR Hunt</span>
        {huntId && <span className="ar-id">huntId: {huntId}</span>}
      </div>

      {!cameraActive && (
        <div className="ar-overlay">
          <button className="ar-button" onClick={startCamera}>
            카메라 시작
          </button>
        </div>
      )}

      <div className="ar-ui">
        <button
          className="ar-button"
          onClick={handleSummon}
          disabled={!cameraActive || gifCapturing || !modelReady}
        >
          촬영/소환
        </button>
        {captureStatus && <div className="ar-status">{captureStatus}</div>}
        {error && <div className="ar-error">{error}</div>}
      </div>
    </div>
  );
}
