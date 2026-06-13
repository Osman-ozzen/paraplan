// ─── API Katmanı ────────────────────────────────────────────────────────
// Hem sunucu (server/index.js) hem de Electron IPC üzerinden çalışır.
// Telefon için: http://<bilgisayar-ip>:3001 adresinden erişilir.

const SUNUCU_URL = `http://${window.location.hostname}:3001`;

// Sunucu çalışıyor mu kontrol et
async function sunucuVarMi() {
  try {
    const r = await fetch(`${SUNUCU_URL}/api/veri`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

// Genel fetch
async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${SUNUCU_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

// CRUD operasyonları
const crud = (bolum) => ({
  ekle: async (kayit) => apiFetch(`/api/${bolum}`, { method: 'POST', body: JSON.stringify(kayit) }),
  sil: async (id) => apiFetch(`/api/${bolum}/${id}`, { method: 'DELETE' }),
  guncelle: async (kayit) => apiFetch(`/api/${bolum}/${kayit.id}`, { method: 'PUT', body: JSON.stringify(kayit) }),
});

// ─── API Nesnesi ─────────────────────────────────────────────────────────
const api = {
  veriOku: async () => {
    if (await sunucuVarMi()) return apiFetch('/api/veri');
    if (window.butceAPI) return window.butceAPI.veriOku();
    return null;
  },

  veriYaz: async (data) => {
    if (await sunucuVarMi()) return apiFetch('/api/veri', { method: 'POST', body: JSON.stringify(data) });
    if (window.butceAPI) return window.butceAPI.veriYaz(data);
    return { basarili: false };
  },

  kayitEkle: async (kayit) => {
    if (await sunucuVarMi()) return apiFetch('/api/kayitlar', { method: 'POST', body: JSON.stringify(kayit) });
    if (window.butceAPI) return window.butceAPI.kayitEkle(kayit);
    return { basarili: false };
  },

  kayitSil: async (id) => {
    if (await sunucuVarMi()) return apiFetch(`/api/kayitlar/${id}`, { method: 'DELETE' });
    if (window.butceAPI) return window.butceAPI.kayitSil(id);
    return { basarili: false };
  },

  kayitGuncelle: async (kayit) => {
    if (await sunucuVarMi()) return apiFetch(`/api/kayitlar/${kayit.id}`, { method: 'PUT', body: JSON.stringify(kayit) });
    if (window.butceAPI) return window.butceAPI.kayitGuncelle(kayit);
    return { basarili: false };
  },

  kategoriEkle: async (kategori) => {
    if (await sunucuVarMi()) return apiFetch('/api/kategoriler', { method: 'POST', body: JSON.stringify(kategori) });
    if (window.butceAPI) return window.butceAPI.kategoriEkle(kategori);
    return { basarili: false };
  },

  kategoriSil: async (id) => {
    if (await sunucuVarMi()) return apiFetch(`/api/kategori/${id}`, { method: 'DELETE' });
    if (window.butceAPI) return window.butceAPI.kategoriSil(id);
    return { basarili: false };
  },

  borclar: crud('borclar'),
  eticaret: crud('eticaret'),
  sirketGider: crud('sirketGider'),
  vergiKdv: crud('vergiKdv'),
};

export default api;
