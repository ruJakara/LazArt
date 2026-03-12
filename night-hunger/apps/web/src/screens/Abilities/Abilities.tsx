import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { patch11AbilityCards, usePatch11Store } from '../../store/patch11Store';
import { useUserStore } from '../../store';

const BRANCH_LABELS = {
  hunt: 'Охота',
  survival: 'Выживание',
  dominance: 'Господство',
} as const;

function Abilities() {
  const navigate = useNavigate();
  const { purchasedAbilityIds, getAvailableXp } = usePatch11Store((state) => ({
    purchasedAbilityIds: state.purchasedAbilityIds,
    getAvailableXp: state.getAvailableXp,
  }));
  const totalXp = useUserStore((state) => state.profile?.xp || 0);

  const grouped = useMemo(() => {
    return patch11AbilityCards.reduce<Record<string, typeof patch11AbilityCards>>(
      (acc, card) => {
        const key = card.branch;
        acc[key] = acc[key] || [];
        acc[key].push(card);
        return acc;
      },
      {},
    );
  }, []);

  const availableXp = getAvailableXp(totalXp);

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 text-slate-100">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-red-400">🧠 Способности</h1>
          <p className="text-sm text-slate-400">Просмотр изученных и доступных карт</p>
        </div>
        <button
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
          onClick={() => navigate('/upgrade')}
          type="button"
        >
          В Прокачку
        </button>
      </header>

      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
        <p>Всего XP: <span className="font-semibold text-blue-300">{totalXp}</span></p>
        <p>Доступно для покупки: <span className="font-semibold text-emerald-300">{availableXp}</span></p>
      </div>

      <div className="space-y-5">
        {(Object.keys(grouped) as Array<keyof typeof BRANCH_LABELS>).map((branch) => (
          <section key={branch}>
            <h2 className="mb-2 text-base font-semibold text-slate-200">{BRANCH_LABELS[branch]}</h2>
            <div className="space-y-2">
              {grouped[branch].map((card) => {
                const isOwned = purchasedAbilityIds.includes(card.id);
                const canBuy = availableXp >= card.costXp;
                return (
                  <article
                    className={`rounded-xl border p-3 ${
                      isOwned
                        ? 'border-emerald-600/40 bg-emerald-900/20'
                        : 'border-slate-800 bg-slate-900'
                    }`}
                    key={card.id}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{card.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          card.type === 'passive'
                            ? 'bg-indigo-900/50 text-indigo-300'
                            : 'bg-amber-900/50 text-amber-300'
                        }`}
                      >
                        {card.type === 'passive' ? 'Пассивная' : 'Активная'}
                      </span>
                    </div>
                    <p className="mb-2 text-xs text-slate-300">{card.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Цена: {card.costXp} XP</span>
                      <span
                        className={
                          isOwned
                            ? 'text-emerald-300'
                            : canBuy
                            ? 'text-blue-300'
                            : 'text-slate-500'
                        }
                      >
                        {isOwned ? 'Куплено' : canBuy ? 'Доступно' : 'Недостаточно XP'}
                      </span>
                    </div>
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

export default Abilities;
