import { useMemo, useState } from 'react';
import { patch11AbilityCards, usePatch11Store } from '../../store/patch11Store';
import { useUserStore } from '../../store';
import './Upgrade.css';

const BRANCH_TITLE = {
  hunt: 'Охота',
  survival: 'Выживание',
  dominance: 'Господство',
} as const;

function Upgrade() {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const profileXp = useUserStore((state) => state.profile?.xp || 0);

  const {
    purchasedAbilityIds,
    spentXp,
    buyAbility,
    getAvailableXp,
  } = usePatch11Store((state) => ({
    purchasedAbilityIds: state.purchasedAbilityIds,
    spentXp: state.spentXp,
    buyAbility: state.buyAbility,
    getAvailableXp: state.getAvailableXp,
  }));

  const availableXp = getAvailableXp(profileXp);

  const groupedCards = useMemo(() => {
    return patch11AbilityCards.reduce<Record<string, typeof patch11AbilityCards>>((acc, card) => {
      const key = card.branch;
      acc[key] = acc[key] || [];
      acc[key].push(card);
      return acc;
    }, {});
  }, []);

  const handleBuyAbility = (abilityId: string) => {
    const result = buyAbility(abilityId, profileXp);
    setMessage({
      text: result.message,
      type: result.ok ? 'success' : 'error',
    });
  };

  return (
    <div className="upgrade-screen">
      <header className="upgrade-header">
        <h1>⚡ Прокачка способностей</h1>
        <div className="player-resources">
          <span className="resource blood">⭐ XP всего: {profileXp}</span>
          <span className="resource points">🧠 Доступно: {availableXp}</span>
        </div>
      </header>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="upgrade-info">
        <p>В патче 1.1 прокачка работает через карточки способностей.</p>
        <p>XP используется как валюта, базовые статы остаются фундаментом.</p>
        <p>Потрачено на способности: {spentXp} XP.</p>
      </div>

      <div className="space-y-6">
        {(Object.keys(groupedCards) as Array<keyof typeof BRANCH_TITLE>).map((branch) => (
          <section key={branch}>
            <h2 className="mb-2 text-base font-semibold text-slate-200">{BRANCH_TITLE[branch]}</h2>
            <div className="stats-grid">
              {groupedCards[branch].map((card) => {
                const isOwned = purchasedAbilityIds.includes(card.id);
                const canBuy = availableXp >= card.costXp;
                return (
                  <article
                    className={`stat-card ${isOwned ? 'stat-card-green' : card.type === 'active' ? 'stat-card-red' : 'stat-card-blue'}`}
                    key={card.id}
                  >
                    <div className="stat-header">
                      <h3 className="stat-title">{card.name}</h3>
                      <span className="stat-icon">{card.type === 'passive' ? '🛡️' : '✨'}</span>
                    </div>

                    <div className="stat-info">
                      <div className="stat-level">
                        <span className="stat-label">Тип:</span>
                        <span className="stat-value">{card.type === 'passive' ? 'Пассивная' : 'Активная'}</span>
                      </div>
                      <div className="stat-bonus">
                        <span className="stat-label">Ветка:</span>
                        <span className="stat-value">{BRANCH_TITLE[card.branch]}</span>
                      </div>
                      <div className="stat-cost">
                        <span className="stat-label">Стоимость:</span>
                        <span className="stat-value cost">{card.costXp} XP</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-300">{card.description}</p>
                    </div>

                    <button
                      className="upgrade-btn"
                      disabled={isOwned || !canBuy}
                      onClick={() => handleBuyAbility(card.id)}
                      type="button"
                    >
                      {isOwned ? 'Куплено' : canBuy ? 'Купить' : 'Недостаточно XP'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default Upgrade;
