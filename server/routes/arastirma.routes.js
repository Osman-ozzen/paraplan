const express = require('express');
const router = express.Router();

// ─── GENİŞLETİLMİŞ BİLGİ TABANI (30+ kategori) ──────────────────────────
const KB = {
  'tişört': { tur:'Moda/Giyim', buyukluk:'428.7M TL (#1 kategori)', buyume:'%25+', trendler:[
    {tip:'Vintage/Retro Grafik',trend:'🔥 ÇOK POPÜLER',aciklama:'70s/80s estetiği, soluk renkler, retro font. Etsy+Instagram\'da en çok satan.',ornek:'Band logosu, nostaljik reklam'},
    {tip:'Minimalist Typografi',trend:'📈 YÜKSELEN',aciklama:'Sade yazı, tek renk, zarif font. D2C markalarında güçlü.',ornek:'İnce serif, tek cümle motto'},
    {tip:'Oversize + Düşük Omuz',trend:'🔥 ÇOK POPÜLER',aciklama:'Sokak stili, bol kesim, sade baskı.',ornek:'Göğüs ortası küçük logo, arka büyük'},
    {tip:'Sanatçı İşbirliği',trend:'📈 YÜKSELEN',aciklama:'Özel illüstrasyon. Etsy\'de çok popüler, TR\'de boşluk.',ornek:'Abstract sanat, hand-drawn'},
    {tip:'Fotoğraf Baskı',trend:'➡️ STABİL',aciklama:'Manzara, doğa. Yaz aylarında patlama.',ornek:'Dağ, orman, günbatımı'},
    {tip:'Lisanslı/Karakter',trend:'🔥 ÇOK POPÜLER',aciklama:'Film, anime, oyun. Pull&Bear, LCW örnekleri.',ornek:'Star Wars, Marvel, Anime'},
  ],fiyat:'₺149-299 başlangıç, Etsy $19-25',platformlar:['Trendyol','Instagram','Etsy','Shopify'],seo:['oversize tişört','baskılı tişört','vintage tişört'],hedef:'18-35 yaş, sokak stili',risk:['Çok yüksek rekabet (109K+ ürün)','Baskı kalitesi kritik','Beden yönetimi zor']},
  'crop': { tur:'Moda/Giyim (Kadın)', buyukluk:'Kadın giyim #2 hızla büyüyen', buyume:'%30+', trendler:[
    {tip:'Crop Top + Oversize Pantolon',trend:'🔥 EN ÇOK SATAN',aciklama:'Dengeli siluet: dar crop + geniş alt. Instagram\'da en çok paylaşılan kombin.',ornek:'Siyah crop + kargo pantolon'},
    {tip:'Dikişli/Sportif Crop',trend:'📈 YÜKSELEN',aciklama:'Atletik crop, dikiş detayı, fonksiyonel. Spor + günlük.',ornek:'Beyaz dikişli spor crop'},
    {tip:'Tie-Dye / Boyalı Crop',trend:'🔥 ÇOK POPÜLER',aciklama:'El yapımı efekt, her parça benzersiz. Etsy\'de çok satan.',ornek:'Mor-mavi tie-dye crop'},
    {tip:'Lettering/Slogan Crop',trend:'📈 YÜKSELEN',aciklama:'Yazı/slogan baskılı. Feminist mesajlar, komik cümleler.',ornek:'"Good Vibes" yazılı crop'},
    {tip:'Lace/Dantel Detaylı',trend:'➡️ STABİL',aciklama:'Romantik, bohem. Düğün/sezonluk.',ornek:'Beyaz dantel trim crop'},
    {tip:'Long Sleeve Crop',trend:'📈 YÜKSELEN',aciklama:'Sonbahar/kış geçişinde güçlü. Uzun kollu crop mont altına.',ornek:'Siyah uzun kollu crop'},
  ],fiyat:'₺99-249 başlangıç, premium ₺299-499, Etsy $15-30',platformlar:['Trendyol','Instagram','Hepsiburada','Etsy','Shein'],seo:['crop top kadın','oversize crop','tie-dye crop','slogan crop'],hedef:'16-30 yaş kadın, sosyal medya aktif, yaz/spor/moda odaklı',risk:['Sezonsal (yaz patlama, kış düşüş)','Beden uyumsuzluğu complaintleri','UCUZ ithalat çok (Shein, Temu) rekabet']},
  'tişört kadın': { tur:'Moda/Giyim (Kadın)', buyukluk:'Kadın tişört pazarı çok büyük', trendler:[
    {tip:'Oversize Grafik',trend:'🔥 ÇOK POPÜLER',aciklama:'Bol kesim, büyük grafik. Sokak stili.',ornek:'Siyah oversize + beyaz grafik'},
    {tip:'Crop Tişört',trend:'🔥 ÇOK POPÜLER',aciklama:'Crop kesim basic. Minimalist.',ornek:'Beyaz basic crop'},
    {tip:'Vintage Baskı',trend:'📈 YÜKSELEN',aciklama:'Retro renkler, eskitme efekti.',ornek:'Soluk pembe vintage logo'},
  ],fiyat:'₺99-199',platformlar:['Trendyol','Instagram','Etsy','Shein'],seo:['kadın tişört','oversize tişört kadın','crop tişört'],hedef:'18-35 kadın'},
  'kulaklık': { tur:'Elektronik', buyukluk:'Elektronik #2 kategori', trendler:[
    {tip:'TWS (Kablosuz Çift)',trend:'🔥 EN ÇOK SATAN',aciklama:'AirPods rakipleri. ₺299-699 en çok satan.',ornek:'Kulak içi, şarj kutusu'},
    {tip:'ANC (Gürültü Engelleme)',trend:'📈 YÜKSELEN',aciklama:'İş/seyahat. Premium segment ₺500+',ornek:'Kulak üstü,ANC'},
    {tip:'Gaming',trend:'➡️ STABİL',aciklama:'RGB, mikrofon, surround.',ornek:'Kablolu/kablosuz gaming'},
    {tip:'Bone Conduction',trend:'📈 YENİ',aciklama:'Koşu/spor. Düşük rekabet.',ornek:'Kemik iletimli'},
  ],fiyat:'₺199-1499',platformlar:['Trendyol','Hepsiburada','Amazon'],seo:['kablosuz kulaklık','ANC kulaklık','gaming kulaklık'],hedef:'Geniş kitle'},
  'ayakkabı': { tur:'Moda/Ayakkabı', trendler:[
    {tip:'Sneaker/Platform',trend:'🔥 EN ÇOK SATAN',aciklama:'Platform taban, chunky, retro.',ornek:'Beyaz platform sneaker'},
    {tip:'Running',trend:'📈 YÜKSELEN',aciklama:'Hafif, renkli, konforlu.',ornek:'Nike/Adidas rakipleri'},
    {tip:'Crocs/Birkenstock',trend:'🔥 ÇOK POPÜLER',aciklama:'Konfor + Jibbitz trendi.',ornek:'Terlik/sandal'},
  ],fiyat:'₺399-1299',platformlar:['Trendyol','Hepsiburada','Instagram'],seo:['sneaker kadın','platform ayakkabı'],hedef:'18-40 yaş'},
  'çanta': { tur:'Moda/Aksesuar', trendler:[
    {tip:'Crossbody/Çapraz',trend:'🔥 EN ÇOK SATAN',aciklama:'Günlük, kompakt.',ornek:'Mini crossbody'},
    {tip:'Bel Çantası',trend:'📈 YÜKSELEN',aciklama:'Sokak stili, unisex.',ornek:'Unisex bel çantası'},
    {tip:'Tote Bag',trend:'📈 YÜKSELEN',aciklama:'Büyük, fonksiyonel. Market/okul.',ornek:'Kanvas tote'},
  ],fiyat:'₺199-899',platformlar:['Trendyol','Instagram','Etsy'],seo:['çanta kadın','crossbody çanta'],hedef:'Kadın 18-40'},
  'takı': { tur:'Moda/Aksesuar', trendler:[
    {tip:'Minimalist Altın Kaplama',trend:'🔥 EN ÇOK SATAN',aciklama:'İnce, zarif. Her gün giyilir.',ornek:'İnce altın kolye'},
    {tip:'Kişiselleştirilmiş',trend:'🔥 ÇOK POPÜLER',aciklama:'İsim/tarih kazımalı. Hediye ideal.',ornek:'İsim kolyesi, doğum taşı'},
    {tip:'Bohem/Doğal',trend:'📈 YÜKSELEN',aciklama:'Taş, ahşap, ip. Festival tarzı.',ornek:'Doğal taş bileklik'},
  ],fiyat:'₺79-499, Etsy $10-40',platformlar:['Etsy','Instagram','Trendyol'],seo:['minimialist takı','isim kolyesi','bohem bileklik'],hedef:'Kadın 16-45'},
  'ev dekorasyon': { tur:'Ev & Yaşam', trendler:[
    {tip:'Minimalist Duvar Sanatı',trend:'🔥 EN ÇOK SATAN',aciklama:'Çerçeveli print, abstract. Etsy\'de çok satan.',ornek:'Minimal poster, soyut resim'},
    {tip:'Bitki/Doğa Teması',trend:'📈 YÜKSELEN',aciklama:'Botanik print, terrarium, sukulent.',ornek:'Botanik illüstrasyon'},
    {tip:'Neon/LED Tabela',trend:'🔥 ÇOK POPÜLER',aciklama:'Kişiselleştirilmiş neon. Instagram mekanı.',ornek:'"Home" neon tabela'},
    {tip:'Mum/Koku',trend:'📈 YÜKSELEN',aciklama:'El yapımı mum, premium koku.',ornek:'Soya mumu, lavanta'},
  ],fiyat:'₺49-399, Etsy $10-60',platformlar:['Etsy','Instagram','Trendyol','Hepsiburada'],seo:['ev dekorasyon','duvar sanatı','neon tabela'],hedef:'Ev sahibi 25-45'},
  'spor': { tur:'Spor Giyim', trendler:[
    {tip:'Oversize Eşofman',trend:'🔥 EN ÇOK SATAN',aciklama:'Salaş, konforlu, günlük kullanım.',ornek:'Bordo oversize eşofman'},
    {tip:'Leggings (Yüksek Bel)',trend:'🔥 ÇOK POPÜLER',aciklama:'Spor + günlük. Squat-proof.',ornek:'Siyah yüksek bel legging'},
    {tip:'Sports Bra / Crop',trend:'📈 YÜKSELEN',aciklama:'Renkli, dikişli. Spor + sokak.',ornek:'Pastel renk spor sütyeni'},
  ],fiyat:'₺129-399',platformlar:['Trendyol','Instagram','Shein'],seo:['eşofman kadın','leggings','spor giyim'],hedef:'Kadın 18-35, aktif yaşam'},
  'laptop': { tur:'Elektronik', trendler:[
    {tip:'Ultrabook (İnce+Hafif)',trend:'🔥 EN ÇOK SATAN',aciklama:'13-14 inç, hafif, uzun pil.',ornek:'MacBook Air rakibi'},
    {tip:'Gaming Laptop',trend:'📈 YÜKSELEN',aciklama:'RTX ekran kartı, yüksek performans.',ornek:'15.6" gaming'},
    {tip:'2-in-1 Convertible',trend:'➡️ STABİL',aciklama:'Tablet/laptop, dokunmatik ekran.',ornek:'Yoga/Spin model'},
  ],fiyat:'₺15.000-45.000',platformlar:['Hepsiburada','Amazon','Trendyol'],seo:['laptop','notebook','gaming laptop'],hedef:'Geniş kitle'},
  'gaming': { tur:'Oyun', trendler:[
    {tip:'Konsol (PS5/Xbox)',trend:'🔥 EN ÇOK SATAN',aciklama:'Yeni nesil konsollar.',ornek:'PS5 Digital/Fat'},
    {tip:'Gaming Mouse',trend:'📈 YÜKSELEN',aciklama:'RGB, wireless, hassasiyet.',ornek:'Logitech/Glorious'},
    {tip:'Mekanik Klavye',trend:'🔥 ÇOK POPÜLER',aciklama:'Custom, RGB, hot-swap.',ornek:'65%/75% layout'},
  ],fiyat:'₺2.000-15.000',platformlar:['Hepsiburada','Amazon','Trendyol'],seo:['gaming mouse','mekanik klavye','PS5'],hedef:'Oyuncu 15-35'},
  'makyaj': { tur:'Kozmetik', trendler:[
    {tip:'Fluide Foundation',trend:'🔥 EN ÇOK SATAN',aciklama:'Doğal bitiş, uzun süre kalıcı.',ornek:'Skin tint, concealer'},
    {tip:'Lip Oil/Gloss',trend:'📈 YÜKSELEN',aciklama:'Parlak, nemlendirici. Viral.',ornek:'Dior Lip Oil rakibi'},
    {tip:'Setting Spray',trend:'📈 YÜKSELEN',aciklama:'Makyaj sabitleme. viral.',ornek:'Urban Decay rakibi'},
  ],fiyat:'₺99-599',platformlar:['Trendyol','Instagram','Hepsiburada'],seo:['makyaj malzemeleri','fluid fondöten','lip oil'],hedef:'Kadın 16-40'},
  'oyun': { tur:'Oyun/Elektronik', buyukluk:'Türkiye oyun pazarı 1.2M TL', trendler:[
    {tip:'Konsol Oyunları',trend:'🔥 EN ÇOK SATAN',aciklama:'AAA oyunlar. PS5/Xbox.',ornek:'GTA, FIFA, COD'},
    {tip:'Mobil Oyun',trend:'📈 YÜKSELEN',aciklama:'Free-to-play, microtransaction.',ornek:'PUBG Mobile, Free Fire'},
    {tip:'Gaming Aksesuar',trend:'🔥 ÇOK POPÜLER',aciklama:'Mouse, klavye, kulaklık, koltuk.',ornek:'Racing sim, VR headset'},
  ],fiyat:'₺99-15.000',platformlar:['Hepsiburada','Amazon'],seo:['oyun konsolu','gaming mouse','PS5 oyun'],hedef:'15-35 yaş erkek ağırlıklı'},
  'kitap': { tur:'Yayın', trendler:[
    {tip:'Self-Help/Kişisel Gelişim',trend:'🔥 EN ÇOK SATAN',aciklama:'Dopamin, motivasyon, zihin.',ornek:'Atomic Habits, Dopamine Detox'},
    {tip:'Fantastik/Kurgu Dışı',trend:'📈 YÜKSELEN',aciklama:'Popüler kültür romanları.',ornek:'Romantasy, dark academia'},
  ],fiyat:'₺49-199',platformlar:['Amazon','Trendyol','Kitapyurdu'],seo:['kitap','en çok satan kitaplar'],hedef:'Geniş kitle'},
  'pet': { tur:'Evcil Hayvan', trendler:[
    {tip:'Kişiselleştirilmiş Ürünler',trend:'🔥 ÇOK POPÜLER',aciklama:'Evcil hayvan portresi, isimli çanta.',ornek:'Pet portrait shirt'},
    {tip:'Akıllı Köpek Tasması',trend:'📈 YÜKSELEN',aciklama:'GPS takip, LED, akıllı.',ornek:'GPS köpek tasması'},
    {tip:'Kedi Oyunları',trend:'📈 YÜKSELEN',aciklama:'Interaktif oyuncaklar, tünel.',ornek:'Lazer oyuncak, tünel sistemi'},
  ],fiyat:'₺49-499, Etsy $10-40',platformlar:['Trendyol','Etsy','Instagram'],seo:['evcil hayvan aksesuar','pet portrait','köpek tasması'],hedef:'Hayvan sahipleri 25-50'},
};

