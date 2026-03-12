import { useEffect, useState } from 'react';
import { leaderboardApi, LeaderboardEntry, LeaderboardFilter } from '../../api';

interface LeaderboardProps {
  onBack?: () => void;
}

function Leaderboard({ onBack }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myPosition, setMyPosition] = useState<{
    rank: number;
    totalXp: number;
    totalKills: number;
    level: number;
    percentile: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<LeaderboardFilter>('xp');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const data = await leaderboardApi.getLeaderboard(limit, offset, activeFilter);
      setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyPosition = async () => {
    try {
      const position = await leaderboardApi.getMyPosition();
      setMyPosition(position);
    } catch (error) {
      console.error('Failed to fetch my position:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchMyPosition();
  }, [activeFilter, offset]);

  const getRankBadge = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getFilterLabel = (filter: LeaderboardFilter): string => {
    switch (filter) {
      case 'xp':
        return 'По опыту';
      case 'kills':
        return 'По убийствам';
      case 'level':
        return 'По уровню';
    }
  };

  return (
    <div className="leaderboard-screen">
      <header className="leaderboard-header">
        <div className="header-left">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              ←
            </button>
          )}
          <h1>🏆 Таблица лидеров</h1>
        </div>

        <div className="filter-buttons">
          {(['xp', 'kills', 'level'] as LeaderboardFilter[]).map((filter) => (
            <button
              key={filter}
              className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => {
                setActiveFilter(filter);
                setOffset(0);
              }}
            >
              {getFilterLabel(filter)}
            </button>
          ))}
        </div>
      </header>

      {myPosition && (
        <div className="my-position-card">
          <div className="position-header">
            <span className="position-rank">
              #{myPosition.rank} место
            </span>
            <span className="position-percentile">
              Топ {Math.round(myPosition.percentile)}%
            </span>
          </div>
          <div className="position-stats">
            <span>🎯 Уровень {myPosition.level}</span>
            <span>⭐ {myPosition.totalXp} XP</span>
            <span>⚔️ {myPosition.totalKills} побед</span>
          </div>
        </div>
      )}

      <div className="leaderboard-list">
        {isLoading ? (
          <div className="loading">Загрузка...</div>
        ) : leaderboard.length === 0 ? (
          <div className="empty">Нет данных</div>
        ) : (
          <>
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className={`leaderboard-entry ${entry.rank <= 3 ? 'top-three' : ''}`}
              >
                <div className="entry-rank">
                  <span className="rank-badge">{getRankBadge(entry.rank)}</span>
                </div>

                <div className="entry-info">
                  <span className="entry-username">{entry.username}</span>
                  <div className="entry-stats">
                    <span>🎯 Ур. {entry.level}</span>
                    <span>⚔️ {entry.totalKills}</span>
                  </div>
                </div>

                <div className="entry-xp">
                  <span className="xp-value">{entry.totalXp.toLocaleString()}</span>
                  <span className="xp-label">XP</span>
                </div>
              </div>
            ))}

            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                disabled={offset === 0}
              >
                Назад
              </button>

              <span className="page-info">
                {offset + 1} - {offset + leaderboard.length}
              </span>

              <button
                className="page-btn"
                onClick={() => setOffset((prev) => prev + limit)}
                disabled={leaderboard.length < limit}
              >
                Вперёд
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .leaderboard-screen {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          padding: 16px;
        }

        .leaderboard-header {
          margin-bottom: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .header-left h1 {
          font-size: 24px;
          font-weight: bold;
          color: #ffd700;
          margin: 0;
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #fff;
          font-size: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.2s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          flex: 1;
          min-width: 80px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background: #ffd700;
          color: #1a1a2e;
          border-color: #ffd700;
        }

        .my-position-card {
          background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          color: #1a1a2e;
        }

        .position-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .position-rank {
          font-size: 18px;
          font-weight: bold;
        }

        .position-percentile {
          font-size: 14px;
          opacity: 0.8;
        }

        .position-stats {
          display: flex;
          gap: 16px;
          font-size: 14px;
        }

        .leaderboard-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .leaderboard-entry {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s;
        }

        .leaderboard-entry:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(4px);
        }

        .leaderboard-entry.top-three {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 140, 0, 0.1) 100%);
          border-color: rgba(255, 215, 0, 0.3);
        }

        .entry-rank {
          width: 40px;
          text-align: center;
        }

        .rank-badge {
          font-size: 20px;
          font-weight: bold;
        }

        .entry-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .entry-username {
          font-size: 16px;
          font-weight: 600;
        }

        .entry-stats {
          display: flex;
          gap: 12px;
          font-size: 12px;
          opacity: 0.7;
        }

        .entry-xp {
          text-align: right;
        }

        .xp-value {
          display: block;
          font-size: 16px;
          font-weight: bold;
          color: #4ade80;
        }

        .xp-label {
          font-size: 12px;
          opacity: 0.6;
        }

        .loading, .empty {
          text-align: center;
          padding: 40px;
          opacity: 0.6;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 20px;
          padding: 16px 0;
        }

        .page-btn {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 14px;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}

export default Leaderboard;
