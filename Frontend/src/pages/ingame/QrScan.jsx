import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../data/api";

export default function QrScan() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("카메라를 준비하는 중...");

  useEffect(() => {
    let active = true;
    let animationId = null;
    let detector = null;

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    const handleDetected = async (value) => {
      if (!value) return;
      setStatus("resolving");
      setMessage("QR을 확인하는 중...");
      try {
        const eyeball = await apiGet(
          `/eyeballs/qr/resolve?value=${encodeURIComponent(value)}`
        );
        setStatus("capturing");
        setMessage("점수를 반영하는 중...");
        const capture = await apiPost("/captures", { eyeball_id: eyeball.id });
        setStatus("success");
        setMessage("인식 완료! 눈알을 찾았어.");
        stopCamera();
        setTimeout(() => {
          navigate("/ingame/found", {
            state: {
              code: value,
              eyeball,
              points: capture?.points ?? 0,
            },
          });
        }, 800);
      } catch (error) {
        setStatus("error");
        setMessage("QR 인식에 실패했어. 다시 시도해줘.");
        stopCamera();
      }
    };

    const startScanLoop = async () => {
      if (!videoRef.current || !detector) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0 && active) {
          const value = barcodes[0]?.rawValue;
          await handleDetected(value);
          return;
        }
      } catch (error) {
        if (active) {
          setStatus("error");
          setMessage("QR 인식을 실패했어. 다시 시도해줘.");
        }
        stopCamera();
        return;
      }

      animationId = requestAnimationFrame(startScanLoop);
    };

    const init = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setMessage("이 기기에서는 카메라를 사용할 수 없어.");
        return;
      }

      if (!("BarcodeDetector" in window)) {
        setStatus("error");
        setMessage("이 브라우저에서는 QR 인식을 지원하지 않아.");
        return;
      }

      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!active) return;
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
        detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        setStatus("ready");
        setMessage("QR 코드를 화면 가운데에 맞춰줘.");
        animationId = requestAnimationFrame(startScanLoop);
      } catch (error) {
        if (active) {
          setStatus("error");
          setMessage("카메라 접근에 실패했어. 권한을 확인해줘.");
        }
        stopCamera();
      }
    };

    init();

    return () => {
      active = false;
      if (animationId) cancelAnimationFrame(animationId);
      stopCamera();
    };
  }, [navigate]);

  return (
    <div className="qr-scan-page">
      <div className="qr-scan-card">
        <h1>QR 스캔</h1>
        <div className="qr-viewport">
          <video ref={videoRef} className="qr-video" muted playsInline />
          {status !== "ready" && (
            <div className="qr-overlay">
              <p>{message}</p>
            </div>
          )}
        </div>
        <p className={`qr-status ${status}`}>{message}</p>
        <div className="qr-actions">
          <button className="qr-secondary" onClick={() => navigate(-1)}>
            뒤로가기
          </button>
        </div>
      </div>
    </div>
  );
}
