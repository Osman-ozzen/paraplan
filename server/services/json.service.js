const fs = require('fs');
const path = require('path');
const { DEFAULT_KATEGORILER, idOlustur } = require('../config/constants');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_PATH = path.join(DATA_DIR, 'butce-verisi.json');

// Sadece Supabase yoksa data dizini oluştur (Railway izin sorunu önlemi)
function ensureDataDir() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) return; // Supabase modunda gerek yok
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // Silent fail — Supabase modunda dosya erişimi gerekmez
  }
}
ensureDataDir();

function getDefaultData() {
  return {
    kategoriler: [...DEFAULT_KATEGORILER],
    kayitlar: [], borclar: [], eticaret: [],
    sirketGider: [], aylikGiderler: [], hedefler: [],
  };
}

function readData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    }
    return getDefaultData();
  } catch {
    return getDefaultData();
  }
}

function writeData(data) {
  try {
    if (fs.existsSync(DATA_PATH)) {
      fs.copyFileSync(DATA_PATH, DATA_PATH + '.bak');
    }
    fs.writeFileSync(DATA_PATH + '.tmp', JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(DATA_PATH + '.tmp', DATA_PATH);
    return true;
  } catch (err) {
    console.error('Veri yazma hatası:', err);
    try {
      if (fs.existsSync(DATA_PATH + '.bak') && !fs.existsSync(DATA_PATH)) {
        fs.copyFileSync(DATA_PATH + '.bak', DATA_PATH);
      }
    } catch {}
    return false;
  }
}

module.exports = { readData, writeData, getDefaultData };
