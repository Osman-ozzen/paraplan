const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Veritabanı Seçimi ──────────────────────────────────────────────────
// SUPABASE_URL ve SUPABASE_SERVICE_KEY varsa Supabase kullan, yoksa JSON
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
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

// ─── JSON Metodları (fallback) ──────────────────────────────────────────
function getDefaultData() {
  return {
    kategoriler: [...DEFAULT_KATEGORILER],
    kayitlar: [], borclar: [], eticaret: [],
    sirketGider: [], aylikGiderler: [],
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
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch { return false; }
}

// ─── Tablo Adı Dönüşümü ──────────────────────────────────────────────────
// Frontend'deki isimlerle DB tablo isimlerini eşle
const BOLUM_TABLO = {
  kategoriler: 'kategoriler',
  kayitlar: 'kayitlar',
  borclar: 'borclar',
  eticaret: 'eticaret',
  sirketGider: 'sirket_gider',
  aylikGiderler: 'aylik_giderler',
};

function getTableName(bolum) {
  return BOLUM_TABLO[bolum] || bolum;
}

// ─── Supabase: Tüm Veriyi Oku ─────────────────────────────────────────
async function supabaseVeriOku() {
  const result = { kategoriler: [], kayitlar: [], borclar: [], eticaret: [], sirketGider: [], aylikGiderler: [] };

  for (const [key, table] of Object.entries(BOLUM_TABLO)) {
    const { data, error } = await supabase.from(table).select('*');
    if (!error && data) result[key] = data;
  }

  // Varsayılan kategorileri ekle (eğer boşsa)
  if (result.kategoriler.length === 0) {
    const { data: katData, error: katError } = await supabase
      .from('kategoriler')
      .upsert(DEFAULT_KATEGORILER, { onConflict: 'id' })
      .select();
    if (!katError && katData) result.kategoriler = katData;
  }

  return result;
}

// ─── Supabase: Bölüm Ekle ──────────────────────────────────────────────
async function supabaseBolumEkle(bolum, kayit) {
  const table = getTableName(bolum);
  const yeni = { ...kayit, id: kayit.id || idOlustur() };

  const { data, error } = await supabase.from(table).insert(yeni).select();
  if (error) throw error;
  return { basarili: true, [bolum]: data };
}

// ─── Supabase: Bölüm Güncelle ─────────────────────────────────────────
async function supabaseBolumGuncelle(bolum, id, kayit) {
  const table = getTableName(bolum);

  const { data, error } = await supabase.from(table).update(kayit).eq('id', id).select();
  if (error) throw error;
  return { basarili: data && data.length > 0, [bolum]: data || [] };
}

// ─── Supabase: Bölüm Sil ─────────────────────────────────────────────
async function supabaseBolumSil(bolum, id) {
  const table = getTableName(bolum);

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;

  // Silindikten sonra kalanları getir
  const { data } = await supabase.from(table).select('*');
  return { basarili: true, [bolum]: data || [] };
}

// ─── Supabase: Kategori Sil (ilişkili kayıtları da sil) ──────────────
async function supabaseKategoriSil(id) {
  // Kategoriye bağlı kayıtları sil
  await supabase.from('kayitlar').delete().eq('kategori_id', id);

  // Kategoriyi sil
  await supabase.from('kategoriler').delete().eq('id', id);

  // Kalan veriyi döndür
  const kategoriler = (await supabase.from('kategoriler').select('*')).data || [];
  const kayitlar = (await supabase.from('kayitlar').select('*')).data || [];

  return { basarili: true, kategoriler, kayitlar };
}

// ─── Servis: Statik Dosyalar (React build) ───────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

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

// ─── API: Veri Yazma (tümü, sadece JSON fallback) ─────────────────────
app.post('/api/veri', (req, res) => {
  if (useSupabase) {
    // Supabase'de toplu yazma yerine tekil CRUD kullan
    res.json({ basarili: true });
  } else {
    const basarili = jsonWriteData(req.body);
    res.json({ basarili });
  }
});

// ─── API: Bölüm Ekle ─────────────────────────────────────────────────────
app.post('/api/:bolum', async (req, res) => {
  const { bolum } = req.params;
  try {
    if (useSupabase) {
      const sonuc = await supabaseBolumEkle(bolum, req.body);
      res.json(sonuc);
    } else {
      const data = jsonReadData();
      if (!data[bolum]) data[bolum] = [];
      const yeni = { ...req.body, id: idOlustur() };
      data[bolum].push(yeni);
      jsonWriteData(data);
      res.json({ basarili: true, [bolum]: data[bolum] });
    }
  } catch (err) {
    console.error(`${bolum} ekleme hatası:`, err);
    res.status(500).json({ basarili: false, error: err.message });
  }
});

// ─── API: Bölüm Güncelle ────────────────────────────────────────────────
app.put('/api/:bolum/:id', async (req, res) => {
  const { bolum, id } = req.params;
  try {
    if (useSupabase) {
      const sonuc = await supabaseBolumGuncelle(bolum, id, req.body);
      res.json(sonuc);
    } else {
      const data = jsonReadData();
      const idx = (data[bolum] || []).findIndex(k => k.id === id);
      if (idx !== -1) {
        data[bolum][idx] = req.body;
        jsonWriteData(data);
        return res.json({ basarili: true, [bolum]: data[bolum] });
      }
      res.json({ basarili: false, [bolum]: data[bolum] || [] });
    }
  } catch (err) {
    console.error(`${bolum} güncelleme hatası:`, err);
    res.status(500).json({ basarili: false, error: err.message });
  }
});

// ─── API: Bölüm Sil ─────────────────────────────────────────────────────
app.delete('/api/:bolum/:id', async (req, res) => {
  const { bolum, id } = req.params;
  try {
    if (useSupabase) {
      const sonuc = await supabaseBolumSil(bolum, id);
      res.json(sonuc);
    } else {
      const data = jsonReadData();
      data[bolum] = (data[bolum] || []).filter(k => k.id !== id);
      jsonWriteData(data);
      res.json({ basarili: true, [bolum]: data[bolum] });
    }
  } catch (err) {
    console.error(`${bolum} silme hatası:`, err);
    res.status(500).json({ basarili: false, error: err.message });
  }
});

// ─── API: Kategori Sil (ilişkili kayıtları da sil) ───────────────────────
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
      jsonWriteData(data);
      res.json({ basarili: true, kategoriler: data.kategoriler, kayitlar: data.kayitlar });
    }
  } catch (err) {
    console.error('Kategori silme hatası:', err);
    res.status(500).json({ basarili: false, error: err.message });
  }
});

// ─── Tüm yolları React'e yönlendir ───────────────────────────────────────
app.get('/{*path}', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ mesaj: 'Bütçe Takip Sunucusu Çalışıyor', api: '/api/veri' });
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
  console.log('  💰 Bütçe Takip Sunucusu Çalışıyor');
  console.log('═══════════════════════════════════════════');
  console.log(`  📺 Bilgisayar: http://localhost:${PORT}`);
  console.log(`  📱 Telefon:    http://${ipAdresi}:${PORT}`);
  console.log(`  🔗 API:        http://localhost:${PORT}/api/veri`);
  if (useSupabase) {
    console.log('  🗄️  Supabase bağlı');
  } else {
    console.log('  🗄️  JSON dosya (SUPABASE_URL ayarla -> Supabase)');
  }
  console.log('═══════════════════════════════════════════\n');
});
