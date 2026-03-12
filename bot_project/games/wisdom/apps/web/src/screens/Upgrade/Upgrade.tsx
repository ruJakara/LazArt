import { useEffect, useState } from 'react';
import { useUserStore } from '../../store';
import { upgradeApi, UpgradeOption } from '../../api';
import './Upgrade.css';

interface StatCardProps {
  option: UpgradeOption;
  onUpgrade: (stat: 'strength' | 'agility' | 'hp') => void;
  isLoading: boolean;
}

const statConfig: Record<string, { title: string; icon: string; color: string }> = {
  strength: { title: 'Сила', icon: '💪', color: 'red' },
  agility: { title: 'Ловкость', icon: '⚡', color: 'blue' },
  hp: { title: 'Здоровье', icon: '❤️', color: 'green' },
};

function StatCard({ option, onUpgrade, isLoading }: StatCardProps) {
  const config = statConfig[option.stat];
  
  return (
    <div className={`stat-card stat-card-${config.color}`}>
      <div className="stat-header">
        <span className="stat-icon">{config.icon}</span>
        <h3 className="stat-title">{config.title}</h3>
      </div>
      
      <div className="stat-info">
        <div className="stat-level">
          <span className="stat-label">Уровень:</span>
          <span className="stat-value">{option.currentLevel}</span>
        </div>
        
        <div className="stat-bonus">
          <span className="stat-label">Бонус:</span>
          <span className="stat-value">+{option.nextLevelBonus}</span>
        </div>
        
        <div className="stat-cost">
          <span className="stat-label">Стоимость:</span>
          <span className="stat-value cost">{option.cost} 🩸</span>
        </div>
      </div>
      
      <button
        className="upgrade-btn"
        onClick={() => onUpgrade(option.stat)}
        disabled={isLoading || !option.canAfford || !option.hasStatPoints}
      >
        {!option.hasStatPoints
          ? 'Нужен уровень'
          : !option.canAfford
          ? 'Не хватает крови'
          : 'Улучшить'}
      </button>
    </div>
  );
}

function Upgrade() {
  const [options, setOptions] = useState<UpgradeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const { bloodBalance, statPoints } = useUserStore((state) => ({
    bloodBalance: state.profile?.bloodBalance || 0,
    statPoints: (state.profile as any)?.statPoints || 0,
  }));
  
  const fetchUpgradeOptions = async () => {
    try {
      const data = await upgradeApi.getOptions();
      setOptions(data);
    } catch (error) {
      console.error('Failed to fetch upgrade options:', error);
    }
  };

  useEffect(() => {
    fetchUpgradeOptions();
  }, []);

  const handleUpgrade = async (stat: 'strength' | 'agility' | 'hp') => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await upgradeApi.buyUpgrade(stat);
      setMessage({ text: response.message, type: 'success' });
      await fetchUpgradeOptions();
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.message || 'Ошибка при улучшении', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upgrade-screen">
      <header className="upgrade-header">
        <h1>⚡ Прокачка характеристик</h1>
        <div className="player-resources">
          <span className="resource blood">🩸 {bloodBalance}</span>
          <span className="resource points">✨ {statPoints} очков</span>
        </div>
      </header>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="upgrade-info">
        <p>Повышайте уровень, чтобы получать очки характеристик</p>
        <p>Каждый уровень даёт +3 очка</p>
      </div>

      <div className="stats-grid">
        {options.map((option) => (
          <StatCard
            key={option.stat}
            option={option}
            onUpgrade={handleUpgrade}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}

export default Upgrade;
