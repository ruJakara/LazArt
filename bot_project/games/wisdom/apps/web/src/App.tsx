import { BrowserRouter, Routes, Route, Suspense } from 'react-router-dom';
import { lazy, memo } from 'react';

// Code splitting: ленивая загрузка экранов
const Hub = lazy(() => import('./screens/Hub'));
const Hunt = lazy(() => import('./screens/Hunt'));
const Upgrade = lazy(() => import('./screens/Upgrade'));
const Inventory = lazy(() => import('./screens/Inventory'));
const Shop = lazy(() => import('./screens/Shop'));
const Leaderboard = lazy(() => import('./screens/Leaderboard'));
const Referral = lazy(() => import('./screens/Referral'));

// Компонент загрузки для Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/hunt" element={<Hunt />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/referral" element={<Referral />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default memo(App);
