const express = require('express');
const router = express.Router();

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// DuckDuckGo HTML araması (daha açık)
async function ddgSearch(query, region = 'tr-tr') {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=${region}`;
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const html = await res.text();
    const results = [];
    const regex = /class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/(?:td|div)/g;
    let match;
    while ((match = regex.exec(html)) !== null && results.length < 8) {
      let link = match[1];
      try { link = new URL(link, 'https://duckduckgo.com').searchParams.get('uddg') || link; } catch {}
      results.push({
        link,
        title: match[2].replace(/<[^>]+>/g, '').trim(),
        snippet: match[3].replace(/<[^>]+>/g, '').trim(),
      });
    }
    return results;
  } catch { return []; }
}

// Fiyat bilgisi çıkar
function extractPrices(text) {
  const prices = [...text.matchAll(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(TL|₺|TRY|USD|\$|€)/gi)];
  const nums = prices.map(p => parseFloat(p[1].replace('.', '').replace(',', '.'))).filter(n => n > 0 && n < 100000);
  return {
    min: nums.length ? Math.min(...nums) : null,
    max: nums.length ? Math.max(...nums) : null,
    avg: nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null,
    count: nums.length,
  };
}

// Ana araştırma endpoint'i
router.get('/:kategori', async (req, res) => {
  const kategori = req.params.kategori?.trim();
  if (!kategori || kategori.length < 2) {
    return res.status(400).json({ basarili: false, hata: 'En az 2 karakter girin' });
  }

  const cacheKey = kategori.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.json({ basarili: true, kaynak: 'cache', ...cached.data });
  }

  try {
    // Paralel aramalar - farklı açılardan veri topla
    const [pazarVerisi, fiyatVerisi, trendVerisi, rekabetVerisi, seoVerisi] = await Promise.all([
      ddgSearch(`${kategori} e-ticaret satış verileri 2026 popüler ürün`),
      ddgSearch(`${kategori} fiyat analizi ortalama fiyat aralığı TL`),
      ddgSearch(`${kategori} trend yükselen 2026 google trends`),
      ddgSearch(`${kategori} rekabet分析 pazar payı en çok satan marka`),
      ddgSearch(`${kategori} seo anahtar kelime arama hacmi`),
    ]);

    // Platform arama linkleri
    const platformlar = {
      trendyol: {
        ad: 'Trendyol',
        icon: '🛍️',
        renk: '#8B5CF6',
        tip: 'Pazar Yeri (#1)',
        link: `https://www.trendyol.com/sr?q=${encodeURIComponent(kategori)}`,
        pay: '%35-38',
        komisyon: '%19-22',
        not: 'Moda/giyimde lider. 45M+ kullanıcı.',
        guclu: 'Moda, kozmetik, ev & yaşam',
        zayif: 'Elektronikte daha düşük',
      },
      hepsiburada: {
        ad: 'Hepsiburada',
        icon: '🏪',
        renk: '#10B981',
        tip: 'Pazar Yeri (#2)',
        link: `https://www.hepsiburada.com/ara?q=${encodeURIComponent(kategori)}`,
        pay: '%18-20',
        komisyon: '%14-18',
        not: 'Elektronik ve beyaz eşyada lider.',
        guclu: 'Elektronik, beyaz eşya, yüksek sepet',
        zayif: 'Moda pazarında düşük',
      },
      amazon: {
        ad: 'Amazon.com.tr',
        icon: '📦',
        renk: '#F59E0B',
        tip: 'Pazar Yeri (#3)',
        link: `https://www.amazon.com.tr/s?k=${encodeURIComponent(kategori)}`,
        pay: '%7-15',
        komisyon: '%8-15',
        not: 'En düşük komisyon. Global satış imkanı.',
        guclu: 'Kitap, elektronik, global markalar',
        zayif: 'Yerel marka bilinirliği düşük',
      },
      etsy: {
        ad: 'Etsy',
        icon: '🎨',
        renk: '#EC4899',
        tip: 'Global El Yapımı',
        link: `https://www.etsy.com/search?q=${encodeURIComponent(kategori)}`,
        pay: 'Global 80M+ alıcı',
        komisyon: '%6.5 + %3',
        not: 'Özel tasarım ve el yapımı ürünlerde güçlü.',
        guclu: 'Niş ürünler, özel tasarım, vintage',
        zayif: 'Toplu üretim için uygun değil',
      },
      n11: {
        ad: 'N11',
        icon: '🎯',
        renk: '#6366F1',
        tip: 'Pazar Yeri (#4)',
        link: `https://www.n11.com/arama?q=${encodeURIComponent(kategori)}`,
        pay: '%8',
        komisyon: '%12-17',
        not: 'Butik ve niş ürünlerde güçlü.',
        guclu: 'Hobi, bahçe, oto aksesuar, butik',
        zayif: 'Genel pazar payı düşük',
      },
      cimri: {
        ad: 'Cimri',
        icon: '💲',
        renk: '#FF6B35',
        tip: 'Fiyat Karşıl.',
        link: `https://www.cimri.com/arama?q=${encodeURIComponent(kategori)}`,
        pay: '10M+ aylık',
        komisyon: '-',
        not: 'Fiyat karşılaştırması. Rekabet analizi için ideal.',
        guclu: 'Fiyat analizi, tüketici davranışı',
        zayif: 'Doğrudan satış platformu değil',
      },
      google: {
        ad: 'Google Alışveriş',
        icon: '🔍',
        renk: '#4285F4',
        tip: 'Arama Motoru',
        link: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(kategori)}`,
        pay: 'En geniş kitle',
        komisyon: '-',
        not: 'SEO ve SEM ile görünürlük kritik.',
        guclu: 'Trafik kaynağı, görünürlük',
        zayif: 'Doğrudan satış değil',
      },
      instagram: {
        ad: 'Instagram',
        icon: '📸',
        renk: '#E1306C',
        tip: 'Sosyal Ticaret',
        link: `https://www.instagram.com/explore/tags/${encodeURIComponent(kategori.replace(/\s+/g, ''))}/`,
        pay: '%70 ürün araştırması',
        komisyon: 'DM satışı',
        not: "Türkiye'de en güçlü sosyal ticaret kanalı.",
        guclu: 'Marka bilinirliği, görsel satış',
        zayif: 'Uygulama içi ödeme desteklenmiyor',
      },
    };

    // Sonuçları derle
    const tumSonuclar = [...pazarVerisi, ...fiyatVerisi, ...trendVerisi, ...rekabetVerisi, ...seoVerisi];
    const toplamFiyat = tumSonuclar.reduce((acc, r) => {
      const f = extractPrices(r.title + ' ' + r.snippet);
      if (f.count > 0) {
        acc.fiyatlar.push(...r.snippet.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(TL|₺|TRY|USD|\$|€)/gi) || []);
        acc.min = acc.min ? Math.min(acc.min, f.min) : f.min;
        acc.max = acc.max ? Math.max(acc.max, f.max) : f.max;
        acc.toplam += f.count;
      }
      return acc;
    }, { fiyatlar: [], min: null, max: null, toplam: 0 });

    const responseData = {
      kategori,
      zaman: new Date().toISOString(),
      platformlar,
      aramaSonuclari: {
        pazar: pazarVerisi.slice(0, 5),
        fiyat: fiyatVerisi.slice(0, 5),
        trend: trendVerisi.slice(0, 5),
        rekabet: rekabetVerisi.slice(0, 5),
        seo: seoVerisi.slice(0, 5),
      },
      fiyatAnalizi: {
        min: toplamFiyat.min,
        max: toplamFiyat.max,
        bulunanKaynak: toplamFiyat.toplam,
      },
      platformSayisi: Object.keys(platformlar).length,
    };

    cache.set(cacheKey, { time: Date.now(), data: responseData });
    res.json({ basarili: true, kaynak: 'canli', ...responseData });
  } catch (err) {
    res.status(500).json({ basarili: false, hata: 'Araştırma hatası', detay: err.message });
  }
});

module.exports = router;
