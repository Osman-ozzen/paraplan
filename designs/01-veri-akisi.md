# 01 — Veri Akışı (Data Flow)

## Mevcut Durum (v2.0.0)

```
Kullanıcı → AuthPage → localStorage (JWT)
         → API (fetch) → Express.js → Supabase / JSON
         → State (App.jsx) → Component Props
```

**Sorunlar:**
- JWT localStorage'da → XSS riski
- 7 sequential Supabase sorgusu → gecikme
- Tüm state App.jsx'te → gereksiz re-render
- Hata durumunda sessiz fallback → kullanıcı habersiz

## Hedef Veri Akışı (v3.0.0)

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────┐
│   Kullanıcı   │────▶│  React App       │────▶│  Express API   │
│  (Browser)    │     │  Zustand Store   │     │  (modüler)     │
└──────────────┘     └──────────────────┘     └───────┬───────┘
       ▲                      │                       │
       │                      │                       ▼
       │                      │               ┌───────────────┐
       │                      │               │  Supabase DB   │
       │                      │               │  (PostgreSQL)  │
       │                      │               │  + RLS         │
       │                      │               └───────────────┘
       │                      │                       │
       │                      ▼                       ▼
       │              ┌──────────────────┐     ┌───────────────┐
       └──────────────│  httpOnly Cookie │     │  JSON Fallback │
                      │  (JWT)           │     │  (encrypted)   │
                      └──────────────────┘     └───────────────┘
```

## Detaylı Akış

### 1. Auth Akışı (İyileştirilmiş)
```
1. Kullanıcı email + şifre girer
2. POST /api/auth/login → Express → Supabase Auth
3. Başarılı: httpOnly cookie'ye JWT yazılır
   Başarısız: "Hatalı email/şifre" hatası
4. Sonraki tüm istekler: cookie otomatik gider (browser)
5. Refresh: middleware'de token doğrulama
6. Logout: cookie silinir, store resetlenir
```

### 2. Veri CRUD Akışı
```
Kullanıcı → Form → Zustand action → api.js → Express → Supabase
                                                         ↓
                                              Başarılı → store güncelle
                                              Hata → toast bildirim
                                              Offline → local queue + sync
```

### 3. Offline Akışı
```
Çevrimdışı → Mutasyon → Local Queue (IndexedDB)
Çevrimiçi  → Queue Sync → Server → Store Güncelle
Kullanıcıya → "Çevrimdışı mod: X değişiklik bekliyor" bildirimi
```

## API İletişim Detayı

| Metot | Endpoint | Auth | Cache | Açıklama |
|-------|----------|------|-------|----------|
| GET | /api/veri | ✅ | NetworkFirst | Tüm veriyi getir (paralel 7 sorgu) |
| POST | /api/:bolum | ✅ | NetworkOnly | Yeni kayıt ekle |
| PUT | /api/:bolum/:id | ✅ | NetworkOnly | Kayıt güncelle |
| DELETE | /api/:bolum/:id | ✅ | NetworkOnly | Kayıt sil |
| POST | /api/auth/login | ❌ | NetworkOnly | Giriş |
| POST | /api/auth/register | ❌ | NetworkOnly | Kayıt |
| GET | /api/auth/me | ✅ | NetworkOnly | Oturum bilgisi |

## Response Formatı (Standartlaştırılmış)

```json
// Başarılı
{
  "basarili": true,
  "veri": { ... },
  "meta": { "timestamp": "2026-06-22T12:00:00Z" }
}

// Hatalı  
{
  "basarili": false,
  "hata": "Açıklayıcı hata mesajı",
  "hataKodu": "VALIDATION_ERROR",
  "detay": { "alan": "tutar", "neden": "pozitif olmalı" }
}
```