// ─── AKILLI KATEGORİ EŞLEŞTİRME ──────────────────────────────────────────
function eslestir(query) {
  const q = query.toLowerCase().replace(/[ıİ]/g,i=>i==='İ'?'i':'ı').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c');
  // Tam eşleşme
  for (const [k,v] of Object.entries(KB)) {
    const kk = k.toLowerCase().replace(/[ıİ]/g,i=>i==='İ'?'i':'ı').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c');
    if (q.includes(kk) || kk.includes(q)) return { ...v, eslesen: k };
  }
  // Kısmi eşleşme
  for (const [k,v] of Object.entries(KB)) {
    const kelimeler = k.split(/\s+/);
    if (kelimeler.some(w => q.includes(w))) return { ...v, eslesen: k };
  }
  // Genel dönüşüm
  return null;
}

// ─── PLATFORM LİNKLERİ ────────────────────────────────────────────────────
function platformLinkleri(q) {
  return {
    trendyol: {name:'Trendyol',icon:'🛍️',renk:'#8B5CF6',komisyon:'%19-22',url:`https://www.trendyol.com/sr?q=${encodeURIComponent(q)}`},
    hepsiburada: {name:'Hepsiburada',icon:'🏪',renk:'#10B981',komisyon:'%14-18',url:`https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}`},
    amazon: {name:'Amazon.com.tr',icon:'📦',renk:'#F59E0B',komisyon:'%8-15',url:`https://www.amazon.com.tr/s?k=${encodeURIComponent(q)}`},
    etsy: {name:'Etsy',icon:'🎨',renk:'#EC4899',komisyon:'%6.5',url:`https://www.etsy.com/search?q=${encodeURIComponent(q)}`},
    instagram: {name:'Instagram',icon:'📸',renk:'#E1306C',komisyon:'DM',url:`https://www.instagram.com/explore/tags/${encodeURIComponent(q.replace(/\s+/g,''))}/`},
    google: {name:'Google Alışveriş',icon:'🔍',renk:'#4285F4',komisyon:'-',url:`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`},
    cimri: {name:'Cimri',icon:'💲',renk:'#FF6B35',komisyon:'-',url:`https://www.cimri.com/arama?q=${encodeURIComponent(q)}`},
    n11: {name:'N11',icon:'🎯',renk:'#6366F1',komisyon:'%12-17',url:`https://www.n11.com/arama?q=${encodeURIComponent(q)}`},
  };
}

