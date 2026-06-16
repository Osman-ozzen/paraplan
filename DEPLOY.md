# 🚀 Bütçe Takip - Canlıya Alma Kılavuzu

## Adım 1: Supabase Hesabı Oluştur

1. [supabase.com](https://supabase.com) adresine git
2. "Start your project" ile ücretsiz hesap aç (GitHub ile bağlan)
3. Yeni bir proje oluştur:
   - **Name:** `butce-takip`
   - **Database Password:** Güçlü bir şifre belirle (kaydet!)
   - **Region:** `Frankfurt` (veya sana en yakın)
   - **Pricing Plan:** Free

## Adım 2: Veritabanı Şemasını Oluştur

1. Supabase Dashboard → **SQL Editor** sayfasına gir
2. `supabase-schema.sql` dosyasının içeriğini kopyala
3. SQL Editor'e yapıştır ve **Run** butonuna bas
4. Tüm tablolar oluşacak

## Adım 3: API Anahtarlarını Al

1. Supabase Dashboard → **Project Settings** → **API** sayfasına git
2. Şu bilgileri bul:
   - **Project URL** (`SUPABASE_URL`)
   - **service_role key** (`SUPABASE_SERVICE_KEY`)
3. Bu bilgileri bir yere kaydet (sonra kullanacağız)

## Adım 4: Mevcut Veriyi Aktar

Eğer mevcut verini Supabase'e taşımak istersen:

1. Bu bilgisayarda `.env` dosyası oluştur:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```
2. Çalıştır:
   ```bash
   node scripts/veri-aktar.js
   ```

## Adım 5: Render.com'a Deploy Et

1. [render.com](https://render.com) adresine git, GitHub ile bağlan
2. **New +** → **Blueprint** seç
3. GitHub'daki `butce-takip` reposunu seç
4. Render, `render.yaml` dosyasını otomatik okuyacak
5. **Environment Variables** bölümünde şunları ekle:
   - `SUPABASE_URL` → Adım 3'teki URL
   - `SUPABASE_SERVICE_KEY` → Adım 3'teki key
6. **Apply** → Deploy başlayacak

## Adım 6: Uygulamanı Kullan

- Render sana bir URL verir (ör: `https://butce-takip.onrender.com`)
- Bu adresi **yer imlerine ekle** ve her yerden kullan!
- Mobil cihazında **"Ana Ekrana Ekle"** ile PWA olarak da kurabilirsin

---

## ⚠️ Önemli Notlar

- **Render Free Tier:** 15 dk işlem olmazsa uygulama uyur, ilk istekte 30sn içinde uyanır
- **Supabase Free Tier:** 500MB veri, 50k satır aylık limit — kişisel kullanım için fazlasıyla yeterli
- **Veri Güvenliği:** `SUPABASE_SERVICE_KEY` asla paylaşılmamalı, sadece sunucuda kullanılır
- **Güncelleme:** Yeni bir özellik ekleyince:
  ```bash
  git add .
  git commit -m "açıklama"
  git push
  ```
  Render otomatik yeniden deploy eder.

---

## 🔧 Yerel Geliştirme

```bash
# Geliştirme sunucusu (frontend)
npm run dev

# API sunucusu (backend)
node server/index.js

# Veri aktarımı
node scripts/veri-aktar.js

# Build
npm run build
```
