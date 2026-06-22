# 09 — Önerilen Proje Klasör Yapısı

## Mevcut → Hedef Dönüşüm

```
butce-takip/
├── designs/                          ← YENİ: Tasarım dokümanları
│   ├── 00-mimari-kararlar.md
│   ├── 01-veri-akisi.md
│   ├── 02-component-tree.md
│   ├── 03-api-tasarimi.md
│   ├── 04-veritabani.md
│   ├── 05-route-yapisi.md
│   ├── 06-state-management.md
│   ├── 07-guvenlik.md
│   ├── 08-test-stratejisi.md
│   └── 09-klasor-yapisi.md
│
├── .github/                           ← YENİ: CI/CD
│   └── workflows/
│       ├── ci.yml                     ← Lint + Test + Build
│       └── cd-deploy.yml              ← Deploy to Render
│
├── src/                               ← Frontend
│   ├── main.jsx                       ← Giriş noktası
│   ├── App.jsx                        ← ~80 satır (routing + layout)
│   │
│   ├── components/                    ← UI component'leri
│   │   ├── AuthPage.jsx
│   │   ├── AppLayout.jsx              ← YENİ: layout wrapper
│   │   ├── Sidebar.jsx                ← App.jsx'ten ayrıldı
│   │   ├── MobileTabBar.jsx           ← App.jsx'ten ayrıldı
│   │   ├── NotificationToast.jsx      ← App.jsx'ten ayrıldı
│   │   ├── AnaSayfa/
│   │   │   ├── index.jsx              ← AnaSayfa (ana export)
│   │   │   ├── OzetKartlari.jsx       ← YENİ
│   │   │   ├── GrafikAlani.jsx        ← YENİ
│   │   │   ├── YevmiyeDefteri.jsx     ← YENİ
│   │   │   └── FiltreCubugu.jsx       ← YENİ
│   │   ├── Raporlar/
│   │   │   └── index.jsx
│   │   ├── GelirGiderEkle/
│   │   │   └── index.jsx
│   │   ├── Borclar/
│   │   │   └── index.jsx
│   │   ├── ETicaret/
│   │   │   └── index.jsx
│   │   ├── AylikGiderler/
│   │   │   └── index.jsx
│   │   ├── Hedefler/
│   │   │   └── index.jsx
│   │   └── common/                    ← YENİ: paylaşılan
│   │       ├── OzetKart.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       ├── SkeletonLoader.jsx
│   │       ├── BosDurum.jsx
│   │       └── ConfirmDialog.jsx
│   │
│   ├── stores/                        ← YENİ: Zustand store'ları
│   │   ├── financeStore.js            ← Veri state + CRUD
│   │   ├── uiStore.js                 ← UI state
│   │   └── authStore.js               ← Auth state
│   │
│   ├── hooks/                         ← YENİ: custom hook'lar
│   │   ├── useCrud.js                 ← CRUD factory hook
│   │   └── useDragScroll.js           ← Fare sürükleme
│   │
│   ├── utils/
│   │   ├── api.js                     ← API client
│   │   ├── format.js                  ← tl(), fTarih(), AYLAR
│   │   ├── constants.js               ← Sabitler
│   │   └── helpers.js                 ← idOlustur() vb.
│   │
│   ├── styles/
│   │   ├── variables.css              ← CSS değişkenleri
│   │   ├── layout.css                 ← Layout stilleri
│   │   ├── panels.css                 ← Panel stilleri
│   │   └── components/                ← YENİ: bileşen bazlı
│   │       ├── AnaSayfa.module.css
│   │       ├── Raporlar.module.css
│   │       └── ...
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx            ← (Zustand'a geçene kadar kalır)
│   │
│   └── tests/                         ← YENİ: test dosyaları
│       ├── setup.js
│       ├── helpers/
│       │   ├── testUtils.jsx
│       │   └── fixtures.js
│       ├── unit/
│       │   ├── utils/
│       │   │   ├── api.test.js
│       │   │   └── format.test.js
│       │   └── server/
│       │       ├── validate.test.js
│       │       └── convertKeys.test.js
│       └── integration/
│           ├── api/
│           │   ├── health.test.js
│           │   ├── auth.test.js
│           │   └── kayitlar.test.js
│           ├── components/
│           │   ├── GelirGiderEkle.test.jsx
│           │   ├── AnaSayfa.test.jsx
│           │   └── AuthPage.test.jsx
│           └── contexts/
│               └── AuthContext.test.jsx
│
├── server/                            ← Backend (yeniden düzenlenmiş)
│   ├── index.js                       ← Sadece listen()
│   ├── app.js                         ← Express app setup
│   ├── server.js                      ← Server start
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── veri.routes.js
│   │   ├── kayit.routes.js
│   │   └── kategori.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── error.middleware.js
│   │   └── audit.middleware.js
│   ├── services/
│   │   ├── database.strategy.js
│   │   ├── supabase.service.js
│   │   └── json.service.js
│   ├── validators/
│   │   ├── kayit.validator.js
│   │   └── auth.validator.js
│   ├── config/
│   │   ├── constants.js
│   │   └── database.js
│   └── utils/
│       ├── response.js
│       └── convert.js
│
├── supabase/                          ← YENİ: DB migration
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_uuid_pk.sql
│       ├── 003_foreign_keys.sql
│       ├── 004_rls_policies.sql
│       └── 005_composite_indexes.sql
│
├── scripts/                           ← Yardımcı scriptler
│   ├── veri-aktar.js
│   ├── generate-icons.js
│   └── seed-data.js
│
├── public/                            ← Statik dosyalar
│   ├── favicon.png
│   ├── logo.webp                      ← YENİ: optimize edilmiş
│   ├── icon-192.png
│   └── icon-512.png
│
├── dist/                              ← Build çıktısı
├── data/                              ← JSON veri (gitignored)
├── electron/                          ← Electron main/preload
├── ios/                               ← Capacitor iOS
├── android/                           ← Capacitor Android
├── Dockerfile                         ← YENİ: multi-stage build
├── .github/                           ← YENİ: CI/CD
├── .env.example                       ← Düzeltilmiş
├── package.json
├── vite.config.js
└── vitest.config.js                   ← YENİ
```
