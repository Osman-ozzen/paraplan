const express = require('express');
const router = express.Router();

// ─── BİLGİ TABANI: Kategori bazlı pazar verileri ──────────────────────────
const KATEGORI_BILGI = {
  'tişört': {
    tur: 'Moda/Giyim',
    pazarBuyuklugu: '428.7 milyar TL (2025) — Giyim #1 kategori',
    buyumeHizi: 'Yıllık %25+',
    ortFiyat: { trendyol: '₺149-299', etsy: '$12-35', amazon: '$15-30' },
    enCokSatanBaskilar: [
      { tip: 'Vintage/Retro Grafik', trend: '📈 ÇOK YÜKSELEN', aciklama: '70s/80s estetiği, soluk renk paletleri, retro yazı fontları. Etsy ve Instagram\'da en çok satan kategori.', ornekLogo: 'Band logosu, nostaljik reklam afişleri' },
      { tip: 'Minimalist Typografi', trend: '📈 YÜKSELEN', aciklama: 'Sade yazı, tek renk, zarif font. Premium his veriyor. Shopify D2C markalarında güçlü.', ornekLogo: 'İnce serif font, tek cümlelik motto' },
      { tip: 'Oversize + Düşük Omuz', trend: '🔥 ÇOK POPÜLER', aciklama: 'Kalıp olarak oversize + düşük omuz kesim, baskıda sade. Sokak stili.', ornekLogo: 'Göğüs ortası küçük logo, arka büyük baskı' },
      { tip: 'Sanatçı İşbirliği', trend: '📈 YÜKSELEN', aciklama: 'Yerel sanatçılarla özel koleksiyon. Etsy\'de çok popüler, Türkiye\'de boşluk var.', ornekLogo: 'Özel illüstrasyon,abstract sanat' },
      { tip: 'Fotoğraf Baskı', trend: '➡️ STABİL', aciklama: 'Manzara, şehir, doğa fotoğrafları. Doğa temalı olanlar yaz aylarında patlama yaşıyor.', ornekLogo: 'Dağ, orman, günbatımı fotoğrafı' },
      { tip: 'Lisanslı/Karakter', trend: '🔥 ÇOK POPÜLER', aciklama: 'Film, dizi, anime, oyun karakterleri. Pull&Bear Star Wars, FIFA lisanslı tişörtler örneği.', ornekLogo: 'Star Wars, Marvel, Anime karakterleri' },
    ],
    fiyatStratejisi: '₺149-199 arası başlangıç, ilk 50 satışta ₺199-249\'a çıkar. Etsy\'de $19-25 sweet spot.',
    oncelikliPlatformlar: ['Trendyol', 'Instagram', 'Etsy', 'Shopify'],
    seoKelimeleri: ['oversize tişört erkek', 'baskılı tişört', 'vintage tişört', 'grafik tişört erkek'],
    hedefKitle: '18-35 yaş, sokak stili, sosyal medya aktif, görsel odaklı alışveriş',
    riskler: ['Çok yüksek rekabet (Trendyol\'da 109K+ ürün)', 'Baskı kalitesi çok önemli (yıkamada solma)', 'Stok yönetimi zor (beden çeşitliliği)'],
  },
  'kulaklık': {
    tur: 'Elektronik',
    pazarBuyuklugu: 'Electronics pazarı Türkiye\'de #2 kategori',
    ortFiyat: { trendyol: '₺299-1499', amazon: '$15-300' },
    enCokSatanBaskilar: [
      { tip: 'TWS (Kablosuz Çift Kulaklık)', trend: '🔥 EN ÇOK SATAN', aciklama: 'AirPods rakipleri, ₺299-699 arası en çok satan segment.' },
      { tip: 'ANC (Aktif Gürültü Engelleme)', trend: '📈 YÜKSELEN', aciklama: 'İş/seyahat odaklı, premium segment.' },
      { tip: 'Gaming Kulaklık', trend: '➡️ STABİL', aciklama: 'RGB, mikrofon, surround ses. Oyun odaklı.' },
      { tip: 'Bone Conduction', trend: '📈 YENİ TREND', aciklama: 'Koşu/spor için. Düşük rekabet, yüksek fiyat marjı.' },
    ],
    fiyatStratejisi: '₺199-499 arası en yüksek hacim. ₺500+ premium segment.',
    oncelikliPlatformlar: ['Trendyol', 'Hepsiburada', 'Amazon'],
    seoKelimeleri: ['kablosuz kulaklık', 'bluetooth kulaklık', 'ANC kulaklık', 'gaming kulaklık'],
  },
  'ayakkabı': {
    tur: 'Moda/Ayakkabı',
    pazarBuyuklugu: 'Ayakkabı pazarı Türkiye\'de hızla büyüyor',
    ortFiyat: { trendyol: '₺399-1299', amazon: '$30-150' },
    enCokSatanBaskilar: [
      { tip: 'Sneaker/Kasık Ayakkabı', trend: '🔥 EN ÇOK SATAN', aciklama: 'Platform taban, retro, chunky. 2026\'da platform sneaker çok popüler.' },
      { tip: 'Running Shoes', trend: '📈 YÜKSELEN', aciklama: 'Hafif, destekli, renkli. Spor + günlük kullanım.' },
      { tip: 'Crocs/Birkenstock Tarzı', trend: '🔥 ÇOK POPÜLER', aciklama: 'Konfor odaklı, günlük kullanım. Jibbitz aksesuar trendi.' },
    ],
    fiyatStratejisi: '₺399-699 orta segment en çok satan.',
    oncelikliPlatformlar: ['Trendyol', 'Hepsiburada', 'Instagram'],
  },
  'çanta': {
    tur: 'Moda/Aksesuar',
    ortFiyat: { trendyol: '₺199-899' },
    enCokSatanBaskilar: [
      { tip: 'Crossbody/Çapraz Çanta', trend: '🔥 EN ÇOK SATAN', aciklama: 'Kadın-erkek, günlük kullanım. Kompakt ve şık.' },
      { tip: 'Bel Çantası', trend: '📈 YÜKSELEN', aciklama: 'Sokak stili, festival tarzı. Unisex.' },
      { tip: 'Laptop Çantası', trend: '➡️ STABİL', aciklama: 'Ofis/work from home. Fonksiyonel tasarım.' },
    ],
    fiyatStratejisi: '₺199-499 orta segment.',
    oncelikliPlatformlar: ['Trendyol', 'Instagram', 'Etsy'],
  },
  'aksesuar': {
    tur: 'Moda/Aksesuar',
    enCokSatanBaskilar: [
      { tip: 'Minimalist Takı', trend: '📈 YÜKSELEN', aciklama: 'Altın kaplama, ince kolye/bileklik. Etsy ve Instagram\'da çok satan.' },
      { tip: 'Kişiselleştirilmiş Takı', trend: '🔥 ÇOK POPÜLER', aciklama: 'İsim/tarih kazımalı, doğum taşı. Etsy\'de en çok satan kategorilerden.' },
    ],
  },
};

