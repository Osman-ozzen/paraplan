const express = require('express');
const router = express.Router();

const cache = new Map();
const CACHE_TTL = 3 * 60 * 1000;

const PLATFORMS = {
  trendyol: {
    name: 'Trendyol',
    icon: '🛍️',
    type: 'pazar-yeri',
    url: (q) => `https://www.trendyol.com/sr?q=${encodeURIComponent(q)}`,
  },
  hepsiburada: {
    name: 'Hepsiburada',
    icon: '🏪',
    type: 'pazar-yeri',
    url: (q) => `https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}`,
  },
  amazon: {
    name: 'Amazon.com.tr',
    icon: '📦',
    type: 'pazar-yeri',
    url: (q) => `https://www.amazon.com.tr/s?k=${encodeURIComponent(q)}`,
  },
  etsy: {
    name: 'Etsy',
    icon: '🎨',
    type: 'global',
    url: (q) => `https://www.etsy.com/search?q=${encodeURIComponent(q)}`,
  },
  google: {
    name: 'Google Alışveriş',
    icon: '🔍',
    type: 'arama',
    url: (q) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`,
  },
  cimri: {
    name: 'Cimri',
    icon: '💲',
    type: 'fiyat',
    url: (q) => `https://www.cimri.com/arama?q=${encodeURIComponent(q)}`,
  },
};

function extractStructuredData(html) {
  const result = { urunler: [], fiyatlar: [], puanlar: [], toplamUrun: 0, kategori: '' };

  // 1. JSON-LD verisi
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const match of jsonLdMatches) {
    try {
      const jsonStr = match.replace(/<\/?script[^>]*>/gi, '');
      const data = JSON.parse(jsonStr);

      if (data['@type'] === 'Product' && data.name) {
        result.urunler.push({
          ad: data.name,
          fiyat: data.offers?.price || data.offers?.lowPrice || '',
          paraBirimi: data.offers?.priceCurrency || 'TRY',
          puan: data.aggregateRating?.ratingValue || '',
          yorumSayisi: data.aggregateRating?.reviewCount || '',
          gorsel: data.image || '',
          marka: data.brand?.name || '',
          link: data.url || '',
        });
      }
      if (data['@type'] === 'ItemList' && data.itemListElement) {
        result.toplamUrun = parseInt(data.numberOfItems) || data.itemListElement.length;
        for (const item of data.itemListElement) {
          if (item.item && item.item.name) {
            result.urunler.push({
              ad: item.item.name,
              fiyat: item.item.offers?.price || '',
              paraBirimi: item.item.offers?.priceCurrency || '',
              puan: item.item.aggregateRating?.ratingValue || '',
              gorsel: item.item.image?.[0] || item.item.image || '',
              link: item.item.url || '',
            });
          }
        }
      }
      if (data['@type'] === 'BreadcrumbList' && data.itemListElement) {
        const last = data.itemListElement[data.itemListElement.length - 1];
        if (last?.name) result.kategori = last.name;
      }
    } catch {}
  }

  // 2. Meta description'dan ürün bilgisi
  if (result.urunler.length === 0) {
    const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
    if (metaDesc?.[1]) {
      const desc = metaDesc[1];
      const urunSayisi = desc.match(/(\d+)\+?\s*(ürün|sonuç|ürün bulundu|sonuç bulundu)/i);
      if (urunSayisi) result.toplamUrun = parseInt(urunSayisi[1]);
    }
  }

  // 3. Sayfa içeriğinden fiyat ara
  if (result.fiyatlar.length === 0) {
    const fiyatMatches = [...new Set([
      ...html.matchAll(/(?:price|fiyat|Price)["\s:]*(?:["\s:]*)(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:TL|₺|TRY|USD|\$)/gi),
      ...html.matchAll(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:TL|₺|TRY)/g),
    ].flat())].slice(0, 5);
    result.fiyatlar = fiyatMatches.map(m => m[0] || m[1]).filter(Boolean);
  }

  // 4. Toplam ürün sayısı
  if (!result.toplamUrun) {
    const sayi = html.match(/(\d{2,})\+?\s*(ürün|sonuç|sonuç|product|result)/i);
    if (sayi) result.toplamUrun = parseInt(sayi[1]);
  }

  // 5. Kategori bilgisi (title'dan)
  if (!result.kategori) {
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (title?.[1]) {
      const cleanTitle = title[1].replace(/\s*[-|–|]\s*(Trendyol|Hepsiburada|Amazon|Etsy).*$/i, '').trim();
      result.kategori = cleanTitle;
    }
  }

  result.urunler = result.urunler.slice(0, 8);
  return result;
}

async function fetchPage(url) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'identity',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

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
    const entries = Object.entries(PLATFORMS);
    const results = await Promise.allSettled(
      entries.map(async ([key, platform]) => {
        const html = await fetchPage(platform.url(kategori));
        if (!html) return { key, platform, data: { durum: 'erişilemedi', urunler: [] } };
        const parsed = extractStructuredData(html);
        return { key, platform, data: parsed };
      })
    );

    const platformlar = {};
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        const { key, platform, data } = r.value;
        const urunler = data.urunler.map(u => ({
          ad: u.ad,
          fiyat: u.fiyat ? `${u.fiyat} ${u.paraBirimi || ''}`.trim() : null,
          puan: u.puan || null,
          yorumSayisi: u.yorumSayisi || null,
          gorsel: u.gorsel || null,
          marka: u.marka || null,
          link: u.link || platform.url(kategori),
        }));

        platformlar[key] = {
          ad: platform.name,
          icon: platform.icon,
          tip: platform.type,
          link: platform.url(kategori),
          durum: urunler.length > 0 ? 'bulundu' : (data.durum || 'bulunamadı'),
          toplamUrun: data.toplamUrun || urunler.length || 0,
          kategori: data.kategori || '',
          urunler: urunler,
          fiyatlar: data.fiyatlar || [],
        };
      }
    });

    const responseData = {
      kategori,
      zaman: new Date().toISOString(),
      toplamPlatform: entries.length,
      bulunanPlatform: Object.values(platformlar).filter(p => p.durum === 'bulundu').length,
      platformlar,
    };
    cache.set(cacheKey, { time: Date.now(), data: responseData });
    res.json({ basarili: true, kaynak: 'canli', ...responseData });
  } catch (err) {
    res.status(500).json({ basarili: false, hata: 'Araştırma hatası', detay: err.message });
  }
});

module.exports = router;
