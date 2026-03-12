import { useEffect, useState } from 'react';
import { useUserStore } from '../../store';
import { shopApi, ShopItem } from '../../api';
import './Shop.css';

interface ShopCardProps {
  item: ShopItem;
  onBuy: (itemId: string) => void;
  isLoading: boolean;
}

const rarityConfig: Record<string, { color: string; label: string }> = {
  common: { color: 'gray', label: 'Обычный' },
  rare: { color: 'blue', label: 'Редкий' },
  epic: { color: 'purple', label: 'Эпический' },
  legendary: { color: 'yellow', label: 'Легендарный' },
};

const typeConfig: Record<string, string> = {
  potion: '🧪',
  boost: '⚡',
  skin: '👕',
  material: '📦',
};

function ShopCard({ item, onBuy, isLoading }: ShopCardProps) {
  const rarity = rarityConfig[item.rarity] || rarityConfig.common;
  const typeIcon = typeConfig[item.type] || '📦';
  const canBuy = item.canAfford && item.meetsLevelRequirement;

  return (
    <div className={`shop-item rarity-${rarity.color}`}>
      <div className="item-header">
        <div className="item-icon-large">{item.icon || typeIcon}</div>
        <span className={`rarity-badge rarity-${rarity.color}`}>
          {rarity.label}
        </span>
      </div>

      <div className="item-details">
        <h4 className="item-name">{item.name}</h4>
        {item.description && (
          <p className="item-description">{item.description}</p>
        )}
        
        <div className="item-requirements">
          <span className={`level-req ${item.meetsLevelRequirement ? 'met' : 'not-met'}`}>
            🎯 Уровень {item.minLevel}+
          </span>
          {item.stock !== null && (
            <span className="stock-req">
              📦 Осталось: {item.stock}
            </span>
          )}
        </div>

        <div className="item-price">
          <span className="price-value">{item.price} 🩸</span>
          <span className="price-currency">({item.currency})</span>
        </div>
      </div>

      <button
        className="buy-btn"
        onClick={() => onBuy(item.itemId)}
        disabled={isLoading || !canBuy}
      >
        {!item.meetsLevelRequirement
          ? `Нужен ${item.minLevel} ур.`
          : !item.canAfford
          ? 'Не хватает крови'
          : item.stock === 0
          ? 'Нет в наличии'
          : 'Купить'}
      </button>
    </div>
  );
}

function Shop() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'default' | 'premium'>('default');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const { level, bloodBalance } = useUserStore((state) => ({
    level: state.profile?.level || 1,
    bloodBalance: state.profile?.bloodBalance || 0,
  }));

  const fetchShopItems = async (type: string) => {
    try {
      const data = await shopApi.getItems(type);
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch shop items:', error);
    }
  };

  useEffect(() => {
    fetchShopItems(activeTab);
  }, [activeTab]);

  const handleBuy = async (itemId: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await shopApi.buyItem(itemId, activeTab);
      setMessage({ text: response.message, type: 'success' });
      
      // Обновляем кровь в store
      useUserStore.getState().updateBloodBalance(-response.totalPaid);
      
      // Небольшая задержка перед обновлением списка
      setTimeout(() => fetchShopItems(activeTab), 500);
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Ошибка при покупке',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="shop-screen">
      <header className="shop-header">
        <div>
          <h1>🏪 Магазин</h1>
          <p className="player-level">Уровень {level}</p>
        </div>
        <div className="player-blood">
          <span>🩸 {bloodBalance}</span>
        </div>
      </header>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="shop-tabs">
        <button
          className={`tab-btn ${activeTab === 'default' ? 'active' : ''}`}
          onClick={() => setActiveTab('default')}
        >
          Обычный
        </button>
        <button
          className={`tab-btn ${activeTab === 'premium' ? 'active' : ''}`}
          onClick={() => setActiveTab('premium')}
        >
          Премиум
        </button>
      </div>

      {items.length === 0 ? (
        <div className="shop-empty">
          <p>Товары отсутствуют</p>
        </div>
      ) : (
        <div className="shop-grid">
          {items.map((item) => (
            <ShopCard
              key={item.id}
              item={item}
              onBuy={handleBuy}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Shop;
