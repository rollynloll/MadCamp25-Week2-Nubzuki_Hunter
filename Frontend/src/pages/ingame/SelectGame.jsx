import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../data/api";

export default function SelectGame() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [selectedGroupCode, setSelectedGroupCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    apiGet("/games/open")
      .then((data) => {
        setGames(data.games || []);
      })
      .catch((err) => {
        console.error(err);
        navigate("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  const handleSelectGame = (gameId) => {
    setSelectedGameId(gameId);
    setSelectedGroupCode(null);
    setGroupsLoading(true);
    apiGet(`/games/${gameId}/groups`)
      .then((data) => {
        setGroups(data.groups || []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setGroupsLoading(false);
      });
  };

  const handleJoin = async () => {
    if (!selectedGroupCode) return;
    try {
      setJoining(true);
      await apiPost("/groups/join", { code: selectedGroupCode });
      navigate("/ingame");
    } catch (err) {
      console.error(err);
      alert("참가에 실패했어. 다시 시도해줘");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="ingame-page">
      <div className="ingame-container">
        <h1 className="ingame-title">게임을 선택해줘</h1>
        <p className="ingame-subtitle">
          참여할 방을 고른 뒤 분반을 선택해줘
        </p>

        {loading ? (
          <div>로딩중...</div>
        ) : (
          <div className="group-grid">
            {games.map((game) => (
              <div
                key={game.id}
                className={`group-card ${selectedGameId === game.id ? "selected" : ""}`}
                onClick={() => handleSelectGame(game.id)}
              >
                <h2>{game.title || "게임"}</h2>
                <div className="meta">
                  <div>상태: {game.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedGameId && (
          <>
            <h2 className="ingame-section-title">분반 선택</h2>
            {groupsLoading ? (
              <div className="ingame-status">분반 불러오는 중...</div>
            ) : (
              <div className="group-grid">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={`group-card ${
                      selectedGroupCode === group.code ? "selected" : ""
                    }`}
                    onClick={() => setSelectedGroupCode(group.code)}
                  >
                    <h2>{group.name || group.code}</h2>
                    <div className="meta">
                      <div>코드: {group.code}</div>
                      <div>
                        인원: {group.members_count}/{group.max_members}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <button
          className="ingame-button"
          disabled={!selectedGroupCode || joining}
          onClick={handleJoin}
        >
          {joining ? "참가 중..." : "참가 완료"}
        </button>
      </div>
    </div>
  );
}
