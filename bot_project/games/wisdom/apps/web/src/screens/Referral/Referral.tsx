import { useEffect, useState } from 'react';
import { referralApi, ReferralInfo } from '../../api';
import { useUserStore } from '../../store';

interface ReferralProps {
  onBack?: () => void;
}

function Referral({ onBack }: ReferralProps) {
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState(false);

  const { updateBloodBalance } = useUserStore();

  const fetchReferralInfo = async () => {
    try {
      setIsLoading(true);
      const data = await referralApi.getReferralCode();
      setReferralInfo(data);
    } catch (error) {
      console.error('Failed to fetch referral info:', error);
      setMessage({ text: 'Ошибка загрузки данных', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralInfo();
  }, []);

  const handleCopyCode = async () => {
    if (!referralInfo?.code) return;

    try {
      await navigator.clipboard.writeText(referralInfo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShareLink = async () => {
    if (!referralInfo?.referralLink) return;

    // Проверяем, есть ли Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;

    if (tg?.shareUrl) {
      tg.shareUrl(referralInfo.referralLink);
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: 'Night Hunger: Vampire Evo',
          text: 'Присоединяйся ко мне в Night Hunger! Получи бонусы за регистрацию.',
          url: referralInfo.referralLink,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: копируем ссылку
      await navigator.clipboard.writeText(referralInfo.referralLink);
      setMessage({ text: 'Ссылка скопирована в буфер обмена', type: 'success' });
    }
  };

  const handleClaimBonus = async () => {
    if (!referralInfo || referralInfo.pendingBonus <= 0) return;

    try {
      setIsClaiming(true);
      const response = await referralApi.claimBonus();

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        updateBloodBalance(response.bonus);
        await fetchReferralInfo(); // Обновляем данные
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Ошибка при получении бонуса',
        type: 'error',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="referral-screen">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="referral-screen">
      <header className="referral-header">
        <div className="header-left">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              ←
            </button>
          )}
          <h1>👥 Рефералы</h1>
        </div>
      </header>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="referral-content">
        {/* Реферальный код */}
        <div className="referral-card">
          <h2>Ваш реферальный код</h2>
          <div className="code-display">
            <code>{referralInfo?.code || 'Загрузка...'}</code>
            <button className="copy-btn" onClick={handleCopyCode}>
              {copied ? '✓' : '📋'}
            </button>
          </div>
          {copied && <span className="copied-hint">Скопировано!</span>}
        </div>

        {/* Кнопка пригласить */}
        <div className="invite-section">
          <p className="invite-text">
            Пригласи друзей и получи <strong>100 крови</strong> за каждого!
          </p>
          <button className="invite-btn" onClick={handleShareLink}>
            🎁 Пригласить друга
          </button>
        </div>

        {/* Статистика */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{referralInfo?.referredCount || 0}</div>
            <div className="stat-label">Приглашено</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-value">{referralInfo?.totalBonusClaimed || 0}</div>
            <div className="stat-label">Получено крови</div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon">🎁</div>
            <div className="stat-value">{referralInfo?.pendingBonus || 0}</div>
            <div className="stat-label">Доступно к получению</div>
          </div>
        </div>

        {/* Кнопка забрать бонус */}
        {referralInfo && referralInfo.pendingBonus > 0 && (
          <button
            className="claim-bonus-btn"
            onClick={handleClaimBonus}
            disabled={isClaiming}
          >
            {isClaiming ? 'Получение...' : `🎁 Забрать ${referralInfo.pendingBonus} крови`}
          </button>
        )}

        {/* Информация */}
        <div className="info-card">
          <h3>📖 Как это работает</h3>
          <ol className="info-list">
            <li>Поделитесь своей реферальной ссылкой с друзьями</li>
            <li>Друг регистрируется по вашей ссылке</li>
            <li>Вы получаете 100 крови на баланс</li>
            <li>Забирайте бонусы в этом разделе</li>
          </ol>
        </div>
      </div>

      <style>{`
        .referral-screen {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          padding: 16px;
        }

        .referral-header {
          margin-bottom: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
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

        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .message.success {
          background: rgba(74, 222, 128, 0.2);
          border: 1px solid rgba(74, 222, 128, 0.4);
          color: #4ade80;
        }

        .message.error {
          background: rgba(248, 113, 113, 0.2);
          border: 1px solid rgba(248, 113, 113, 0.4);
          color: #f87171;
        }

        .referral-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .referral-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .referral-card h2 {
          font-size: 16px;
          margin: 0 0 16px 0;
          opacity: 0.8;
        }

        .code-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.3);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .code-display code {
          font-size: 24px;
          font-weight: bold;
          color: #ffd700;
          font-family: 'Courier New', monospace;
          letter-spacing: 2px;
        }

        .copy-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #fff;
          font-size: 20px;
          width: 44px;
          height: 44px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .copied-hint {
          font-size: 12px;
          color: #4ade80;
        }

        .invite-section {
          background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          color: #1a1a2e;
        }

        .invite-text {
          font-size: 16px;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .invite-text strong {
          font-weight: bold;
        }

        .invite-btn {
          background: #1a1a2e;
          border: none;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          padding: 14px 28px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .invite-btn:hover {
          transform: scale(1.02);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .stat-card.highlight {
          background: rgba(74, 222, 128, 0.1);
          border-color: rgba(74, 222, 128, 0.3);
        }

        .stat-icon {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #ffd700;
          margin-bottom: 4px;
        }

        .stat-card.highlight .stat-value {
          color: #4ade80;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.7;
          line-height: 1.3;
        }

        .claim-bonus-btn {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          border: none;
          color: #1a1a2e;
          font-size: 16px;
          font-weight: 600;
          padding: 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .claim-bonus-btn:hover:not(:disabled) {
          transform: scale(1.02);
        }

        .claim-bonus-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
        }

        .info-card h3 {
          font-size: 16px;
          margin: 0 0 12px 0;
          color: #ffd700;
        }

        .info-list {
          margin: 0;
          padding-left: 20px;
          font-size: 14px;
          line-height: 1.8;
          opacity: 0.8;
        }

        .loading {
          text-align: center;
          padding: 40px;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

export default Referral;
