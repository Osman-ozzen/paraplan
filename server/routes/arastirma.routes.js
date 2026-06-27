const express = require('express');
const router = express.Router();

const cache = new Map();
const CACHE_TTL = 3 * 60 * 1000;

const PLATFORMS = {
  trendyol: {
    name: 'Trendyol',
    url: (q) => `https://www.trendyol.com/sr?q=${encodeURIComponent(q)}`,
    searchUrl: (q) => `https://www.trendyol.com/sr?q=${encodeURIComponent(q)}`,
    icon: '🛍️',
    type: 'pazar-yeri',
  },
  hepsiburada: {
    name: 'Hepsiburada',
    url: (q) => `https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}`,
    searchUrl: (q) => `https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}`,
    icon: '🏪',
    type: 'pazar-yeri',
  },
  amazon: {
    name: 'Amazon.com.tr',
    url: (q) => `https://www.amazon.com.tr/s?k=${encodeURIComponent(q)}`,
    searchUrl: (q) => `https://www.amazon.com.tr/s?k=${encodeURIComponent(q)}`,
    icon: '📦',
    type: 'pazar-yeri',
  },
  etsy: {
    name: 'Etsy',
    url: (q) => `https://www.etsy.com/search?q=${encodeURIComponent(q)}`,
    searchUrl: (q) => `https://www.etsy.com/search?q=${encodeURIComponent(q)}`,
    icon: '🎨',
    type: 'global',
  },
  google: {
    name: 'Google Alışveriş',
    url: (q) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`,
    searchUrl: (q) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`,
    icon: '🔍',
    type: 'arama',
  },
  cimri: {
    name: 'Cimri',
    url: (q) => `https://www.cimri.com/arama?q=${encodeURIComponent(q)}`,
    searchUrl: (q) => `https://www.cimri.com/arama?q=${encodeURIComponent(q)}`,
    icon: '💲',
    type: 'fiyat-karsilastirma',
  },
};

async function searchPlatform(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'tr-TR,tr;q=0.9',
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return { basarili: false, mesaj: `HTTP ${res.status}` };
    const text = await res.text();
    const clean = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Ürün adı benzeri kalıpları bul
    const urunler = [];
    const urunPatterns = [
      ...clean.matchAll(/[A-ZÖÜİĞŞÇ][A-Za-zÖÜİĞŞÇ0-9\s\-_,.]{8,60}(?:Tişört|T-Shirt|Telefon|Kulaklık|Ayakkabı|Çanta|Saat|Pantolon|Kazak|Ceket|Mont|Elbise|Gömlek|Şort|Sweat|Hoodie)/g)
    ];
    for (const m of urunPatterns.slice(0, 5)) {
      urunler.push(m[0].trim());
    }
    // Fiyat kalıpları
    const fiyatlar = [...new Set([...clean.matchAll(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(TL|₺)/g)].map(m => m[0]).slice(0, 3))];
    // Puan kalıpları
    const puanlar = [...new Set([...clean.matchAll(/(\d+(?:,\d+)?)\s*\/\s*5/g)].map(m => m[0]).slice(0, 2))];
    return {
      basarili: true,
      urunSayisi: urunler.length > 0 ? `${urunler.length}+ ürün` : 'Sayfa tarandı',
      ornekUrunler: urunler,
      fiyatlar: fiyatlar,
      puanlar: puanlar,
    };
  } catch (err) {
    return { basarili: false, mesaj: err.message };
  }
}

// GET /api/arastirma/:kategori
router.get('/:kategori', async (req, res) => {
  const kategori = req.params.kategori?.trim();
  if (!kategori || kategori.length < 2) {
    return res.status(400).json({ basarili: false, hata: 'En az 2 karakter girin' });
  }
  const cacheKey = kategori.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.json({ basarili: true, kaynak: 'cache', zaman: new Date(cached.time).toISOString(), ...cached.data });
  }
  try {
    const results = await Promise.allSettled(
      Object.entries(PLATFORMS).map(async ([key, platform]) => {
        const data = await searchPlatform(platform.searchUrl(kategori));
        return { key, ...platform, data };
      })
    );
    const platformlar = {};
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        const p = r.value;
        platformlar[p.key] = {
          ad: p.name,
          icon: p.icon,
          tip: p.type,
          link: p.url(kategori),
          ...p.data,
        };
      }
    });
    // Cache'e kaydet
    const responseData = {
      kategori,
      zaman: new Date().toISOString(),
      toplamPlatform: Object.keys(PLATFORMS).length,
      platformlar,
      analiz: {
        mesaj: 'Her platform için doğrudan arama linki kullanabilirsiniz.',
        ipucu: 'Daha derin analiz için AI skill kullanın: "pazar araştırması [kategori]"',
      },
    };
    cache.set(cacheKey, { time: Date.now(), data: responseData });
    res.json({ basarili: true, kaynak: 'canli', ...responseData });
  } catch (err) {
    res.status(500).json({ basarili: false, hata: 'Araştırma hatası', detay: err.message });
  }
});

module.exports = router;
