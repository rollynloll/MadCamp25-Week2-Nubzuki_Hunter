import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../../data/api";
import "./QRPrint.css";

const QR_SIZE_PX = 360;

export default function QRPrint() {
  const [game, setGame] = useState(null);
  const [eyeballs, setEyeballs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [perTypeLimit, setPerTypeLimit] = useState(2);

  const loadEyeballs = async (gameId) => {
    if (!gameId) {
      setEyeballs([]);
      return;
    }
    const data = await apiGet(`/games/${gameId}/eyeballs`);
    setEyeballs(data?.eyeballs || []);
  };

  const loadActiveGame = async () => {
    setLoading(true);
    setError("");
    try {
      const active = await apiGet("/games/active");
      const activeGame = active?.game || null;
      setGame(activeGame);
      await loadEyeballs(activeGame?.id);
    } catch (err) {
      console.error(err);
      setError("게임 정보를 불러오지 못했어");
      setGame(null);
      setEyeballs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveGame();
  }, []);

  const handleBulkCreate = async () => {
    if (!game?.id) {
      setError("활성 게임이 없어");
      return;
    }
    setCreating(true);
    setError("");
    try {
      await apiPost("/eyeballs/bulk", {
        game_id: game.id,
        per_type_count: perTypeLimit,
      });
      await loadEyeballs(game.id);
    } catch (err) {
      console.error(err);
      setError("눈알 생성에 실패했어");
    } finally {
      setCreating(false);
    }
  };

  const displayEyeballs = useMemo(() => {
    const counts = new Map();
    const filtered = [];
    eyeballs.forEach((item) => {
      const key = item.type_name || "unknown";
      const current = counts.get(key) || 0;
      if (current >= perTypeLimit) return;
      counts.set(key, current + 1);
      filtered.push(item);
    });
    return filtered;
  }, [eyeballs, perTypeLimit]);

  return (
    <div className="qr-print-page">
      <div className="qr-print-toolbar">
        <div className="qr-print-title">QR 출력</div>
        <button
          className="qr-button"
          type="button"
          onClick={handleBulkCreate}
          disabled={creating || loading}
        >
          {creating ? "생성 중..." : `${perTypeLimit}개씩 눈알 생성`}
        </button>
        <button
          className="qr-button"
          type="button"
          onClick={() => window.print()}
          disabled={loading || displayEyeballs.length === 0}
        >
          인쇄
        </button>
        <button
          className="qr-button"
          type="button"
          onClick={loadActiveGame}
          disabled={loading}
        >
          새로고침
        </button>
      </div>

      <div className="qr-print-meta">
        {game?.title ? `게임: ${game.title}` : "활성 게임 없음"}
        {game?.id ? ` · ${game.id}` : ""}
      </div>
      <div className="qr-print-meta">
        QR 크기: 3cm x 3cm (인쇄 시 "실제 크기"로 출력)
      </div>

      {error && <div className="qr-error">{error}</div>}

      {!loading && displayEyeballs.length === 0 && (
        <div className="qr-print-meta">표시할 눈알이 없어.</div>
      )}

      <div className="qr-grid">
        {displayEyeballs.map((item) => (
          <div key={item.id} className="qr-card">
            <img
              className="qr-image"
              alt={`qr-${item.type_name}`}
              src={`https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE_PX}x${QR_SIZE_PX}&data=${encodeURIComponent(
                item.qr_code || item.id
              )}`}
            />
            <div className="qr-label">{item.type_name}</div>
            <div className="qr-label">{String(item.qr_code || item.id).slice(0, 8)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
