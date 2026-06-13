const { contextBridge, ipcRenderer } = require('electron');

// CRUD helper factory
const crud = (bolum) => ({
  ekle: (kayit) => ipcRenderer.invoke(`${bolum}-ekle`, kayit),
  sil: (id) => ipcRenderer.invoke(`${bolum}-sil`, id),
  guncelle: (kayit) => ipcRenderer.invoke(`${bolum}-guncelle`, kayit),
});

contextBridge.exposeInMainWorld('butceAPI', {
  veriOku: () => ipcRenderer.invoke('veri-oku'),
  veriYaz: (data) => ipcRenderer.invoke('veri-yaz', data),

  kayitEkle: (kayit) => ipcRenderer.invoke('kayit-ekle', kayit),
  kayitSil: (kayitId) => ipcRenderer.invoke('kayit-sil', kayitId),
  kayitGuncelle: (kayit) => ipcRenderer.invoke('kayit-guncelle', kayit),

  kategoriEkle: (kategori) => ipcRenderer.invoke('kategori-ekle', kategori),
  kategoriSil: (kategoriId) => ipcRenderer.invoke('kategori-sil', kategoriId),

  // Yeni bölümler
  borclar: crud('borclar'),
  eticaret: crud('eticaret'),
  sirketGider: crud('sirketGider'),
  vergiKdv: crud('vergiKdv'),
});
