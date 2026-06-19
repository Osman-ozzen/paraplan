const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS (sadece yerel kaynaklar) ────────────────────────────────────────
const CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:4173',
  'capacitor://localhost',
  'ionic://localhost',
];
app.use(cors({
  origin: (origin, cb) => {
    // originsiz isteklere izin ver (curl, mobile app)
    if (!origin || CORS_ORIGINS.some(o => origin.startsWith(o))) {
      cb(null, true);
    } else {
      cb(null, true); // geliştirme modunda herkese açık, prod'da kısıtla
    }
  },
}));

// ─── Body Parse ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ─── Rate Limiting ───────────────────────────────────────────────────────
let rateLimit = null;
try {
  rateLimit = require('express-rate-limit');
} catch { /* optional dependency */ }

if (rateLimit) {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Çok fazla istek, lütfen bekleyin.' },
  });
  app.use('/api', apiLimiter);
}

// ─── Veritabanı Seçimi ──────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const useSupabase = !!(SUPABASE_URL && SUPABASE_KEY);

let supabase = null;
if (useSupabase) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  console.log('  🗄️  Veritabanı: Supabase');
} else {
  console.log('  🗄️  Veritabanı: JSON (yerel dosya)');
}

// ─── JSON Veri Yolu (fallback) ──────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_PATH = path.join(DATA_DIR, 'butce-verisi.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── Varsayılan Kategoriler ──────────────────────────────────────────────
const DEFAULT_KATEGORILER = [
  { id: 'gelir-maas', ad: 'Maaş', tur: 'gelir' },
  { id: 'gelir-serbest', ad: 'Serbest Çalışma', tur: 'gelir' },
  { id: 'gelir-yatirim', ad: 'Yatırım / Kira', tur: 'gelir' },
  { id: 'gelir-diger', ad: 'Diğer Gelir', tur: 'gelir' },
  { id: 'gider-kira', ad: 'Kira / Konut', tur: 'gider' },
  { id: 'gider-fatura', ad: 'Faturalar', tur: 'gider' },
  { id: 'gider-market', ad: 'Market / Gıda', tur: 'gider' },
  { id: 'gider-ulasim', ad: 'Ulaşım', tur: 'gider' },
  { id: 'gider-eglence', ad: 'Eğlence / Hobi', tur: 'gider' },
  { id: 'gider-saglik', ad: 'Sağlık', tur: 'gider' },
  { id: 'gider-egitim', ad: 'Eğitim', tur: 'gider' },
  { id: 'gider-giyim', ad: 'Giyim', tur: 'gider' },
  { id: 'gider-diger', ad: 'Diğer Gider', tur: 'gider' },
];

// ─── ID Oluşturucu ────────────────────────────────────────────────────────
function idOlustur() {
  try {
    return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
  }
}

// ─── Geçerli Bölümler ──────────────────────────────────────────────────────
const GECERLI_BOLUMLER = ['kategoriler', 'kayitlar', 'borclar', 'eticaret', 'sirketGider', 'aylikGiderler', 'hedefler'];

const BOLUM_TABLO = {
  kategoriler: 'kategoriler',
  kayitlar: 'kayitlar',
  borclar: 'borclar',
  eticaret: 'eticaret',
  sirketGider: 'sirket_gider',
  aylikGiderler: 'aylik_giderler',
  hedefler: 'hedefler',
};

function getTableName(bolum) {
  if (!GECERLI_BOLUMLER.includes(bolum)) {
    throw new Error(`Geçersiz bölüm: ${bolum}`);
  }
  return BOLUM_TABLO[bolum] || bolum;
}

// ─── Alan Adı Dönüşümü (camelCase ↔ snake_case) ─────────────────────────
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeys(obj, converter) {
  if (Array.isArray(obj)) return obj.map(item => convertKeys(item, converter));
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, val]) => [
        converter(key),
        val && typeof val === 'object' ? convertKeys(val, converter) : val,
      ])
    );
  }
  return obj;
}

// ─── Input Validasyonu ────────────────────────────────────────────────────
function validateKayit(body, bolum) {
  const errors = [];
  if (body.tutar !== undefined && isNaN(Number(body.tutar))) {
    errors.push('Tutar geçerli bir sayı olmalıdır.');
  }
  if (body.tur && !['gelir', 'gider'].includes(body.tur)) {
    errors.push('Tur yalnızca "gelir" veya "gider" olabilir.');
  }
  if (body.durum && !['odendi', 'odenmedi', 'devam', 'tamamlandi'].includes(body.durum)) {
    errors.push('Geçersiz durum değeri.');
  }
  if (body.tarih && isNaN(Date.parse(body.tarih))) {
    errors.push('Tarih geçerli bir tarih formatında olmalıdır.');
  }
  return errors;
}

// ─── JSON Metodları (fallback) ──────────────────────────────────────────
function getDefaultData() {
  return {
    kategoriler: [...DEFAULT_KATEGORILER],
    kayitlar: [], borclar: [], eticaret: [],
    sirketGider: [], aylikGiderler: [], hedefler: [],
  };
}

function jsonReadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    }
    return getDefaultData();
  } catch { return getDefaultData(); }
}

function jsonWriteData(data) {
  try {
    // Atomik yazma: önce yedek, sonra yaz
    if (fs.existsSync(DATA_PATH)) {
      fs.copyFileSync(DATA_PATH, DATA_PATH + '.bak');
    }
    fs.writeFileSync(DATA_PATH + '.tmp', JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(DATA_PATH + '.tmp', DATA_PATH);
    return true;
  } catch (err) {
    console.error('Veri yazma hatası:', err);
    // Hata durumunda yedeği geri yüklemeyi dene
    try {
      if (fs.existsSync(DATA_PATH + '.bak') && !fs.existsSync(DATA_PATH)) {
        fs.copyFileSync(DATA_PATH + '.bak', DATA_PATH);
      }
    } catch {}
    return false;
  }
}

// ─── Supabase: Tüm Veriyi Oku (🐛 FIX: hedefler eklendi) ─────────────
async function supabaseVeriOku() {
  const result = {};

  for (const [key, table] of Object.entries(BOLUM_TABLO)) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (!error && data) {
        // Snake_case'den camelCase'e dönüştür
        result[key] = convertKeys(data, toCamelCase);
      } else {
        result[key] = [];
      }
    } catch {
      result[key] = [];
    }
  }

  // Varsayılan kategorileri ekle (eğer boşsa)
  if (!result.kategoriler || result.kategoriler.length === 0) {
    try {
      const { data: katData, error: katError } = await supabase
        .from('kategoriler')
        .upsert(convertKeys(DEFAULT_KATEGORILER, toSnakeCase), { onConflict: 'id' })
        .select();
      if (!katError && katData) result.kategoriler = convertKeys(katData, toCamelCase);
    } catch {}
  }

  if (!result.kategoriler) result.kategoriler = [...DEFAULT_KATEGORILER];
  return result;
}

// ─── Supabase: Bölüm Ekle ──────────────────────────────────────────────
async function supabaseBolumEkle(bolum, kayit) {
  const table = getTableName(bolum);
  const yeni = { ...convertKeys(kayit, toSnakeCase), id: kayit.id || idOlustur() };

  const { data, error } = await supabase.from(table).insert(yeni).select();
  if (error) throw error;
  return { basarili: true, [bolum]: convertKeys(data || [], toCamelCase) };
}

// ─── Supabase: Bölüm Güncelle ─────────────────────────────────────────
async function supabaseBolumGuncelle(bolum, id, kayit) {
  const table = getTableName(bolum);
  const guncel = convertKeys(kayit, toSnakeCase);

  const { data, error } = await supabase.from(table).update(guncel).eq('id', id).select();
  if (error) throw error;
  return { basarili: data && data.length > 0, [bolum]: convertKeys(data || [], toCamelCase) };
}

// ─── Supabase: Bölüm Sil ─────────────────────────────────────────────
async function supabaseBolumSil(bolum, id) {
  const table = getTableName(bolum);

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;

  const { data } = await supabase.from(table).select('*');
  return { basarili: true, [bolum]: convertKeys(data || [], toCamelCase) };
}

// ─── Supabase: Kategori Sil ───────────────────────────────────────────
async function supabaseKategoriSil(id) {
  await supabase.from('kayitlar').delete().eq('kategori_id', id);
  await supabase.from('kategoriler').delete().eq('id', id);

  const kategoriler = (await supabase.from('kategoriler').select('*')).data || [];
  const kayitlar = (await supabase.from('kayitlar').select('*')).data || [];

  return { basarili: true, kategoriler: convertKeys(kategoriler, toCamelCase), kayitlar: convertKeys(kayitlar, toCamelCase) };
}

// ─── Servis: Statik Dosyalar ───────────────────────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ─── Health Check ───────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), uptime: process.uptime() });
});

// ─── API: Veri Okuma ─────────────────────────────────────────────────────
app.get('/api/veri', async (req, res) => {
  try {
    if (useSupabase) {
      const data = await supabaseVeriOku();
      res.json(data);
    } else {
      res.json(jsonReadData());
    }
  } catch (err) {
    console.error('Veri okuma hatası:', err);
    res.status(500).json({ error: 'Veri okunamadı' });
  }
});

// ─── API: Veri Yazma ────────────────────────────────────────────────────
app.post('/api/veri', (req, res) => {
  if (useSupabase) {
    res.json({ basarili: true });
  } else {
    const basarili = jsonWriteData(req.body);
    res.json({ basarili });
  }
});

