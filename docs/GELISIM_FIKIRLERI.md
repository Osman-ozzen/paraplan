# 🚀 ParaPlan — Gelişim Fikirleri Raporu

> Haziran 2026 • Proje durumu: Canlı (Production)

---

## Önceliklendirme

| 🔴 Acil | 🟡 Yapılabilir | 🟢 Uzun Vade |
|---------|---------------|-------------|
| Hemen eklenebilir, yüksek etki | Orta çaba, iyi kazanç | Büyük özellik, planlı |

---

## 🔴 ÖNCELİKLİ (Hızlı Kazanç)

### 1. Yevmiye Defteri'ne Arama/Filtre
**Etki:** Yüksek • **Çaba:** Düşük
- Kayıtlar arasında kelime/not arama
- Tarih aralığı filtresi (başlangıç-bitiş)
- Kategoriye göre filtreleme
- Minimum/maksimum tutar filtresi

### 2. Excel/CSV Dışa Aktar
**Etki:** Yüksek • **Çaba:** Düşük
- Tüm kayıtları CSV veya Excel olarak indir
- Aylık raporları PDF çıktısı
- Vergi beyannamesi için yıllık döküm

### 3. Gece Modu (Dark Mode) Toggle
**Etki:** Orta • **Çaba:** Düşük
- Sağ üste güneş/ay ikonu
- CSS değişkenlerini toggle et
- localStorage'da tercih sakla
- Sistem temasına otomatik uyum (prefers-color-scheme)

### 4. Dashboard'a Hızlı İstatistik Kartları
**Etki:** Yüksek • **Çaba:** Düşük
- "Bu ay harcama ortalaman"
- "En çok harcama yaptığın kategori"
- "Kalan bütçe" (hedef/limit bazlı)
- "Tasarruf oranı" (gelir/gider farkı)

---

## 🟡 ORTA VADE (Bu Ay İçinde)

### 5. Düzenli Ödeme Hatırlatıcıları
**Etki:** Yüksek • **Çaba:** Orta
- Aylık sabit giderler için hatırlatma (kira, fatura, abonelik)
- Vade tarihi yaklaşan borçlar için uyarı
- Telegram/email bildirimi
- Tarayıcı Push Notification (PWA)

### 6. Bütçe Limiti & Uyarı Sistemi
**Etki:** Yüksek • **Çaba:** Orta
- Kategori bazında aylık limit belirleme
- Limite yaklaşınca renk uyarısı (sarı → kırmızı)
- Limit aşılınca bildirim
- Dashboard'da bütçe çubuğu

### 7. Finansal Hedef Görselleştirme
**Etki:** Orta • **Çaba:** Orta
- Hedef ilerleme animasyonu (circular progress)
- "Kalan gün" sayacı
- Hedef tamamlanma tahmini
- Birden çok hedef karşılaştırma

### 8. Hızlı Kategori Yönetimi
**Etki:** Orta • **Çaba:** Düşük
- Kayıt eklerken kategori önerisi (sık kullanılanlar)
- Kategori renk atama (şu an pasta grafikte indeks bazlı)
- Kategori gruplama (Zorunlu / İsteğe Bağlı / Tasarruf)

### 9. Harcama Analizi & Raporlama
**Etki:** Yüksek • **Çaba:** Orta
- Geçen aya göre değişim yüzdesi
- En pahalı 5 harcama
- Haftanın gününe göre harcama ısı haritası
- Yıllık karşılaştırma grafikleri

### 10. Hesap (Cüzdan) Yönetimi
**Etki:** Yüksek • **Çaba:** Orta
- Birden çok hesap ekleme (Nakit, Banka, Kredi Kartı)
- Her hesap için ayrı bakiye
- Transfer işlemleri (hesaplar arası para taşıma)
- Hesap bazlı raporlama

---

## 🟢 UZUN VADE (Stratejik)

