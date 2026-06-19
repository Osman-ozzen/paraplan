// ─── API Katmanı ────────────────────────────────────────────────────────
// Auth token localStorage'dan okunur, tüm isteklere eklenir.

const SUNUCU_URL = window.location.port === '5173'
  ? `http://${window.location.hostname}:3001`
  : '';

function getToken() {
  try { return localStorage.getItem('paraplan_token'); } catch { return null; }
}

function authHeaders() {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${SUNUCU_URL}${path}`;
  const res = await fetch(url, {
    headers: authHeaders(),
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  // 401 durumunda oturumu temizle
  if (res.status === 401) {
    localStorage.removeItem('paraplan_token');
    localStorage.removeItem('paraplan_user');
    window.location.reload();
  }
  return res.json();
}

const crud = (bolum) => ({
  ekle: async (kayit) => apiFetch(`/api/${bolum}`, { method: 'POST', body: JSON.stringify(kayit) }),
  sil: async (id) => apiFetch(`/api/${bolum}/${id}`, { method: 'DELETE' }),
  guncelle: async (kayit) => apiFetch(`/api/${bolum}/${kayit.id}`, { method: 'PUT', body: JSON.stringify(kayit) }),
});

const api = {
  veriOku: async () => {
    try {
      const r = await fetch(`${SUNUCU_URL}/api/veri`, {
        headers: authHeaders(), signal: AbortSignal.timeout(5000)
      });
      if (r.ok) return r.json();
    } catch { /* fallback */ }
    if (window.butceAPI) return window.butceAPI.veriOku();
    return null;
  },

  veriYaz: async (data) => {
    const r = await apiFetch('/api/veri', { method: 'POST', body: JSON.stringify(data) });
    return r;
  },

  kayitEkle: async (kayit) => apiFetch('/api/kayitlar', { method: 'POST', body: JSON.stringify(kayit) }),
  kayitSil: async (id) => apiFetch(`/api/kayitlar/${id}`, { method: 'DELETE' }),
  kayitGuncelle: async (kayit) => apiFetch(`/api/kayitlar/${kayit.id}`, { method: 'PUT', body: JSON.stringify(kayit) }),

  kategoriEkle: async (kategori) => apiFetch('/api/kategoriler', { method: 'POST', body: JSON.stringify(kategori) }),
  kategoriSil: async (id) => apiFetch(`/api/kategori/${id}`, { method: 'DELETE' }),

  borclar: crud('borclar'),
  eticaret: crud('eticaret'),
  sirketGider: crud('sirketGider'),
  aylikGiderler: crud('aylikGiderler'),
  hedefler: crud('hedefler'),
};

export default api;
