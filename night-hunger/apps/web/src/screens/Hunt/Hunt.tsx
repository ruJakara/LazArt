import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSkinPortrait } from '../../features/patch11/portraits';
import { usePatch11Store } from '../../store/patch11Store';
import { useUserStore } from '../../store/userStore';

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

function Hunt() {
  const navigate = useNavigate();
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const profile = useUserStore((state) => state.profile);
  const stats = useUserStore((state) => state.stats);

  const {
    stage,
    selectedLocation,
    nightEnergy,
    currentEnemy,
    currentEvent,
    combatLog,
    hunger,
    showCrystalPrompt,
    activeFamiliar,
    combatFamiliar,
    shouldReturnToHub,
    selectLocation,
    searchEvent,
    dismissEvent,
    activateCrystal,
    declineCrystal,
    attackEnemy,
    useSkill,
    tryEscape,
    applyFinalChoice,
    enterHunt,
    syncNightState,
    ackReturnToHub,
    getCooldownRemainingMs,
    getCombatPlayerSnapshot,
    isAbilityOwned,
  } = usePatch11Store((state) => ({
    stage: state.stage,
    selectedLocation: state.selectedLocation,
    nightEnergy: state.nightEnergy,
    currentEnemy: state.currentEnemy,
    currentEvent: state.currentEvent,
    combatLog: state.combatLog,
    hunger: state.hunger,
    showCrystalPrompt: state.showCrystalPrompt,
    activeFamiliar: state.activeFamiliar,
    combatFamiliar: state.combatFamiliar,
    shouldReturnToHub: state.shouldReturnToHub,
    selectLocation: state.selectLocation,
    searchEvent: state.searchEvent,
    dismissEvent: state.dismissEvent,
    activateCrystal: state.activateCrystal,
    declineCrystal: state.declineCrystal,
    attackEnemy: state.attackEnemy,
    useSkill: state.useSkill,
    tryEscape: state.tryEscape,
    applyFinalChoice: state.applyFinalChoice,
    enterHunt: state.enterHunt,
    syncNightState: state.syncNightState,
    ackReturnToHub: state.ackReturnToHub,
    getCooldownRemainingMs: state.getCooldownRemainingMs,
    getCombatPlayerSnapshot: state.getCombatPlayerSnapshot,
    isAbilityOwned: state.isAbilityOwned,
  }));

  const fallbackStats = useMemo(
    () => ({
      strength: stats?.strength || 6,
      agility: stats?.agility || 6,
      hp: stats?.hp || Math.max(10, Math.round((profile?.maxHp || 100) / 10)),
    }),
    [stats, profile?.maxHp],
  );

  const combatSnapshot = getCombatPlayerSnapshot(fallbackStats);
  const skin = getSkinPortrait(profile?.skinId);
  const cooldownLeft = getCooldownRemainingMs();
  const isCombatStage = stage === 'combat' || stage === 'final_choice';
  const hasCombatFamiliar = !!combatFamiliar;
  const actionPanelBottom = hasCombatFamiliar ? 'bottom-[18.5rem]' : 'bottom-[11.5rem]';

  useEffect(() => {
    enterHunt();
  }, [enterHunt]);

  useEffect(() => {
    const timer = setInterval(() => {
      syncNightState();
    }, 1000);
    return () => clearInterval(timer);
  }, [syncNightState]);

  useEffect(() => {
    if (!shouldReturnToHub) return;
    ackReturnToHub();
    navigate('/hub');
  }, [ackReturnToHub, navigate, shouldReturnToHub]);

  useEffect(() => {
    (window as unknown as { __PATCH11_STATE__?: Record<string, unknown> }).__PATCH11_STATE = {
      stage,
      selectedLocation,
      nightEnergy,
      hunger,
      showCrystalPrompt,
      currentEvent,
      currentEnemy,
      activeFamiliar,
      combatFamiliar,
    };

    return () => {
      delete (window as unknown as { __PATCH11_STATE__?: Record<string, unknown> }).__PATCH11_STATE;
    };
  }, [
    activeFamiliar,
    combatFamiliar,
    currentEnemy,
    currentEvent,
    hunger,
    nightEnergy,
    selectedLocation,
    showCrystalPrompt,
    stage,
  ]);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className={`mx-auto flex min-h-screen w-full max-w-xl flex-col gap-3 bg-slate-950 p-4 text-slate-100 ${isCombatStage ? 'pb-72' : 'pb-24'}`}>
      <header className="rounded-xl border border-slate-800 bg-slate-900 p-3">
        <h1 className="text-xl font-bold text-red-400">🩸 Hunt 1.1</h1>
        <p className="text-xs text-slate-400">Охота = поиск события. Локация патча: Грот.</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-800 px-2 py-1">Энка: {nightEnergy}/100</span>
          <span className="rounded-full bg-slate-800 px-2 py-1">Голод: {hunger}/100</span>
          <span className="rounded-full bg-slate-800 px-2 py-1">HP: {profile.currentHp}/{profile.maxHp}</span>
          <span className="rounded-full bg-slate-800 px-2 py-1">Локация: {selectedLocation === 'grot' ? 'Грот' : selectedLocation === 'forest' ? 'Лес (Скоро)' : 'Не выбрана'}</span>
        </div>
      </header>

      {stage === 'cooldown' && (
        <section className="rounded-xl border border-amber-700/50 bg-amber-900/20 p-4">
          <h2 className="mb-1 text-sm font-semibold text-amber-300">☀️ Рассвет</h2>
          <p className="text-sm text-slate-200">Охота завершена. Следующая ночь через {formatDuration(cooldownLeft)}.</p>
          <button
            className="mt-3 rounded-lg bg-slate-700 px-3 py-2 text-sm"
            onClick={() => navigate('/hub')}
            type="button"
          >
            В Hub
          </button>
        </section>
      )}

      {(stage === 'idle' || stage === 'location' || stage === 'event') && stage !== 'cooldown' && (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-200">Выбор локации</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`rounded-lg px-3 py-3 text-sm font-semibold ${
                selectedLocation === 'grot'
                  ? 'bg-red-600 text-white'
                  : 'border border-slate-700 bg-slate-950 text-slate-300'
              }`}
              onClick={() => selectLocation('grot')}
              type="button"
            >
              ⛰️ Грот
            </button>
            <button
              className={`rounded-lg px-3 py-3 text-sm font-semibold ${
                selectedLocation === 'forest'
                  ? 'bg-slate-600 text-white'
                  : 'border border-slate-700 bg-slate-950 text-slate-500'
              }`}
              onClick={() => selectLocation('forest')}
              type="button"
            >
              🌲 Лес (Скоро)
            </button>
          </div>
          <button
            className="mt-3 w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-500 disabled:bg-slate-700"
            disabled={!selectedLocation || stage === 'cooldown'}
            onClick={() => {
              const result = searchEvent();
              setLocalMessage(result.message);
            }}
            type="button"
          >
            🔍 Искать событие (-10 энки)
          </button>
          {localMessage && <p className="mt-2 text-xs text-slate-300">{localMessage}</p>}
        </section>
      )}

      {currentEvent && stage === 'event' && (
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-3">
          <h2 className="text-sm font-semibold text-slate-200">{currentEvent.title}</h2>
          <p className="mt-1 text-sm text-slate-300">{currentEvent.description}</p>
          <button
            className="mt-3 rounded-lg bg-slate-700 px-3 py-2 text-sm"
            onClick={() => dismissEvent()}
            type="button"
          >
            Продолжить
          </button>
        </section>
      )}

      {showCrystalPrompt && (
        <section className="rounded-xl border border-violet-500/40 bg-violet-900/20 p-3">
          <h2 className="text-sm font-semibold text-violet-300">🧿 Кристалл ночи</h2>
          <p className="mt-1 text-sm text-slate-200">
            Энка = 0. Активировать кристалл (+40 энки) для текущей охоты?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold"
              onClick={() => activateCrystal()}
              type="button"
            >
              Активировать
            </button>
            <button
              className="rounded-lg bg-slate-700 px-3 py-2 text-sm"
              onClick={() => declineCrystal()}
              type="button"
            >
              Завершить охоту
            </button>
          </div>
        </section>
      )}

      {(stage === 'combat' || stage === 'final_choice') && currentEnemy && (
        <>
          <section className="rounded-xl border border-red-700/40 bg-slate-900 p-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-red-300">{currentEnemy.portrait} {currentEnemy.name}</h2>
                <p className="text-xs text-slate-400">Событие: {currentEvent?.type === 'victim' ? 'Жертва' : 'Бой'}</p>
              </div>
              <span className="rounded-full bg-slate-800 px-2 py-1 text-xs">Награда: {currentEnemy.rewardXp} XP</span>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm">
            <h3 className="mb-2 font-semibold text-slate-200">Статы врага</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-slate-950 p-2">HP: {currentEnemy.hp}/{currentEnemy.maxHp}</div>
              <div className="rounded-lg bg-slate-950 p-2">Атака: {currentEnemy.attack}</div>
              <div className="rounded-lg bg-slate-950 p-2">Защита: {currentEnemy.defense}</div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">📜 Лог события</h3>
            <div className="max-h-28 space-y-1 overflow-y-auto text-xs text-slate-300">
              {combatLog.slice(-12).map((entry, index) => (
                <p key={`${entry}-${index}`}>{entry}</p>
              ))}
            </div>
          </section>

          {stage === 'combat' && (
            <section className={`sticky ${actionPanelBottom} z-30 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur`}>
              <h3 className="mb-2 text-sm font-semibold text-slate-200">Действия боя</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className="rounded-lg bg-red-600 px-2 py-3 text-xs font-semibold text-white"
                  onClick={() => attackEnemy(fallbackStats)}
                  type="button"
                >
                  ⚔️ Атака
                </button>
                <button
                  className="rounded-lg bg-violet-600 px-2 py-3 text-xs font-semibold text-white disabled:bg-slate-700"
                  disabled={!isAbilityOwned('summon_bats') || !!combatFamiliar || !!activeFamiliar}
                  onClick={() => useSkill(fallbackStats)}
                  type="button"
                >
                  ✨ Навык
                </button>
                <button
                  className="rounded-lg bg-amber-600 px-2 py-3 text-xs font-semibold text-white disabled:bg-slate-700"
                  disabled={!combatSnapshot.canEscape}
                  onClick={() => tryEscape(fallbackStats)}
                  type="button"
                >
                  🏃 Убежать
                </button>
              </div>
              {!combatSnapshot.canEscape && (
                <p className="mt-2 text-xs text-amber-300">
                  Побег заблокирован: низкий голод усиливает урон, но мешает отступлению.
                </p>
              )}
            </section>
          )}

          {stage === 'final_choice' && (
            <section className={`sticky ${actionPanelBottom} z-30 rounded-xl border border-purple-500/40 bg-purple-900/95 p-3 shadow-xl backdrop-blur`}>
              <h3 className="mb-2 text-sm font-semibold text-purple-300">🩸 Финальный выбор</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  className="rounded-lg bg-red-700 px-3 py-3 text-xs font-semibold text-white"
                  onClick={() => applyFinalChoice('execute')}
                  type="button"
                >
                  Добить
                  <span className="mt-1 block text-[11px] opacity-90">+50% XP</span>
                </button>
                <button
                  className="rounded-lg bg-blue-700 px-3 py-3 text-xs font-semibold text-white"
                  onClick={() => applyFinalChoice('drain')}
                  type="button"
                >
                  Выпить досуха
                  <span className="mt-1 block text-[11px] opacity-90">HP + голод до 100</span>
                </button>
                <button
                  className="rounded-lg bg-indigo-700 px-3 py-3 text-xs font-semibold text-white"
                  onClick={() => applyFinalChoice('hypnosis')}
                  type="button"
                >
                  Гипноз
                  <span className="mt-1 block text-[11px] opacity-90">10% шанс фамильяра</span>
                </button>
              </div>
            </section>
          )}

          {combatFamiliar && (
            <section className="sticky bottom-[11.5rem] z-20 rounded-xl border border-emerald-600/40 bg-emerald-900/90 p-3 text-sm backdrop-blur">
              <h3 className="mb-2 font-semibold text-emerald-300">Фамильяр в бою</h3>
              <div className="flex items-center justify-between rounded-lg bg-slate-950 p-2">
                <span>{combatFamiliar.portrait} {combatFamiliar.name}</span>
                <span>HP {combatFamiliar.hp}/{combatFamiliar.maxHp}</span>
              </div>
            </section>
          )}

          <section className="sticky bottom-20 z-10 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-sm shadow-xl backdrop-blur">
            <h3 className="mb-2 font-semibold text-slate-200">Игрок</h3>
            <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-950 p-2">
              <span className="text-2xl">{skin.portrait}</span>
              <div>
                <p className="font-semibold">{profile.username || profile.firstName || 'Игрок'}</p>
                <p className="text-xs text-slate-400">{skin.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-slate-950 p-2">HP: {profile.currentHp}/{profile.maxHp}</div>
              <div className="rounded-lg bg-slate-950 p-2">Атака: {combatSnapshot.attack}</div>
              <div className="rounded-lg bg-slate-950 p-2">Защита: {combatSnapshot.defense}</div>
              <div className={`rounded-lg p-2 ${combatSnapshot.lowHunger ? 'bg-amber-900/40 text-amber-300' : 'bg-slate-950'}`}>
                Голод: {combatSnapshot.hunger}/100
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Hunt;
