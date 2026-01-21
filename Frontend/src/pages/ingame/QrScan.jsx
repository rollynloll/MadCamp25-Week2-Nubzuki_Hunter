import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../../data/api";

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
        setStatus("success");
        setMessage("인식 완료! 눈알을 찾았어.");
        stopCamera();
        setTimeout(() => {
          navigate(`/ar?huntId=${encodeURIComponent(value)}`, {
            state: { eyeball },
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
        setMessage("가운데에 맞추면 바로 인식돼.");
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
      <button
        className="qr-back"
        onClick={() => navigate(-1)}
        aria-label="카메라 종료"
        type="button"
      >
        <span className="qr-close-icon" aria-hidden="true">×</span>
      </button>
      <div className="qr-viewport">
        <video ref={videoRef} className="qr-video" muted playsInline />
        <div className="qr-frame" aria-hidden="true">
          <span className="qr-corner top-left" />
          <span className="qr-corner top-right" />
          <span className="qr-corner bottom-left" />
          <span className="qr-corner bottom-right" />
          <span className="qr-scan-line" />
        </div>
        {status !== "ready" && (
          <div className="qr-overlay">
            <p>{message}</p>
          </div>
        )}
      </div>
      <p className={`qr-status ${status}`}>{message}</p>
    </div>
  );
}
