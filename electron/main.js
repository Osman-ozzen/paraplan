const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// ─── ID Oluşturucu ─────────────────────────────────────────────────────────
function idOlustur() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

// ─── Varsayılan Veri Yapısı ───────────────────────────────────────────────
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

// ─── Veri Yolu ────────────────────────────────────────────────────────────
const getDataPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'butce-verisi.json');
};

// ─── Veri Okuma / Yazma ───────────────────────────────────────────────────
function readData() {
  try {
    const dataPath = getDataPath();
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      return JSON.parse(data);
    }
    return getDefaultData();
  } catch (err) {
    console.error('Veri okuma hatası:', err);
    return getDefaultData();
  }
}

function writeData(data) {
  try {
    const dataPath = getDataPath();
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Veri yazma hatası:', err);
    return false;
  }
}

// ─── Pencere Oluşturma ────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Bütçe Takip',
    icon: path.join(__dirname, '../src/assets/icon.png'),
    show: false,
  });

  // Pencere yüklendiğinde göster (beyaz ekran flaşı önleme)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Geliştirme modu: Vite dev server, Üretim: build dosyası
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// ─── IPC İşleyiciler ──────────────────────────────────────────────────────

// Veri okuma
ipcMain.handle('veri-oku', () => {
  return readData();
});

// Tüm veriyi yaz
ipcMain.handle('veri-yaz', (_event, data) => {
  return writeData(data);
});

// Kayıt ekle
ipcMain.handle('kayit-ekle', (_event, kayit) => {
  const data = readData();
  data.kayitlar.push(kayit);
  const basarili = writeData(data);
  return { basarili, kayitlar: data.kayitlar };
});

// Kayıt sil
ipcMain.handle('kayit-sil', (_event, kayitId) => {
  const data = readData();
  data.kayitlar = data.kayitlar.filter((k) => k.id !== kayitId);
  const basarili = writeData(data);
  return { basarili, kayitlar: data.kayitlar };
});

// Kayıt güncelle
ipcMain.handle('kayit-guncelle', (_event, guncelKayit) => {
  const data = readData();
  const index = data.kayitlar.findIndex((k) => k.id === guncelKayit.id);
  if (index !== -1) {
    data.kayitlar[index] = guncelKayit;
    const basarili = writeData(data);
    return { basarili, kayitlar: data.kayitlar };
  }
  return { basarili: false, kayitlar: data.kayitlar };
});

// Kategori ekle
ipcMain.handle('kategori-ekle', (_event, kategori) => {
  const data = readData();
  data.kategoriler.push(kategori);
  const basarili = writeData(data);
  return { basarili, kategoriler: data.kategoriler };
});

// Kategori sil
ipcMain.handle('kategori-sil', (_event, kategoriId) => {
  const data = readData();
  data.kategoriler = data.kategoriler.filter((k) => k.id !== kategoriId);
  // Bu kategorideki kayıtları da sil (opsiyonel)
  data.kayitlar = data.kayitlar.filter((k) => k.kategoriId !== kategoriId);
  const basarili = writeData(data);
  return { basarili, kategoriler: data.kategoriler, kayitlar: data.kayitlar };
});

// ─── Uygulama Yaşam Döngüsü ──────────────────────────────────────────────

// ─── Genel CRUD İşleyici (borclar, eticaret, sirketGider, vergiKdv için) ──
const bolumHandler = (bolum) => {
  ipcMain.handle(`${bolum}-ekle`, (_event, kayit) => {
    const data = readData();
    if (!data[bolum]) data[bolum] = [];
    const yeni = { ...kayit, id: idOlustur() };
    data[bolum].push(yeni);
    const basarili = writeData(data);
    return { basarili, [bolum]: data[bolum] };
  });

  ipcMain.handle(`${bolum}-sil`, (_event, kayitId) => {
    const data = readData();
    data[bolum] = (data[bolum] || []).filter((k) => k.id !== kayitId);
    const basarili = writeData(data);
    return { basarili, [bolum]: data[bolum] };
  });

  ipcMain.handle(`${bolum}-guncelle`, (_event, guncelKayit) => {
    const data = readData();
    const index = (data[bolum] || []).findIndex((k) => k.id === guncelKayit.id);
    if (index !== -1) {
      data[bolum][index] = guncelKayit;
      const basarili = writeData(data);
      return { basarili, [bolum]: data[bolum] };
    }
    return { basarili: false, [bolum]: data[bolum] || [] };
  });
};

['borclar', 'eticaret', 'sirketGider', 'vergiKdv'].forEach(bolumHandler);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
