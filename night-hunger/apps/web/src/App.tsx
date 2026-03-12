import { useEffect } from 'react';
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { TelegramInit } from './components/common';
import { useProfile } from './hooks';
import { useGameStore, usePatch11Store, useUserStore } from './store';
import Hub from './screens/Hub';
import Hunt from './screens/Hunt';
import Upgrade from './screens/Upgrade';
import Inventory from './screens/Inventory';
import Shop from './screens/Shop';
import Leaderboard from './screens/Leaderboard';
import Referral from './screens/Referral';
import Abilities from './screens/Abilities';

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => Promise<void>;
  }
}

const NAV_ITEMS = [
  { to: '/hub', label: 'Hub', icon: '🦇' },
  { to: '/hunt', label: 'Hunt', icon: '⚔️' },
  { to: '/inventory', label: 'Bag', icon: '🎒' },
  { to: '/shop', label: 'Shop', icon: '🏪' },
] as const;

function useAutomationBridge(pathname: string) {
  useEffect(() => {
    window.render_game_to_text = () => {
      const userState = useUserStore.getState();
      const gameState = useGameStore.getState();

      return JSON.stringify({
        coordinateSystem: 'UI-only app; no canvas. DOM origin is top-left, x→right, y→down.',
        route: pathname,
        user: {
          id: userState.profile?.id || null,
          level: userState.profile?.level || 0,
          hp: userState.profile
            ? { current: userState.profile.currentHp, max: userState.profile.maxHp }
            : null,
          xp: userState.profile?.xp || 0,
          blood: userState.profile?.bloodBalance || 0,
          statPoints: userState.profile?.statPoints || 0,
        },
        hunt: {
          isHunting: gameState.isHunting,
          enemy: gameState.currentEnemy,
          canHunt: gameState.canHunt(),
          combatLogTail: gameState.combatLog.slice(-5),
        },
        patch11: (() => {
          const patchState = usePatch11Store.getState();
          return {
            stage: patchState.stage,
            selectedLocation: patchState.selectedLocation,
            nightEnergy: patchState.nightEnergy,
            hunger: patchState.hunger,
            showCrystalPrompt: patchState.showCrystalPrompt,
            currentEvent: patchState.currentEvent,
            currentEnemy: patchState.currentEnemy,
            activeFamiliar: patchState.activeFamiliar,
            combatFamiliar: patchState.combatFamiliar,
          };
        })(),
      });
    };

    window.advanceTime = async (ms: number) => {
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
    };

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [pathname]);
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isLoading } = useProfile();

  useAutomationBridge(location.pathname);

  const isActive = (route: string) => location.pathname.startsWith(route);

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      <main className="h-full overflow-y-auto pb-20">
        {isLoading && !profile ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-red-500" />
          </div>
        ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/hub" replace />} />
          <Route path="/hub" element={<Hub />} />
          <Route path="/hunt" element={<Hunt />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/abilities" element={<Abilities />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/leaderboard" element={<Leaderboard onBack={() => navigate('/hub')} />} />
          <Route path="/referral" element={<Referral onBack={() => navigate('/hub')} />} />
          <Route path="*" element={<Navigate to="/hub" replace />} />
        </Routes>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
        <ul className="mx-auto grid max-w-xl grid-cols-4">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <button
                className={`flex w-full flex-col items-center gap-1 py-2 text-xs ${
                  isActive(item.to) ? 'text-red-400' : 'text-slate-400'
                }`}
                onClick={() => navigate(item.to)}
                type="button"
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <TelegramInit>
        <AppShell />
      </TelegramInit>
    </HashRouter>
  );
}

export default App;
