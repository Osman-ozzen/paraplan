# 00 — Mimari Kararlar: ParaPlan v3.0

## Mevcut Durum

ParaPlan (v2.0.0) kişisel bütçe takip uygulamasıdır. React 18 + Express.js + Supabase stack'i ile çalışan,
PWA/Desktop/Mobile destekli full-stack bir uygulamadır.

### Güçlü Yanlar
- Kapsamlı özellik seti (7 modül)
- Multi-platform (Web PWA + Electron Desktop + Capacitor Mobile)
- Atomik JSON yazma + yedekleme
- camelCase/snake_case dönüşüm katmanı
- Türkçe UI ve dokümantasyon

### Kritik Sorunlar
| # | Sorun | Etki |
|---|-------|------|
| 1 | App.jsx God Component (396 satır) | Ölçeklenemez, test edilemez |
| 2 | Server/index.js monolit (547 satır) | Bakım kabusu |
| 3 | Hiç test yok | Regresyon riski |
| 4 | CI/CD yok | Manuel deploy riski |
| 5 | Güvenlik açıkları (CORS, localStorage token) | Veri sızıntısı riski |
| 6 | 1.2 MB logo.png, 650 KB JS bundle | Performans |
| 7 | Sequential DB sorguları (7×) | API gecikmesi |
| 8 | Tek CSS dosyası (1749 satır, 50+ !important) | Bakım |

## v3.0 Hedef Mimari

```
┌──────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│  React 18 + Zustand + React Router v7                    │
│  ┌─ AnaSayfa ─ Raporlar ─ GelirGider ─ Borclar ─ ... ─┐ │
│  └──────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│                    STATE LAYER                             │
│  Zustand Store: financeStore, uiStore, authStore          │
│  React.lazy + Suspense (route-based)                      │
├──────────────────────────────────────────────────────────┤
│                    API LAYER                               │
│  api.js → Express.js v4 → Supabase (PostgreSQL)           │
│  Parallel queries, pagination, caching                    │
├──────────────────────────────────────────────────────────┤
│                    DATA LAYER                              │
│  Primary: Supabase (PostgreSQL + RLS)                      │
│  Fallback: Encrypted JSON file                             │
│  Migration: Supabase CLI + versioned SQL                   │
└──────────────────────────────────────────────────────────┘
```

## Önerilen Teknik Kararlar

| Karar | Seçim | Gerekçe |
|-------|-------|---------|
| **State Management** | Zustand | App.jsx'teki 10+ useState ve CRUD'u store'a taşır. Context'ten hafif, selector bazlı re-render |
| **Routing** | React Router v7 | State-based routing (aktifSekme) yerine URL routing. Deep linking, back button, lazy loading |
| **Testing** | Vitest + RTL + Supertest | Vite ile native uyum, hızlı, ESM/CJS karışımı |
| **CSS** | CSS Modules (kademeli) | Tek CSS → bileşen bazlı modüller. !important sorununu çözer |
| **Backend** | Express v4 (v5'ten dön) | v5 stabil değil, community desteği zayıf |
| **Backend Yapısı** | Modüler (routes/services/middleware) | 547 satır → bölünmüş, test edilebilir |
| **Auth** | httpOnly cookie (localStorage'ı kaldır) | XSS'ye karşı koruma |
| **DB Queries** | Promise.all ile paralel | 7 sequential → 1 parallel |
| **Optimizasyon** | React.lazy + useMemo + memo | Bundle 650→250 KB, re-render %70 azalma |
| **Görseller** | WebP formatı | logo.png 1.2 MB → ~50 KB |

## Vazgeçilenler
- **TypeScript**: Şimdilik JS'de kal, test coverage öncelikli
- **Tailwind CSS**: Mevcut CSS'i koru, CSS Modules'a geç
- **Microservices**: Monolith devam, gereksiz complexity
- **GraphQL**: REST yeterli, fazla stack ekleme

## Risk Analizi

| Risk | Olasılık | Etki | Mitigasyon |
|------|----------|------|------------|
| Refactor sırasında veri kaybı | Düşük | Kritik | Önce test + yedekleme |
| Zustand geçişinde hatalar | Orta | Yüksek | Kademeli geçiş, aynı anda iki store |
| Express v5 → v4 dönüşü | Düşük | Orta | API testleri ile doğrulama |
| Kullanıcı alışkanlıkları (yeni UI) | Orta | Düşük | A/B test veya feature flag |
