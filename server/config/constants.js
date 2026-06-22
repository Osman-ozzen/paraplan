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
const crypto = require('crypto');
function idOlustur() {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
  }
}

module.exports = { GECERLI_BOLUMLER, BOLUM_TABLO, getTableName, DEFAULT_KATEGORILER, idOlustur };
