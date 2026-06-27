const express = require('express');
const router = express.Router();
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

async function ddg(query) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=tr-tr`, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    clearTimeout(t);
    if (!r.ok) return [];
    const h = await r.text();
    const res = [];
    const re = /class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/(?:td|div)/g;
    let m;
    while ((m = re.exec(h)) !== null && res.length < 6) {
      let link = m[1];
      try { link = new URL(link, 'https://duckduckgo.com').searchParams.get('uddg') || link; } catch {}
      res.push({ link, title: m[2].replace(/<[^>]+>/g, '').trim(), snippet: m[3].replace(/<[^>]+>/g, '').trim() });
    }
    return res;
  } catch { return []; }
}

router.get('/:kategori', async (req, res) => {
  const kategori = req.params.kategori?.trim();
  if (!kategori || kategori.length < 2) return res.status(400).json({ basarili: false, hata: 'En az 2 karakter' });
  const ck = kategori.toLowerCase();
  const c = cache.get(ck);
  if (c && Date.now() - c.t < CACHE_TTL) return res.json({ basarili: true, kaynak: 'cache', ...c.d });
  try {
    const [pazar, trend, global, tasarim, fiyat, platform] = await Promise.all([
      ddg(`${kategori} en çok satan baskı model 2026`),
      ddg(`${kategori} trend yükselen tasarım baskı popüler`),
      ddg(`best selling ${kategori} print designs 2026`),
      ddg(`${kategori} baskı türleri minimalist vintage typografi`),
      ddg(`${kategori} fiyat aralığı satış ortalaması TL`),
      ddg(`${kategori} Trendyol Etsy Instagram satış verisi`),
    ]);
    const responseData = {
      kategori, zaman: new Date().toISOString(),
      sonuclar: { pazar: pazar.slice(0,5), trend: trend.slice(0,5), global: global.slice(0,5), tasarim: tasarim.slice(0,5), fiyat: fiyat.slice(0,5), platform: platform.slice(0,5) },
      toplamSonuc: [...pazar,...trend,...global,...tasarim,...fiyat,...platform].length,
    };
    cache.set(ck, { t: Date.now(), d: responseData });
    res.json({ basarili: true, kaynak: 'canli', ...responseData });
  } catch (err) { res.status(500).json({ basarili: false, hata: err.message }); }
});
module.exports = router;
