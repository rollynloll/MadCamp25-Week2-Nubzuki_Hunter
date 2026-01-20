import { useEffect, useRef, useState } from "react";
import { apiGet, apiPost } from "../../data/api";

export default function QRScanner() {
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [scanned, setScanned] = useState("");
  const [manualValue, setManualValue] = useState("");
  const [eyeball, setEyeball] = useState(null);
  const [captureStatus, setCaptureStatus] = useState("");

  const stopStream = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const reset = () => {
    setScanned("");
    setEyeball(null);
    setCaptureStatus("");
    setError("");
  };

  const handleResolve = async (value) => {
    try {
      const data = await apiGet(`/eyeballs/qr/resolve?value=${encodeURIComponent(value)}`);
      setEyeball(data);
    } catch (err) {
      console.warn("resolve failed", err);
      setError("QR 해석에 실패했어");
    }
  };

  const handleCapture = async () => {
    if (!eyeball?.id) return;
    setCaptureStatus("capturing");
    try {
      const data = await apiPost("/captures", { eyeball_id: eyeball.id });
      setCaptureStatus(`captured +${data?.points ?? 0}`);
    } catch (err) {
      console.warn("capture failed", err);
      setCaptureStatus("capture failed");
    }
  };

  useEffect(() => {
    let active = true;

    const start = async () => {
      setStatus("requesting camera");
      setError("");
      if (!("BarcodeDetector" in window)) {
        setStatus("barcode detector not supported");
        setError("이 브라우저는 QR 스캔을 지원하지 않아");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!active) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
        setStatus("scanning");

        const scan = async () => {
          if (!active || !videoRef.current || !detectorRef.current) return;
          try {
            const codes = await detectorRef.current.detect(videoRef.current);
            if (codes.length > 0) {
              const value = codes[0]?.rawValue || "";
              if (value) {
                setScanned(value);
                setStatus("scanned");
                stopStream();
                await handleResolve(value);
                return;
              }
            }
          } catch (err) {
            console.warn("scan error", err);
          }
          rafRef.current = requestAnimationFrame(scan);
        };
        rafRef.current = requestAnimationFrame(scan);
      } catch (err) {
        console.warn("camera error", err);
        setStatus("camera error");
        setError("카메라 접근에 실패했어");
      }
    };

    start();

    return () => {
      active = false;
      stopStream();
    };
  }, []);

  return (
    <div className="ingame-map-container" style={{ padding: 24 }}>
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: 20,
          maxWidth: 720,
          margin: "0 auto",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>QR 스캔</h2>
        <p style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>
          카메라 권한을 허용하고 QR을 비춰줘.
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{
              width: "100%",
              borderRadius: 16,
              background: "#0f172a",
              minHeight: 280,
            }}
          />

          <div style={{ fontSize: 12, color: "#475569" }}>status: {status}</div>
          {error && <div style={{ fontSize: 12, color: "#ef4444" }}>error: {error}</div>}
          {scanned && (
            <div style={{ fontSize: 12, color: "#0f172a" }}>
              scanned: {scanned}
            </div>
          )}

          {eyeball && (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.4)",
                fontSize: 12,
                background: "#f8fafc",
              }}
            >
              <div>eyeball: {eyeball.id}</div>
              <div>type id: {eyeball.type_id}</div>
              <div>points: {eyeball.points}</div>
            </div>
          )}

          {eyeball && (
            <button
              onClick={handleCapture}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "none",
                background: "#fbbf24",
                color: "#111827",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              점수 반영
            </button>
          )}
          {captureStatus && (
            <div style={{ fontSize: 12, color: "#0f172a" }}>{captureStatus}</div>
          )}

          <div
            style={{
              marginTop: 8,
              paddingTop: 12,
              borderTop: "1px solid rgba(148,163,184,0.3)",
            }}
          >
            <div style={{ fontSize: 12, color: "#475569" }}>수동 입력</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="QR 값 붙여넣기"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.4)",
                  fontSize: 12,
                }}
              />
              <button
                onClick={() => {
                  if (!manualValue.trim()) return;
                  reset();
                  setScanned(manualValue.trim());
                  handleResolve(manualValue.trim());
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: "white",
                  fontSize: 12,
                }}
              >
                해석
              </button>
              <button
                onClick={() => {
                  reset();
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: "white",
                  fontSize: 12,
                }}
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
