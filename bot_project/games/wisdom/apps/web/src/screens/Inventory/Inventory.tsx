import { useEffect, useState } from 'react';
import { useUserStore } from '../../store';
import { inventoryApi, InventoryItem } from '../../api';
import './Inventory.css';

interface ItemCardProps {
  item: InventoryItem;
  onUse: (itemId: string) => void;
  onSell: (itemId: string) => void;
  isLoading: boolean;
}

const itemTypeConfig: Record<string, { label: string; color: string }> = {
  potion: { label: 'Зелье', color: 'red' },
  boost: { label: 'Буст', color: 'blue' },
  skin: { label: 'Скин', color: 'purple' },
  material: { label: 'Материал', color: 'brown' },
};

function ItemCard({ item, onUse, onSell, isLoading }: ItemCardProps) {
  const config = itemTypeConfig[item.itemType] || { label: 'Предмет', color: 'gray' };
  const canUse = item.itemType === 'potion' || item.itemType === 'boost' || item.itemType === 'skin';
  const canSell = item.itemType !== 'skin'; // Скины нельзя продать

  return (
    <div className={`inventory-item item-${config.color}`}>
      <div className="item-icon">{item.icon || '📦'}</div>
      
      <div className="item-info">
        <h4 className="item-name">{item.name || item.itemId}</h4>
        <div className="item-meta">
          <span className={`item-type type-${config.color}`}>{config.label}</span>
          <span className="item-quantity">x{item.quantity}</span>
        </div>
        {item.effectValue && (
          <div className="item-effect">
            Эффект: +{item.effectValue}
          </div>
        )}
      </div>

      <div className="item-actions">
        {canUse && (
          <button
            className="action-btn use-btn"
            onClick={() => onUse(item.itemId)}
            disabled={isLoading}
          >
            Использовать
          </button>
        )}
        {canSell && (
          <button
            className="action-btn sell-btn"
            onClick={() => onSell(item.itemId)}
            disabled={isLoading}
          >
            Продать
          </button>
        )}
      </div>
    </div>
  );
}

function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const { bloodBalance } = useUserStore((state) => ({
    bloodBalance: state.profile?.bloodBalance || 0,
  }));

  const fetchInventory = async () => {
    try {
      const data = await inventoryApi.getInventory();
      setInventory(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUse = async (itemId: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await inventoryApi.useItem(itemId);
      setMessage({ text: response.message, type: 'success' });
      await fetchInventory();
      
      // Обновляем HP в store если было исцеление
      if (response.effect?.type === 'heal') {
        useUserStore.getState().updateHp(
          useUserStore.getState().profile!.currentHp + response.effect.value
        );
      }
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Ошибка при использовании',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async (itemId: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await inventoryApi.sellItem(itemId, 1);
      setMessage({ text: response.message, type: 'success' });
      await fetchInventory();
      
      // Обновляем кровь в store
      useUserStore.getState().updateBloodBalance(response.totalReceived);
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Ошибка при продаже',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInventory = filter === 'all'
    ? inventory
    : inventory.filter((item) => item.itemType === filter);

  const itemTypes = ['all', ...new Set(inventory.map((item) => item.itemType))];

  return (
    <div className="inventory-screen">
      <header className="inventory-header">
        <h1>🎒 Инвентарь</h1>
        <div className="player-blood">
          <span>🩸 {bloodBalance}</span>
        </div>
      </header>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="inventory-filters">
        {itemTypes.map((type) => (
          <button
            key={type}
            className={`filter-btn ${filter === type ? 'active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type === 'all' ? 'Все' : itemTypeConfig[type]?.label || type}
          </button>
        ))}
      </div>

      {filteredInventory.length === 0 ? (
        <div className="inventory-empty">
          <p>Инвентарь пуст</p>
          <p className="hint">Посетите магазин чтобы купить предметы</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {filteredInventory.map((item) => (
            <ItemCard
              key={item.itemId}
              item={item}
              onUse={handleUse}
              onSell={handleSell}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Inventory;
