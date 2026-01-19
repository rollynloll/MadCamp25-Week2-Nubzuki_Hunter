import { useEffect, useState } from "react";
import { apiGet } from "../../data/api";

export default function ActiveGame() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/games/active")
      .then((data) => {
        setGame(data.game);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="ingame-page">
        <div className="ingame-container">
          <div className="ingame-status">로딩중...</div>
        </div>
      </div>
    );
  }
  if (!game) {
    return (
      <div className="ingame-page">
        <div className="ingame-container">
          <div className="ingame-status">진행 중인 게임 없음</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ingame-page">
      <div className="ingame-container">
        <h2 className="ingame-title">현재 게임</h2>
        <pre className="ingame-pre">{JSON.stringify(game, null, 2)}</pre>
      </div>
    </div>
  );
}
