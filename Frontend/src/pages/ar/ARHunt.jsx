import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import GIF from "gif.js";
import { apiGet, apiPost } from "../../data/api";
import "./ARHunt.css";

const MODEL_URL =
  "https://pub-1475ab6767f74ade9449c1b0234209a4.r2.dev/Nupjuki-Idle_v2.glb";

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
        console.error(loadErr);
        setError("3D 모델 로드 실패");
      }
    );

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

  const triggerAnimation = async () => {
    if (!actionsRef.current.length) return;
    setCaptureStatus("");
    const action = actionsRef.current.length > 1 ? actionsRef.current[1] : actionsRef.current[0];
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.play();

    if (!eyeball?.id) return;
    try {
      setCaptureStatus("점수 반영 중...");
      const data = await apiPost("/captures", { eyeball_id: eyeball.id });
      setCaptureStatus(`+${data?.points ?? 0}점 획득!`);
      setTimeout(() => navigate("/mypage"), 800);
    } catch (err) {
      console.error(err);
      setCaptureStatus("점수 반영 실패");
    }
  };

  const captureGif = async () => {
    if (
      gifCapturing ||
      !videoRef.current ||
      !rendererRef.current ||
      !sceneRef.current ||
      !cameraRef.current
    ) {
      return;
    }

    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    setGifCapturing(true);
    setCaptureStatus("움짤 생성 중...");

    if (actionsRef.current.length) {
      const action = actionsRef.current[0];
      action.reset();
      action.time = 0;
      action.setLoop(THREE.LoopOnce, 1);
      action.play();
    }

    const renderer = rendererRef.current;
    const prevSize = renderer.getSize(new THREE.Vector2());
    renderer.setSize(width, height, false);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      renderer.setSize(prevSize.x, prevSize.y, false);
      setGifCapturing(false);
      setCaptureStatus("");
      return;
    }

    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: `${process.env.PUBLIC_URL}/gif.worker.js`,
    });

    const totalFrames = 60;
    const delay = Math.round(1000 / 12);

    await new Promise((resolve) => setTimeout(resolve, 100));

    for (let i = 0; i < totalFrames; i += 1) {
      renderer.render(sceneRef.current, cameraRef.current);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.drawImage(renderer.domElement, 0, 0, width, height);
      gif.addFrame(ctx, { copy: true, delay });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    gif.on("finished", (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nupjuki-${Date.now()}.gif`;
      link.click();
      URL.revokeObjectURL(url);
      renderer.setSize(prevSize.x, prevSize.y, false);
      setGifCapturing(false);
      setCaptureStatus("");
    });

    gif.render();
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
        <button className="ar-button" onClick={triggerAnimation} disabled={!modelReady}>
          촬영/소환
        </button>
        <button
          className="ar-button ghost"
          onClick={captureGif}
          disabled={!cameraActive || gifCapturing}
        >
          캡처 저장
        </button>
        {captureStatus && <div className="ar-status">{captureStatus}</div>}
        {error && <div className="ar-error">{error}</div>}
      </div>
    </div>
  );
}
