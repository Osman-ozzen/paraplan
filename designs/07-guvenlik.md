# 07 — Güvenlik Tasarımı

## Mevcut Güvenlik Açıkları

| # | Açık | Seviye | Çözüm |
|---|------|--------|-------|
| 1 | Supabase Service Key .env'de commit edilmiş | 🔴 Kritik | Key rotate et, .env'yi git'ten kaldır |
| 2 | Service key tüm CRUD'da kullanılıyor (RLS bypass) | 🔴 Kritik | Anon key + RLS kullan |
| 3 | JWT localStorage'da (XSS riski) | 🔴 Kritik | httpOnly cookie'ye taşı |
| 4 | CORS herkese açık | 🟠 Yüksek | Whitelist kullan |
| 5 | Helmet yok (güvenlik header'ları eksik) | 🟠 Yüksek | Helmet.js ekle |
| 6 | HTTPS zorunlu değil | 🟠 Yüksek | HTTPS redirect + HSTS |
| 7 | Rate limiter opsiyonel | 🟠 Yüksek | Zorunlu yap + auth rate limit |
| 8 | Auth brute-force korumasız | 🟠 Yüksek | 5 deneme/15dk limit |
| 9 | Input validasyonu zayıf | 🟡 Orta | Zod schema validation |
| 10 | Audit log yok | 🟡 Orta | Mutasyon loglama |
| 11 | JSON veri şifresiz | 🟡 Orta | Şifrele + dosya izni 600 |
| 12 | RLS politikaları yok | 🟡 Orta | Her tablo için policy |

## Hedef Güvenlik Katmanları

```
                         ┌─────────────────────────┐
                         │    HTTPS (TLS 1.3)       │
                         │    HSTS Header           │
                         └──────────┬──────────────┘
                                     │
                         ┌──────────▼──────────────┐
                         │    Helmet.js             │
                         │    - CSP                 │
                         │    - X-Frame-Options     │
                         │    - X-Content-Type-Options│
                         └──────────┬──────────────┘
                                     │
                         ┌──────────▼──────────────┐
                         │    CORS Whitelist        │
                         │    Sadece bilinen domain │
                         └──────────┬──────────────┘
                                     │
                         ┌──────────▼──────────────┐
                         │    Rate Limiting          │
                         │    Auth: 5/15dk          │
                         │    API: 200/15dk         │
                         └──────────┬──────────────┘
                                     │
                         ┌──────────▼──────────────┐
                         │    Auth Middleware        │
                         │    httpOnly cookie'den   │
                         │    JWT doğrulama         │
                         └──────────┬──────────────┘
                                     │
                         ┌──────────▼──────────────┐
                         │    Zod Validation         │
                         │    Request body schema   │
                         └──────────┬──────────────┘
                                     │
                         ┌──────────▼──────────────┐
                         │    Supabase + RLS         │
                         │    Anon key + user_id    │
                         │    Row Level Security    │
                         └──────────┬──────────────┘
                                     │
                         ┌──────────▼──────────────┐
                         │    Audit Log             │
                         │    Tüm mutasyon kaydı   │
                         └─────────────────────────┘
```

## Uygulama Adımları

### 1. Acil: Service Key'i Kaldır
```bash
# 1. .env'yi git'ten kaldır
git rm --cached .env
echo ".env" >> .gitignore

# 2. Supabase Dashboard'da yeni key'ler oluştur (rotate)
# 3. Yeni key'leri Render'da env variable olarak tanımla
```

### 2. Anon Key + RLS Kullan
```javascript
// server/config/database.js
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  global: {
    headers: { Authorization: `Bearer ${token}` }
  }
});
```

### 3. httpOnly Cookie
```javascript
// Auth giriş başarılı
res.cookie('session_token', data.session.access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

// Frontend: localStorage'ı kaldır, cookie otomatik gider
```

### 4. Helmet + CORS
```javascript
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://paraplan.onrender.com']
    : ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
}));
```

### 5. Zod Validasyon
```javascript
const { z } = require('zod');

const kayitSchema = z.object({
  tutar: z.number().positive('Tutar pozitif olmalı'),
  tur: z.enum(['gelir', 'gider']),
  tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  aciklama: z.string().max(500).optional(),
  kategoriId: z.string().uuid(),
});

// Middleware
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      res.status(400).json({
        basarili: false,
        hata: 'Validasyon hatası',
        detay: err.errors
      });
    }
  };
}
```

### 6. Audit Log
```javascript
function auditLog(req, res, next) {
  if (req.method !== 'GET') {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: req.userId,
      action: `${req.method} ${req.path}`,
      ip: req.ip,
    }));
  }
  next();
}
```