### 11. Mobil Uygulama (Capacitor)
**Etki:** Yüksek • **Çaba:** Yüksek
- `npm run mobile:android` ile APK oluşturma
- iOS build (Xcode gerekli)
- Push notification eklentisi
- Kamera ile fiş okuma (OCR ile harcama tanıma)
- Offline destek (IndexedDB)

### 12. Çoklu Para Birimi & Kur Desteği
**Etki:** Orta • **Çaba:** Yüksek
- USD, EUR, GBP ile işlem yapabilme
- Güncel kur üzerinden otomatik çeviri (API entegrasyonu)
- Döviz bazlı raporlama
- Kuruş hassasiyeti

### 13. Enflasyon & Zam Analizi
**Etki:** Orta • **Çaba:** Yüksek
- Aynı kategorinin geçen yıla göre fiyat değişimi
- Enflasyon oranı ile karşılaştırma
- "Geçen yıl bu ay ne harcamıştım" karşılaştırması
- Harcama artış trendi uyarısı

### 14. Yapay Zeka Asistanı
**Etki:** Yüksek • **Çaba:** Yüksek
- "Bu ay çok fazla yemek harcamam var, önerin ne?" gibi sorular
- Otomatik kategori önerisi (fiş açıklamasına göre)
- Anomali tespiti (alışılmadık harcamaları işaretle)
- Aylık harcama özeti (AI tarafından oluşturulmuş)
- Tasarruf önerileri

### 15. PDF Fiş / Fatura Tarama
**Etki:** Orta • **Çaba:** Yüksek
- Fotoğraf çekerek fiş okuma
- Tarih, tutar, kategori otomatik çıkarma
- Fatura görselini kaydetme (delil olarak)
- Arama: fiş üzerindeki yazılar

### 16. Paylaşımlı Hesaplar / Aile Bütçesi
**Etki:** Yüksek • **Çaba:** Yüksek
- Aile üyeleriyle ortak bütçe
- İzin yönetimi (kim ne görebilir)
- Ortak harcama ekleme ve bölüşme
- "Ne kadar borcun var" takibi

### 17. Veri Yedekleme & Senkronizasyon
**Etki:** Yüksek • **Çaba:** Orta
- Otomatik Supabase yedekleme (zaten var)
- JSON dışa aktar (manuel yedek)
- Google Drive / iCloud entegrasyonu
- Geçmiş sürümlere dönme

### 18. E-Ticaret Modülü Geliştirme
**Etki:** Düşük • **Çaba:** Yüksek
- Ürün katalog yönetimi
- Stok takibi
- Kârlılık analizi
- Tedarikçi yönetimi
- Otomatik komisyon hesaplama (Trendyol, Hepsiburada, vb.)

---

## 📊 Önerilen Yol Haritası

```
Hafta 1-2:   🔴 Arama/Filtre + Excel Çıktı + Dark Mode
Hafta 3-4:   🟡 Bütçe Limiti + Hatırlatıcılar + Kategori Renk
Hafta 5-6:   🟡 Harcama Analizi + Hesap Yönetimi
Hafta 7-8:   🟢 Mobil APK + Offline Destek
Hafta 9+:    🟢 AI Asistan + Paylaşımlı Hesaplar
```

---

## 🔧 Teknik Borç & Bakım

- **Test yazma:** Unit test (Vitest) + API test
- **TypeScript'a geçiş:** Daha güvenli tip kontrolü
- **Hata izleme:** Sentry entegrasyonu
- **Performans:** Lazy loading + code splitting
- **Erişilebilirlik:** ARIA etiketleri, klavye navigasyonu

---

## 📈 Metrikler & Başarı Kriteri

Her özellik için başarı kriteri:
- Kullanıcı testi: "Telefondan 3 adımda yapabiliyor muyum?"
- Performans: Sayfa yüklenme < 2sn (First Contentful Paint)
- Hata oranı: %0.1 altı
- Mobil uyumluluk: 320px - 414px ekranlarda test

---

> 📝 Bu rapor canlı uygulama üzerinden gözlem ve kullanıcı ihtiyaçlarına göre
> güncellenmelidir. Öncelikler geri bildirimlere göre değişebilir.
