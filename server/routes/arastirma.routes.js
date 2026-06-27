const express = require('express');
const router = express.Router();

// Cache basit �nbellek (5 dakika)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// Platform bazl� ara�t�rma URL'leri
const PLATFORMS = {
  trendyol: {
    name: 'Trendyol',
    searchUrl: (q) => `https://www.trendyol.com/sr?q=${encodeURIComponent(q)}&qt=${encodeURIComponent(q)}&st=${encodeURIComponent(q)}&os=1`,
    type: 'pazar-yeri',
  },
  hepsiburada: {
    name: 'Hepsiburada',
    searchUrl: (q) => `https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}`,
    type: 'pazar-yeri',
  },
  amazon: {
    name: 'Amazon.com.tr',
    searchUrl: (q) => `https://www.amazon.com.tr/s?k=${encodeURIComponent(q)}`,
    type: 'pazar-yeri',
  },
  etsy: {
    name: 'Etsy',
    searchUrl: (q) => `https://www.etsy.com/search?q=${encodeURIComponent(q)}`,
    type: 'global',
  },
};

// Web sayfas�ndan metin �ek
async function fetchText(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      },
    });
    clearTimeout(timeout);
    const text = await res.text();
    // HTML'i temizle, sadece g�r�n�r metinleri al
    return text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000);
  } catch (err) {
    return `Veri alınamadı: ${err.message}`;
  }
}

// Ara�t�rma endpoint'i
router.get('/:kategori', async (req, res) => {
  const kategori = req.params.kategori?.trim();
  if (!kategori || kategori.length < 2) {
    return res.status(400).json({ basarili: false, hata: 'En az 2 karakter girin' });
  }

  // Cache kontrol�
  const cacheKey = kategori.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.json({ basarili: true, kaynak: 'cache', zaman: new Date(cached.time).toISOString(), ...cached.data });
  }

  try {
    // Paralel platform taramas�
    const results = await Promise.allSettled(
      Object.entries(PLATFORMS).map(async ([key, platform]) => {
        const html = await fetchText(platform.searchUrl(kategori));
        // Fiyat ve �r�n bilgisi �ek
        const fiyatlar = (html.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(TL|₺)/g) || []).slice(0, 5);
        const puanlar = (html.match(/(\d+(?:,\d+)?)\s*\/\s*5/g) || []).slice(0, 3);
        const urunAdlari = (html.match(/[A-Z][^.]{10,80}(?:Tişört|T-Shirt|t-shirt|tişört|Telefon|Kulaklık|Ayakkabı|Pantolon|Çanta)/gi) || []).slice(0, 5);

        return {
          platform: platform.name,
          tip: platform.type,
          urunSayisi: urunAdlari.length > 0 ? `${urunAdlari.length}+ ürün bulundu` : 'Veri alınamadı',
          ornekUrunler: urunAdlari,
          fiyatBilgisi: fiyatlar.slice(0, 3),
          puanBilgisi: puanlar.slice(0, 3),
          not: html.length > 100 ? 'Sayfa başarıyla tarandı' : 'Sayfaya erişilemedi',
        };
      })
    );

    const platformSonuclari = {};
    results.forEach((r, i) => {
      const key = Object.keys(PLATFORMS)[i];
      platformSonuclari[key] = r.status === 'fulfilled' ? r.value : { platform: PLATFORMS[key].name, hata: r.reason?.message || 'Bilinmeyen hata' };
    });

    // Google Trends benzeri basit analiz
    const analiz = {
      toplamPlatform: Object.keys(PLATFORMS).length,
      basariliTarama: Object.values(platformSonuclari).filter(p => !p.hata).length,
      oneri: 'Daha detaylı analiz için skill\'i kullanın: "pazar araştırması [kategori]"',
    };

    const responseData = {
      kategori,
      zaman: new Date().toISOString(),
      platformlar: platformSonuclari,
      analiz,
    };

    // Cache'e kaydet
    cache.set(cacheKey, { time: Date.now(), data: responseData });

    res.json({ basarili: true, kaynak: 'canli', ...responseData });
  } catch (err) {
    res.status(500).json({ basarili: false, hata: 'Araştırma sırasında hata', detay: err.message });
  }
});

module.exports = router;
