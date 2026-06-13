const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Veri Yolu ────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_PATH = path.join(DATA_DIR, 'butce-verisi.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── Varsayılan Veri ──────────────────────────────────────────────────────
const getDefaultData = () => ({
  kategoriler: [
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
  ],
  kayitlar: [],
  borclar: [],
  eticaret: [],
  sirketGider: [],
  vergiKdv: [],
});

// ─── Veri Okuma / Yazma ───────────────────────────────────────────────────
function readData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    }
    return getDefaultData();
  } catch { return getDefaultData(); }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch { return false; }
}

// ─── ID Oluşturucu ────────────────────────────────────────────────────────
function idOlustur() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

// ─── Servis: Statik Dosyalar (React build) ───────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ─── API: Veri Okuma ─────────────────────────────────────────────────────
app.get('/api/veri', (req, res) => {
  res.json(readData());
});

// ─── API: Veri Yazma (tümü) ──────────────────────────────────────────────
app.post('/api/veri', (req, res) => {
  const basarili = writeData(req.body);
  res.json({ basarili });
});

// ─── API: Bölüm Ekle ─────────────────────────────────────────────────────
app.post('/api/:bolum', (req, res) => {
  const { bolum } = req.params;
  const data = readData();
  if (!data[bolum]) data[bolum] = [];
  const yeni = { ...req.body, id: idOlustur() };
  data[bolum].push(yeni);
  const basarili = writeData(data);
  res.json({ basarili, [bolum]: data[bolum] });
});

// ─── API: Bölüm Güncelle ─────────────────────────────────────────────────
app.put('/api/:bolum/:id', (req, res) => {
  const { bolum, id } = req.params;
  const data = readData();
  const idx = (data[bolum] || []).findIndex(k => k.id === id);
  if (idx !== -1) {
    data[bolum][idx] = req.body;
    const basarili = writeData(data);
    return res.json({ basarili, [bolum]: data[bolum] });
  }
  res.json({ basarili: false, [bolum]: data[bolum] || [] });
});

// ─── API: Bölüm Sil ──────────────────────────────────────────────────────
app.delete('/api/:bolum/:id', (req, res) => {
  const { bolum, id } = req.params;
  const data = readData();
  data[bolum] = (data[bolum] || []).filter(k => k.id !== id);
  const basarili = writeData(data);
  res.json({ basarili, [bolum]: data[bolum] });
});

// ─── API: Kategori Sil (ilişkili kayıtları da sil) ───────────────────────
app.delete('/api/kategori/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  data.kategoriler = data.kategoriler.filter(k => k.id !== id);
  data.kayitlar = data.kayitlar.filter(k => k.kategoriId !== id);
  const basarili = writeData(data);
  res.json({ basarili, kategoriler: data.kategoriler, kayitlar: data.kayitlar });
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
  console.log('═══════════════════════════════════════════\n');
});