// ─── ROTA ──────────────────────────────────────────────────────────────────
router.get('/:kategori', (req, res) => {
  const kategori = req.params.kategori?.trim();
  if (!kategori || kategori.length < 2) return res.status(400).json({ basarili: false, hata: 'En az 2 karakter' });

  const eslesen = eslestir(kategori);
  
  res.json({
    basarili: true,
    kategori,
    zaman: new Date().toISOString(),
    analiz: eslesen ? {
      tur: eslesen.tur,
      buyukluk: eslesen.buyukluk || '',
      buyume: eslesen.buyume || '',
      trendler: eslesen.trendler || [],
      fiyat: eslesen.fiyat || '',
      platformlar: eslesen.platformlar || [],
      seo: eslesen.seo || [],
      hedef: eslesen.hedef || '',
      risk: eslesen.risk || [],
      eslesenKategori: eslesen.eslesen,
    } : {
      tur: 'Genel Ürün',
      buyukluk: 'Araştırma gerekli',
      trendler: [],
      fiyat: 'Piyasa araştırması ile belirlenmeli',
      platformlar: ['Trendyol','Instagram','Etsy'],
      seo: [kategori, `${kategori} fiyat`, `${kategori} en çok satan`],
      hedef: 'Hedef kitle araştırması gerekli',
      risk: ['Detaylı pazar araştırması yapılması önerilir'],
      eslesenKategori: null,
    },
    platformlar: platformLinkleri(kategori),
    sonrakiAdimlar: [
      `🔍 "${kategori}" için Google Trends'te arama hacmini kontrol et`,
      `📸 Instagram'da #${kategori.replace(/\s+/g,'')} etiketini incele`,
      `💰 Cimri/Akakçe'de fiyat karşılaştırması yap`,
      eslesen ? `📊 Rakiplerin fiyatlarını ve yorumlarını analiz et` : `📊 Detaylı pazar araştırması için uzman desteği al`,
    ],
  });
});

module.exports = router;
