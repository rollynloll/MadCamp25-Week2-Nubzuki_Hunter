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
        window.location.href = "/login";
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>로딩중...</div>;
  if (!game) return <div>진행 중인 게임 없음</div>;

  return (
    <div>
      <h2>현재 게임</h2>
      <pre>{JSON.stringify(game, null, 2)}</pre>
    </div>
  );
}
