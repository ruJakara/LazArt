import { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerCard } from '../../components/common';
import { useProfile } from '../../hooks';
import { patch11PatronFamiliars, usePatch11Store } from '../../store/patch11Store';

function HubContent() {
  const navigate = useNavigate();
  const { profile, isLoading } = useProfile();
  const [patronMessage, setPatronMessage] = useState<string | null>(null);

  const { selectedPatronFamiliarId, selectPatronFamiliar, syncNightState } = usePatch11Store((state) => ({
    selectedPatronFamiliarId: state.selectedPatronFamiliarId,
    selectPatronFamiliar: state.selectPatronFamiliar,
    syncNightState: state.syncNightState,
  }));

  const selectedPatron = useMemo(
    () => patch11PatronFamiliars.find((entry) => entry.id === selectedPatronFamiliarId) || patch11PatronFamiliars[0],
    [selectedPatronFamiliarId],
  );

  const handleNavigate = useCallback(
    (path: string) => {
      syncNightState();
      navigate(path);
    },
    [navigate, syncNightState],
  );

  const handlePatronSelect = useCallback(
    (patronId: string) => {
      const result = selectPatronFamiliar(patronId);
      setPatronMessage(result.message);
    },
    [selectPatronFamiliar],
  );

  if (isLoading || !profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-4 pb-24">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-red-500">Night Hunger</h1>
        <p className="text-sm text-slate-400">Патч 1.1 • Ночная охота</p>
      </header>

      <PlayerCard
        username={profile.username || profile.firstName || 'Игрок'}
        level={profile.level}
        currentHp={profile.currentHp}
        maxHp={profile.maxHp}
        xp={profile.xp}
        bloodBalance={profile.bloodBalance}
        skinId={profile.skinId}
      />

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-3">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Основное</h2>
        <div className="grid grid-cols-1 gap-2">
          <button
            className="rounded-lg bg-red-600 px-4 py-3 text-left font-semibold text-white transition hover:bg-red-500"
            onClick={() => handleNavigate('/hunt')}
            type="button"
          >
            🩸 Охота
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-3">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Прогрессия</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            className="rounded-lg bg-blue-700 px-3 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
            onClick={() => handleNavigate('/upgrade')}
            type="button"
          >
            ⚡ Прокачка
          </button>
          <button
            className="rounded-lg bg-violet-700 px-3 py-3 text-sm font-semibold text-white transition hover:bg-violet-600"
            onClick={() => handleNavigate('/abilities')}
            type="button"
          >
            🧠 Способности
          </button>
          <button
            className="rounded-lg bg-emerald-700 px-3 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
            onClick={() => handleNavigate('/inventory')}
            type="button"
          >
            🎒 Инвентарь
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-3">
        <h2 className="mb-1 text-sm font-semibold text-slate-200">Донатный фамильяр (пассив)</h2>
        <p className="mb-3 text-xs text-slate-400">
          Выбирается в Hub и меняется вне охоты. Не является отдельным боевым юнитом.
        </p>
        <div className="mb-2 grid gap-2 sm:grid-cols-3">
          {patch11PatronFamiliars.map((patron) => (
            <button
              className={`rounded-lg border px-2 py-2 text-xs transition ${
                patron.id === selectedPatron.id
                  ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                  : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
              }`}
              key={patron.id}
              onClick={() => handlePatronSelect(patron.id)}
              type="button"
            >
              <span className="block font-semibold">{patron.name}</span>
              <span className="mt-1 block text-[11px] opacity-80">{patron.description}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">Выбран: {selectedPatron.name}</p>
        {patronMessage && <p className="mt-1 text-xs text-blue-300">{patronMessage}</p>}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-3">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Social</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="rounded-lg bg-yellow-700 px-3 py-3 text-sm font-semibold text-white transition hover:bg-yellow-600"
            onClick={() => handleNavigate('/leaderboard')}
            type="button"
          >
            🏆 Лидеры
          </button>
          <button
            className="rounded-lg bg-rose-700 px-3 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
            onClick={() => handleNavigate('/referral')}
            type="button"
          >
            👥 Рефералы
          </button>
          <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-center text-sm text-slate-500">
            Гильдии • Скоро
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-center text-sm text-slate-500">
            Ивенты • Скоро
          </div>
        </div>
      </section>
    </div>
  );
}

const Hub = memo(function Hub() {
  return <HubContent />;
});

export default Hub;
