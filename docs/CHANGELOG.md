# 📋 ParaPlan - Değişiklik Raporu

**Tarih:** 17 Haziran 2026  
**Proje:** ParaPlan (eski: Bütçe Takip)

---

## 1. 🚀 Mobil Uygulama Versiyonu

### PWA İyileştirmeleri
- **Manifest güncellendi:** `name`, `short_name`, `description` yenilendi
- **Service Worker:** Workbox ile API, resim ve harici kaynak caching stratejileri
- **Splash Screen:** Geometrik float animasyonları, logo reveal, ring expand, loading bar
- **Install Prompt:** "Ana Ekrana Ekle" desteği
- **Shortcuts:** 3D Touch / uzun bas → Yeni Fiş, Raporlar

### Capacitor Native Kurulumu
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android` eklendi
- `capacitor.config.json` yapılandırıldı (iOS + Android)
- iOS platformu eklendi: `ios/`
- Android platformu eklendi: `android/`
- Native splash screen ve status bar yapılandırması

### Mobil UI
- Alt tab bar: 📋 Ana Defter | 💳 Borçlar | ➕ Yeni | 🎯 Hedefler | 📊 Raporlar
- Ortadaki ➕ Yeni butonu belirgin (mor yuvarlak, gölgeli, yukarı kalkık)
- Responsive panel grid (mobilde 2 kolon)
- Safe area desteği (iOS notch)
- Touch optimizasyonu

### Mobil Grafik Düzeltmeleri
- Recharts responsive container max-height sınırlaması
- Pie chart boyutları mobilde küçültüldü (240→140px)
- Font boyutları mobilde optimize edildi (9px)
- Yatay bar chart etiketleri kısaltıldı
- Flex-wrap grafik-yanı liste mobilde column oldu
- Tüm grafik alanlarına `overflow: hidden` + `border-radius: 16px`

---

## 2. 🎯 Hedef Takip Paneli

### Yeni Bileşen: `src/components/Hedefler.jsx`
- Hedef ekleme/düzenleme/silme
- Ön tanımlı 8 hedef önerisi (Telefon, Borç, Araba, Ev, Tatil, Bilgisayar, Eğitim, Özel)
- İlerleme çubuğu (kırmızı/sarı/mavi/yeşil renk kodlu)
- Tamamlama işareti (%100'e ulaşınca)
- Birikim ekle/çıkar (+ hızlı butonlar: 100, 500, 1000, 5000)

### Veri Modeli
```js
{ id, ad, icon, hedefTutar, birikenTutar, tamamlanmaTarihi, durum, aciklama, createdAt }
```

### Etkilenen Dosyalar
- `src/components/Hedefler.jsx` (YENİ)
- `src/App.jsx` → state, yükleme, sekme, render
- `src/components/AnaSayfa.jsx` → dashboard özeti
- `src/utils/api.js` → `hedefler: crud('hedefler')`
- `server/index.js` → varsayılan veri + tablo eşleme
- `electron/main.js` → varsayılan veri + handler
- `electron/preload.js` → IPC binding
- `supabase-schema.sql` → `hedefler` tablosu
- `scripts/veri-aktar.js` → veri aktarımı
- `data/butce-verisi.json` → başlangıç verisi

---

## 3. 📊 Bilgi Baloncukları (Tooltip)

### Tüm Panellere Eklendi
| Panel | Tooltip İçeriği |
|-------|----------------|
| 💰 Toplam Gelir | En çok kazandığın 6 kategori + toplam |
| 📉 Toplam Gider | En çok harcadığın 6 kategori + toplam |
| ⚖️ Net Bakiye | Yıllık gelir/gider/net + genel bakiye |
| 📊 Bu Ay | Aylık gelir/gider/net detayı |
| 💳 Borç Kalan | Tek tek borçlar + ödenen/kalan özeti |
| 🎯 Hedefler | Hedef listesi progres bar ile |
| 📈 Sabit Gelir | Düzenli gelir kalemleri (gruplu) |
| 📉 Sabit Gider | Düzenli gider kalemleri (gruplu) |

### Teknik
- `position: fixed` ile stacking context sorunu çözüldü
- `onMouseEnter`/`onMouseLeave` ile tetikleme
- Özel tooltip bileşeni (koyu tema, gölgeli, ok işaretli)

---

## 4. 🔥 Kritik Güvenlik Düzeltmeleri

### `server/index.js`
| Düzeltme | Açıklama |
|----------|----------|
| CORS | Yerel origin'lerle sınırlandırıldı |
| Rate Limiting | 15 dk'da 200 istek limiti |
| Input Validasyonu | Tutar, tur, durum, tarih validasyonu |
| Body Limit | 10MB → 1MB |
| Hata Mesajları | Generic mesajlar (detay sızdırma yok) |
| hedefler Bug | Supabase'de hedefler yüklenmiyordu → düzeltildi |
| camelCase/snake_case | Otomatik dönüşüm eklendi |
| Atomik Yazma | .tmp + rename + .bak yedekleme |
| Health Check | `/health` endpoint eklendi |
| Tablo Adı Validasyonu | Geçersiz bölümler reddedilir |

### `App.jsx`
| Düzeltme | Açıklama |
|----------|----------|
| Bildirim Timeout | `useRef` ile timeout takibi + cleanup |
| duzenlenecekKayit | `finally` bloğu ile garanti sıfırlama |
| Optional Chaining | `sonuc?.basarili` (5 yerde) |
| API Hata Yönetimi | Tüm catch blokları iyileştirildi |

### Component'ler
- **16 API çağrısı** `try/catch` ile koruma altına alındı
- **3 bileşende stale data fix:** `useEffect` ile prop → state senkronizasyonu
- Etkilenen: Borclar, Hedefler, ETicaret, AylikGiderler, GelirGiderEkle, Kategoriler

---

## 5. 🏗️ DevOps & Build

### Electron Desktop
- `electron-builder` yapılandırması (macOS DMG, Windows NSIS, Linux AppImage)
- macOS uygulama ikonu: `build/icon.icns`
- Code signing hazırlığı (Developer ID gerekli)
- **Build çıktısı:** `release/ParaPlan-2.0.0-arm64.dmg` (139 MB)

### Android
- Capacitor Android platformu
- Android SDK kurulumu (Java 21 + SDK 34)
- Tüm mipmap ikon boyutları
- **Build çıktısı:** `release/ParaPlan-2.0.0-android.apk` (5.9 MB)

### iOS
- Capacitor iOS platformu
- AppIcon.appiconset yapılandırması
- Xcode ile açmak için: `npx cap open ios`

### Scripts
| Script | Açıklama |
|--------|----------|
| `npm run mobile:build` | Web build + Capacitor sync |
| `npm run mobile:ios` | iOS'te aç |
| `npm run mobile:android` | Android'de aç |
| `npm run electron:build` | Electron DMG oluştur |

---

## 6. 🎨 Tasarım Değişiklikleri

### Logo & Marka
- Proje adı: **Bütçe Takip** → **ParaPlan**
- Yeni logo: `public/logo.png` (saydam arkaplanlı, beyaz alanlar temizlendi)
- PWA ikonları: 192×192, 512×512, 180×180, 48×48
- Sidebar logo: PNG görsel
- Splash screen: Animasyonlu açılış (float sis, ring expand, loading bar)

### Açılış Animasyonu
- Geometrik mor float küreler
- Logo dönerek + ölçeklenerek gelir
- Halkalar genişler
- "ParaPlan" gradyan yazı
- Modern loading bar
- "YÜKLENİYOR..." animasyonlu noktalar
- Zarif kapanış (scale + fade)

### Şirket Giderleri Kaldırıldı
- 🏢 Şirket Gider paneli UI'dan kaldırıldı
- API altyapısı korundu (veri kaybı yok)

### Fiş Kaydı → Hızlı Kayıt
- Sidebar: "Fiş Kaydı" → "Hızlı Kayıt"
- Mobil tab: "Yeni" (ortada, mor yuvarlak buton)
- Sayfa başlığı: "Hızlı Kayıt"

### Pasta Grafikleri
- Overlay yöntemi ile mükemmel yuvarlak halka
- `innerRadius={0}` + `<circle>` overlay
- `cornerRadius={4}` ile yumuşatılmış köşeler
- `stroke` kaldırıldı (pürüzsüz görünüm)

---

## 7. 📱 Gelecek İyileştirmeler

### 🔴 Yapılacaklar
- [ ] ESLint + Prettier kurulumu
- [ ] GitHub Actions CI/CD pipeline
- [ ] Error boundary ekleme
- [ ] Dockerfile oluşturma
- [ ] Test altyapısı (Vitest + React Testing Library)

### 🟡 Planlananlar
- [ ] Karanlık tema
- [ ] Çoklu para birimi desteği
- [ ] Veri yedekleme/geri yükleme
- [ ] PDF / Excel rapor çıktısı
- [ ] Bildirimler (ödeme hatırlatma)

### 🟢 İyileştirmeler
- [ ] `tl()` fonksiyonunu ortak modüle çıkarma
- [ ] Raporlar sayfası mobil grid düzeltmesi
- [ ] `bildirimGoster` useCallback sarmalama
- [ ] Hook sıralaması standardizasyonu

---

*Rapor otomatik oluşturulmuştur. Son güncelleme: 17 Haziran 2026*
