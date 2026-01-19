import { useState } from "react";
import { apiPost } from "../../data/api";

export default function QRCodeGenerator() {
  const [eyeballId, setEyeballId] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!eyeballId.trim()) {
      setError("eyeball_id를 입력해줘");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await apiPost(`/eyeballs/${eyeballId}/qr`, {});
      setQrValue(data?.qr_value || "");
    } catch (err) {
      console.error(err);
      setError("QR 생성에 실패했어");
      setQrValue("");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!qrValue) return;
    try {
      await navigator.clipboard.writeText(qrValue);
    } catch (err) {
      console.warn("clipboard copy failed", err);
    }
  };

  return (
    <div className="ingame-map-container" style={{ padding: 24 }}>
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: 20,
          maxWidth: 520,
          margin: "0 auto",
          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20 }}>QR 생성 (개발자용)</h2>
        <p style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>
          eyeball_id를 입력하면 QR 값을 생성하고 이미지로 보여줘.
        </p>

        <form onSubmit={handleGenerate} style={{ display: "grid", gap: 12 }}>
          <input
            value={eyeballId}
            onChange={(e) => setEyeballId(e.target.value)}
            placeholder="eyeball_id 입력"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.4)",
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "none",
              background: "#fbbf24",
              color: "#111827",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "생성 중..." : "QR 생성"}
          </button>
        </form>

        {error && (
          <p style={{ marginTop: 12, color: "#ef4444", fontSize: 13 }}>{error}</p>
        )}

        {qrValue && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 12, color: "#475569" }}>QR 값</div>
              <button
                onClick={handleCopy}
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: "white",
                  fontSize: 11,
                }}
              >
                복사
              </button>
            </div>
            <div
              style={{
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.4)",
                fontSize: 12,
                wordBreak: "break-all",
                background: "#f8fafc",
              }}
            >
              {qrValue}
            </div>

            <div style={{ marginTop: 12, textAlign: "center" }}>
              <img
                alt="qr"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                  qrValue
                )}`}
                style={{ width: 240, height: 240 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
