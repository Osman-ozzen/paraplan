# 05 — Route Yapısı (Web + Mobile Navigation)

## Mevcut Durum
State-based routing: `aktifSekme` state'i ile sekme değişimi. URL değişmez, back button çalışmaz.

## Hedef: React Router v7

### Web Routes
```
/                    → AnaSayfa (Dashboard)
/gelir-gider         → GelirGiderEkle
/raporlar            → Raporlar
/kategoriler         → Kategoriler
/borclar             → Borclar
/eticaret            → ETicaret
/aylik-giderler      → AylikGiderler
/hedefler            → Hedefler
/auth                → AuthPage (login/register)
```

### Mobile Navigation
Mobilde alt tab bar (5 sekme):
```
Ana Defter   → /
Borclar      → /borclar
Yeni         → /gelir-gider
Hedefler     → /hedefler
Raporlar     → /raporlar
```

### React Router Setup
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';

const AnaSayfa = lazy(() => import('./components/AnaSayfa'));
const Raporlar = lazy(() => import('./components/Raporlar'));
// ... diğer lazy import'lar

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Suspense fallback={...}><AnaSayfa /></Suspense>} />
            <Route path="gelir-gider" element={<Suspense><GelirGiderEkle /></Suspense>} />
            <Route path="raporlar" element={<Suspense><Raporlar /></Suspense>} />
            <Route path="kategoriler" element={<Suspense><Kategoriler /></Suspense>} />
            <Route path="borclar" element={<Suspense><Borclar /></Suspense>} />
            <Route path="eticaret" element={<Suspense><ETicaret /></Suspense>} />
            <Route path="aylik-giderler" element={<Suspense><AylikGiderler /></Suspense>} />
            <Route path="hedefler" element={<Suspense><Hedefler /></Suspense>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### Mobile Tab Bar
```jsx
function MobileTabBar() {
  const location = useLocation();
  const tabs = [
    { path: '/', label: 'Ana Defter', icon: '📊' },
    { path: '/borclar', label: 'Borçlar', icon: '💰' },
    { path: '/gelir-gider', label: 'Yeni', icon: '➕' },
    { path: '/hedefler', label: 'Hedefler', icon: '🎯' },
    { path: '/raporlar', label: 'Raporlar', icon: '📈' },
  ];
  
  return (
    <nav className="mobile-tab-bar">
      {tabs.map(tab => (
        <NavLink key={tab.path} to={tab.path}
          className={({ isActive }) => isActive ? 'tab-aktif' : ''}>
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```
