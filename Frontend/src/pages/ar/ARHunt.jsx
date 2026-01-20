import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { apiGet, apiPost } from "../../data/api";
import "./ARHunt.css";

const MODEL_URL = `${process.env.PUBLIC_URL}/Nupjuki_Idle.glb`;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ARHunt() {
  const query = useQuery();
  const huntId = query.get("huntId");
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const rendererRef = useRef(null);
  const mixerRef = useRef(null);
  const actionsRef = useRef([]);
  const clockRef = useRef(new THREE.Clock());
  const [cameraActive, setCameraActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [eyeball, setEyeball] = useState(null);
  const [captureStatus, setCaptureStatus] = useState("");
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
        const scale = 1.2 / maxDim;
        model.scale.setScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(model);
        model.position.set(0, -scaledBox.min.y, 0);

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
    } catch (err) {
      console.error(err);
      setCaptureStatus("점수 반영 실패");
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !rendererRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    ctx.drawImage(rendererRef.current.domElement, 0, 0, width, height);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `nupjuki-${Date.now()}.png`;
    link.click();
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
        <button className="ar-button ghost" onClick={captureFrame} disabled={!cameraActive}>
          캡처 저장
        </button>
        {captureStatus && <div className="ar-status">{captureStatus}</div>}
        {error && <div className="ar-error">{error}</div>}
      </div>
    </div>
  );
}