// ─── API: Bölüm Ekle ─────────────────────────────────────────────────────
app.post('/api/:bolum', async (req, res) => {
  const { bolum } = req.params;

  // Validasyon
  if (!GECERLI_BOLUMLER.includes(bolum)) {
    return res.status(400).json({ basarili: false, error: `Geçersiz bölüm: ${bolum}` });
  }
  const hatalar = validateKayit(req.body, bolum);
  if (hatalar.length > 0) {
    return res.status(400).json({ basarili: false, error: hatalar.join(' ') });
  }

  try {
    if (useSupabase) {
      const sonuc = await supabaseBolumEkle(bolum, req.body);
      res.json(sonuc);
    } else {
      const data = jsonReadData();
      if (!data[bolum]) data[bolum] = [];
      const yeni = { ...req.body, id: idOlustur() };
      data[bolum].push(yeni);
      const yazildi = jsonWriteData(data);
      res.json({ basarili: yazildi, [bolum]: data[bolum] });
    }
  } catch (err) {
    console.error(`${bolum} ekleme hatası:`, err);
    res.status(500).json({ basarili: false, error: 'Veri eklenemedi' });
  }
});

// ─── API: Bölüm Güncelle ────────────────────────────────────────────────
app.put('/api/:bolum/:id', async (req, res) => {
  const { bolum, id } = req.params;

  if (!GECERLI_BOLUMLER.includes(bolum)) {
    return res.status(400).json({ basarili: false, error: `Geçersiz bölüm: ${bolum}` });
  }

  try {
    if (useSupabase) {
      const sonuc = await supabaseBolumGuncelle(bolum, id, req.body);
      res.json(sonuc);
    } else {
      const data = jsonReadData();
      const idx = (data[bolum] || []).findIndex(k => k.id === id);
      if (idx !== -1) {
        data[bolum][idx] = { ...data[bolum][idx], ...req.body };
        const yazildi = jsonWriteData(data);
        return res.json({ basarili: yazildi, [bolum]: data[bolum] });
      }
      res.json({ basarili: false, [bolum]: data[bolum] || [] });
    }
  } catch (err) {
    console.error(`${bolum} güncelleme hatası:`, err);
    res.status(500).json({ basarili: false, error: 'Veri güncellenemedi' });
  }
});

// ─── API: Bölüm Sil ─────────────────────────────────────────────────────
app.delete('/api/:bolum/:id', async (req, res) => {
  const { bolum, id } = req.params;

  if (!GECERLI_BOLUMLER.includes(bolum)) {
    return res.status(400).json({ basarili: false, error: `Geçersiz bölüm: ${bolum}` });
  }

  try {
    if (useSupabase) {
      const sonuc = await supabaseBolumSil(bolum, id);
      res.json(sonuc);
    } else {
      const data = jsonReadData();
      data[bolum] = (data[bolum] || []).filter(k => k.id !== id);
      const yazildi = jsonWriteData(data);
      res.json({ basarili: yazildi, [bolum]: data[bolum] });
    }
  } catch (err) {
    console.error(`${bolum} silme hatası:`, err);
    res.status(500).json({ basarili: false, error: 'Veri silinemedi' });
  }
});

// ─── API: Kategori Sil ───────────────────────────────────────────────────
app.delete('/api/kategori/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (useSupabase) {
      const sonuc = await supabaseKategoriSil(id);
      res.json(sonuc);
    } else {
      const data = jsonReadData();
      data.kategoriler = data.kategoriler.filter(k => k.id !== id);
      data.kayitlar = data.kayitlar.filter(k => k.kategoriId !== id);
      const yazildi = jsonWriteData(data);
      res.json({ basarili: yazildi, kategoriler: data.kategoriler, kayitlar: data.kayitlar });
    }
  } catch (err) {
    console.error('Kategori silme hatası:', err);
    res.status(500).json({ basarili: false, error: 'Kategori silinemedi' });
  }
});

// ─── Tüm yolları React'e yönlendir ───────────────────────────────────────
app.get('/{*path}', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ mesaj: 'ParaPlan Sunucusu Çalışıyor', api: '/api/veri', health: '/health' });
  }
});

// ─── Ağ Bilgisi ───────────────────────────────────────────────────────────
const networks = os.networkInterfaces();
let ipAdresi = 'localhost';
Object.keys(networks).forEach((iface) => {
  networks[iface].forEach((details) => {
    if (details.family === 'IPv4' && !details.internal) {
      ipAdresi = details.address;
    }
  });
});

// ─── Başlat ───────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n═══════════════════════════════════════════');
  console.log('  💰 ParaPlan Sunucusu Çalışıyor');
  console.log('═══════════════════════════════════════════');
  console.log(`  📺 Bilgisayar: http://localhost:${PORT}`);
  console.log(`  📱 Telefon:    http://${ipAdresi}:${PORT}`);
  console.log(`  🔗 API:        http://localhost:${PORT}/api/veri`);
  console.log(`  ❤️  Sağlık:     http://localhost:${PORT}/health`);
  if (useSupabase) {
    console.log('  🗄️  Supabase bağlı (camelCase ↔ snake_case dönüşümü aktif)');
  } else {
    console.log('  🗄️  JSON dosya (atomik yazma + yedekleme aktif)');
  }
  console.log('═══════════════════════════════════════════\n');
});
