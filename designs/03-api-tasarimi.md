# 03 — API Tasarımı (v3.0.0)

## Mevcut Sorunlar

| Sorun | Açıklama |
|-------|----------|
| Generic route | `/:bolum` parametresi — Swagger dökümantasyonu imkansız |
| Tutarsız status code | POST → 200 (201 olmalı), DELETE → 200 (204 olmalı) |
| 3 farklı response formatı | Auth, CRUD, Health hepsi farklı |
| Sequential sorgular | 7 sorgu ardışık |
| Rate limiter opsiyonel | Try/catch ile yükleniyor |
| Helmet yok | Güvenlik header'ları eksik |
| camelCase route | `sirketGider` → REST'e aykırı |

## Hedef API Yapısı

### Route Organizasyonu

```
server/
├── index.js              ← App kurulumu + middleware
├── app.js                ← Express app (server'dan ayrı)
├── server.js             ← listen() + startup
│
├── routes/
│   ├── index.js          ← Router birleştirici
│   ├── auth.routes.js    ← Auth endpoint'leri
│   ├── veri.routes.js    ← /api/veri
│   ├── kayit.routes.js   ← CRUD (factory ile)
│   └── kategori.routes.js ← Kategori özel işlemler
│
├── middleware/
│   ├── auth.middleware.js    ← JWT doğrulama
│   ├── validate.middleware.js ← Zod validasyon
│   ├── error.middleware.js   ← Merkezi hata yönetimi
│   └── audit.middleware.js   ← İşlem loglama
│
├── services/
│   ├── supabase.service.js  ← Tüm Supabase işlemleri
│   ├── json.service.js      ← JSON dosya işlemleri
│   └── database.strategy.js ← Strategy pattern (abstract)
│
├── validators/
│   ├── auth.validator.js
│   ├── kayit.validator.js
│   └── common.validator.js
│
├── config/
│   ├── constants.js       ← GECERLI_BOLUMLER, tablo mapping
│   └── database.js        ← DB bağlantı seçimi
│
└── utils/
    ├── response.js        ← Standart response wrapper
    └── convert.js         ← camelCase/snake_case
```

### Endpoint Listesi

| Method | Path | Auth | Rate Limit | Status Code | Açıklama |
|--------|------|------|------------|-------------|----------|
| GET | /health | ❌ | Yok | 200 | Health check |
| POST | /api/v1/auth/kayit | ❌ | 5/15dk | 201 | Kayıt ol |
| POST | /api/v1/auth/giris | ❌ | 5/15dk | 200 | Giriş yap |
| GET | /api/v1/auth/oturum | ✅ | Yok | 200 | Oturum bilgisi |
| POST | /api/v1/auth/ata | ✅ | Yok | 200 | Veri ata (güvenli) |
| POST | /api/v1/auth/cikis | ✅ | Yok | 200 | Çıkış yap |
| GET | /api/v1/veri | ✅ | 200/15dk | 200 | Tüm veri |
| GET | /api/v1/kayitlar | ✅ | 200/15dk | 200 | Kayıtlar (sayfalı) |
| POST | /api/v1/kayitlar | ✅ | 200/15dk | 201 | Kayıt ekle |
| PUT | /api/v1/kayitlar/:id | ✅ | 200/15dk | 200 | Kayıt güncelle |
| DELETE | /api/v1/kayitlar/:id | ✅ | 200/15dk | 204 | Kayıt sil |
| GET | /api/v1/kategoriler | ✅ | 200/15dk | 200 | Kategoriler |
| POST | /api/v1/kategoriler | ✅ | 200/15dk | 201 | Kategori ekle |
| DELETE | /api/v1/kategoriler/:id | ✅ | 200/15dk | 204 | Kategori sil (cascade) |
| GET | /api/v1/borclar | ✅ | 200/15dk | 200 | Borçlar |
| POST | /api/v1/borclar | ✅ | 200/15dk | 201 | Borç ekle |
| PUT | /api/v1/borclar/:id | ✅ | 200/15dk | 200 | Borç güncelle |
| DELETE | /api/v1/borclar/:id | ✅ | 200/15dk | 204 | Borç sil |
| GET | /api/v1/eticaret | ✅ | 200/15dk | 200 | E-ticaret |
| POST | /api/v1/eticaret | ✅ | 200/15dk | 201 | Satış ekle |
| PUT | /api/v1/eticaret/:id | ✅ | 200/15dk | 200 | Satış güncelle |
| DELETE | /api/v1/eticaret/:id | ✅ | 200/15dk | 204 | Satış sil |
| GET | /api/v1/sirket-gider | ✅ | 200/15dk | 200 | Şirket giderleri |
| POST | /api/v1/sirket-gider | ✅ | 200/15dk | 201 | Gider ekle |
| PUT | /api/v1/sirket-gider/:id | ✅ | 200/15dk | 200 | Gider güncelle |
| DELETE | /api/v1/sirket-gider/:id | ✅ | 200/15dk | 204 | Gider sil |
| GET | /api/v1/aylik-giderler | ✅ | 200/15dk | 200 | Aylık giderler |
| POST | /api/v1/aylik-giderler | ✅ | 200/15dk | 201 | Aylık gider ekle |
| PUT | /api/v1/aylik-giderler/:id | ✅ | 200/15dk | 200 | Güncelle |
| DELETE | /api/v1/aylik-giderler/:id | ✅ | 200/15dk | 204 | Sil |
| GET | /api/v1/hedefler | ✅ | 200/15dk | 200 | Hedefler |
| POST | /api/v1/hedefler | ✅ | 200/15dk | 201 | Hedef ekle |
| PUT | /api/v1/hedefler/:id | ✅ | 200/15dk | 200 | Güncelle |
| DELETE | /api/v1/hedefler/:id | ✅ | 200/15dk | 204 | Sil |

### Güvenlik Middleware Sırası

```javascript
app.use(helmet());
app.use(cors({ origin: whitelist }));
app.use(rateLimit({ max: 200 }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/v1/auth', authLimiter);  // 5/15dk
app.use('/api/v1', authMiddleware);    // JWT kontrolü
app.use('/api/v1', auditMiddleware);   // İşlem loglama
app.use(errorHandler);                 // Merkezi hata yakalama
```

### Response Wrapper

```javascript
// utils/response.js
function basarili(res, veri, status = 200, meta = {}) {
  return res.status(status).json({
    basarili: true,
    veri,
    meta: { timestamp: new Date().toISOString(), ...meta }
  });
}

function hata(res, mesaj, status = 400, kod = 'HATA', detay = null) {
  return res.status(status).json({
    basarili: false,
    hata: mesaj,
    hataKodu: kod,
    ...(detay && { detay })
  });
}
```
