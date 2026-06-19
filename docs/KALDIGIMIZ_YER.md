# ⏸️ Kaldığımız Yer — 16 Haziran 2026

## ✅ Tamamlananlar

### Kod Değişiklikleri
- **Tooltip:** Ana Defter → "Bu Ay" kartında hover bilgi balonu (gelir/gider/net)
- **Net Bakiye:** Raporlar'daki pasta grafiği → net değer kartı (negatif değer sorunu çözüldü)
- **Electron:** `base: './'` ile beyaz ekran sorunu düzeltildi
- **API:** Production'da aynı origin kullanacak şekilde düzeltildi (`api.js`)

### Deploy Altyapısı (Render + Supabase)
- `@supabase/supabase-js` kurulu
- `supabase-schema.sql` — 6 tablo + indeksler hazır
- `lib/supabase.js` — Bağlantı modülü
- `server/index.js` — JSON + Supabase ikili mod desteği (env var'a göre)
- `scripts/veri-aktar.js` — JSON → Supabase veri taşıma
- `render.yaml` — Supabase env var'ları eklendi
- `.env.example` — Ortam değişkeni şablonu
- `DEPLOY.md` — Adım adım deploy kılavuzu
- `package.json` — Yeni script'ler (`veri-aktar`, `deploy`)
- **Git commit:** Tüm değişiklikler commit'lendi (`8581788`)

## 📋 Kalan İşler

### 1. GitHub Repo Oluştur
```bash
# https://github.com/new → "butce-takip" repo'su oluştur
git remote add origin https://github.com/KULLANICI_ADIN/butce-takip.git
git branch -M main
git push -u origin main
```

### 2. Supabase Projesi Aç
- [supabase.com](https://supabase.com) → Yeni proje (Frankfurt, free)
- SQL Editor'de `supabase-schema.sql` çalıştır
- Settings > API'den `SUPABASE_URL` ve `SUPABASE_SERVICE_KEY` al

### 3. Verileri Aktar
- `.env` dosyasına Supabase bilgilerini yaz
- `npm run veri-aktar` çalıştır

### 4. Render'a Deploy
- [render.com](https://render.com) → GitHub bağla
- Blueprint ile deploy et (`render.yaml` otomatik okunur)
- Render dashboard'da `SUPABASE_URL` ve `SUPABASE_SERVICE_KEY` gir

### 5. Canlı Test
- Render URL'sini aç → tüm özellikleri test et
- Mobilde PWA kurulumu dene

---

## 🔗 Önemli Linkler
| Kaynak | Adres |
|--------|-------|
| Proje dizini | `/Users/macair/butce-takip/` |
| Yedek düzeni | `/Users/macair/projeler/butce-takip/` |
| Deploy kılavuzu | `DEPLOY.md` |
| SQL şeması | `supabase-schema.sql` |
| Sunucu kodu | `server/index.js` |