// ─── KATEGORİ TESPİTİ ────────────────────────────────────────────────────
function kategoriTespiti(query) {
  const q = query.toLowerCase();
  for (const [anahtar, veri] of Object.entries(KATEGORI_BILGI)) {
    if (q.includes(anahtar)) return { ...veri, eslesenKategori: anahtar };
  }
  // Genel dönüşüm
  return {
    tur: 'Genel',
    pazarBuyuklugu: 'Genel e-ticaret pazarı',
    enCokSatanBaskilar: [],
    fiyatStratejisi: 'Piyasa araştırması gerekli',
    oncelikliPlatformlar: ['Trendyol', 'Instagram', 'Etsy'],
    eslesenKategori: null,
  };
}

// ─── PLATFORM BİLGİSİ ────────────────────────────────────────────────────
const PLATFORMLAR = {
  trendyol: { name: 'Trendyol', icon: '🛍️', renk: '#8B5CF6', pay: '%35-38', komisyon: '%19-22', guclu: 'Moda/giyimde lider, 45M+ kullanıcı, hızlı kargo', zayif: 'Çok yüksek rekabet (109K+ tişört)', url: q => `https://www.trendyol.com/sr?q=${encodeURIComponent(q)}` },
  hepsiburada: { name: 'Hepsiburada', icon: '🏪', renk: '#10B981', pay: '%18-20', komisyon: '%14-18', guclu: 'Elektronikte güçlü, 54M+ ziyaret', zayif: 'Modada düşük', url: q => `https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}` },
  amazon: { name: 'Amazon.com.tr', icon: '📦', renk: '#F59E0B', pay: '%7-15', komisyon: '%8-15', guclu: 'Düşük komisyon, FBA, global satış', zayif: 'Yerel marka bilinirliği düşük', url: q => `https://www.amazon.com.tr/s?k=${encodeURIComponent(q)}` },
  etsy: { name: 'Etsy', icon: '🎨', renk: '#EC4899', pay: '80M+ alıcı', komisyon: '%6.5', guclu: 'Özel tasarım, niş, premium fiyat ($24-35)', zayif: 'Toplu üretim uygun değil', url: q => `https://www.etsy.com/search?q=${encodeURIComponent(q)}` },
  instagram: { name: 'Instagram', icon: '📸', renk: '#E1306C', pay: '58M TR', komisyon: 'DM satışı', guclu: '%70 ürün araştırması, görsel satış, DM dönüşümü yüksek', zayif: 'Uygulama içi ödeme yok', url: q => `https://www.instagram.com/explore/tags/${encodeURIComponent(q.replace(/\s+/g,''))}/` },
  shopify: { name: 'Shopify D2C', icon: '🛒', renk: '#96BF48', pay: 'Kendi mağazan', komisyon: '0%', guclu: 'Komisyon yok, marka kontrolü, veri sahipliği', zayif: 'Trafik kendin oluşturmalı', url: q => `https://www.shopify.com/blog?q=${encodeURIComponent(q)}` },
};

// ─── ANALİZ ────────────────────────────────────────────────────────────────
router.get('/:kategori', async (req, res) => {
  const kategori = req.params.kategori?.trim();
  if (!kategori || kategori.length < 2) return res.status(400).json({ basarili: false, hata: 'En az 2 karakter' });

  const bilgi = kategoriTespiti(kategori);

  // Platform linkleri
  const platformLinkleri = {};
  for (const [key, p] of Object.entries(PLATFORMLAR)) {
    platformLinkleri[key] = { ...p, link: p.url(kategori) };
  }

  res.json({
    basarili: true,
    kategori,
    zaman: new Date().toISOString(),
    analiz: bilgi,
    platformlar: platformLinkleri,
    sonrakiAdimlar: [
      `🔍 "${kategori}" için Google Trends'te arama hacmini kontrol et`,
      `📸 Instagram'da #${kategori.replace(/\s+/g,'')} etiketini incele`,
      `💰 Cimri/Akakçe'de fiyat karşılaştırması yap`,
      `🎯 Etsy'de benzer ürün yorumlarını oku (müşteri beklentileri)`,
    ],
  });
});

module.exports = router;
